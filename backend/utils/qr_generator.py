import qrcode
import io
import base64
from typing import Dict, Any

def generate_qr_code(data: Dict[str, Any]) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=2,
    )
    # Always use pipe-delimited format: "entry:1|uid:SCRB-XXXX"
    # NEVER pass the dict directly — Python str(dict) uses single quotes
    # which is NOT valid JSON and breaks the scanner.
    entry_id = data.get('entry_id', 0)
    unique_id = data.get('unique_id', '')
    qr_text = f"entry:{entry_id}|uid:{unique_id}"
    qr.add_data(qr_text)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    from PIL import Image, ImageDraw, ImageFont

    width, height = img.size
    
    pad = 6
    new_width = width + (pad * 2)
    new_height = height + (pad * 2)
    new_img = Image.new("RGB", (new_width, new_height), "white")
    new_img.paste(img, (pad, pad))

    draw = ImageDraw.Draw(new_img)
    text = f"{unique_id}"
    if not text:
        text = f"#{entry_id}"

    try:
        font = ImageFont.truetype("arial.ttf", 12)
    except IOError:
        font = ImageFont.load_default()

    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    except AttributeError:
        text_width, text_height = draw.textsize(text, font=font)

    margin = 6
    
    # Top (centered horizontally)
    x_top = (new_width - text_width) // 2
    y_top = margin
    draw.text((x_top, y_top), text, fill="black", font=font)
    
    # Bottom (centered horizontally)
    x_bot = (new_width - text_width) // 2
    y_bot = new_height - text_height - margin
    draw.text((x_bot, y_bot), text, fill="black", font=font)
    
    # Create rotated text for Left and Right sides
    txt_img = Image.new("RGBA", (text_width, text_height), (255, 255, 255, 0))
    d = ImageDraw.Draw(txt_img)
    d.text((0, 0), text, fill=(0, 0, 0, 255), font=font)
    
    # Left side (rotated 90 degrees)
    left_txt = txt_img.rotate(90, expand=1)
    lw, lh = left_txt.size
    x_left = margin
    y_left = (new_height - lh) // 2
    new_img.paste(left_txt, (x_left, y_left), left_txt)
    
    # Right side (rotated -90 degrees)
    right_txt = txt_img.rotate(-90, expand=1)
    rw, rh = right_txt.size
    x_right = new_width - rw - margin
    y_right = (new_height - rh) // 2
    new_img.paste(right_txt, (x_right, y_right), right_txt)

    buffer = io.BytesIO()
    new_img.save(buffer, format="PNG")
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def create_qr_data(entry_id: int, unique_id: str, app_url: str = "scrb://") -> Dict[str, Any]:
    return {
        "entry_id": entry_id,
        "unique_id": unique_id,
        "app_url": app_url
    }