#!/bin/bash
set -e
exec > >(tee -a /var/log/speechlekha-setup.log) 2>&1

echo "=== Starting SpeechLekha Model and Dependency Setup ==="

# 1. Install Python packages
pip3 install --break-system-packages fastapi "uvicorn[standard]" faster-whisper \
  httpx boto3 python-multipart huggingface_hub weasyprint

# 2. Setup model directories
mkdir -p /opt/speechlekha/data
mkdir -p /opt/speechlekha/hf
cd /opt/speechlekha

# 3. Download Qwen2.5-1.5B GGUF weights
echo "Downloading fine-tuned SpeechLekha model weights..."
huggingface-cli download Himanshu-Vishwakarma-HF/speechlekha-qwen-gguf \
  --include "speechlekha-gguf_gguf/*" --local-dir /opt/speechlekha/hf

# 4. Create Ollama model
echo "Registering model with Ollama..."
systemctl start ollama || true
ollama create speechlekha -f /opt/speechlekha/hf/speechlekha-gguf_gguf/Modelfile

# 5. Pre-cache faster-whisper tiny.en weights
echo "Pre-caching faster-whisper tiny.en..."
python3 -c "from faster_whisper import WhisperModel; WhisperModel('tiny.en', device='cpu'); print('Whisper initialized successfully!')"

# 6. Ensure .env exists
cat > /opt/speechlekha/.env << 'EOF'
AWS_REGION=ap-south-1
BUCKET_DATA=speechlekha-data-808101329680
DDB_SESSIONS=Sessions
DDB_CHUNKS=Chunks
STT_MODEL=tiny.en
TRANSCRIBE_VOCABULARY=eng-math-vocab
AGENT_EVERY_N_CHUNKS=2
MODEL_NAME=speechlekha
DATA_DIR=/opt/speechlekha/data
EOF

# 7. Ensure app.py permissions
if [ -f /tmp/app.py ]; then
    cp /tmp/app.py /opt/speechlekha/app.py
fi

# 8. Restart service
systemctl daemon-reload
systemctl restart speechlekha

echo "=== SpeechLekha Setup Finished Successfully! ==="
