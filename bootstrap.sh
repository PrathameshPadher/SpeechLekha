#!/bin/bash
exec > >(tee /var/log/speechlekha-bootstrap.log) 2>&1
set -x

echo "=== SpeechLekha Automated Bootstrap Starting ==="

apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg pandoc weasyprint python3-pip curl awscli

# 4GB swap (Crucial for t3.medium with 4GB RAM)
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
    grep -q swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

pip3 install --break-system-packages fastapi "uvicorn[standard]" faster-whisper \
  httpx boto3 python-multipart huggingface_hub

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
systemctl start ollama || true
sleep 3

mkdir -p /opt/speechlekha/data
cd /opt/speechlekha

# Download fine-tuned model and register with Ollama
huggingface-cli download Himanshu-Vishwakarma-HF/speechlekha-qwen-gguf \
  --include "speechlekha-gguf_gguf/*" --local-dir hf

ollama create speechlekha -f hf/speechlekha-gguf_gguf/Modelfile

# Pre-download Whisper tiny.en weights
python3 -c "from faster_whisper import WhisperModel; WhisperModel('tiny.en', device='cpu'); print('whisper ok')"

# Configure Environment
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

# Fetch app.py from S3 (using attached EC2 Instance Profile IAM role)
aws s3 cp s3://speechlekha-data-808101329680/app.py /opt/speechlekha/app.py --region ap-south-1

# Configure Systemd Service
cat > /etc/systemd/system/speechlekha.service << 'EOF_SERVICE'
[Unit]
Description=SpeechLekha Realtime Agentic Note Taker
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
EOF_SERVICE

systemctl daemon-reload
systemctl enable --now speechlekha

echo "BOOTSTRAP_DONE"
