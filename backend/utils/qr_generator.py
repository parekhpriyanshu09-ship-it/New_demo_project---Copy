import qrcode
import io
import base64
from typing import Dict, Any

def generate_qr_code(data: Dict[str, Any]) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    # Always use pipe-delimited format: "entry:1|uid:SCRB-XXXX"
    # NEVER pass the dict directly — Python str(dict) uses single quotes
    # which is NOT valid JSON and breaks the scanner.
    entry_id = data.get('entry_id', 0)
    unique_id = data.get('unique_id', '')
    qr_text = f"entry:{entry_id}|uid:{unique_id}"
    qr.add_data(qr_text)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def create_qr_data(entry_id: int, unique_id: str, app_url: str = "scrb://") -> Dict[str, Any]:
    return {
        "entry_id": entry_id,
        "unique_id": unique_id,
        "app_url": app_url
    }