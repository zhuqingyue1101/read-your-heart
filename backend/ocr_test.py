"""
OCR 快速测试脚本 — 验证左右标注是否正确
用法: python3 ocr_test.py <截图路径>
"""
import sys
from ocr_service import extract_text

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python3 ocr_test.py <截图路径>")
        sys.exit(1)

    path = sys.argv[1]
    with open(path, "rb") as f:
        image_bytes = f.read()

    print("=" * 40)
    print(f"识别结果（{path}）:")
    print("=" * 40)
    text = extract_text(image_bytes)
    print(text if text else "（未识别到文字）")
    print("=" * 40)
