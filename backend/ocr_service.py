"""
OCR 服务 — 图片 bytes → 带左右标注的聊天文本
由视觉模型（SiliconFlow Qwen2.5-VL）替代 EasyOCR 实现
"""
import logging
from vision_client import extract_text_via_vision

logger = logging.getLogger(__name__)


def extract_text(image_bytes: bytes, swap_sides: bool = False) -> str:
    """从图片提取文字，按从上到下排列，并标注左右（本人/对方）"""
    return extract_text_via_vision(image_bytes, swap_sides=swap_sides)


def warmup():
    """视觉模型为外部 API 调用，无需本地预热"""
    logger.info("视觉模型读图已就绪（无需本地预热）")
