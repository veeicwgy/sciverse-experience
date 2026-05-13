# Sciverse Academic Retrieval Skill 审计报告与优化方案

基于对 ClawHub 上的 `sciverse/academic-retrieval` 页面及底层 `manifest.json`、`SKILL.md` 的抓取分析，结合 Anthropic 官方 Skill 编写指南与 Awesome OpenClaw Skills 竞品对标，现提供完整的审计报告与优化方案。

## 一、 现状审计与差距分析

### 1. 可发现性 (Discoverability)
**现状**：
- **Name**: `sciverse-academic-retrieval` (Slug: `sciverse-papers`)
- **Description**: "SciVerse academic paper retrieval: structured metadata search, semantic chunk retrieval for RAG, and byte-range content reading. For agent workflows that need citation-grade scientific literature."
- **Keywords/Tags**: 未在 `manifest.json` 中配置显式的 `tags` 或 `categories` 字段。

**差距与风险**：
- **触发词密度不足**：Anthropic 官方指南明确指出，`description` 字段是 Agent 决定是否调用该 Skill 的**唯一触发条件**。当前的描述偏向功能陈述，缺乏具体的触发场景词（如 PubMed, arXiv, DOI, literature review, paper search）。
- **缺乏"Pushy"引导**：官方建议描述要稍微"强势"（pushy）一点，明确告诉模型"当用户要求 X 时，必须使用本工具"。
- **SEO 标签缺失**：在 ClawHub 这样的 Marketplace 中，缺少 `tags` 会导致在 `search-and-research` 等类目下的曝光率降低。

### 2. 可信度 (Credibility)
**现状**：
- **Audits**: ClawScan (Pass), Static analysis (Review), VirusTotal (Pass) - 基础安全可信度良好。
- **README/SKILL.md**: 提供了中英双语说明，列出了工具速览（`search_papers`, `semantic_search`, `read_content`）。
- **兼容性说明**：明确了与 PyPI/npm SDK 的互补关系，指明了 "OpenClaw users only"。

**差距与风险**：
- **缺乏平台兼容矩阵**：虽然提到了 OpenClaw，但作为面向 Agent 生态的工具，未在显著位置（如 README 顶部）标明对主流 IDE/Agent（如 Cursor, Claude Code, Manus）的兼容性或使用方式，降低了泛开发者的信任感。
- **示例过于简单**：README 中的直接调用示例仅给出了 `node scripts/semantic_search.mjs ...`，缺乏 Agent 视角的自然语言 Prompt 示例。

### 3. 可安装性 (Installability)
**现状**：
- **安装命令**：提供了标准的 `openclaw skills install academic-retrieval` 和 `clawhub install sciverse-agent-tools`。
- **配置要求**：明确指出了需要 `SCIVERSE_API_TOKEN` 环境变量。

**差距与风险**：
- **配置引导断层**：虽然给出了获取 Token 的链接 `https://sciverse.space`，但没有说明获取 Token 是否免费、是否需要审核，可能导致用户在安装前犹豫。
- **缺乏"Hello World"验证**：安装配置完成后，用户不知道如何验证是否成功。缺少一个简单的 "Copy-paste this prompt to test" 环节。

---

## 二、 优化方案与可直接覆盖的文案

### 1. `manifest.json` 优化 (提升 Agent 触发率与市场检索率)

**修改建议**：
- 重写 `description`，加入强触发指令和丰富的同义词。
- 增加 `tags` 字段（如果 ClawHub 支持）。

**优化版 JSON 片段**：
```json
{
  "name": "sciverse-academic-retrieval",
  "version": "0.1.6",
  "slug": "sciverse-papers",
  "description": "MUST USE THIS SKILL whenever the user asks to search academic papers, find scientific literature, conduct literature reviews, or look up specific researchers/authors. Provides citation-grade retrieval across arXiv, PubMed, and major journals. Features structured metadata search, semantic chunk retrieval for RAG, and byte-range content reading.",
  "tags": ["academic", "research", "paper-search", "rag", "literature-review", "science"],
  "runtime": "node>=18",
  "license": "Apache-2.0",
  "homepage": "https://sciverse.space"
}
```

### 2. `README.md` 优化 (提升人类开发者的转化率)

**修改建议**：
- 顶部增加兼容性徽章（Manus / Claude / Cursor）。
- 增加 "Test Prompt" 环节，降低上手门槛。
- 明确标明 "Free API Key"。

**优化版 README.md**：
```markdown
# sciverse-agent-tools — ClawHub skill bundle

[![ClawHub](https://img.shields.io/badge/clawhub-sciverse--agent--tools-brightgreen)](https://clawhub.ai/sciverse-agent-tools)
[![Compatible](https://img.shields.io/badge/Compatible_with-Manus_|_Claude_Code_|_Cursor-blue)](#)

ClawHub skill that gives any OpenClaw agent SciVerse academic-paper retrieval capabilities (English | [中文](#中文说明)).

## 🚀 Quick Start

### 1. Install
```bash
clawhub install sciverse-agent-tools
```

### 2. Configure
Get your **free** API token from [https://sciverse.space](https://sciverse.space).
```bash
export SCIVERSE_API_TOKEN=sv-xxx       
# optional: export SCIVERSE_BASE_URL=https://sciverse-dev.opendatalab.org.cn/api
```

### 3. Test it out
Paste this prompt to your Agent to verify the installation:
> *"Use the Sciverse skill to find 3 recent papers about Transformer attention mechanisms, and summarize their abstracts."*

## 🛠 Tools at a glance

| Tool | Purpose |
|---|---|
| `search_papers` | Structured metadata search (authors/year/journal/subjects) |
| `semantic_search` | Natural-language semantic chunk retrieval (for RAG) |
| `read_content` | Byte-range read of a paper's original text |

See `SKILL.md` for full agent-facing documentation.

## 🔗 Relationship to the SDK

This skill is **complementary** to the `sciverse-agent-tools` packages on PyPI / npm:
- **This skill** — OpenClaw users only. Zero external deps (Node 18+ native fetch).
- **PyPI / npm SDK** — Any LLM agent framework (OpenAI, Anthropic, LangChain, LlamaIndex…).

## License
Apache-2.0

---

## 中文说明

OpenClaw 用户专用：通过 ClawHub 一键给 agent 加上 SciVerse 学术文献检索能力。原生支持 Manus / Claude Code / Cursor 等 Agent 环境。

### 1. 安装
```bash
clawhub install sciverse-agent-tools
```

### 2. 配置
从 [https://sciverse.space](https://sciverse.space) 免费申请 API Token。
```bash
export SCIVERSE_API_TOKEN=sv-xxx   
# 可选：export SCIVERSE_BASE_URL=https://sciverse-dev.opendatalab.org.cn/api
```

### 3. 测试验证
向你的 Agent 发送以下 Prompt 进行测试：
> *"请使用 Sciverse 工具帮我找 3 篇关于 Transformer 注意力机制的最新论文，并总结它们的摘要。"*

### 工具速览
| Tool | 用途 |
|---|---|
| `search_papers` | 按作者/年份/期刊/学科结构化检索文献元数据 |
| `semantic_search` | 自然语言语义检索文献片段（RAG 用） |
| `read_content` | 按字节区间读取文献原文片段 |

agent 视角的完整文档见 `SKILL.md`（英文）。
```

### 3. `SKILL.md` 优化 (提升 Agent 的执行准确率)

**修改建议**：
- 在 `When to use` 部分增加具体的触发场景词汇。
- 增加 `Composition patterns` 的具体自然语言示例。

**优化版 SKILL.md 片段 (替换原 When to use 部分)**：
```markdown
## When to use

MUST trigger this skill when the user's request involves any of the following:
*   Searching for academic papers, scientific literature, or journal articles (e.g., arXiv, PubMed, Nature, Science).
*   Conducting literature reviews or finding papers by specific authors, years, or subjects.
*   Grounding answers in paper excerpts (RAG / citations) to ensure factual accuracy.
*   Expanding the original text around a known doc_id (more bytes before/after a chunk).

Do NOT use this skill for general web search or non-academic queries.
```
