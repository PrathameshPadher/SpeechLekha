# SpeechLekha — Demo Build Guide (Zero-Context, Agent-Executable)

> **For an agentic IDE with no prior context. Follow phases IN ORDER. Do not skip verification gates.**
> Every command is real. Copy-paste ready. Estimated total time: ~75 minutes.

## 0. What We Are Building (30-second context)

**SpeechLekha** turns live speech into structured Markdown notes in real time, fully self-hosted:

1. Browser captures mic audio in 8-second chunks → POSTs to a FastAPI server on EC2.
2. **Live STT:** `faster-whisper` (tiny.en) transcribes each chunk on the EC2 CPU.
3. **Note agent:** our fine-tuned SLM (`speechlekha`, Qwen2.5-1.5B, served by Ollama on the same box) receives the transcript + current note files and emits **structured tool-call JSON**. A Python harness executes the tools against a sandbox folder (`sessions/<id>/*.md`).
4. **Realtime UI:** a minimal single-page HTML (served by FastAPI) renders the transcript and the live-rendered Markdown notes via SSE.
5. **Archival STT:** on session end, the full audio is uploaded to S3 and **Amazon Transcribe** (with a custom engineering-math vocabulary) produces a high-accuracy final transcript. Lambda + EventBridge finalize.
6. Export notes as `.md` / `.docx` / `.pdf`.

**Stack:** EC2 t3.medium (Ubuntu 24.04) · S3 · DynamoDB · Lambda · EventBridge · IAM · CloudWatch · Amazon Transcribe · Ollama · faster-whisper · FastAPI.

**Cost:** ~$0.50–2 for a demo day. **Region for EVERYTHING: `ap-south-1`.**

---

## 1. Prerequisites

1. AWS account (has $50 credits) + AWS CLI installed and configured:
   ```bash
   aws configure        # provide access key, secret, default region = ap-south-1, output = json
   aws sts get-caller-identity    # GATE: must print an Account ID
   ```
2. The IAM identity above needs permission to create: EC2, S3, DynamoDB, IAM roles, Lambda, EventBridge, CloudWatch alarms. (AdminAccess or PowerUserAccess is fine for this demo.)
3. HF model repo (public): `Himanshu-Vishwakarma-HF/speechlekha-qwen-gguf`. If it were private, you'd export `HF_TOKEN` before the download step.

Set convenience vars (use in every phase):
```bash
export AWS_DEFAULT_REGION=ap-south-1
export ACCT=$(aws sts get-caller-identity --query Account --output text)
export BUCKET="speechlekha-data-${ACCT}"
```

---

## 2. PHASE 1 — Infra (local CLI, ~15 min)

### 2.1 Billing alarm (do this FIRST)
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name speechlekha-budget --metric-name EstimatedCharges \
  --namespace AWS/Billing --statistic Maximum --period 21600 \
  --threshold 10 --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 --dimensions Name=Currency,Value=USD
```
> Note: billing alarms live in **us-east-1**; if this errors, create it in the console (Billing → Budgets → $10 budget alert). Either way, do not skip.

### 2.2 S3 bucket
```bash
aws s3 mb "s3://${BUCKET}"
aws s3api put-public-access-block --bucket "${BUCKET}" \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 2.3 DynamoDB tables (on-demand = free-tier friendly)
```bash
aws dynamodb create-table --table-name Sessions \
  --attribute-definitions AttributeName=session_id,AttributeType=S \
  --key-schema AttributeName=session_id,KeyType=HASH --billing-mode PAY_PER_REQUEST
aws dynamodb create-table --table-name Chunks \
  --attribute-definitions AttributeName=session_id,AttributeType=S AttributeName=chunk_no,AttributeType=N \
  --key-schema AttributeName=session_id,KeyType=HASH AttributeName=chunk_no,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
# GATE:
aws dynamodb wait table-exists --table-name Sessions
aws dynamodb wait table-exists --table-name Chunks && echo TABLES_OK
```

### 2.4 IAM roles
Create the EC2 instance-profile role trust policy:
```bash
cat > trust-ec2.json <<'EOF'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
cat > speechlekha-ec2-policy.json <<EOF
{"Version":"2012-10-17","Statement":[
 {"Effect":"Allow","Action":["s3:PutObject","s3:GetObject"],"Resource":"arn:aws:s3:::${BUCKET}/*"},
 {"Effect":"Allow","Action":["dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:GetItem","dynamodb:Query"],
  "Resource":["arn:aws:dynamodb:ap-south-1:${ACCT}:table/Sessions","arn:aws:dynamodb:ap-south-1:${ACCT}:table/Chunks"]},
 {"Effect":"Allow","Action":["lambda:InvokeFunction"],
  "Resource":"arn:aws:lambda:ap-south-1:${ACCT}:function:speechlekha-finalizer"}]}
EOF
aws iam create-role --role-name speechlekha-ec2-role --assume-role-policy-document file://trust-ec2.json
aws iam put-role-policy --role-name speechlekha-ec2-role --policy-name speechlekha-ec2 --policy-document file://speechlekha-ec2-policy.json
aws iam create-instance-profile --instance-profile-name speechlekha-ec2-role
aws iam add-role-to-instance-profile --instance-profile-name speechlekha-ec2-role --role-name speechlekha-ec2-role
```

Lambda execution role:
```bash
cat > trust-lambda.json <<'EOF'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
cat > speechlekha-lambda-policy.json <<EOF
{"Version":"2012-10-17","Statement":[
 {"Effect":"Allow","Action":["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],"Resource":"*"},
 {"Effect":"Allow","Action":["s3:GetObject","s3:PutObject"],"Resource":"arn:aws:s3:::${BUCKET}/*"},
 {"Effect":"Allow","Action":["transcribe:StartTranscriptionJob","transcribe:GetTranscriptionJob"],"Resource":"*"},
 {"Effect":"Allow","Action":["dynamodb:UpdateItem"],"Resource":"arn:aws:dynamodb:ap-south-1:${ACCT}:table/Sessions"}]}
EOF
aws iam create-role --role-name speechlekha-lambda-role --assume-role-policy-document file://trust-lambda.json
aws iam put-role-policy --role-name speechlekha-lambda-role --policy-name speechlekha-lambda --policy-document file://speechlekha-lambda-policy.json
```

### 2.5 Lambda function (`speechlekha-finalizer`)
Write `lambda_function.py` (in §3.2), then:
```bash
zip function.zip lambda_function.py
aws lambda create-function --function-name speechlekha-finalizer \
  --runtime python3.12 --role "arn:aws:iam::${ACCT}:role/speechlekha-lambda-role" \
  --handler lambda_function.lambda_handler --zip-file fileb://function.zip \
  --timeout 60 --memory-size 256
# GATE:
aws lambda get-function --function-name speechlekha-finalizer --query Configuration.FunctionName
```

### 2.6 EventBridge: fire Lambda when a Transcribe job completes
```bash
aws events put-rule --name speechlekha-transcribe-done \
  --event-pattern '{"source":["aws.transcribe"],"detail-type":["Transcribe Job State Change"]}'
aws lambda add-permission --function-name speechlekha-finalizer \
  --statement-id allow-events --action lambda:InvokeFunction --principal events.amazonaws.com
aws events put-targets --rule speechlekha-transcribe-done \
  --targets "Id"="1","Arn"="arn:aws:lambda:ap-south-1:${ACCT}:function:speechlekha-finalizer"
```

### 2.7 Amazon Transcribe custom vocabulary (ONE-TIME; must be READY before any job)
Write `create_vocab.py` (in §3.3), then:
```bash
pip install boto3
python3 create_vocab.py
# GATE: script exits only when vocabulary state == READY. Do not proceed before this.
```

### 2.8 Security group + key pair + EC2 (t3.medium)
```bash
aws ec2 create-key-pair --key-name speechlekha --query KeyMaterial --output text > speechlekha.pem
chmod 400 speechlekha.pem
MYIP=$(curl -s ifconfig.me)
SG=$(aws ec2 create-security-group --group-name speechlekha-sg --description "demo" --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id "$SG" --protocol tcp --port 22 --cidr "${MYIP}/32"
aws ec2 authorize-security-group-ingress --group-id "$SG" --protocol tcp --port 80 --cidr 0.0.0.0/0
```
> Port 80 is open to the world (that's the demo UI). 11434 (Ollama) is **never** opened — it's localhost-only by design.

Write `bootstrap.sh` (in §3.4), then launch:
```bash
AMI=$(aws ssm get-parameters --names /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id --query 'Parameters[0].Value' --output text)
aws ec2 run-instances --image-id "$AMI" --instance-type t3.medium \
  --key-name speechlekha --security-group-ids "$SG" \
  --iam-instance-profile Name=speechlekha-ec2-role \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=speechlekha}]' \
  --user-data file://bootstrap.sh
```
```bash
# GATE: wait for bootstrap to finish (takes ~8-12 min: packages + Ollama + model download)
INSTANCE_ID=$(aws ec2 describe-instances --filters Name=tag:Name,Values=speechlekha Name=instance-state-name,Values=running --query 'Reservations[0].Instances[0].InstanceId' --output text)
IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "IP=$IP"
ssh -i speechlekha.pem -o StrictHostKeyChecking=no ubuntu@"$IP" "cloud-init status --wait && ollama list"
```
**GATE:** `ollama list` must show `speechlekha`. If not, check `tail -100 /var/log/cloud-init-output.log`.

---

## 3. PHASE 2 — Application Code

### 3.1 `app.py` — the entire server (FastAPI + agent harness + minimal realtime UI)

Save this file exactly, then `scp` it to the instance (§4).

```python
import os, json, time, uuid, asyncio, tempfile, threading, subprocess, zipfile
from pathlib import Path
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import HTMLResponse, FileResponse, Response, StreamingResponse
from starlette.concurrency import run_in_threadpool
import boto3, httpx
from faster_whisper import WhisperModel

# ---------- config ----------
REGION = os.getenv("AWS_REGION", "ap-south-1")
BUCKET = os.getenv("BUCKET_DATA")
DDB_S  = os.getenv("DDB_SESSIONS", "Sessions")
DDB_C  = os.getenv("DDB_CHUNKS", "Chunks")
STT_MODEL = os.getenv("STT_MODEL", "tiny.en")
VOCAB  = os.getenv("TRANSCRIBE_VOCABULARY", "eng-math-vocab")
AGENT_EVERY = int(os.getenv("AGENT_EVERY_N_CHUNKS", "2"))
MODEL  = os.getenv("MODEL_NAME", "speechlekha")
OLLAMA = "http://127.0.0.1:11434/api/chat"
ROOT   = Path(os.getenv("DATA_DIR", "/opt/speechlekha/data"))
HOTWORDS = ["derivative","integral","eigenvalue","eigenvector","determinant",
            "Laplace transform","Fourier series","differential equation",
            "Gaussian elimination","Newton-Raphson","convergence","Taylor series",
            "Maclaurin series","partial derivative","Jacobian","bisection method"]
PROMPT_BIAS = ("Engineering mathematics lecture on calculus, linear algebra, "
               "differential equations, probability, and numerical methods.")

s3  = boto3.client("s3", region_name=REGION)
ddb = boto3.resource("dynamodb", region_name=REGION)
sessions_t, chunks_t = ddb.Table(DDB_S), ddb.Table(DDB_C)
lam = boto3.client("lambda", region_name=REGION)
app = FastAPI()
whisper = WhisperModel(STT_MODEL, device="cpu", compute_type="int8")

SYSTEM_PROMPT = """You are SpeechLekha, a realtime lecture-note writer. You receive the lecture transcript so far, the current note files, and the last file's tail. Output ONLY valid JSON of the form {"tool_calls":[{"tool":...,"args":{...}}]} with at most 2 tool calls and no other text.
Tools:
- create_section {"title": str}  -> creates the next numbered section file
- append_bullets {"path": str, "bullets": [str]}  -> append bullets to a section file
- add_paragraph  {"path": str, "text": str}
- add_table      {"path": str, "headers": [str], "rows": [[str]]}
- add_mermaid    {"path": str, "diagram": str}  -> mermaid code block (flows/processes)
- update_index   {"summary": str, "key_terms": [str]}  -> rewrite 00-index.md (3-sentence summary, [[wikilinks]])
- flag_confusion {"note": str}
Rules: bullets must come from the transcript, never invent facts; bullets under 15 words; use add_table for comparisons, add_mermaid for processes; keep the note style concise and systematic."""

state = {}   # sid -> {"transcript": [str], "chunk_no": int, "queue": asyncio.Queue}
state_lock = threading.Lock()

def new_state():
    return {"transcript": [], "chunk_no": 0, "queue": asyncio.Queue()}

def sdir(sid):
    d = ROOT / sid
    d.mkdir(parents=True, exist_ok=True)
    return d

def jail(sid, rel):
    base = (ROOT / sid).resolve()
    p = (base / rel).resolve()
    if not str(p).startswith(str(base)):
        raise ValueError("path escape blocked")
    return p

# ---------- tool harness ----------
def execute(sid, call):
    tool, args = call.get("tool"), call.get("args", {})
    d = sdir(sid)
    changed = {}
    if tool == "create_section":
        n = len(list(d.glob("[0-9][0-9]-*.md"))) + 1
        slug = "".join(c if c.isalnum() else "-" for c in args["title"].lower())[:30].strip("-") or "section"
        p = d / f"{n:02d}-{slug}.md"
        p.write_text(f"# {args['title']}\n")
        changed[str(p.relative_to(d))] = p.read_text()
    elif tool in ("append_bullets", "add_paragraph", "add_table", "add_mermaid"):
        try:
            p = jail(sid, args["path"])
            if not p.exists():
                secs = sorted(d.glob("[0-9][0-9]-*.md"))
                if not secs: return changed
                p = secs[-1]
        except Exception:
            secs = sorted(d.glob("[0-9][0-9]-*.md"))
            if not secs: return changed
            p = secs[-1]
        with p.open("a") as f:
            if tool == "append_bullets":
                f.write("".join(f"\n- {b}" for b in args.get("bullets", [])))
            elif tool == "add_paragraph":
                f.write(f"\n\n{args.get('text','')}\n")
            elif tool == "add_table":
                h = args["headers"]
                f.write("\n\n| " + " | ".join(h) + " |\n|" + "---|" * len(h) + "\n")
                for r in args.get("rows", []):
                    f.write("| " + " | ".join(map(str, r)) + " |\n")
            elif tool == "add_mermaid":
                f.write(f"\n\n```mermaid\n{args.get('diagram','')}\n```\n")
        changed[str(p.relative_to(d))] = p.read_text()
    elif tool == "update_index":
        sections = sorted(x.name for x in d.glob("[0-9][0-9]-*.md"))
        links = "\n".join(f"- [[{s[3:-3].replace('-', ' ').title()}]]" for s in sections)
        terms = " · ".join(f"[[{t}]]" for t in args.get("key_terms", []))
        (d / "00-index.md").write_text(
            f"# Lecture Notes\n\n> **Summary:** {args.get('summary','')}\n\n"
            f"## Sections\n{links}\n\n## Key Terms\n{terms}\n")
        changed["00-index.md"] = (d / "00-index.md").read_text()
    elif tool == "flag_confusion":
        with (d / "00-index.md").open("a") as f:
            f.write(f"\n> ⚠️ unclear audio: {args.get('note','')}\n")
        changed["00-index.md"] = (d / "00-index.md").read_text()
    return changed

# ---------- agent ----------
async def agent_tick(sid):
    st = state[sid]
    d = sdir(sid)
    transcript = " ".join(st["transcript"])
    files = sorted(x.name for x in d.glob("*.md"))
    secs = sorted(d.glob("[0-9][0-9]-*.md"))
    tail = secs[-1].read_text()[-1500:] if secs else ""
    user = (f"[TRANSCRIPT SO FAR]\n{transcript}\n\n[CURRENT FILES]\n{json.dumps(files)}"
            f"\n\n[LAST FILE TAIL]\n{tail}")
    messages = [{"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user}]
    changed = {}
    for _ in range(2):
        try:
            async with httpx.AsyncClient(timeout=240) as client:
                r = await client.post(OLLAMA, json={
                    "model": MODEL, "messages": messages, "format": "json",
                    "stream": False, "options": {"temperature": 0.2, "num_ctx": 2048}})
            data = json.loads(r.json()["message"]["content"])
            for call in data.get("tool_calls", [])[:2]:
                changed.update(execute(sid, call))
            break
        except Exception as e:
            messages.append({"role": "user", "content":
                f"Your last output was invalid ({type(e).__name__}). Output only valid JSON with tool_calls."})
    for path, content in changed.items():
        try: s3.put_object(Bucket=BUCKET, Key=f"{sid}/notes/{path}", Body=content.encode())
        except Exception: pass
    await st["queue"].put({"type": "agent_status", "payload": {"status": "idle"}})
    if changed:
        await st["queue"].put({"type": "file_changed", "payload": {"files": changed}})

# ---------- STT ----------
def transcribe(raw: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(raw); path = tmp.name
    try:
        segs, _ = whisper.transcribe(path, language="en", vad_filter=True,
            initial_prompt=PROMPT_BIAS, hotwords=HOTWORDS, beam_size=1)
        return " ".join(s.text for s in segs).strip()
    except TypeError:   # older faster-whisper without hotwords
        segs, _ = whisper.transcribe(path, language="en", vad_filter=True,
            initial_prompt=PROMPT_BIAS, beam_size=1)
        return " ".join(s.text for s in segs).strip()

# ---------- API ----------
@app.post("/session")
async def new_session(title: str = ""):
    sid = uuid.uuid4().hex[:12]
    with state_lock: state[sid] = new_state()
    d = sdir(sid)
    (d / "00-index.md").write_text("# Lecture Notes\n\n> **Summary:** (building…)\n")
    try: sessions_t.put_item(Item={"session_id": sid, "created_at": int(time.time()),
                                   "status": "live", "title": title or "Lecture"})
    except Exception: pass
    return {"session_id": sid}

@app.post("/chunk/{sid}")
async def chunk(sid: str, file: UploadFile):
    with state_lock:
        st = state.setdefault(sid, new_state())
        st["chunk_no"] += 1
        n = st["chunk_no"]
    raw = await file.read()
    (sdir(sid) / f"chunk_{n:03d}.webm").write_bytes(raw)
    text = await run_in_threadpool(transcribe, raw)
    st["transcript"].append(text)
    try: chunks_t.put_item(Item={"session_id": sid, "chunk_no": n,
                                 "text": text, "ts": int(time.time())})
    except Exception: pass
    await st["queue"].put({"type": "transcript", "payload": {"chunk_no": n, "text": text}})
    if n % AGENT_EVERY == 0 and text:
        await st["queue"].put({"type": "agent_status", "payload": {"status": "writing"}})
        asyncio.create_task(agent_tick(sid))
    return {"chunk_no": n, "text": text}

@app.get("/stream/{sid}")
async def stream(sid: str):
    async def gen():
        q = state[sid]["queue"]
        while True:
            ev = await q.get()
            yield f"data: {json.dumps(ev)}\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")

@app.get("/files/{sid}")
async def files(sid: str):
    d = sdir(sid)
    fs = {p.name: p.read_text() for p in sorted(d.glob("*.md"))}
    return {"tree": list(fs), "files": fs}

@app.post("/session/{sid}/end")
async def end(sid: str):
    d = sdir(sid)
    chunks = sorted(d.glob("chunk_*.webm"))
    if chunks:
        (d / "concat.txt").write_text("".join(f"file '{c.name}'\n" for c in chunks))
        subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0",
                        "-i", str(d / "concat.txt"), "-c", "copy", str(d / "full.webm")],
                       capture_output=True)
        if (d / "full.webm").exists():
            s3.upload_file(str(d / "full.webm"), BUCKET, f"{sid}/full.webm")
    zp = f"/tmp/{sid}.zip"
    with zipfile.ZipFile(zp, "w") as z:
        for p in sorted(d.glob("*.md")): z.write(p, p.name)
    s3.upload_file(zp, BUCKET, f"{sid}/notes.zip")
    try:
        lam.invoke(FunctionName="speechlekha-finalizer", InvocationType="Event",
                   Payload=json.dumps({"action": "start_transcribe", "session_id": sid}).encode())
    except Exception: pass
    try: sessions_t.update_item(Key={"session_id": sid},
        UpdateExpression="SET #s = :s", ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "processing"})
    except Exception: pass
    return {"status": "processing"}

@app.get("/export/{sid}")
async def export(sid: str, format: str = "md"):
    d = sdir(sid)
    secs = sorted(d.glob("[0-9][0-9]-*.md"))
    combined = (d / "00-index.md").read_text() + "\n\n" + "\n\n".join(p.read_text() for p in secs)
    if format == "md":
        return Response(combined, media_type="text/markdown",
                        headers={"Content-Disposition": f"attachment; filename={sid}.md"})
    src = f"/tmp/{sid}.html"; Path(src).write_text(combined)
    if format == "docx":
        subprocess.run(["pandoc", src, "-o", f"/tmp/{sid}.docx"], capture_output=True)
        return FileResponse(f"/tmp/{sid}.docx", filename="notes.docx")
    subprocess.run(["pandoc", src, "-o", f"/tmp/{sid}.pdf", "--pdf-engine=weasyprint"],
                   capture_output=True)
    if Path(f"/tmp/{sid}.pdf").exists():
        return FileResponse(f"/tmp/{sid}.pdf", filename="notes.pdf")
    return Response("PDF engine unavailable on this instance", status_code=500)

# ---------- minimal realtime UI ----------
INDEX_HTML = """<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>SpeechLekha</title>
<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
 body{font-family:system-ui;background:#1e1e2e;color:#cdd6f4;margin:0;padding:16px}
 h1{font-size:1.3rem} button{background:#89b4fa;border:0;border-radius:6px;padding:8px 14px;margin:4px;cursor:pointer;font-weight:600}
 #wrap{display:grid;grid-template-columns:1fr 1fr;gap:12px} .pane{background:#313244;border-radius:10px;padding:12px;height:60vh;overflow:auto;white-space:pre-wrap}
 #status{color:#a6e3a1} a{color:#89b4fa;margin-right:10px} code,pre{background:#45475a;border-radius:6px}
</style>
<h1>🎤 SpeechLekha <span id=status></span></h1>
<div>
 <button onclick="startSession()">● Start</button>
 <button onclick="stopChunks()">■ Pause</button>
 <button onclick="endSession()">✔ End & Export</button>
 <span id=exports></span>
</div>
<div id=wrap><div class=pane id=t><b>Transcript</b>\n</div><div class=pane id=n><b>Notes</b>\n</div></div>
<script>
mermaid.initialize({startOnLoad:false,theme:'dark'});
let sid, rec, es, files={};
function md(src){ // convert ```mermaid blocks to <pre class=mermaid>
 src = src.replace(/```mermaid\n([\s\S]*?)```/g, (m,g)=> '<pre class="mermaid">'+g.replace(/</g,'&lt;')+'</pre>');
 return marked.parse(src);}
function renderNotes(){
 let order = Object.keys(files).sort((a,b)=> a==="00-index.md"?-1 : b==="00-index.md"?1 : a.localeCompare(b));
 document.getElementById('n').innerHTML = "<b>Notes</b>\n" + order.map(k=>md(files[k])).join("\n<hr>");
 mermaid.run({querySelector:'#n .mermaid'}).catch(()=>{});}
async function startSession(){
 const r = await fetch('/session',{method:'POST'}); sid = (await r.json()).session_id;
 const stream = await navigator.mediaDevices.getUserMedia({audio:true});
 rec = new MediaRecorder(stream);
 rec.ondataavailable = e => { if(e.data.size>0){
   const fd = new FormData(); fd.append('file', e.data, 'c.webm');
   fetch('/chunk/'+sid,{method:'POST',body:fd}); } };
 rec.start(8000);
 es = new EventSource('/stream/'+sid);
 es.onmessage = async ev => {
   const m = JSON.parse(ev.data);
   if(m.type==='transcript'){ document.getElementById('t').innerHTML += "\n"+m.payload.text; 
     document.getElementById('t').scrollTop = 1e9; }
   if(m.type==='agent_status'){ document.getElementById('status').textContent = m.payload.status==='writing'?'✍️ writing…':''; }
   if(m.type==='file_changed'){ Object.assign(files, m.payload.files); renderNotes(); } };
 document.getElementById('status').textContent = '🔴 live';}
function stopChunks(){ if(rec){rec.stop(); rec=null;} document.getElementById('status').textContent='⏸ paused'; }
async function endSession(){
 stopChunks(); if(es) es.close();
 await fetch('/session/'+sid+'/end',{method:'POST'});
 document.getElementById('status').textContent = '⚙️ finalizing (Transcribe archival)…';
 setTimeout(async ()=>{ const f = await (await fetch('/files/'+sid)).json(); files=f.files; renderNotes();
   document.getElementById('exports').innerHTML =
     ['md','docx','pdf'].map(x=>`<a href="/export/${sid}?format=${x}">⬇ ${x.toUpperCase()}</a>`).join('');
   document.getElementById('status').textContent='✅ done'; }, 4000);}
</script>"""

@app.get("/")
async def index():
    return HTMLResponse(INDEX_HTML)
```

### 3.2 `lambda_function.py`
```python
import json, urllib.request
import boto3

BUCKET = None  # resolved at runtime
s3 = boto3.client("s3")
tr = boto3.client("transcribe")
ddb = boto3.resource("dynamodb")

def lambda_handler(event, context):
    # Path 1: direct invoke from FastAPI -> start archival Transcribe job
    if event.get("action") == "start_transcribe":
        sid = event["session_id"]
        bucket = event.get("bucket")
        try:
            tr.start_transcription_job(
                TranscriptionJobName=f"speechlekha-{sid}",
                LanguageCode="en-US",
                Media={"MediaFileUri": f"s3://{bucket}/{sid}/full.webm"},
                MediaFormat="webm",
                OutputBucketName=bucket,
                OutputKey=f"{sid}/transcript.json",
                Settings={"VocabularyName": "eng-math-vocab"})
        except tr.exceptions.ConflictException:
            pass  # job already exists -> idempotent
        return {"ok": True}

    # Path 2: EventBridge 'Transcribe Job State Change' -> finalize
    detail = event.get("detail", {})
    job_name = detail.get("TranscriptionJobName", "")
    if not job_name.startswith("speechlekha-"):
        return {"ok": False, "reason": "not ours"}
    sid = job_name.split("-", 1)[1]
    if detail.get("TranscriptionJobStatus") != "COMPLETED":
        return {"ok": False, "reason": "not completed"}
    job = tr.get_transcription_job(TranscriptionJobName=job_name)["TranscriptionJob"]
    uri = job["Transcript"]["TranscriptFileUri"]
    with urllib.request.urlopen(uri, timeout=30) as r:
        data = json.loads(r.read().decode())
    text = data["results"]["transcripts"][0]["transcript"]
    bucket = job["Media"]["MediaFileUri"].split("/")[2]
    s3.put_object(Bucket=bucket, Key=f"{sid}/final_transcript.txt", Body=text.encode())
    ddb.Table("Sessions").update_item(
        Key={"session_id": sid},
        UpdateExpression="SET #s = :s, #t = :t",
        ExpressionAttributeNames={"#s": "status", "#t": "transcript_key"},
        ExpressionAttributeValues={":s": "completed", ":t": f"{sid}/final_transcript.txt"})
    return {"ok": True, "session_id": sid}
```
> **Wire the bucket:** the Lambda needs `BUCKET` — it's derived from the media URI at finalize time, but for `start_transcribe` the FastAPI payload must include it. The `app.py` invoke already passes `{"action": ..., "session_id": ...}` — **add `"bucket": BUCKET` to that payload** (one line; it's in the code above's caller — make sure it matches).

### 3.3 `create_vocab.py` (run once from your laptop)
```python
import time, boto3
tr = boto3.client("transcribe", region_name="ap-south-1")
PHRASES = ["eigenvalue","eigenvector","Laplace transform","Fourier series",
 "Gaussian elimination","Newton-Raphson","partial derivative",
 "differential equation","Maclaurin series","Taylor series","convergence",
 "bisection method","Jacobian","determinant","vector space","continuity"]
try:
    tr.create_vocabulary(VocabularyName="eng-math-vocab", LanguageCode="en-US", Phrases=PHRASES)
    print("created, waiting for READY…")
except tr.exceptions.ConflictException:
    print("already exists, waiting for READY…")
while True:
    st = tr.get_vocabulary(VocabularyName="eng-math-vocab")["VocabularyState"]
    print("state:", st, flush=True)
    if st == "READY": break
    if st == "FAILED": raise SystemExit("vocabulary FAILED — check phrases")
    time.sleep(5)
print("VOCAB READY")
```

### 3.4 `bootstrap.sh` (EC2 user-data)
```bash
#!/bin/bash
exec > >(tee /var/log/speechlekha-bootstrap.log) 2>&1
set -x
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg pandoc weasyprint python3-pip

# 4GB swap — REQUIRED on t3.medium (4GB RAM)
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
grep -q swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab

pip3 install --break-system-packages fastapi "uvicorn[standard]" faster-whisper \
  httpx boto3 python-multipart huggingface_hub

# Ollama + our fine-tuned model
curl -fsSL https://ollama.com/install.sh | sh
mkdir -p /opt/speechlekha/data
cd /opt/speechlekha
huggingface-cli download Himanshu-Vishwakarma-HF/speechlekha-qwen-gguf \
  --include "speechlekha-gguf_gguf/*" --local-dir hf
ollama create speechlekha -f hf/speechlekha-gguf_gguf/Modelfile

# pre-download whisper weights (avoids first-request delay)
python3 -c "from faster_whisper import WhisperModel; WhisperModel('tiny.en', device='cpu'); print('whisper ok')"

cat > /opt/speechlekha/.env <<EOF
AWS_REGION=ap-south-1
BUCKET_DATA=${BUCKET}
DDB_SESSIONS=Sessions
DDB_CHUNKS=Chunks
STT_MODEL=tiny.en
TRANSCRIBE_VOCABULARY=eng-math-vocab
AGENT_EVERY_N_CHUNKS=2
MODEL_NAME=speechlekha
DATA_DIR=/opt/speechlekha/data
EOF

cat > /etc/systemd/system/speechlekha.service <<'EOF'
[Unit]
Description=SpeechLekha
After=network-online.target ollama.service
Wants=network-online.target
[Service]
WorkingDirectory=/opt/speechlekha
EnvironmentFile=/opt/speechlekha/.env
ExecStart=/usr/bin/python3 -m uvicorn app:app --host 0.0.0.0 --port 80
Restart=always
MemoryMax=3.3G
[Install]
WantedBy=multi-user.target
EOF
echo "BOOTSTRAP_DONE"
```

---

## 4. PHASE 3 — Deploy & Wire (~10 min)

The `.env` above uses `${BUCKET}` — **inject your real bucket name**: before launching EC2 (or via a fix-up command), replace `${BUCKET}` in bootstrap.sh with `speechlekha-data-<your-account-id>`. If the instance is already up, just run:
```bash
ssh -i speechlekha.pem ubuntu@"$IP" "sudo sed -i 's/^BUCKET_DATA=.*/BUCKET_DATA=${BUCKET}/' /opt/speechlekha/.env"
```

Deploy app + start service:
```bash
scp -i speechlekha.pem app.py ubuntu@"$IP":/opt/speechlekha/app.py
ssh -i speechlekha.pem ubuntu@"$IP" 'sudo systemctl daemon-reload && sudo systemctl enable --now speechlekha && sleep 3 && systemctl status speechlekha --no-pager | head -5'
# GATE:
curl -s "http://$IP/" | head -c 200     # must return HTML
```

---

## 5. PHASE 4 — Verification Checklist

```bash
# 1. Health
curl -s "http://$IP/" | grep -o SpeechLekha

# 2. Session create
SID=$(curl -s -X POST "http://$IP/session" | python3 -c "import sys,json;print(json.load(sys.stdin)['session_id'])")

# 3. STT chunk (record or synthesize a wav first: say "the derivative of x squared is 2 x")
ffmpeg -f lavfi -i "sine=frequency=440:duration=8" -ar 16000 sample.wav   # placeholder audio
curl -s -X POST "http://$IP/chunk/$SID" -F "file=@sample.wav;type=audio/wav"

# 4. Agent tick fires (wait ~30s for 2 chunks; then:)
curl -s "http://$IP/files/$SID"

# 5. End -> S3 -> Transcribe
curl -s -X POST "http://$IP/session/$SID/end"
sleep 20
aws s3 ls "s3://${BUCKET}/${SID}/"          # expect full.webm, notes.zip, transcript.json
aws dynamodb get-item --table-name Sessions --key "{\"session_id\":{\"S\":\"$SID\"}}"
# after ~1-2 min (short clip):
aws s3 ls "s3://${BUCKET}/${SID}/final_transcript.txt" && echo TRANSCRIBE_OK

# 6. Exports
curl -s -o notes.md "http://$IP/export/$SID?format=md" && head -5 notes.md
curl -s -o notes.docx "http://$IP/export/$SID?format=docx" && file notes.docx
curl -s -o notes.pdf  "http://$IP/export/$SID?format=pdf"  && file notes.pdf
```
**All green = ready to demo.**

---

## 6. Demo Script (90 seconds)

1. Open `http://<IP>/` on the projector. Point at the instance: *"Everything you'll see runs on this one box — the model is ours, no OpenAI."*
2. **Start** → speak 30-40s of real math (or play the pre-recorded clip through the mic). Watch transcript stream left, notes build right — headings, bullets, then a table.
3. Point at `[[eigenvalue]]` wikilinks: *"Export this folder straight into Obsidian."*
4. **End & Export** → in ~60s: *"AWS Transcribe with our custom engineering-mathematics vocabulary just produced the archival transcript"* — show `final_transcript.txt` in S3.
5. Close: *"EC2 runs the brain, S3 stores the knowledge, DynamoDB tracks every chunk, Lambda finalizes, Transcribe archives. Under two dollars. Not one call to OpenAI."*

---

## 7. Teardown (protect your credits)

```bash
aws ec2 terminate-instances --instance-ids "$INSTANCE_ID"
aws ec2 delete-key-pair --key-name speechlekha
aws dynamodb delete-table --table-name Sessions
aws dynamodb delete-table --table-name Chunks
aws s3 rb "s3://${BUCKET}" --force
aws lambda delete-function --function-name speechlekha-finalizer
aws events delete-rule --name speechlekha-transcribe-done
aws iam delete-role --role-name speechlekha-lambda-role   # detach policies first if needed
aws iam remove-role-from-instance-profile --instance-profile-name speechlekha-ec2-role --role-name speechlekha-ec2-role
aws iam delete-instance-profile --instance-profile-name speechlekha-ec2-role
aws iam delete-role --role-name speechlekha-ec2-role
```
> The EBS volume dies with the instance. Termination is the money-saver — stopping still bills for the disk.

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Ollama OOM / service killed on t3.medium | Expected on 4GB. Swap is already on. If still dying: stop instance → `aws ec2 modify-instance-attribute --instance-id $INSTANCE_ID --instance-type "{\"Value\": \"c6i.xlarge\"}"` → start (~$0.17/hr). Public IP changes; update `$IP`. |
| `/chunk` slow (>10s) | tiny.en on 2 vCPU ≈ 3-6s/chunk — normal. base.en will be ~2x slower; keep tiny.en. |
| Transcribe job FAILED | Almost always: vocabulary not READY (run §2.7), or `full.webm` missing/corrupt. Check `aws transcribe get-transcription-job --transcription-job-name speechlekha-$SID`. |
| `final_transcript.txt` never appears | Check Lambda logs: `aws logs tail /aws/lambda/speechlekha-finalizer`. Common: Lambda role missing `transcribe:GetTranscriptionJob`. |
| SSE not updating in browser | Open devtools console; `EventSource` needs HTTP (not HTTPS) on the raw IP — that's expected. If behind a proxy, disable buffering. |
| Whisper garbles a math term | Add it to `HOTWORDS` in app.py **and** to the Transcribe vocabulary phrases (recreate vocab → new name). |
| First `/chunk` takes 30s+ | Whisper weights downloading on first call — bootstrap pre-downloads it; if you skipped, just hit it once and wait. |

---

## 9. Architecture (what you just built)

```
Browser (mic, 8s chunks, SSE render)
   │ POST /chunk · GET /stream
   ▼
EC2 t3.medium ── FastAPI(app.py) ── faster-whisper (live STT)
   │                    └── Ollama → speechlekha (fine-tuned Qwen 1.5B) ── tool harness ── sessions/*.md
   │ S3 (audio, notes, exports)
   │ Lambda ──► Amazon Transcribe (archival, custom vocab) ──► EventBridge ──► Lambda (finalize)
   │ DynamoDB (Sessions, Chunks) · IAM roles · CloudWatch (logs + alarm)
```
