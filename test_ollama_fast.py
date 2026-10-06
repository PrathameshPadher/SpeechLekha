import urllib.request
import json
import time

SYSTEM_PROMPT = """You are SpeechLekha, a realtime lecture-note writer. You receive the lecture transcript so far, the current note files, and the last file's tail. Output ONLY valid JSON of the form {"tool_calls":[{"tool":...,"args":{...}}]} with at most 2 tool calls and no other text.
Tools:
- create_section {"title": str}
- append_bullets {"path": str, "bullets": [str]}
- update_index {"summary": str, "key_terms": [str]}
"""

payload = {
    "model": "speechlekha",
    "messages": [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": "[TRANSCRIPT SO FAR]\nToday we are studying calculus and limits. The derivative of x squared is 2x.\n\n[CURRENT FILES]\n[\"00-index.md\"]\n\n[LAST FILE TAIL]\n# Lecture Notes\n"}
    ],
    "stream": False,
    "format": "json",
    "options": {
        "temperature": 0.2,
        "num_ctx": 1024,
        "num_predict": 120
    }
}

t0 = time.time()
req = urllib.request.Request(
    "http://127.0.0.1:11434/api/chat",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    resp = urllib.request.urlopen(req, timeout=60)
    data = json.loads(resp.read().decode("utf-8"))
    dur = time.time() - t0
    print(f"Ollama Response ({dur:.2f}s):")
    print(data["message"]["content"])
except Exception as e:
    print("Error calling Ollama:", e)
