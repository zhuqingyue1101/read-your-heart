"""
EasyOCR 单例服务 — 图片 bytes → 带左右标注的聊天文本
微信布局：本人（绿色气泡）靠右，对方（白色气泡）靠左
"""
import io
import logging
from typing import Optional
from PIL import Image

logger = logging.getLogger(__name__)

_reader: Optional[object] = None

# 左右分界阈值（相对图片宽度的比例）
# 微信气泡：对方靠左、本人靠右，中间是时间戳/系统消息，不标注
LEFT_MAX = 0.45
RIGHT_MIN = 0.55


def _get_reader():
    """懒加载 EasyOCR reader（模型加载慢，只加载一次）"""
    global _reader
    if _reader is None:
        import easyocr
        logger.info("🔄 正在加载 EasyOCR 中文模型（首次较慢）...")
        _reader = easyocr.Reader(["ch_sim", "en"], gpu=False)
        logger.info("✅ EasyOCR 加载完成")
    return _reader


def extract_text(image_bytes: bytes, swap_sides: bool = False) -> str:
    """
    从图片提取文字，按从上到下排列，并标注左右（本人/对方）
    返回格式示例：
      对方：在吗
      本人：在的
      （无标注 = 居中内容，如时间戳/系统提示）
    swap_sides=True 时交换左右标注（气泡识别纠错）
    """
    reader = _get_reader()
    image = Image.open(io.BytesIO(image_bytes))

    # 转换为 RGB（处理 RGBA/灰度等格式）
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    width = image.width
    results = reader.readtext(image)

    if not results:
        return ""

    # 按 y 坐标排序（从上到下）
    results.sort(key=lambda r: r[0][0][1])

    left_label = "本人" if swap_sides else "对方"
    right_label = "对方" if swap_sides else "本人"

    lines = []
    for bbox, text, conf in results:
        if conf <= 0.3:  # 置信度过滤
            continue

        # 计算文字包围盒的中心 x 坐标（相对图片宽度）
        xs = [p[0] for p in bbox]
        x_ratio = sum(xs) / len(xs) / width

        if x_ratio < LEFT_MAX:
            lines.append(f"{left_label}：{text}")
        elif x_ratio > RIGHT_MIN:
            lines.append(f"{right_label}：{text}")
        else:
            # 居中的内容（时间戳、系统提示等），不标注
            lines.append(text)

    return "\n".join(lines)


def warmup():
    """预热 OCR 模型（服务启动时调用）"""
    _get_reader()
