"""
Trade-license OCR + owner-photo crop microservice (Phase 3.1–3.3).

A small FastAPI service the Next.js `/api/extract` orchestrator calls **OCR-first**:
  POST /ocr   → Tesseract ben+eng on the license image → cleaned text + confidence
  POST /crop  → detect + crop the owner-photo region → (later) upload to Cloudinary

Status: SCAFFOLD. /ocr returns a working Tesseract result if pytesseract +
the ben/eng traineddata are installed; otherwise it returns 503 so the Node
orchestrator falls back to AI vision. /crop is a stub for a later sub-phase.

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
(Set PYTHON_SERVICE_URL=http://localhost:8000 in the Next app's .env.local.)
"""
from __future__ import annotations

import base64
import io

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="trade-license-ocr", version="0.1.0")


class OcrRequest(BaseModel):
    image: str  # base64-encoded image or pdf bytes
    contentType: str = "image/jpeg"
    lang: str = "ben+eng"


class OcrResponse(BaseModel):
    text: str
    confidence: float  # 0..1


class CropRequest(BaseModel):
    image: str
    contentType: str = "image/jpeg"


@app.get("/health")
def health() -> dict:
    return {"ok": True, "ocr": _ocr_available()}


def _ocr_available() -> bool:
    try:
        import pytesseract  # noqa: F401
        from PIL import Image  # noqa: F401
        return True
    except Exception:
        return False


@app.post("/ocr", response_model=OcrResponse)
def ocr(req: OcrRequest):
    """Tesseract ben+eng OCR. Returns 503 (via HTTPException) if deps missing so
    the Node orchestrator falls back to AI vision."""
    from fastapi import HTTPException

    if not _ocr_available():
        raise HTTPException(status_code=503, detail="OCR deps not installed")

    import pytesseract
    from PIL import Image, ImageOps

    try:
        raw = base64.b64decode(req.image)
        img = Image.open(io.BytesIO(raw))
    except Exception:
        raise HTTPException(status_code=400, detail="invalid image")

    # Light preprocessing: grayscale + autocontrast. (Deskew/threshold: later.)
    img = ImageOps.autocontrast(ImageOps.grayscale(img))

    data = pytesseract.image_to_data(
        img, lang=req.lang, output_type=pytesseract.Output.DICT
    )
    text = pytesseract.image_to_string(img, lang=req.lang)

    confs = [int(c) for c in data.get("conf", []) if str(c).lstrip("-").isdigit() and int(c) >= 0]
    confidence = (sum(confs) / len(confs) / 100.0) if confs else 0.0

    return OcrResponse(text=text, confidence=round(confidence, 3))


@app.post("/crop")
def crop(req: CropRequest):
    """Detect + crop the owner-photo region (OpenCV) and upload to Cloudinary.
    Stub for a later sub-phase — returns 501 for now."""
    from fastapi import HTTPException

    raise HTTPException(status_code=501, detail="crop not implemented yet")
