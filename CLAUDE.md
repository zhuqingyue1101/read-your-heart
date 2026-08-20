# 读心 (Duxin) - AI 暧昧聊天截图解读工具

## 项目概述
面向18-28岁年轻人的AI聊天截图解读H5应用。用户上传与crush的微信聊天截图，
系统OCR提取文本后通过DeepSeek API分析对方信号、判断关系局势，
并生成可直接复制发送的自然回复。

## 标准文件路径指引

| 类型 | 路径 | 说明 |
|------|------|------|
| 产品需求 | [docs/01-产品需求.md](docs/01-产品需求.md) | 功能范围、用户流程、验收标准 |
| 技术方案 | [docs/02-技术方案.md](docs/02-技术方案.md) | 架构设计、API设计、模型选择 |
| 设计规范 | [docs/03-设计规范.md](docs/03-设计规范.md) | 视觉风格、文案规范、交互规则 |
| 开发计划 | [docs/04-开发计划.md](docs/04-开发计划.md) | 分阶段执行步骤、里程碑 |
| 开发日志 | [dev_logs/](dev_logs/) | 每日自动记录，按日期归档 |

## 工作准则

### 技术栈
- **前端**: React 19 + Vite + TypeScript + Tailwind CSS v4，移动端H5
- **后端**: Python FastAPI，OCR使用 EasyOCR 或 PaddleOCR
- **AI**: DeepSeek API（deepseek-chat，纯文本，不持视觉）
- **存储**: 浏览器 localStorage（无数据库、无登录）
- **部署**: 前后端分离，API Key 仅存后端环境变量

### 开发原则
1. **安全优先**：API Key 永远不放前端代码；截图不上传到服务端持久化
2. **小步推进**：每个 Phase 完成并验证后再进入下一 Phase
3. **每日日志**：每次开发会话结束前更新 dev_logs/ 对应日期文件
4. **文档先行**：技术方案变更先更新 docs/ 再写代码
5. **分支策略**：每个 Phase 独立分支，完成后合并

### 参考数据
- 训练/参考截图: [cursh聊天截图/](cursh聊天截图/) — 130+ 张小红书真实聊天截图
- 完整PRD: [读心V2 产品需求文档.pdf](读心V2 产品需求文档.pdf)

### 环境变量
- `DEEPSEEK_API_KEY`: DeepSeek API Key
- `DEEPSEEK_BASE_URL`: API 地址（默认 https://api.deepseek.com）
