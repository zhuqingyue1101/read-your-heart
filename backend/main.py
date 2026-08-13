"""
读心 (Duxin) - FastAPI 主入口
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import AnalyzeResponse
from ocr_service import warmup, extract_text
from deepseek_client import chat_completion, parse_json_response
from prompt_builder import build_analyze_messages

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时预热 OCR 模型"""
    logger.info("🚀 读心服务启动中...")
    warmup()
    logger.info("✅ 服务就绪")
    yield


app = FastAPI(
    title="读心 API",
    description="AI 暧昧聊天截图解读服务",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发阶段允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MAX_IMAGES = 5
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(
    images: list[UploadFile] = File(..., description="聊天截图 (1-5张)"),
    relationship_stage: str = Form(default="暧昧中"),
    goal: str = Form(default="试探好感"),
    reply_style: str = Form(default="自然一点"),
    crush_profile_summary: str = Form(default=""),
    swap_sides: bool = Form(default=False),
):
    """分析聊天截图，返回结论、进度条、回复建议"""
    # 校验
    if not images or len(images) > MAX_IMAGES:
        raise HTTPException(
            status_code=400, detail=f"一次上传1-{MAX_IMAGES}张图片"
        )

    # Step 1: OCR 提取文本
    all_texts = []
    for img in images:
        if img.size and img.size > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="单张图片不超过10MB")

        content = await img.read()
        try:
            text = extract_text(content, swap_sides=swap_sides)
            if text:
                all_texts.append(text)
        except Exception as e:
            logger.error(f"OCR 失败: {e}")
            raise HTTPException(status_code=422, detail=f"图片识别失败: {img.filename}")

        # 不持久化，用完即丢

    if not all_texts:
        raise HTTPException(
            status_code=422,
            detail="我好像没看到聊天气泡，可以换一张完整点的截图。"
        )

    chat_text = "\n---\n".join(all_texts)
    logger.info(f"OCR 提取完成，共 {len(all_texts)} 张图，{len(chat_text)} 字符")

    # Step 2: 构建 prompt → DeepSeek 分析
    messages = build_analyze_messages(
        chat_text=chat_text,
        relationship_stage=relationship_stage,
        goal=goal,
        reply_style=reply_style,
        crush_profile_summary=crush_profile_summary,
    )

    try:
        raw = await chat_completion(messages, temperature=0.7, max_tokens=2048)
        data = parse_json_response(raw)
        return AnalyzeResponse(**data)
    except Exception as e:
        logger.error(f"DeepSeek 分析失败: {e}")
        raise HTTPException(status_code=500, detail="分析失败，请稍后重试")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
