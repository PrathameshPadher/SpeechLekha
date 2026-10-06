import os, json, time, uuid, asyncio, tempfile, threading, subprocess, zipfile, re
from pathlib import Path
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import HTMLResponse, FileResponse, Response, StreamingResponse
from starlette.concurrency import run_in_threadpool
import boto3, httpx
from faster_whisper import WhisperModel

# ---------- config ----------
REGION = os.getenv("AWS_REGION", "ap-south-1")
BUCKET = os.getenv("BUCKET_DATA", "speechlekha-data-808101329680")
DDB_S  = os.getenv("DDB_SESSIONS", "Sessions")
DDB_C  = os.getenv("DDB_CHUNKS", "Chunks")
STT_MODEL = os.getenv("STT_MODEL", "tiny.en")
VOCAB  = os.getenv("TRANSCRIBE_VOCABULARY", "eng-math-vocab")
AGENT_EVERY = int(os.getenv("AGENT_EVERY_N_CHUNKS", "2"))
MODEL  = os.getenv("MODEL_NAME", "speechlekha")
OLLAMA = "http://127.0.0.1:11434/api/chat"
ROOT   = Path(os.getenv("DATA_DIR", "/opt/speechlekha/data"))
HOTWORDS = ("derivative integral eigenvalue eigenvector determinant "
            "Laplace transform Fourier series differential equation "
            "Gaussian elimination Newton-Raphson convergence Taylor series "
            "Maclaurin series partial derivative Jacobian bisection method")
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
    if isinstance(call, (list, tuple)) and len(call) >= 2:
        tool_raw = str(call[0]).strip().lower().replace("-", "_")
        arg_val = call[1]
        if isinstance(arg_val, dict):
            tool = tool_raw
            args = arg_val
        elif tool_raw in ("create_section",):
            tool, args = "create_section", {"title": str(arg_val)}
        elif tool_raw in ("append_bullets", "update_lecture"):
            tool, args = "append_bullets", {"path": "", "bullets": [str(arg_val)] if isinstance(arg_val, str) else list(arg_val)}
        elif tool_raw in ("add_paragraph",):
            tool, args = "add_paragraph", {"path": "", "text": str(arg_val)}
        elif tool_raw in ("update_index",):
            tool, args = "update_index", {"summary": str(arg_val), "key_terms": []}
        else:
            tool, args = tool_raw, {"note": str(arg_val)}
    elif isinstance(call, dict):
        tool = str(call.get("tool", "")).strip().replace("-", "_")
        args = call.get("args", {})
        if not isinstance(args, dict):
            args = {}
    else:
        return {}

    d = sdir(sid)
    changed = {}
    if tool == "create_section":
        n = len(list(d.glob("[0-9][0-9]-*.md"))) + 1
        title = args.get("title", f"Section {n}")
        slug = "".join(c if c.isalnum() else "-" for c in str(title).lower())[:30].strip("-") or "section"
        p = d / f"{n:02d}-{slug}.md"
        p.write_text(f"# {title}\n", encoding="utf-8")
        changed[str(p.relative_to(d))] = p.read_text(encoding="utf-8")
    elif tool in ("append_bullets", "add_paragraph", "add_table", "add_mermaid"):
        p = None
        if "path" in args and args["path"]:
            try:
                candidate = jail(sid, args["path"])
                if candidate.exists(): p = candidate
            except Exception: pass
        if p is None:
            secs = sorted(d.glob("[0-9][0-9]-*.md"))
            if not secs:
                p = d / "01-introduction.md"
                p.write_text("# Introduction\n", encoding="utf-8")
            else:
                p = secs[-1]
        with p.open("a", encoding="utf-8") as f:
            if tool == "append_bullets":
                f.write("".join(f"\n- {b}" for b in args.get("bullets", [])))
            elif tool == "add_paragraph":
                f.write(f"\n\n{args.get('text','')}\n")
            elif tool == "add_table":
                h = args.get("headers", ["Item", "Description"])
                f.write("\n\n| " + " | ".join(h) + " |\n|" + "---|" * len(h) + "\n")
                for r in args.get("rows", []):
                    f.write("| " + " | ".join(map(str, r)) + " |\n")
            elif tool == "add_mermaid":
                f.write(f"\n\n```mermaid\n{args.get('diagram','')}\n```\n")
        changed[str(p.relative_to(d))] = p.read_text(encoding="utf-8")
    elif tool == "update_index":
        sections = sorted(x.name for x in d.glob("[0-9][0-9]-*.md"))
        links = "\n".join(f"- [[{s[3:-3].replace('-', ' ').title()}]]" for s in sections)
        terms = " · ".join(f"[[{t}]]" for t in args.get("key_terms", []))
        (d / "00-index.md").write_text(
            f"# Lecture Notes\n\n> **Summary:** {args.get('summary','')}\n\n"
            f"## Sections\n{links}\n\n## Key Terms\n{terms}\n", encoding="utf-8")
        changed["00-index.md"] = (d / "00-index.md").read_text(encoding="utf-8")
    elif tool == "flag_confusion":
        with (d / "00-index.md").open("a", encoding="utf-8") as f:
            f.write(f"\n> ⚠️ unclear audio: {args.get('note','')}\n")
        changed["00-index.md"] = (d / "00-index.md").read_text(encoding="utf-8")
    return changed

def extract_tool_calls(raw: str):
    try:
        data = json.loads(raw)
        if isinstance(data, dict) and "tool_calls" in data:
            return data["tool_calls"]
        if isinstance(data, list):
            return data
    except Exception:
        pass
    calls = []
    for m in re.finditer(r'\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"args"\s*:\s*(\{.*?\})\s*\}', raw, re.DOTALL):
        try:
            calls.append({"tool": m.group(1), "args": json.loads(m.group(2))})
        except Exception:
            pass
    if calls:
        return calls
    m = re.search(r'\[\s*\[\s*"([^"]+)"\s*,\s*"?([^"\]]+)"?\s*\]\s*\]', raw)
    if m:
        return [[m.group(1), m.group(2)]]
    return []

# ---------- agent ----------
async def agent_tick(sid):
    st = state[sid]
    d = sdir(sid)
    transcript = " ".join(st["transcript"])
    files = sorted(x.name for x in d.glob("*.md"))
    secs = sorted(d.glob("[0-9][0-9]-*.md"))
    tail = secs[-1].read_text(encoding="utf-8")[-1500:] if secs else ""
    user = (f"[TRANSCRIPT SO FAR]\n{transcript}\n\n[CURRENT FILES]\n{json.dumps(files)}"
            f"\n\n[LAST FILE TAIL]\n{tail}")
    messages = [{"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user}]
    changed = {}
    for _ in range(2):
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.post(OLLAMA, json={
                    "model": MODEL, "messages": messages, "format": "json",
                    "stream": False, "options": {"temperature": 0.2, "num_ctx": 1024, "num_predict": 128,
                                                 "stop": ["<tool_call>", "</tool_call>", "<|im_end|>"]}})
            content = r.json().get("message", {}).get("content", "{}")
            print(f"[{sid}] agent_tick Ollama raw: {content}", flush=True)
            tool_calls = extract_tool_calls(content)
            for call in tool_calls[:2]:
                ch = execute(sid, call)
                changed.update(ch)
                print(f"[{sid}] execute {call} -> updated {list(ch.keys())}", flush=True)
            if tool_calls:
                break
        except Exception as e:
            print(f"[{sid}] agent_tick retry error: {e}", flush=True)
            messages.append({"role": "user", "content":
                f"Your last output was invalid ({type(e).__name__}). Output only valid JSON with tool_calls."})
    for path, content in changed.items():
        try: s3.put_object(Bucket=BUCKET, Key=f"{sid}/notes/{path}", Body=content.encode("utf-8"))
        except Exception: pass
    await st["queue"].put({"type": "agent_status", "payload": {"status": "idle"}})
    if changed:
        await st["queue"].put({"type": "file_changed", "payload": {"files": changed}})

# ---------- STT ----------
def transcribe(raw: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(raw); path = tmp.name
    try:
        hw = " ".join(HOTWORDS) if isinstance(HOTWORDS, (list, tuple)) else str(HOTWORDS)
        segs, _ = whisper.transcribe(path, language="en", vad_filter=True,
            initial_prompt=PROMPT_BIAS, hotwords=hw, beam_size=1)
        return " ".join(s.text for s in segs).strip()
    except Exception:
        try:
            segs, _ = whisper.transcribe(path, language="en", vad_filter=True,
                initial_prompt=PROMPT_BIAS, beam_size=1)
            return " ".join(s.text for s in segs).strip()
        except Exception:
            return ""
    finally:
        try: os.unlink(path)
        except Exception: pass

# ---------- API ----------
@app.post("/session")
async def new_session(title: str = ""):
    sid = uuid.uuid4().hex[:12]
    with state_lock: state[sid] = new_state()
    d = sdir(sid)
    (d / "00-index.md").write_text("# Lecture Notes\n\n> **Summary:** (building…)\n", encoding="utf-8")
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
    if n % AGENT_EVERY == 0 and any(t.strip() for t in st["transcript"]):
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
    fs = {p.name: p.read_text(encoding="utf-8") for p in sorted(d.glob("*.md"))}
    return {"tree": list(fs), "files": fs}

@app.get("/file/{sid}/{filename:path}")
async def get_file(sid: str, filename: str):
    p = jail(sid, filename)
    if not p.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=p.read_text(encoding="utf-8"), media_type="text/markdown")

@app.post("/session/{sid}/end")
async def end(sid: str):
    d = sdir(sid)
    chunks = sorted(d.glob("chunk_*.webm"))
    if chunks:
        (d / "concat.txt").write_text("".join(f"file '{c.name}'\n" for c in chunks), encoding="utf-8")
        subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0",
                        "-i", str(d / "concat.txt"), "-c", "copy", str(d / "full.webm")],
                       capture_output=True)
        if (d / "full.webm").exists():
            try: s3.upload_file(str(d / "full.webm"), BUCKET, f"{sid}/full.webm")
            except Exception: pass

    # Alternative A: Build high-accuracy archival transcript directly using faster-whisper on EC2
    st = state.get(sid, {})
    full_transcript = " ".join(st.get("transcript", []))
    if not full_transcript and (d / "full.webm").exists():
        try:
            full_transcript = transcribe((d / "full.webm").read_bytes())
        except Exception: pass

    final_tx_path = d / "final_transcript.txt"
    final_tx_path.write_text(full_transcript or "(No speech recorded)", encoding="utf-8")
    try:
        s3.upload_file(str(final_tx_path), BUCKET, f"{sid}/final_transcript.txt")
    except Exception as e:
        print("S3 upload transcript error:", e)

    # Backup notes zip to S3
    zp = f"/tmp/{sid}.zip"
    with zipfile.ZipFile(zp, "w") as z:
        for p in sorted(d.glob("*.md")): z.write(p, p.name)
    try:
        s3.upload_file(zp, BUCKET, f"{sid}/notes.zip")
    except Exception: pass

    # Update DynamoDB Session to completed
    try:
        sessions_t.update_item(
            Key={"session_id": sid},
            UpdateExpression="SET #s = :s, #t = :t",
            ExpressionAttributeNames={"#s": "status", "#t": "transcript_key"},
            ExpressionAttributeValues={":s": "completed", ":t": f"{sid}/final_transcript.txt"}
        )
    except Exception as e:
        print("DynamoDB update error:", e)

    return {"status": "completed", "transcript": full_transcript}

@app.get("/zip/{sid}")
@app.get("/export/{sid}")
async def export(sid: str, format: str = "zip"):
    d = sdir(sid)
    if format == "zip":
        zp = Path(tempfile.gettempdir()) / f"{sid}_notes.zip"
        with zipfile.ZipFile(zp, "w") as z:
            for p in sorted(d.glob("*.md")): z.write(p, p.name)
        return FileResponse(zp, filename=f"notes_{sid}.zip", media_type="application/zip")
    secs = sorted(d.glob("[0-9][0-9]-*.md"))
    combined = (d / "00-index.md").read_text(encoding="utf-8") + "\n\n" + "\n\n".join(p.read_text(encoding="utf-8") for p in secs)
    if format == "md":
        return Response(combined, media_type="text/markdown",
                        headers={"Content-Disposition": f"attachment; filename={sid}.md"})
    src = f"/tmp/{sid}.html"; Path(src).write_text(combined, encoding="utf-8")
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
function md(src){
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
 document.getElementById('status').textContent = '⚙️ finalizing…';
 setTimeout(async ()=>{ const f = await (await fetch('/files/'+sid)).json(); files=f.files; renderNotes();
   document.getElementById('exports').innerHTML =
     ['md','zip'].map(x=>`<a href="/export/${sid}?format=${x}">⬇ ${x.toUpperCase()}</a>`).join('');
   document.getElementById('status').textContent='✅ done'; }, 3000);}
</script>"""

@app.get("/")
async def index():
    return HTMLResponse(INDEX_HTML)
