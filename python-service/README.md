# Trade-license OCR service (Phase 3.1–3.3)

Small FastAPI microservice the Next.js `/api/extract` orchestrator calls
**OCR-first**. If it's not running (or Tesseract deps are missing), the Node
side falls back to AI vision automatically — so the app works without it.

## Endpoints
- `GET  /health` — `{ ok, ocr }` (whether Tesseract deps are importable)
- `POST /ocr`    — `{ image (base64), contentType, lang="ben+eng" }` → `{ text, confidence }`
- `POST /crop`   — owner-photo crop (stub, returns 501 — later sub-phase)

## Run locally
```bash
cd python-service
python -m venv .venv && . .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Tesseract binary + Bengali data required for real OCR:
#   Windows: install Tesseract-OCR, add ben.traineddata + eng.traineddata
#   Linux:   apt-get install tesseract-ocr tesseract-ocr-ben tesseract-ocr-eng
uvicorn main:app --reload --port 8000
```

Then set in the Next app's `.env.local`:
```
PYTHON_SERVICE_URL=http://localhost:8000
```

## Status
Scaffold. `/ocr` works when `pytesseract` + `ben`/`eng` traineddata are present;
otherwise returns 503 and the Node orchestrator uses AI vision. `/crop` is a stub.
