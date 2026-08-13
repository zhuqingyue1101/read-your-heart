"""临时验证脚本：测试 EasyOCR 模型加载 + 真实截图识别"""
import sys
import time
import glob

from ocr_service import extract_text


def main():
    # 用第一张截图测试，也支持传入路径
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        files = glob.glob("../cursh聊天截图/*.jpg")
        if not files:
            print("未找到测试截图")
            return
        path = files[0]

    print(f"测试图片: {path}")

    with open(path, "rb") as f:
        data = f.read()
    print(f"图片大小: {len(data)} bytes")

    t0 = time.time()
    text = extract_text(data)
    elapsed = time.time() - t0

    print(f"\n=== OCR 结果 (含模型加载耗时 {elapsed:.1f}s) ===")
    print(text if text else "(未识别到文字)")
    print("=== END ===")


if __name__ == "__main__":
    main()
