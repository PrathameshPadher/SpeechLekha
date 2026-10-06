#!/bin/bash
set -e
exec > >(tee -a /var/log/speechlekha-step2.log) 2>&1

echo "=== Step 2: Download Model & Configure Ollama ==="

mkdir -p /opt/speechlekha/hf
cd /opt/speechlekha

# 1. Download Qwen2.5-1.5B GGUF weights
echo "Downloading fine-tuned SpeechLekha model..."
/opt/speechlekha/venv/bin/python3 -c "from huggingface_hub import snapshot_download; snapshot_download('Himanshu-Vishwakarma-HF/speechlekha-qwen-gguf', local_dir='/opt/speechlekha/hf')"

# 2. Start Ollama and create speechlekha model
echo "Registering model in Ollama..."
systemctl start ollama || true
sleep 3
ollama create speechlekha -f /opt/speechlekha/hf/speechlekha-gguf_gguf/Modelfile

# 3. Pre-cache whisper tiny.en
echo "Pre-caching faster-whisper tiny.en..."
/opt/speechlekha/venv/bin/python3 -c "from faster_whisper import WhisperModel; WhisperModel('tiny.en', device='cpu'); print('Whisper initialized successfully!')"

# 4. Copy app.py
if [ -f /tmp/app.py ]; then
    cp /tmp/app.py /opt/speechlekha/app.py
fi

# 5. Ensure .env
cat > /opt/speechlekha/.env << 'EOF_ENV'
AWS_REGION=ap-south-1
BUCKET_DATA=speechlekha-data-808101329680
DDB_SESSIONS=Sessions
DDB_CHUNKS=Chunks
STT_MODEL=tiny.en
TRANSCRIBE_VOCABULARY=eng-math-vocab
AGENT_EVERY_N_CHUNKS=2
MODEL_NAME=speechlekha
DATA_DIR=/opt/speechlekha/data
EOF_ENV

# 6. Update systemd service
cat > /etc/systemd/system/speechlekha.service << 'EOF_SVC'
[Unit]
Description=SpeechLekha Realtime Agentic Note Taker
After=network-online.target ollama.service
Wants=network-online.target

[Service]
WorkingDirectory=/opt/speechlekha
EnvironmentFile=/opt/speechlekha/.env
ExecStart=/opt/speechlekha/venv/bin/python3 -m uvicorn app:app --host 0.0.0.0 --port 80
Restart=always
MemoryMax=3.3G

[Install]
WantedBy=multi-user.target
EOF_SVC

systemctl daemon-reload
systemctl enable speechlekha
systemctl restart speechlekha

echo "=== SpeechLekha Successfully Deployed and Started! ==="
