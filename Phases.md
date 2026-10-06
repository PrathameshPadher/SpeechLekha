# SpeechLekha — Execution Phases & Verification Checklist

> **Tracking Document**: Update the checkboxes (`- [x]`) as each milestone and verification gate is completed.
> **Target Region for All Resources**: `ap-south-1` (Mumbai)  
> **Estimated Budget Consumption**: ~$0.50 – $2.00 (within $50 credit limit)

---

## Progress Overview

- [x] **Phase 0: Environment Connection & CLI/CloudShell Setup**
- [x] **Phase 1: Cloud Infrastructure & Security Roles**
- [ ] **Phase 2: Archival STT (Transcribe, Lambda & EventBridge)**
- [ ] **Phase 3: EC2 Launch & Automated Model Bootstrap**
- [ ] **Phase 4: Application Wiring & End-to-End Testing**
- [ ] **Phase 5: Demo Rehearsal (90-Second Walkthrough)**
- [ ] **Phase 6: Clean Teardown (Credit Protection)**

---

## Phase 0: Environment Connection & Setup

- [x] **Step 0.1: Connect Environment**
  - *Option B Completed*: Configured local environment with `boto3` and `awscli` on E: drive.
  - AWS credentials configured for region `ap-south-1`.
- [x] **Step 0.2: Set Global Variables**
  - **Account ID:** `808101329680`
  - **Region:** `ap-south-1`
  - **Bucket Name:** `speechlekha-data-808101329680`
- [x] **Verification Gate 0**:
  - `aws sts get-caller-identity` PASSED: `arn:aws:iam::808101329680:root`

---

## Phase 1: Cloud Infrastructure & Security Roles

- [x] **Step 1.1: Billing Alarm Safeguard ($10 Cap)**
  - CloudWatch Alarm `speechlekha-budget` created in `us-east-1` on metric `EstimatedCharges >= $10`.
- [x] **Step 1.2: S3 Data Bucket**
  - Bucket `speechlekha-data-808101329680` created in `ap-south-1`.
  - Public access block applied (`BlockPublicAcls`, `IgnorePublicAcls`, `BlockPublicPolicy`, `RestrictPublicBuckets`).
- [x] **Step 1.3: DynamoDB Tables (On-Demand / Free-Tier Friendly)**
  - Table `Sessions` (HASH: `session_id`) created and ACTIVE.
  - Table `Chunks` (HASH: `session_id`, RANGE: `chunk_no`) created and ACTIVE.
- [x] **Step 1.4: IAM Roles & Instance Profile**
  - Role `speechlekha-ec2-role` created with inline policy `speechlekha-ec2` and attached to Instance Profile `speechlekha-ec2-role`.
  - Role `speechlekha-lambda-role` created with policy `speechlekha-lambda`.
- [x] **Verification Gate 1**:
  - S3 Status: HTTP 200 (Active)
  - DynamoDB Sessions: ACTIVE
  - DynamoDB Chunks: ACTIVE
  - IAM EC2 Profile: `speechlekha-ec2-role` READY
  - IAM Lambda Role: `speechlekha-lambda-role` READY

---

## Phase 2: Archival STT (Transcribe, Lambda & EventBridge)

- [ ] **Step 2.1: Custom Vocabulary for Amazon Transcribe**
  - Create vocabulary `eng-math-vocab` containing domain terms (`eigenvalue`, `eigenvector`, `Laplace transform`, `Fourier series`, `Gaussian elimination`, etc.).
  - Run `python3 create_vocab.py`.
- [ ] **Step 2.2: Lambda Function Deployment (`speechlekha-finalizer`)**
  - Package `lambda_function.py` into `function.zip`.
  - Deploy function with Python 3.12 runtime, memory 256MB, timeout 60s, using `speechlekha-lambda-role`.
- [ ] **Step 2.3: EventBridge Orchestration**
  - Rule `speechlekha-transcribe-done` matching event pattern:
    `{"source":["aws.transcribe"],"detail-type":["Transcribe Job State Change"]}`
  - Add Lambda invoke permission for `events.amazonaws.com`.
  - Set target of rule to `speechlekha-finalizer`.

- [ ] **Verification Gate 2**:
  ```bash
  aws transcribe get-vocabulary --vocabulary-name eng-math-vocab --query VocabularyState --output text
  aws lambda get-function --function-name speechlekha-finalizer --query Configuration.FunctionName --output text
  ```
  *Pass condition: Vocabulary state returns `READY` (do not proceed to EC2 until READY).*

---

## Phase 3: EC2 Launch & Automated Model Bootstrap

- [x] **Step 3.1: Network & Security Group**
  - Key pair `speechlekha.pem` created.
  - Security group `speechlekha-sg` (`sg-097c47b00785bf303`): Port 80 (HTTP) open to world, Port 22 (SSH) open for remote debugging.
- [x] **Step 3.2: Prepare `bootstrap.sh` UserData**
  - Configured 4GB swapfile on EBS.
  - Installs FFmpeg, Pandoc, WeasyPrint, Python packages, and Ollama server.
  - Automatically fetches fine-tuned Qwen2.5-1.5B model (`Himanshu-Vishwakarma-HF/speechlekha-qwen-gguf`).
  - Pre-caches `tiny.en` Whisper model weights.
  - Automatically pulls `app.py` from S3 (`speechlekha-data-808101329680`) and starts `speechlekha.service`.
- [x] **Step 3.3: Launch EC2 Instance**
  - **Instance ID:** `i-070335e05df1b7590`
  - **Instance Type:** `t3.small` (**Free-Tier Eligible in `ap-south-1`**, 2 vCPUs, 2 GB RAM + 4 GB swap)
  - **Public IP:** `3.110.188.91`
  - **Web URL:** `http://3.110.188.91/`
  - **State:** `running` (Bootstrap executing in background ~8–10 min)

- [ ] **Verification Gate 3**:
  - Wait for cloud-init bootstrap to finish.
  - Web UI at `http://3.110.188.91/` returns HTTP 200 with SpeechLekha title.

---

## Phase 4: Application Wiring & End-to-End Testing

- [ ] **Step 4.1: Deploy Server Code (`app.py`)**
  - Verify `app.py` passes `"bucket": BUCKET` in the `speechlekha-finalizer` invoke payload.
  - Upload `app.py` to `/opt/speechlekha/app.py` via SCP:
    ```bash
    scp -i speechlekha.pem app.py ubuntu@"$IP":/opt/speechlekha/app.py
    ```
  - Reload and restart systemd service:
    ```bash
    ssh -i speechlekha.pem ubuntu@"$IP" 'sudo systemctl daemon-reload && sudo systemctl restart speechlekha'
    ```

- [ ] **Step 4.2: End-to-End Verification Checklist**
  - [ ] **1. Health Check**: `curl -s "http://$IP/" | grep -o SpeechLekha` returns `SpeechLekha`.
  - [ ] **2. Session Initiation**: `POST http://$IP/session` returns a 12-char `session_id`.
  - [ ] **3. Live STT Ingestion**: Send an 8s test audio chunk:
    ```bash
    curl -s -X POST "http://$IP/chunk/$SID" -F "file=@sample.wav;type=audio/wav"
    ```
    Verifies `faster-whisper` returns text and DynamoDB `Chunks` table records the entry.
  - [ ] **4. Agent Tool Execution**: After 2 chunks (~16s), verify agent generates markdown sections:
    ```bash
    curl -s "http://$IP/files/$SID"
    ```
    Expect `00-index.md` and `01-*.md` with bullets, tables, or Mermaid diagrams.
  - [ ] **5. Archival Pipeline Trigger**: Call `POST http://$IP/session/$SID/end`:
    - Full audio concatenated (`full.webm`) and uploaded to S3.
    - Notes zipped (`notes.zip`) and uploaded to S3.
    - Lambda `speechlekha-finalizer` triggers Amazon Transcribe job (`speechlekha-$SID`).
    - EventBridge detects completion → writes `final_transcript.txt` to S3 → marks DynamoDB session as `completed`.
  - [ ] **6. Document Exports**:
    - Verify `GET http://$IP/export/$SID?format=md` downloads valid Markdown.
    - Verify `GET http://$IP/export/$SID?format=docx` downloads Word document.
    - Verify `GET http://$IP/export/$SID?format=pdf` downloads PDF via WeasyPrint.

- [ ] **Verification Gate 4**:
  ```bash
  aws s3 ls "s3://${BUCKET}/${SID}/final_transcript.txt" && echo "PIPELINE 100% OPERATIONAL"
  ```
  *Pass condition: `final_transcript.txt` exists in S3 and notes export cleanly in all 3 formats.*

---

## Phase 5: Demo Rehearsal (90-Second Walkthrough)

- [ ] **Step 5.1: Browser Projection Setup**
  - Open `http://<IP>/` on full screen.
  - Test mic input permissions (`navigator.mediaDevices.getUserMedia`).
- [ ] **Step 5.2: Demo Execution Flow**
  1. **(0:00–0:15) Hook**: *"Everything you see runs self-hosted on AWS EC2 without calling OpenAI or proprietary APIs."*
  2. **(0:15–0:45) Speak Math**: Speak continuous engineering math (e.g., *"Eigenvalues satisfy determinant of A minus lambda I equals zero. This method uses characteristic polynomials..."*).
  3. **(0:45–1:15) Live File System Build**: Show the right-hand panel building sections, bullets, comparison tables, and Mermaid flowcharts live. Point out `[[wikilinks]]` for Obsidian.
  4. **(1:15–1:30) Archival & Export**: Click **End & Export**. Show Amazon Transcribe with custom vocabulary producing `final_transcript.txt` and download `.pdf` / `.docx`.

---

## Phase 6: Clean Teardown (Credit Protection)

Execute immediately after your demo / testing session to halt all charges:

- [ ] **Step 6.1: Terminate Compute & Security**
  ```bash
  aws ec2 terminate-instances --instance-ids "$INSTANCE_ID"
  aws ec2 delete-key-pair --key-name speechlekha
  aws ec2 delete-security-group --group-id "$SG"
  ```
- [ ] **Step 6.2: Purge Databases & Storage**
  ```bash
  aws dynamodb delete-table --table-name Sessions
  aws dynamodb delete-table --table-name Chunks
  aws s3 rb "s3://${BUCKET}" --force
  ```
- [ ] **Step 6.3: Remove Serverless & IAM Resources**
  ```bash
  aws lambda delete-function --function-name speechlekha-finalizer
  aws events delete-rule --name speechlekha-transcribe-done
  aws iam remove-role-from-instance-profile --instance-profile-name speechlekha-ec2-role --role-name speechlekha-ec2-role
  aws iam delete-instance-profile --instance-profile-name speechlekha-ec2-role
  aws iam delete-role-policy --role-name speechlekha-ec2-role --policy-name speechlekha-ec2
  aws iam delete-role --role-name speechlekha-ec2-role
  aws iam delete-role-policy --role-name speechlekha-lambda-role --policy-name speechlekha-lambda
  aws iam delete-role --role-name speechlekha-lambda-role
  ```
- [ ] **Verification Gate 6**: Check AWS Billing console to confirm zero active EC2/EBS instances remain.
