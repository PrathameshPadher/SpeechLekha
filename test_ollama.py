import urllib.request
import json

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

payload = {
    "model": "speechlekha",
    "messages": [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": "[TRANSCRIPT SO FAR]\nToday we are studying calculus and limits. The derivative of x squared is 2x.\n\n[CURRENT FILES]\n[\"00-index.md\"]\n\n[LAST FILE TAIL]\n# Lecture Notes\n\n> **Summary:** (building…)\n"}
    ],
    "stream": False,
    "format": "json",
    "options": {"temperature": 0.2, "num_ctx": 2048}
}

req = urllib.request.Request(
    "http://127.0.0.1:11434/api/chat",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    resp = urllib.request.urlopen(req, timeout=120)
    data = json.loads(resp.read().decode("utf-8"))
    print("Ollama Response with SYSTEM_PROMPT:")
    print(data["message"]["content"])
except Exception as e:
    print("Error calling Ollama:", e)
