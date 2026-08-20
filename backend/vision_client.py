"""
视觉模型读图客户端 — 图片 bytes → 带左右标注的聊天文本
用 SiliconFlow 的 Qwen2.5-VL 等 OpenAI 兼容视觉模型替代 EasyOCR
"""
import os
import io
import base64
import logging
import httpx
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

logger = logging.getLogger(__name__)

VISION_API_KEY = os.getenv("VISION_API_KEY", "")
VISION_BASE_URL = os.getenv("VISION_BASE_URL", "https://api.siliconflow.cn/v1")
VISION_MODEL = os.getenv("VISION_MODEL", "Qwen/Qwen3-VL-8B-Instruct")

MAX_EDGE = 2048


def _image_to_base64(image_bytes: bytes) -> str:
    """缩放长边到 MAX_EDGE，转 RGB JPEG，返回 base64 data URL"""
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    w, h = image.size
    if max(w, h) > MAX_EDGE:
        scale = MAX_EDGE / max(w, h)
        image = image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=90)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def _build_vision_prompt(swap_sides: bool) -> str:
    left_label = "本人" if swap_sides else "对方"
    right_label = "对方" if swap_sides else "本人"
    return (
        "这是微信聊天截图。请识别所有聊天气泡中的文字，并按气泡左右位置区分说话人：\n"
        f"- 靠右的绿色气泡 = {right_label}发的消息\n"
        f"- 靠左的白色气泡 = {left_label}发的消息\n"
        "- 居中的灰色小字（时间戳、系统提示如「撤回了一条消息」「微信转账」）= 不标注，直接输出原文\n\n"
        "请严格按从上到下的时间顺序，每行一条，格式如下：\n"
        f"{left_label}：<文字>\n"
        f"{right_label}：<文字>\n"
        "<时间戳或系统提示直接输出原文，不加任何前缀>\n\n"
        "只输出识别出的对话内容，不要任何解释、不要 markdown 代码块。"
    )


def extract_text_via_vision(image_bytes: bytes, swap_sides: bool = False) -> str:
    """调用视觉模型读图，返回带左右标注的聊天文本"""
    if not VISION_API_KEY:
        logger.error("VISION_API_KEY 未设置，视觉读图将失败")
        return ""

    image_url = _image_to_base64(image_bytes)
    prompt = _build_vision_prompt(swap_sides)

    payload = {
        "model": VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        "max_tokens": 2048,
        "temperature": 0.1,
    }
    headers = {
        "Authorization": f"Bearer {VISION_API_KEY}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=60.0) as client:
        resp = client.post(
            f"{VISION_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    return data["choices"][0]["message"]["content"].strip()
