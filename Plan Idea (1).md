# SpeechLekha — Hackathon Master Plan

> **Event:** AWS Hackathon (Open Innovation) · **Duration:** ~5 hrs · **Budget:** $50 AWS credits · **Team:** 4 (Python · UI Design · ML · AI/Agents) + 1 IoT/AWS infra friend
> **Judging basis:** AWS services used + working deployed prototype (no slides)

---

## 1. The Idea (Elevator Pitch)

**SpeechLekha** — speak, and watch a structured, Obsidian-style knowledge document build itself live on screen.

A realtime speech-to-text pipeline feeds an on-device-class **Small Language Model (SLM) acting as a note-writing agent**. The agent doesn't just "summarize" — it uses **tools to write systematically into a sandbox file system** (folders and Markdown files): creating sections, appending bullets, building tables, inserting key terms as `[[wikilinks]]`, and even generating Mermaid graphs from what it hears. The user watches a live-rendered Markdown preview and can export the result as **Markdown, PDF, or Word**.

**One-liner:** *"A self-hosted, open-source AI note-taker that writes like you think — organized Markdown notes, built live from speech, with zero dependency on OpenAI/Google/Anthropic."*

---

## 2. The Problem

1. **Students miss content while scribbling.** Humans type ~40 wpm but speak ~150 wpm. Note-taking during lectures is a losing race — you either listen or you write, rarely both.
2. **Recordings don't get re-watched.** Everyone records lectures; almost nobody re-listens to 60 minutes of audio to find 5 minutes of value. Recordings are write-only memory.
3. **Existing AI note-takers are black boxes in the cloud.** Otter.ai, Notta, Fireflies, etc. send your voice to their servers, cost subscriptions, lock notes in their app, and — critically for us — **are just wrappers around OpenAI/Google models**. Your lecture data leaves your control.
4. **LLM power is gatekept by AI MNCs.** Students and small builders who want to *run* models themselves (not rent them) face a wall: huge model sizes, GPU costs, and cloud notebooks that disconnect. Small, capable SLMs that run anywhere — even on a modest VPS or embedded system — are the missing piece.

---

## 3. The Solution

SpeechLekha turns live speech into a **systematically organized Markdown knowledge base** in real time:

| Stage | What happens |
| --- | --- |
| **Capture** | User speaks in the browser; audio is chunked every ~8s (Opus via MediaRecorder) and streamed to the server |
| **Transcribe** | Self-hosted **Whisper (tiny.en)** transcribes each chunk in ~2-4s (faster than realtime on CPU) |
| **Agentic note-writing** | Every ~2 chunks, the transcript-so-far + current file tree + file contents are fed to the **SLM agent (Qwen2.5-1.5B)** |
| **Tool harness** | The agent issues structured tool calls (`create_file`, `append_bullets`, `add_table`, `add_mermaid`, `update_index`…) that a small Python harness executes against a **sandbox folder per session** |
| **Live render** | Frontend re-renders the Markdown folder live: headings, paragraphs, bullets, tables, `[[wikilinks]]`, Mermaid diagrams, icons |
| **Export** | One click → `.md` (raw), `.docx` (Word), `.pdf` — generated server-side via Pandoc, downloadable via presigned S3 URL |

The output isn't a chat response — it's a **folder of real Markdown files**, Obsidian-compatible, exportable, and written by an agent that *acts* rather than *replies*.

---

## 4. Why This Is a Hackathon-Worthy "Wow"

- **Theatrical demo:** talk for 30 seconds → headings, bullets, a table, and a diagram appear live on a projected screen. "Future of classrooms" energy.
- **Real agent, not a wrapper:** the SLM runs **on our own EC2 instance** (Ollama + CPU). We can honestly say: *"No OpenAI. No Google. No Anthropic. The model is ours."* — while most teams will demo a provider API in a trenchcoat.
- **Agent with hands:** watching an LLM *edit a file system* systematically (creating folders, placing content) is visibly more impressive than watching text stream.
- **Obsidian-native output:** every key term becomes a `[[wikilink]]`; export the folder straight into Obsidian. Nerdy, specific, memorable.
- **Cost flex:** the entire thing runs on ~$2 of compute for the event day.

---

## 5. System Architecture

```javascript
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER (UI)                                                        │
│  Mic capture ──▶ MediaRecorder (8s Opus chunks)                     │
│  Live Markdown preview (marked.js + Mermaid + highlight.js)          │
│  Export buttons (MD / DOCX / PDF) · Session list                     │
└──────────────▲──────────────────────────────────────────────────────┘
               │ HTTPS (POST /chunk · SSE /stream · GET /export)
┌──────────────┴──────────────────────────────────────────────────────┐
│  EC2 (c6i.xlarge, ap-south-1) — "The Brain"                          │
│                                                                      │
│  FastAPI server                                                      │
│   ├─ STT worker    : faster-whisper (tiny.en) + Silero VAD filter    │
│   ├─ Agent loop    : Qwen2.5-1.5B via Ollama (JSON tool-calling)     │
│   ├─ Tool harness  : executes agent tool calls on the sandbox FS     │
│   │                  (session folders: 00-index.md, sections/, ...)  │
│   └─ Exporter      : Pandoc → .md / .docx / .pdf                     │
└──────┬──────────────────┬──────────────────┬─────────────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐   ┌──────────────┐   ┌─────────────────────────────┐
│  DynamoDB   │   │  S3          │   │  Lambda (finalizer+export)  │
│  Sessions   │   │  -lekha-data │   │  S3 event → EventBridge →   │
│  Chunks     │   │  (audio,     │   │  polish pass → zip folder → │
│  (metadata, │   │  notes,      │   │  presigned URLs → update    │
│   latency)  │   │  exports)    │   │  DynamoDB status            │
└─────────────┘   │  -lekha-     │   └─────────────────────────────┘
                  │   assets(UI) │            ▲
                  └──────┬───────┘            │ IAM role (instance
                         ▼                    │  profile, least-privilege)
              ┌────────────────────┐          │
              │ CloudFront (CDN)   │          │
              │ serves UI          │    ┌─────┴───────┐
              └────────────────────┘    │ CloudWatch  │
                                        │ logs + live │
                                        │ dashboard   │
                                        └─────────────┘
```

**Design principle:** the EC2 box is disposable state; S3 is durable storage; DynamoDB is queryable metadata; IAM gates everything.

---

## 6. Detailed Pipeline

### Stage 1 — Capture (Browser)

- `MediaRecorder` with `timeslice: 8000` → Opus/WebM chunks.
- Chunks upload immediately via `POST /chunk/{session_id}`.
- **Why chunked, not streaming:** 10x simpler code, Whisper can't tell the difference, demo looks identical.

### Stage 2 — Transcription (STT)

- `faster-whisper` **tiny.en** (int8, CPU): realtime factor ≈ 0.3 on 4 vCPU → 8s audio in ~2.5s.
- `vad_filter=True` (Silero VAD) kills demo-room noise and silence.
- Each chunk's text + latency appended to transcript buffer and written to DynamoDB `Chunks` table.

### Stage 3 — Agent Loop (the core differentiator)

Trigger: every 2 chunks (~16s of speech) or on VAD silence.

Context given to the SLM:

1. Full transcript so far
2. Current sandbox file tree (paths only)
3. Contents of the last-modified file (truncated)
4. System prompt with tool schemas

The model outputs **one structured tool call per turn** (JSON mode):

```json
{
  "tool": "append_bullets",
  "args": {
    "path": "02-photosynthesis.md",
    "bullets": [
      "Converts light energy into chemical energy in chloroplasts",
      "Occurs in two stages: light-dependent reactions and the Calvin cycle"
    ]
  }
}
```

The harness validates the path (sandbox jail: `../` rejected), executes the tool, updates the file tree, and pushes the changed files' contents to the UI over **SSE**.

**Tool set (v1 — keep it small):**

| Tool | Action |
| --- | --- |
| `create_section` | New file `NN-title.md` under the session folder |
| `append_bullets` | Append bullets to current section |
| `add_paragraph` | Append a prose paragraph |
| `add_table` | Insert/update a Markdown table (e.g., comparisons, formulas) |
| `add_mermaid` | Insert Mermaid code block (flowcharts from processes described aloud) |
| `update_index` | Rewrite `00-index.md`: title, 3-line summary, key terms as `[[wikilinks]]`, file links |
| `flag_confusion` | Mark an unclear audio segment for review (honesty feature!) |

**Max 2 tool calls per trigger** (1.5B model + CPU = keep turns short). Retry-once on invalid JSON.

### Stage 4 — Live Render (Frontend)

- **marked.js** → HTML; **Mermaid.js** renders code blocks as live diagrams; emoji shortcodes for icons (⚠️ ✅ 📌).
- Two-pane layout: transcript (left, scrolling) · rendered notes (right, updating).
- "✍️ agent writing…" indicator while a tool call is in flight.
- Obsidian-dark theme — this is the UI designer's stage.

### Stage 5 — Export

- `GET /export/{session_id}?format=md|docx|pdf`
- Pandoc converts the folder → single document (index + concatenated sections).
- Upload result to S3 → presigned URL (15 min TTL) → frontend download button.
- **PDF path:** Pandoc → HTML → WeasyPrint (avoids the LaTeX install mess on a fresh instance).

### Stage 6 — Session Finalization

1. User clicks End → FastAPI invokes **Lambda** (`speechlekha-finalizer`) with the session_id.
2. Lambda reads `Chunks` from DynamoDB, runs one final "polish pass" on `00-index.md` (via the EC2-exposed internal endpoint or a bundled tiny inference — simplest: EC2 does polish, Lambda handles packaging).
3. **S3 event → EventBridge → Lambda** triggers packaging: zip the session folder into `-lekha-data`.
4. Lambda updates `Sessions.status = completed` + writes presigned URLs.
5. TTL (7 days) on DynamoDB rows auto-cleans.

---

## 7. Team Architecture — 4 Independent Components

**The rule that lets 4 people work alone for 5 hours and merge in minutes: the contract is frozen at hour 0.** Everyone codes against one written contract (endpoints, event schemas, folder layout, env vars) plus a mock of everyone else's component. If it's not in `contracts.md`, it doesn't exist — no side agreements, no "I'll just add a field."

### 7.1 The Frozen Contract (`contracts.md` — written together, first 20 minutes)

**API surface** (owned by Component 3, consumed by 1, 2, 4):

| Endpoint | Request | Response | Called by |
|---|---|---|---|
| `POST /session` | `{title?}` | `{session_id}` | C4 |
| `POST /chunk/{sid}` | multipart audio (webm/opus) | `{chunk_no, text, latency_ms}` | C4 → C1 |
| `GET /stream/{sid}` | SSE stream | event envelope (below) | C4 |
| `GET /files/{sid}` | — | `{tree: [...], files: {path: content}}` | C4 |
| `POST /session/{sid}/end` | — | `{status: "processing"}` → later `{download_urls}` | C4 |
| `GET /export/{sid}?format=md\|docx\|pdf` | — | `302` → presigned URL | C4 |
| `POST /internal/agent_tick` | `{sid, transcript}` | `{changed_files: {path: content}}` | C3 → C2 |

**SSE event envelope** (single shape for everything live):

```json
{"type": "transcript | file_changed | agent_status | session_state",
 "session_id": "uuid", "ts": "ISO-8601", "payload": { }}
```

**Sandbox folder layout** (owned by C2, read by C3/C4):

```
sessions/<session_id>/
  00-index.md          # summary + [[key terms]] + section links
  01-<slug>.md         # one file per section (agent creates)
  assets/              # images/diagrams (future)
```

**Shared `.env`** (copy of `.env.example` — same keys for everyone):

```
AWS_REGION=ap-south-1
BUCKET_DATA=speechlekha-data
BUCKET_ASSETS=speechlekha-assets
DDB_SESSIONS=Sessions
DDB_CHUNKS=Chunks
CHUNK_SECS=8
AGENT_EVERY_N_CHUNKS=2
MOCK_MODE=false
```

### 7.2 The Four Components

| # | Component | Owner | Standalone deliverable (runs WITHOUT the others) |
|---|---|---|---|
| 🎤 | **C1 — STT Pipeline ("The Ear")** | ML friend | `stt/` package exposing a FastAPI `APIRouter`: audio multipart in → `{chunk_no, text, latency_ms}` out; appends to transcript buffer; tested via `curl -F file=@sample.wav`. Also produces the **60s canned lecture audio** (doubles as demo fallback). |
| 🧠 | **C2 — Agent Harness ("Brain & Hands")** | You | `agent/` package: `run_tick(transcript, file_tree) → changed_files`; system prompt + JSON tool schema + sandbox-jailed executor + retry-once logic. Ships `agent/demo.py` that feeds a canned transcript and builds a full folder of `.md` files — provable on your laptop, no server needed. |
| 🔌 | **C3 — Orchestrator + AWS Glue ("The Spine")** | Python friend | `server.py` that **mounts C1's and C2's routers**, owns session lifecycle, SSE fan-out, DynamoDB writes, export pipeline (Pandoc→S3→presigned), Lambda finalizer, EventBridge rule. `MOCK_MODE=true` runs the entire UX with canned data — **no AWS needed**. Also ships `mock_server.py` for C4. |
| 🖥️ | **C4 — Frontend ("The Face")** | UI designer | Static site in `web/`: mic capture (MediaRecorder 8s chunks), two-pane live render (marked.js + Mermaid + icons), session list, export buttons. Develops entirely against `mock_server.py` — never blocked. |

**The mechanical merge trick:** C1 and C2 each export a FastAPI `APIRouter` (`stt_router`, `agent_router`) with agreed prefixes. C3's `server.py` is 30 lines: `app.include_router(...)`. Nobody merges code into anyone else's files — the spine imports them.

### 7.3 Mock-First Development (nobody waits for anybody)

- **C1** mocks nothing (it's the source) — but delivers `sample.wav` + expected JSON for everyone.
- **C2** mocks the STT feed: canned 60s lecture transcript → demo folder. This transcript is the single most reused artifact of the day.
- **C3** mocks C1+C2 in `MOCK_MODE`: canned transcript events + canned `file_changed` events stream over SSE exactly per contract — C4 can't tell the difference.
- **C4** mocks everything via `mock_server.py`, so the UI is 100% done before the real backend exists.

### 7.4 Definition of Done (each component, tested ALONE)

- **C1:** curl a wav → valid JSON with text, < 5s, VAD on, noise robust.
- **C2:** `python -m agent.demo` → a session folder with `00-index.md`, ≥2 sections, one table or Mermaid block, zero crashes on 10 consecutive ticks.
- **C3:** `MOCK_MODE=true` → browser sees the full live experience; `MOCK_MODE=false` → real rows in DynamoDB, real objects in S3.
- **C4:** against mock server → record → watch notes appear → click all three export buttons.

### 7.5 Merge Plan — Forced Sync Points

| Clock | Sync | What happens |
|---|---|---|
| 0:00 | **Contract freeze** | 20 min, all 4: write `contracts.md` + `.env.example` + repo skeleton. After this it is read-only. |
| 1:30 | Sync #1 | C1 endpoint demoed live to C3; `mock_server.py` handed to C4; C2 shows `agent/demo.py` output. |
| 3:00 | Sync #2 (the big one) | **C2 ↔ C3 integrate**: real transcript → real agent ticks → real `file_changed` over SSE. This is the heart — protect this slot. |
| 3:45 | Sync #3 | C4 swaps mock for real server; AWS bits (IAM role, Lambda, EventBridge) wired. |
| 4:30 | Feature freeze | Only bugfixes + demo rehearsals from here. |

**Merge order if time is short:** C2↔C3 first (the wow lives there), then C1 into the spine, then C4 against the real server, AWS glue last.

## 8. Flowchart (End-to-End)

```javascript
                    ┌──────────────┐
                    │  User opens  │
                    │  SpeechLekha │
                    └──────┬───────┘
                           ▼
               ┌───────────────────────┐
               │ Create session (DDB)  │
               └──────┬────────────────┘
                      ▼
        ┌─────────────────────────────┐     no
   ┌───▶│  Mic chunk captured (8s)?   │────────▶ End session ──▶ Lambda finalizer
   │    └──────┬──────────────────────┘                        (polish→zip→S3→URL)
   │           ▓ yes
   │    ┌──────▼──────────────────────┐
   │    │ Whisper transcribe (VAD on) │──fail──▶ flag_confusion tool
   │    └──────┬──────────────────────┘
   │           ▓
   │    ┌──────▼──────────────────────┐        ┌─────────────────────┐
   │    │ Append to transcript buffer │───────▶│ DynamoDB Chunks     │
   │    └──────┬──────────────────────┘        └─────────────────────┘
   │           ▓
   │    every 2 chunks? ──no──▶ (loop back for next chunk)
   │           ▓ yes
   │    ┌──────▼──────────────────────┐
   │    │ Agent turn: transcript +    │
   │    │ file tree + last file       │
   │    └──────┬──────────────────────┘
   │           ▓
   │    ┌──────▼──────────────────────┐
   │    │ SLM outputs tool call (JSON)│──invalid──▶ retry once w/ error fed back
   │    └──────┬──────────────────────┘
   │           ▓
   │    ┌──────▼──────────────────────┐
   │    │ Harness validates + executes│──bad path──▶ reject, tell agent
   │    │ tool on sandbox filesystem  │
   │    └──────┬──────────────────────┘
   │           ▓
   │    ┌──────▼──────────────────────┐
   └───┬│ SSE push changed .md files  │
       │ └──────┬──────────────────────┘
       │        ▓
       │ ┌──────▼──────────────────────┐
       └─│ Frontend live-renders notes │
         └─────────────────────────────┘
```

---

## 9. Competitor Analysis

| Competitor | What it does | Where it falls short vs SpeechLekha |
| --- | --- | --- |
| **Otter.ai** | Cloud transcription + summaries | Closed, subscription, notes locked in their app, data on their servers, wrapped big-model AI |
| **Notta / Fireflies.ai** | Meeting transcription bots | Same: cloud-only, per-seat pricing, no file-system structure, no local/self-host option |
| **Plaud / Fathom** | Hardware + cloud AI notes | Hardware cost + cloud dependency; transcription is the product, *organizing* isn't |
| **Microsoft Copilot / Teams recap** | Meeting recap in Teams | Ecosystem-locked, cloud-dependent, zero control |
| **NotebookLM (Google)** | Upload audio → notes/study tools | Cloud, upload-after-the-fact (not realtime), not self-hostable |
| **Buzz / MacWhisper (OSS Whisper GUIs)** | Local Whisper transcription | Transcription only — no agentic structuring, no live Markdown knowledge base, no tables/diagrams |
| **Obsidian + plugins** (e.g., Whisper plugin) | Manual note vault, some STT plugins | No realtime agentic writing; plugins transcribe but don't *organize* |

**Whitespace nobody occupies:** *realtime, self-hosted, agentic, file-system-native note structuring with live Markdown rendering and open export.* SpeechLekha sits exactly there.

---

## 10. Where We Are Good (Differentiators)

1. **Zero AI-MNC dependency** — the SLM runs on *our* EC2 via Ollama. Our thesis in one line: *"small intelligence products that can be deployed anywhere — compact, embedded, yours."*
2. **Agent with tools, not a chatbot** — systematic file/folder writing is visibly smarter than text streaming; the file tree *is* the demo.
3. **Obsidian-native, open exports** — `.md` first; PDF/DOCX via Pandoc. Notes are *yours*, in a standard format, forever.
4. **Structured beyond bullets** — tables, Mermaid diagrams, wikilinks, icons — based on what the content needs, decided by the agent.
5. **Radically cheap** — ~$2/event day vs competitors' $10-30/user/month.
6. **Honest AI** — `flag_confusion` marks unclear audio instead of hallucinating. Judges remember integrity touches.
7. **AWS-native architecture** — every service used is load-bearing (judging criteria), not decorative.

---

## 11. Open-Source Tools (with Alternatives)

| Layer | Primary choice | Why | Alternatives (if primary fails) |
| --- | --- | --- | --- |
| ASR (STT) | **faster-whisper** (tiny.en) | Fastest CPU Whisper; built-in Silero VAD | whisper.cpp · Vosk (lighter, worse accuracy) · NeMo (heavier) |
| SLM runtime | **Ollama** (Qwen2.5:1.5b) | One-command install; OpenAI-compatible API; JSON mode | llama.cpp server · LM Studio (GUI, not server) |
| SLM model | **Qwen2.5-1.5B-Instruct** (Q4) | Best-in-class JSON/tool adherence at this size | SmolLM2-1.7B · Phi-3.5-mini (3.8B, slower on CPU) · TinyLlama-1.1B (weaker JSON) |
| Backend | **FastAPI + Uvicorn** | Async-native, SSE support, fast to build | Flask (simpler, no async) · Django (overkill) |
| AWS SDK | **boto3** | Official | — |
| Live push to UI | **SSE** (Server-Sent Events) | One-way streaming, dead simple, auto-reconnect | WebSocket (if bidirectional needed) · polling (fallback) |
| Markdown render | **marked.js** | Small, fast | markdown-it (plugin-rich) · remark |
| Diagrams | **Mermaid.js** | Text→diagram in browser | Excalidraw (manual) · Kroki (server render) |
| Icons | Emoji shortcodes (`:warning:`) | Zero assets | Font Awesome · Lucide |
| Export MD→DOCX | **Pandoc** | Battle-tested | python-docx (direct, more code) |
| Export MD→PDF | **Pandoc→HTML→WeasyPrint** | No LaTeX dependency | wkhtmltopdf · headless Chrome |
| Audio handling | **ffmpeg** (decode/convert) | Whisper dep anyway | pydub (wrapper, still needs ffmpeg) |
| Frontend | Vanilla JS + Tailwind (CDN) | No build step in 5 hours | React via Vite (if team prefers) |
| Env/config | **python-dotenv** | Simple | pydantic-settings |

**Fallback rule for the event:** if any model/component fails locally 30 min before the event, we swap to its listed alternative — no new research on event day.

---

## 12. AWS Services (with Free Tier & Credit Math)

**Mandatory trio (all teams need these):** EC2 · S3 · IAM.

| Service | Role in project | Free tier? | Event-day cost |
| --- | --- | --- | --- |
| **EC2** (c6i.xlarge, ap-south-1) | Runs FastAPI + Whisper + Ollama + agent harness | ❌ (t2/t3.micro only — too weak) | ~$0.17/hr × 8h ≈ **$1.40** |
| **S3** (2 buckets) | `-lekha-data`: audio, notes, exports · `-lekha-assets`: UI for CloudFront | ✅ 5GB × 12 months | <$0.10 |
| **IAM** | Instance profile (no access keys in code); presigned URLs for downloads | ✅ Always free | $0 |
| **DynamoDB** | `Sessions` + `Chunks` tables, on-demand | ✅ 25GB + provisioned capacity free tier | <$0.10 |
| **Lambda** | `speechlekha-finalizer`: polish trigger, packaging, presigned URLs | ✅ 1M req + 400k GB-s/mo | ~$0 |
| **EventBridge** | S3 object-created → Lambda trigger (decoupled, judge-friendly) | ✅ 1M events/mo | ~$0 |
| **CloudWatch** | Log group `/speechlekha/*` + custom metrics (chunks, latency) + dashboard | ✅ 5GB logs + 10 metrics | ~$0 |
| **CloudFront** | Serves the UI from `-lekha-assets` | ✅ 1TB + 1M req × 12 months | ~$0 |
| **AWS Budgets + billing alarm** | $5 budget alert, $10 alarm | ✅ Free | $0 |
| **TOTAL** |  |  | **≈ $2** |

### Credit-Management Rules (protect the $50)

1. **Local-first iteration.** Everything (models, FastAPI, harness, UI) runs on our laptops with the *same* models (Ollama + faster-whisper) before any EC2 minute is spent. **Target: ≥90% of dev time is $0.**
2. **One shared dev EC2, created only after local success.** Stop (don't terminate) between working sessions so EBS persists. Terminate only at the very end — or keep if budget allows.
3. **Hard service blocklist:** no NAT Gateway ($0.045/hr data-processing + hourly), no RDS, no SageMaker, no Bedrock, no ElastiCache, no Elastic IP left unattached.
4. **Billing alarm at $10 + Budget alert at $5** — set on Day 0, before anything launches.
5. **Region discipline:** everything in `ap-south-1` (latency + single-region data transfer = free).
6. **Right-size:** c6i.xlarge only for demo; if we rehearse, a t3.medium ($0.05/hr) suffices for non-demo testing (models still fit, just slower).
7. **Teardown checklist:** instance terminated → EBS volumes deleted → buckets emptied (versioning off) → log retention set to 1 day → final cost check in Billing console.

---

## 13. Team Split & 5-Hour Plan

| Time | Owner | Deliverable |
| --- | --- | --- |
| 0:00–0:40 | IoT/AWS friend | EC2 provisioned (c6i.xlarge, ap-south-1), ffmpeg/Ollama/faster-whisper installed, both models pulled & smoke-tested |
| 0:40–1:40 | ML friend | Chunk ingestion + Whisper pipeline + transcript buffer + `Chunks` writes to DynamoDB |
| 1:40–3:00 | **You (AI)** | Agent loop: system prompt + JSON tool schema + harness executor (sandbox jail) + retry logic |
| 1:40–3:30 (parallel) | UI designer | Two-pane live Markdown renderer (marked + Mermaid + icons), Obsidian-dark theme, "agent writing" indicator |
| 3:00–3:45 | Python friend | Export pipeline (Pandoc → DOCX/PDF/MD → S3 → presigned URL) + Lambda finalizer + EventBridge rule |
| 3:45–4:30 | All | CloudFront + assets bucket, IAM instance profile, CloudWatch dashboard, end-to-end wiring |
| 4:30–5:00 | All | **3 full rehearsals**, bugfix the one thing that breaks, freeze the demo script |

---

## 14. Risk Register & Fallbacks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Demo-room mic noise | High | USB mic if possible; Silero VAD; **pre-recorded 60s lecture clip** as "recorded lecture mode" fallback — same pipeline |
| SLM emits invalid JSON | Medium | Ollama JSON mode + retry-once with error fed back + final regex salvage |
| CPU inference lag | Medium | Update every ~16s of speech; spinner in UI; c6i (not burstable t3) |
| First-token load lag | Medium | Warm-up call at server start |
| Pandoc/LaTeX pain on fresh EC2 | Medium | Use WeasyPrint path (no LaTeX); test export locally first |
| Internet flake during demo | Low | Everything self-hosted on one box; UI served via CloudFront (edge-cached) |
| Session churn | — | DynamoDB TTL (7d) auto-cleans; S3 lifecycle rule to delete old audio |

---

## 15. Demo Script (90 seconds)

1. **0:00–0:10** — "Everyone records lectures; nobody re-listens. And every AI note-taker rents OpenAI. We built one that runs *ourselves*." Open SpeechLekha → New Session.
2. **0:10–0:40** — Speak (or play the clip): *"Photosynthesis converts light energy into chemical energy. It happens in two stages: light-dependent reactions in the thylakoid membranes, and the Calvin cycle in the stroma. Plants use chlorophyll, which absorbs red and blue light… Compare C3 and C4 plants…"*
3. **0:40–1:10** — Point at screen: headings appear → bullets → a **comparison table** → a **Mermaid diagram** of the two stages → `[[Chlorophyll]]` wikilinks in Key Terms. *"The model isn't summarizing text — it's editing files. Watch the file tree."*
4. **1:10–1:30** — End session → show CloudWatch dashboard (chunks processed, avg latency 3.2s) → download buttons: **Export as Markdown / Word / PDF** → open the `.md` — Obsidian-ready.
5. **1:30–1:40** — Close: *"EC2 runs the brain, S3 stores the knowledge, DynamoDB tracks every chunk, Lambda finalizes, CloudFront serves it. Total cost today: about two dollars. And not one call to OpenAI."*

---

## 16. Post-Hackathon Vision (if judges ask "what's next")

- **Smaller:** swap Qwen 1.5B → **SmolLM2-360M / Qwen 0.5B** quantised to run on Raspberry Pi 5 / ESP-class edge devices with audio HAT — the "small intelligence product, deployed anywhere" thesis.
- **Bigger:** multi-speaker diarization (pyannote), multilingual Whisper (small), collaborative lecture rooms (WebSocket), Obsidian plugin shipping notes straight to a vault.
- **Open-source it:** MIT license the harness — "the note-writing agent harness" as the reusable artifact.