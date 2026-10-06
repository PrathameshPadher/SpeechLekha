import wave
import struct
import math
import urllib.request
import json
import uuid

# Generate a small 3-second mono 16kHz WAV file
wav_path = "sample_test.wav"
sample_rate = 16000
duration = 3.0  # seconds
num_samples = int(sample_rate * duration)

with wave.open(wav_path, "w") as wav_file:
    wav_file.setnchannels(1)  # mono
    wav_file.setsampwidth(2)  # 16-bit
    wav_file.setframerate(sample_rate)
    for i in range(num_samples):
        # 440 Hz sine tone with soft amplitude
        sample = int(10000.0 * math.sin(2.0 * math.pi * 440.0 * (i / sample_rate)))
        wav_file.writeframes(struct.pack("<h", sample))

print(f"Generated {wav_path} ({num_samples} samples)")

# Test session creation and chunk upload
BASE_URL = "http://3.110.188.91"
req = urllib.request.Request(f"{BASE_URL}/session", data=b"", method="POST")
session_data = json.loads(urllib.request.urlopen(req).read().decode("utf-8"))
sid = session_data["session_id"]
print(f"Created session: {sid}")

# Prepare multipart/form-data for chunk upload
boundary = "----SpeechLekhaBoundary" + uuid.uuid4().hex
with open(wav_path, "rb") as f:
    audio_data = f.read()

body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="file"; filename="chunk_0.wav"\r\n'
    f"Content-Type: audio/wav\r\n\r\n"
).encode("utf-8") + audio_data + f"\r\n--{boundary}--\r\n".encode("utf-8")

chunk_req = urllib.request.Request(
    f"{BASE_URL}/chunk/{sid}",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    method="POST"
)

chunk_resp = json.loads(urllib.request.urlopen(chunk_req, timeout=30).read().decode("utf-8"))
print("Chunk upload response:", json.dumps(chunk_resp, indent=2))
