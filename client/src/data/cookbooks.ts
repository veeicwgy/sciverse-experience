/**
 * Sciverse Cookbook 数据文件
 * ─────────────────────────────────────────────────────────
 * 维护说明：
 * - 每个案例是一个 CookbookItem 对象
 * - 新增案例只需在 COOKBOOKS 数组末尾追加一个对象即可
 * - tags 可选值见 CookbookTag 类型
 * - difficulty 可选值：入门 | 进阶 | 高级
 * - steps 中的 code.lang 支持：python | bash | markdown | typescript
 * - slug 用于 URL 路由，必须唯一且使用 kebab-case
 *
 * API 字段对照（以线上文档为准）：
 * - agentic-search: POST /agentic-search { query, top_k(1-100) } → { hits: [{doc_id, chunk, title, score, offset}] }
 * - content: GET /content?doc_id=&offset=&limit=(默认700) → { text, next_offset, more }
 * - resource: GET /resource?file_name= → binary stream
 * - meta-catalog: GET /meta-catalog → { fields: [{name, type, operators}] }
 * - meta-search: POST /meta-search { query, filters:[{field, operator, value}], sort:[{field, order}], page, page_size } → { results, total_count }
 *   - operator 枚举: FILTER_OP_EQ / FILTER_OP_IN / FILTER_OP_GTE / FILTER_OP_LTE / FILTER_OP_GT / FILTER_OP_LT
 *   - order 枚举: SORT_ORDER_ASC / SORT_ORDER_DESC
 *   - 常用字段: publication_published_year, publication_venue_name, author, citation_count
 */

export type CookbookTag = "RAG" | "Agent" | "检索" | "多模态" | "Skill" | "专利" | "元数据" | "综述" | "工具";

export type CodeSample = {
  lang: string;
  label: string;
  code: string;
  group?: string;
};

export type CookbookItem = {
  slug: string;
  title: string;
  subtitle: string;
  tags: CookbookTag[];
  difficulty: "入门" | "进阶" | "高级";
  estimatedCalls: string;
  tools: string[];
  pipeline: string[];
  coverImage?: string;
  scenario: string;
  inputExample: string;
  outputExample: string;
  agentPrompt: string;
  steps: { title: string; desc: string; code: CodeSample }[];
  notes: string[];
  nextSteps: { label: string; hash: string }[];
};

export const COOKBOOKS: CookbookItem[] = [
  // ═══════════════════════════════════════════════════════════
  // 1. 科研文献综述 Agent
  // ═══════════════════════════════════════════════════════════
  {
    slug: "literature-review-agent",
    coverImage: "/manus-storage/cookbook-cover-1-literature-review_709a5f2b.png",
    title: "用 Sciverse 构建科研文献综述 Agent",
    subtitle: "从一句研究问题出发，自动检索、摘要、生成带引用的文献综述",
    tags: ["Agent", "RAG"],
    difficulty: "进阶",
    estimatedCalls: "~15–30 次 API 调用 / 一次综述任务",
    tools: ["agentic-search", "content"],
    pipeline: ["agentic-search", "→ doc_id + chunk + offset", "→ content", "→ evidence markdown"],
    scenario: "科研人员或 AI Agent 需要针对一个研究问题，自动检索相关文献、提取关键证据段落，并生成一份带引用的文献综述。",
    inputExample: `用户在 Claude / Cursor 中提问：\n"请帮我综述 2020–2024 年 Transformer 在蛋白质结构预测领域的应用进展，列出关键论文和核心贡献。"`,
    outputExample: `## 文献综述：Transformer 在蛋白质结构预测中的应用（2020–2024）\n\n### 1. AlphaFold2 的突破\nJumper et al. (2021) 提出 AlphaFold2，利用 Evoformer 模块...\n[来源: Nature, doc_id: af2_xxx, offset: 12480]\n\n### 2. ESMFold 的端到端预测\nLin et al. (2023) 提出 ESMFold...\n[来源: Science, doc_id: esm_yyy, offset: 8320]\n\n---\n共检索 12 篇核心文献，提取 28 个证据片段。`,
    agentPrompt: `你是一个科研文献综述 Agent。当用户提出研究问题时：\n1. 调用 agentic-search(query=用户问题, top_k=20) 获取相关片段\n2. 对每个高分片段，调用 content(doc_id=hit.doc_id, offset=hit.offset, limit=2000) 获取上下文\n3. 整理为结构化综述，每个论点必须标注来源 [doc_id, offset]\n4. 不要编造任何引用，所有信息必须来自 Sciverse 返回的真实数据`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置 API Token",
        code: { lang: "bash", label: "安装依赖", code: `# 安装所需 Python 包\npip install httpx anthropic\n\n# 设置环境变量（替换为你的真实 Token）\nexport SCIVERSE_API_TOKEN="sv-your-token-here"\nexport ANTHROPIC_API_KEY="sk-ant-..."` },
      },
      {
        title: "Step 2: 语义检索相关片段",
        desc: "使用 agentic-search 获取与研究问题最相关的文献片段",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def search_literature(query: str, top_k: int = 20):\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.post(\n            f"{BASE}/agentic-search",\n            headers=HEADERS,\n            json={"query": query, "top_k": top_k}\n        )\n        resp.raise_for_status()\n        return resp.json()["hits"]\n\nasync def main():\n    hits = await search_literature(\n        "Transformer applications in protein structure prediction 2020-2024"\n    )\n    print(f"Found {len(hits)} relevant chunks")\n    for h in hits[:3]:\n        print(f"  [{h['score']:.2f}] {h['title'][:60]}...")\n    return hits\n\nhits = asyncio.run(main())` },
      },
      {
        title: "Step 3: 读取原文上下文",
        desc: "对高分片段调用 content 接口获取更完整的上下文",
        code: { lang: "python", label: "Python", code: `async def read_context(doc_id: str, offset: int = 0, limit: int = 2000):\n    """读取指定文档的原文片段。返回 {text, next_offset, more}"""\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.get(\n            f"{BASE}/content",\n            headers=HEADERS,\n            params={"doc_id": doc_id, "offset": offset, "limit": limit}\n        )\n        resp.raise_for_status()\n        return resp.json()\n\nasync def gather_evidence(hits, top_n=5):\n    sorted_hits = sorted(hits, key=lambda x: x["score"], reverse=True)[:top_n]\n    evidences = []\n    for hit in sorted_hits:\n        ctx = await read_context(hit["doc_id"], hit.get("offset", 0))\n        evidences.append({\n            "title": hit["title"],\n            "doc_id": hit["doc_id"],\n            "offset": hit.get("offset", 0),\n            "chunk": hit["chunk"],\n            "context": ctx["text"],  # 注意：响应字段是 text\n            "score": hit["score"]\n        })\n    return evidences\n\nevidences = asyncio.run(gather_evidence(hits))` },
      },
      {
        title: "Step 4: 生成带引用的综述（可选增强）",
        desc: "将证据传给 LLM 生成结构化综述。此步骤依赖 Anthropic API Key，非 Sciverse 必需",
        code: { lang: "python", label: "Python", code: `from anthropic import Anthropic\n\nclient = Anthropic()  # 自动读取 ANTHROPIC_API_KEY\n\nevidence_text = "\\n\\n".join([\n    f"[{e['doc_id']}, offset={e['offset']}] {e['title']}\\n{e['context']}"\n    for e in evidences\n])\n\nmsg = client.messages.create(\n    model="claude-sonnet-4-20250514",\n    max_tokens=4096,\n    messages=[{\n        "role": "user",\n        "content": f"""基于以下文献证据，生成一份关于 Transformer 在蛋白质结构预测中应用的综述。\n每个论点必须标注来源 [doc_id, offset]。\n不要编造任何未在证据中出现的信息。\n\n{evidence_text}"""\n    }]\n)\nprint(msg.content[0].text)` },
      },
    ],
    notes: [
      "所有引用必须来自 Sciverse 返回的真实 doc_id 和 offset，不要让 LLM 编造",
      "agentic-search 的 top_k 范围为 1–100，综述场景建议 top_k=20",
      "content 接口默认 limit=700 字符；如需更多上下文可传入更大值（如 2000–4096）",
      "如需全文，可循环调用 content 并使用 next_offset 拼接",
      "生产环境建议加 try/except 处理 404（文档无全文）和 429（限流）",
    ],
    nextSteps: [
      { label: "查看 agentic-search 接口文档", hash: "sciverse/api/agentic-search" },
      { label: "查看 content 接口文档", hash: "sciverse/api/content" },
      { label: "申请 API Token", hash: "auth" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 2. 科学 RAG 数据源
  // ═══════════════════════════════════════════════════════════
  {
    slug: "scientific-rag",
    coverImage: "/manus-storage/cookbook-cover-2-rag-datasource_28fdc177.png",
    title: "用 Sciverse 做科学 RAG 数据源",
    subtitle: "将 Sciverse 作为 RAG pipeline 的检索后端，为 LLM 提供可信科学证据",
    tags: ["RAG", "Agent"],
    difficulty: "进阶",
    estimatedCalls: "~5–15 次 API 调用 / 一次 RAG 查询",
    tools: ["agentic-search", "content"],
    pipeline: ["agentic-search", "→ chunks + scores", "→ score 过滤", "→ LLM grounded answer"],
    scenario: "开发者构建科学问答系统或 RAG 应用，需要从权威学术文献中检索证据来 ground LLM 的回答，避免幻觉。",
    inputExample: `RAG 系统收到用户问题：\n"mRNA 疫苗的脂质纳米颗粒递送系统有哪些最新改进？"`,
    outputExample: `{\n  "answer": "近年来 LNP 递送系统的改进主要集中在...[1][2]",\n  "citations": [\n    {"id": 1, "doc_id": "lnp_001", "title": "Ionizable lipids for...", "chunk": "...", "score": 0.92},\n    {"id": 2, "doc_id": "lnp_002", "title": "Biodegradable LNP...", "chunk": "...", "score": 0.87}\n  ]\n}`,
    agentPrompt: `你是一个科学 RAG 系统。对于每个用户问题：\n1. 调用 agentic-search 获取相关文献片段\n2. 根据 score 筛选 top 片段作为证据（建议阈值 0.6–0.7）\n3. 基于证据生成回答，每句话标注来源 [编号]\n4. 如果证据不足以回答，明确告知用户"当前检索结果不足以回答该问题"`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置环境变量",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx openai\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"\nexport OPENAI_API_KEY="sk-..."` },
      },
      {
        title: "Step 2: 调用 agentic-search 获取证据",
        desc: "一次调用即可获得经过打分的文献片段",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def sciverse_retrieve(query: str, top_k: int = 10):\n    """调用 agentic-search 获取相关文献片段"""\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.post(\n            f"{BASE}/agentic-search",\n            headers=HEADERS,\n            json={"query": query, "top_k": top_k}\n        )\n        resp.raise_for_status()\n        data = resp.json()\n        return [\n            {"text": h["chunk"], "doc_id": h["doc_id"],\n             "title": h["title"], "score": h["score"]}\n            for h in data["hits"]\n        ]` },
      },
      {
        title: "Step 3: 证据过滤",
        desc: "按 score 阈值过滤低质量片段",
        code: { lang: "python", label: "Python", code: `def filter_evidence(hits: list, threshold: float = 0.65) -> list:\n    """过滤低分片段，按 score 降序排列"""\n    filtered = [h for h in hits if h["score"] >= threshold]\n    return sorted(filtered, key=lambda x: x["score"], reverse=True)\n\nasync def main():\n    hits = await sciverse_retrieve("mRNA LNP delivery system improvements")\n    top_evidence = filter_evidence(hits, threshold=0.65)\n    print(f"Retrieved {len(hits)} chunks, filtered to {len(top_evidence)} high-quality")\n    return top_evidence\n\ntop_evidence = asyncio.run(main())` },
      },
      {
        title: "Step 4: 基于证据生成 Grounded Answer（可选增强）",
        desc: "将证据注入 LLM prompt，生成带引用的回答。此步骤依赖 OpenAI API Key，非 Sciverse 必需",
        code: { lang: "python", label: "Python", code: `from openai import OpenAI\n\nclient = OpenAI()  # 自动读取 OPENAI_API_KEY\n\ncontext = "\\n\\n".join([\n    f"[{i+1}] {e['title']}\\n{e['chunk']}"\n    for i, e in enumerate(top_evidence[:5])\n])\n\nresp = client.chat.completions.create(\n    model="gpt-4o",\n    messages=[\n        {"role": "system", "content": "基于提供的文献证据回答问题。每个论点用 [编号] 标注来源。如果证据不足，说明无法确定。不要编造未在证据中出现的信息。"},\n        {"role": "user", "content": f"问题：mRNA LNP 递送系统最新改进？\\n\\n证据：\\n{context}"}\n    ]\n)\nprint(resp.choices[0].message.content)` },
      },
    ],
    notes: [
      "agentic-search 的 top_k 范围为 1–100，RAG 场景建议 10–20",
      "score 阈值建议 0.6–0.7，过低会引入噪声，过高可能丢失相关证据",
      "生产环境建议缓存高频查询结果，减少 API 调用和延迟",
      "如需更精确的证据，可对 top hits 再调用 content(doc_id, offset) 接口获取完整段落上下文",
    ],
    nextSteps: [
      { label: "查看 agentic-search 接口", hash: "sciverse/api/agentic-search" },
      { label: "了解统一鉴权", hash: "auth" },
      { label: "查看 FAQ", hash: "faq" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 3. 论文全文证据
  // ═══════════════════════════════════════════════════════════
  {
    slug: "fulltext-evidence",
    coverImage: "/manus-storage/cookbook-cover-3-fulltext-evidence_d8bbb7f7.png",
    title: "用 Sciverse 查找论文全文证据",
    subtitle: "从检索片段出发，定位并读取原文完整段落作为可引用证据",
    tags: ["RAG", "检索"],
    difficulty: "入门",
    estimatedCalls: "~3–8 次 API 调用",
    tools: ["agentic-search", "content"],
    pipeline: ["agentic-search", "→ doc_id + offset", "→ content(offset, limit)", "→ 全文证据"],
    scenario: "Agent 通过 agentic-search 找到了相关片段，但需要更完整的上下文来确认论点或生成精确引用。",
    inputExample: `Agent 已通过 agentic-search 获得 chunk："AlphaFold2 achieves atomic accuracy..."\ndoc_id: "由 agentic-search 返回的真实 ID"\noffset: 12480`,
    outputExample: `{\n  "text": "## Methods\\n\\nAlphaFold2 achieves atomic accuracy in protein structure prediction through a novel architecture combining...(完整段落 ~2000 字符)",\n  "next_offset": 14480,\n  "more": true\n}`,
    agentPrompt: `当你需要验证或扩展一个文献片段时：\n1. 使用 chunk 中的 doc_id 和 offset\n2. 调用 content 接口读取该位置前后的完整段落\n3. 确认原文是否支持你的论点\n4. 如需更多上下文，使用返回的 next_offset 继续读取`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置环境变量",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"` },
      },
      {
        title: "Step 2: 读取完整上下文",
        desc: "调用 content 接口，以 offset 为起点读取原文。响应字段为 text（非 content）",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def get_fulltext(doc_id: str, offset: int = 0, limit: int = 2000):\n    """读取文档原文。返回 {text, next_offset, more}"""\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.get(\n            f"{BASE}/content",\n            headers=HEADERS,\n            params={"doc_id": doc_id, "offset": offset, "limit": limit}\n        )\n        resp.raise_for_status()\n        return resp.json()\n\nasync def main():\n    # 先通过 agentic-search 获取真实 doc_id\n    search_resp = await httpx.AsyncClient(timeout=30).__aenter__()\n    # 示例：用真实查询获取 hit\n    resp = await search_resp.post(f"{BASE}/agentic-search", headers=HEADERS, json={"query": "AlphaFold2 protein structure prediction", "top_k": 3})\n    resp.raise_for_status()\n    hit = resp.json()["hits"][0]  # 取最高分结果\n\n    # 向前偏移 300 字符以获取前文语境\n    start = max(0, hit["offset"] - 300)\n    result = await get_fulltext(hit["doc_id"], offset=start, limit=2000)\n\n    print(f"Text length: {len(result['text'])} chars")\n    print(f"Has more: {result['more']}")\n    if result.get("next_offset"):\n        print(f"Next offset: {result['next_offset']}")\n    print(f"\\nContent preview:\\n{result['text'][:300]}...")\n    return result\n\nresult = asyncio.run(main())` },
      },
      {
        title: "Step 3: 迭代读取全文（可选）",
        desc: "如果需要更多上下文，使用 next_offset 循环读取",
        code: { lang: "python", label: "Python", code: `async def read_full_document(doc_id: str, max_chars: int = 16000):\n    \"\"\"循环读取直到全文或达到字符上限\"\"\"\n    full_text = \"\"\n    offset = 0\n    while len(full_text) < max_chars:\n        result = await get_fulltext(doc_id, offset=offset, limit=4000)\n        full_text += result[\"text\"]\n        if not result.get(\"more\"):\n            break\n        offset = result[\"next_offset\"]\n    return full_text\n\nasync def main():\n    # 使用上一步 agentic-search 返回的真实 doc_id\n    text = await read_full_document(hit[\"doc_id\"], max_chars=16000)\n    print(f\"Total document length: {len(text)} chars\")\n\nasyncio.run(main())` }
      },
    ],
    notes: [
      "content 接口响应字段是 text（不是 content），请注意区分",
      "offset 是 Unicode 码点数，不是字节数",
      "默认 limit=700 字符，建议传入 2000–4000 以减少调用次数",
      "部分文档可能无全文（返回 404），需做异常处理",
      "建议向前偏移 300–500 字符读取，以获取片段的前文语境",
    ],
    nextSteps: [
      { label: "查看 content 接口文档", hash: "sciverse/api/content" },
      { label: "下载论文图表", hash: "cookbook/download-figures" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 4. 论文图表资源下载
  // ═══════════════════════════════════════════════════════════
  {
    slug: "download-figures",
    coverImage: "/manus-storage/cookbook-cover-4-chart-download_95926cea.png",
    title: "用 Sciverse 下载论文图表资源",
    subtitle: "从全文 Markdown 中提取图表路径，通过 resource 接口获取二进制文件",
    tags: ["多模态", "检索"],
    difficulty: "入门",
    estimatedCalls: "~3–10 次 API 调用",
    tools: ["content", "resource"],
    pipeline: ["content", "→ Markdown 中 ![](path)", "→ resource(file_name=path)", "→ 图片二进制"],
    scenario: "用户需要提取论文中的图表（如实验结果图、流程图、表格截图）用于报告、演示或多模态 RAG。",
    inputExample: `content 返回的 Markdown 中包含：\n![Figure 3](dt=<doc_id>/p_12/f3.png)\n![Table 2](dt=<doc_id>/p_15/t2.png)\n\n注：<doc_id> 为实际检索返回的 ID`,
    outputExample: `成功下载：\n- f3.png (image/png, 245KB) → ./figures/f3.png\n- t2.png (image/png, 180KB) → ./figures/t2.png`,
    agentPrompt: `当你需要论文中的图表时：\n1. 先调用 content 获取全文 Markdown\n2. 用正则提取所有 ![...](path) 中的 path\n3. 对每个 path 调用 resource(file_name=path) 下载\n4. 返回图片供用户查看或传给多模态模型分析`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置环境变量",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"` },
      },
      {
        title: "Step 2: 从全文中提取图表路径",
        desc: "content 返回的 Markdown 中，图表以标准 Markdown 图片语法引用",
        code: { lang: "python", label: "Python", code: `import os\nimport re\nimport asyncio\nimport httpx\nfrom pathlib import Path\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def get_content(doc_id: str, offset: int = 0, limit: int = 4000):\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.get(\n            f"{BASE}/content", headers=HEADERS,\n            params={"doc_id": doc_id, "offset": offset, "limit": limit}\n        )\n        resp.raise_for_status()\n        return resp.json()\n\nasync def main():\n    # 先通过 agentic-search 获取真实 doc_id\n    search_resp = await httpx.AsyncClient(timeout=30).post(\n        f\"{BASE}/agentic-search\", headers=HEADERS,\n        json={\"query\": \"AlphaFold2 protein structure\", \"top_k\": 3}\n    )\n    search_resp.raise_for_status()\n    doc_id = search_resp.json()[\"hits\"][0][\"doc_id\"]\n    result = await get_content(doc_id, offset=0, limit=4000)\n    # 注意：响应字段是 text\n    markdown_text = result["text"]\n    # 提取所有图片路径\n    figure_paths = re.findall(r'!\\[.*?\\]\\((.*?)\\)', markdown_text)\n    print(f"Found {len(figure_paths)} figures:")\n    for p in figure_paths:\n        print(f"  {p}")\n    return figure_paths\n\nfigure_paths = asyncio.run(main())` },
      },
      {
        title: "Step 3: 调用 resource 下载图表",
        desc: "对每个路径调用 resource 接口获取二进制数据。参数是 file_name（非 path）",
        code: { lang: "python", label: "Python", code: `async def download_resource(file_name: str, save_dir: str = "./figures"):\n    """下载资源文件。参数 file_name 为 content 中提取的相对路径"""\n    Path(save_dir).mkdir(exist_ok=True)\n    async with httpx.AsyncClient(timeout=60) as client:\n        resp = await client.get(\n            f"{BASE}/resource",\n            headers=HEADERS,\n            params={"file_name": file_name}  # 注意：参数是 file_name\n        )\n        resp.raise_for_status()\n        local_name = file_name.split("/")[-1]\n        save_path = f"{save_dir}/{local_name}"\n        Path(save_path).write_bytes(resp.content)\n        print(f"  Saved: {save_path} ({len(resp.content)} bytes)")\n        return save_path\n\nasync def download_all(paths: list):\n    results = []\n    for p in paths:\n        try:\n            saved = await download_resource(p)\n            results.append(saved)\n        except httpx.HTTPStatusError as e:\n            print(f"  Failed: {p} ({e.response.status_code})")\n    return results\n\nsaved_files = asyncio.run(download_all(figure_paths))` },
      },
    ],
    notes: [
      "resource 接口参数是 file_name（不是 path），传入 content 中提取的相对路径即可",
      "resource 接口返回原始二进制流，Content-Type 为实际 MIME 类型",
      "图表路径格式通常为 dt=文献ID/p_页码/文件名，由 content 接口给出",
      "部分文档可能没有图表资源（resource 返回 404），需做异常处理",
      "建议在 Agent 侧缓存已下载的图表，避免重复请求",
    ],
    nextSteps: [
      { label: "查看 resource 接口文档", hash: "sciverse/api/resource" },
      { label: "查看 content 接口文档", hash: "sciverse/api/content" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 5. 结构化论文筛选
  // ═══════════════════════════════════════════════════════════
  {
    slug: "structured-paper-filter",
    coverImage: "/manus-storage/cookbook-cover-5-structured-filter_3f56ccaa.png",
    title: "用 Sciverse 做结构化论文筛选",
    subtitle: "通过 meta-catalog 获取可用字段，用 meta-search 精确过滤论文",
    tags: ["检索", "Agent"],
    difficulty: "进阶",
    estimatedCalls: "~2–5 次 API 调用",
    tools: ["meta-catalog", "meta-search"],
    pipeline: ["meta-catalog", "→ 可用字段 + 算子", "→ meta-search(filters, sort)", "→ 结构化结果"],
    scenario: "用户需要按年份、期刊、作者、学科等条件精确筛选论文，类似学术搜索引擎的高级检索功能。",
    inputExample: `用户需求：\n"帮我找 2022–2024 年发表在 Nature 或 Science 上关于 CRISPR 基因编辑的论文，按引用数排序。"`,
    outputExample: `{\n  "total_count": 47,\n  "results": [\n    {"title": "Prime editing for...", "publication_published_year": 2023, "publication_venue_name": "Nature", "citation_count": 892},\n    {"title": "CRISPR-Cas13...", "publication_published_year": 2022, "publication_venue_name": "Science", "citation_count": 654}\n  ]\n}`,
    agentPrompt: `当用户需要按条件筛选论文时：\n1. 先调用 meta-catalog 获取可用字段和算子\n2. 根据用户条件构造 filters（使用 FILTER_OP_* 枚举）\n3. 调用 meta-search 执行检索\n4. 如果用户条件模糊，先用 meta-catalog 确认字段名和可用值`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置环境变量",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"` },
      },
      {
        title: "Step 2: 查询可用字段",
        desc: "meta-catalog 返回所有可过滤、可排序的字段及其算子",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def get_catalog():\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.get(f"{BASE}/meta-catalog", headers=HEADERS)\n        resp.raise_for_status()\n        return resp.json()\n\nasync def main():\n    catalog = await get_catalog()\n    print("Available fields:")\n    for field in catalog["fields"]:\n        print(f"  {field['name']} ({field['type']}) - operators: {field['operators']}")\n    return catalog\n\ncatalog = asyncio.run(main())` },
      },
      {
        title: "Step 3: 构造过滤条件并检索",
        desc: "使用 FILTER_OP_* 枚举构造 filters，SORT_ORDER_* 构造排序",
        code: { lang: "python", label: "Python", code: `async def search_papers(filters: list, query: str = None, sort: list = None, page_size: int = 20):\n    \"\"\"调用 meta-search 进行结构化检索\n    \n    注意: query 和 sort 不能同时传！\n    - 要相关性排序：传 query，不传 sort\n    - 要字段排序（如引用数）：传 sort，不传 query\n    \n    filters 格式: [{field, operator, value}]\n    operator 枚举: FILTER_OP_EQ / FILTER_OP_IN / FILTER_OP_GTE / FILTER_OP_LTE\n    sort 格式: [{field, order}]\n    order 枚举: SORT_ORDER_ASC / SORT_ORDER_DESC\n    \"\"\"\n    async with httpx.AsyncClient(timeout=30) as client:\n        body = {\"filters\": filters, \"page_size\": page_size}\n        if query:\n            body[\"query\"] = query\n        if sort:\n            body[\"sort\"] = sort\n        resp = await client.post(\n            f\"{BASE}/meta-search\", headers=HEADERS, json=body\n        )\n        resp.raise_for_status()\n        return resp.json()\n\nasync def main():\n    # 示例 1: 按引用数排序（不传 query）\n    results = await search_papers(\n        filters=[\n            {\"field\": \"publication_published_year\", \"operator\": \"FILTER_OP_GTE\", \"value\": 2022},\n            {\"field\": \"publication_published_year\", \"operator\": \"FILTER_OP_LTE\", \"value\": 2024},\n            {\"field\": \"publication_venue_name\", \"operator\": \"FILTER_OP_IN\", \"value\": [\"Nature\", \"Science\"]}\n        ],\n        sort=[{\"field\": \"citation_count\", \"order\": \"SORT_ORDER_DESC\"}]\n    )\n    print(f\"Found {results['total_count']} papers\")\n    for h in results[\"results\"][:5]:\n        print(f\"  {h['title']} ({h.get('publication_published_year','')}, \"\n              f\"{h.get('publication_venue_name','')}, \"\n              f\"citations: {h.get('citation_count', 'N/A')})\")\n\n    # 示例 2: 按相关性排序（传 query，不传 sort）\n    results2 = await search_papers(\n        query=\"CRISPR gene editing delivery\",\n        filters=[\n            {\"field\": \"publication_published_year\", \"operator\": \"FILTER_OP_GTE\", \"value\": 2023}\n        ]\n    )\n    print(f\"\\nRelevance search: {results2['total_count']} papers\")\n\nasyncio.run(main())` },
      },
    ],
    notes: [
      "meta-catalog 建议缓存结果（字段列表变化频率低），避免每次查询都调用",
      "query 和 sort 不能同时传：要相关性排序就传 query；要字段排序（如引用数）就传 sort",
      "filters 中的 operator 必须使用 FILTER_OP_* 枚举（如 FILTER_OP_GTE），不能用 gte/lte 等缩写",
      "sort 中的 order 必须使用 SORT_ORDER_ASC 或 SORT_ORDER_DESC",
      "响应中论文列表字段是 results（非 hits），总数字段是 total_count（非 total）",
      "常用字段名：publication_published_year、publication_venue_name、author、citation_count",
      "分页使用 page 和 page_size 参数",
    ],
    nextSteps: [
      { label: "查看 meta-catalog 接口", hash: "sciverse/api/meta-catalog" },
      { label: "查看 meta-search 接口", hash: "sciverse/api/meta-search" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 6. Skill 接入
  // ═══════════════════════════════════════════════════════════
  {
    slug: "skill-integration",
    coverImage: "/manus-storage/cookbook-cover-6-skill-integration_05b65d61.png",
    title: "在 Claude / Cursor / Codex 中接入 Sciverse Skill",
    subtitle: "安装 Sciverse MCP 工具，让 AI 助手直接调用科学文献检索",
    tags: ["Skill", "Agent"],
    difficulty: "入门",
    estimatedCalls: "~2–5 次工具调用 / 一次对话",
    tools: ["Sciverse MCP Server", "semantic_search", "read_content", "list_catalog"],
    pipeline: ["安装 Skill / 配置 MCP", "→ 设置 Token", "→ AI 助手自动调用", "→ 输出带引用的证据"],
    scenario: "开发者希望在日常使用的 AI 编程助手（Claude Code、Cursor、Codex CLI）中直接调用 Sciverse 检索科学文献，无需手动写 API 调用代码。",
    inputExample: `在 Claude Code 中直接提问：\n"帮我查找关于 Graph Neural Networks 在药物发现中应用的最新论文，给出关键发现。"`,
    outputExample: `Claude 自动调用 semantic_search 工具，返回：\n\n## 检索结果\n\n找到 8 篇高相关论文：\n\n1. **"GNN-based molecular property prediction"** (2024, Nature MI)\n   - 关键发现：提出 3D-aware GNN 架构，AUROC 提升 12%...\n   [evidence from Sciverse, score: 0.91]\n\n2. **"Drug-target interaction via attention GNN"** (2023, ICML)\n   - 关键发现：注意力机制显著提升 DTI 预测...\n   [evidence from Sciverse, score: 0.87]`,
    agentPrompt: `（无需手动编写 — Skill 安装后 AI 助手自动获得工具描述）\n\nSciverse Skill 为 AI 助手提供以下工具：\n- list_catalog: 查询可用字段\n- search_papers: 结构化论文检索\n- semantic_search: 语义片段检索\n- read_content: 读取原文\n- get_resource: 下载图表`,
    steps: [
      {
        title: "Step 1: 安装 Sciverse Skill",
        desc: "根据你使用的 AI 助手选择对应的安装方式",
        code: { lang: "bash", label: "安装", code: `# ─── Claude Code ───\n# 方式 A：通过官方域名安装（推荐）\nnpx skills add https://sciverse.space\n\n# 方式 B：从 GitHub 源安装\nnpx skills add opendatalab/Sciverse-Agent-Tools --skill sciverse\n\n# ─── Cursor ───\n# 在 Cursor Settings > MCP 中添加 Sciverse MCP Server\n# Server URL: https://mcp.sciverse.space\n\n# ─── Codex CLI ───\n# 参考 Codex 文档配置 MCP server` },
      },
      {
        title: "Step 2: 配置 API Token",
        desc: "设置环境变量，Skill 会自动读取",
        code: { lang: "bash", label: "配置", code: `# 在 shell 配置文件中添加（~/.bashrc 或 ~/.zshrc）\nexport SCIVERSE_API_TOKEN="sv-your-token-here"\n\n# 或在项目 .env 文件中\nSCIVERSE_API_TOKEN=sv-your-token-here\n\n# 验证安装成功（Claude Code）\nnpx skills list | grep sciverse` },
      },
      {
        title: "Step 3: 在 AI 助手中使用",
        desc: "安装后直接在对话中提问，AI 会自动调用 Sciverse 工具",
        code: { lang: "markdown", label: "使用示例", code: `# 在 Claude Code / Cursor / Codex 中直接提问：\n\n> 帮我查找 2023 年以来关于 LLM 幻觉检测的论文\n\nAI 助手会自动：\n1. 调用 semantic_search(query="LLM hallucination detection", top_k=10)\n2. 返回相关论文片段和引用\n3. 如需详情，继续调用 read_content 获取全文\n\n> 用结构化检索按 Nature 期刊过滤\n\nAI 助手会：\n1. 调用 list_catalog() 确认字段名\n2. 调用 search_papers(filters=[...]) 执行过滤` },
      },
    ],
    notes: [
      "SCIVERSE_API_TOKEN 环境变量必须设置，否则所有工具调用会返回 401",
      "不同 AI 助手的 MCP/Skill 配置方式不同，请参考各自官方文档",
      "Skill 安装后对支持 MCP 协议的 AI 助手生效",
      "具体调用限制请在 Token 管理页查看你的配额",
    ],
    nextSteps: [
      { label: "查看 Skills 完整文档", hash: "sciverse/skills" },
      { label: "申请 API Token", hash: "auth" },
      { label: "构建文献综述 Agent", hash: "cookbook/literature-review-agent" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 7. 专利与文献交叉探索
  // ═══════════════════════════════════════════════════════════
  {
    slug: "patent-literature-cross",
    coverImage: "/manus-storage/cookbook-cover-7-patent-explore_ea314eee.png",
    title: "用 Sciverse 做专利与文献语义探索",
    subtitle: "通过语义检索同时探索专利和学术文献，发现技术关联",
    tags: ["专利", "检索", "Agent"],
    difficulty: "进阶",
    estimatedCalls: "~10–20 次 API 调用",
    tools: ["agentic-search", "content"],
    pipeline: ["agentic-search(专利关键词)", "→ agentic-search(学术关键词)", "→ content(验证)", "→ 对比分析"],
    scenario: "研发人员需要了解某项技术在专利和学术论文中的覆盖情况，通过语义检索发现两者之间的关联和差异。",
    inputExample: `用户提问：\n"探索 CRISPR base editing 领域的专利文献和学术研究，找出技术关联。"`,
    outputExample: `## 专利与文献语义探索：CRISPR Base Editing\n\n### 专利相关片段（来自 agentic-search）\n1. [doc_id: 由 agentic-search 返回] "A method for adenine base editing..." (score: 0.89)\n2. [doc_id: 由 agentic-search 返回] "Compositions for cytosine base editing..." (score: 0.85)\n\n### 学术文献片段\n1. [doc_id: 由 agentic-search 返回] "Programmable base editing of A-T to G-C..." (score: 0.92)\n2. [doc_id: 由 agentic-search 返回] "Programmable base editing without DNA cleavage..." (score: 0.88)\n\n### 关联分析\n- 专利片段的技术方案与学术片段的 ABE 架构高度相关...`,
    agentPrompt: `你是一个专利与文献探索 Agent。当用户提出技术领域时：\n1. 调用 agentic-search 检索包含"patent"关键词的相关片段\n2. 再次调用 agentic-search 检索学术文献片段\n3. 对比两组结果，找出技术关联\n4. 调用 content 验证关键技术细节\n5. 输出对比分析报告，标注所有 doc_id 来源\n\n注意：当前为语义探索模式，不保证能精确区分专利和论文类型`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置环境变量",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx anthropic\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"\nexport ANTHROPIC_API_KEY="sk-ant-..."` },
      },
      {
        title: "Step 2: 语义检索专利和学术文献",
        desc: "分别用专利和学术关键词进行语义检索",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def search(query: str, top_k: int = 15):\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.post(\n            f"{BASE}/agentic-search",\n            headers=HEADERS,\n            json={"query": query, "top_k": top_k}\n        )\n        resp.raise_for_status()\n        return resp.json()["hits"]\n\nasync def main():\n    # 检索专利相关内容\n    patent_hits = await search("CRISPR base editing patent method composition")\n    print(f"Patent-related: {len(patent_hits)} chunks")\n\n    # 检索学术文献\n    academic_hits = await search("CRISPR base editing adenine cytosine mechanism")\n    print(f"Academic-related: {len(academic_hits)} chunks")\n\n    return patent_hits, academic_hits\n\npatent_hits, academic_hits = asyncio.run(main())` },
      },
      {
        title: "Step 3: 交叉分析与报告生成",
        desc: "将两组检索结果交给 LLM 进行关联分析",
        code: { lang: "python", label: "Python", code: `from anthropic import Anthropic\n\nclient = Anthropic()\n\npatent_summary = "\\n".join([\n    f"- [{h['doc_id']}] (score: {h['score']:.2f}) {h['title']}: {h['chunk'][:80]}..."\n    for h in patent_hits[:8]\n])\nacademic_summary = "\\n".join([\n    f"- [{h['doc_id']}] (score: {h['score']:.2f}) {h['title']}: {h['chunk'][:80]}..."\n    for h in academic_hits[:8]\n])\n\nmsg = client.messages.create(\n    model="claude-sonnet-4-20250514",\n    max_tokens=4096,\n    messages=[{\n        "role": "user",\n        "content": f"""分析以下两组检索结果的技术关联：\n\n## 专利相关片段\n{patent_summary}\n\n## 学术文献片段\n{academic_summary}\n\n请输出：\n1) 两组结果中的技术主题对比\n2) 可能的专利-论文关联（基于内容相似性）\n3) 技术发展脉络推测\n\n注意：所有结论必须基于上述检索结果，标注 doc_id。"""\n    }]\n)\nprint(msg.content[0].text)` },
      },
    ],
    notes: [
      "当前为语义探索模式：通过关键词区分专利和学术内容，不保证 100% 准确分类",
      "如需精确区分文档类型，请先调用 meta-catalog 确认是否有 source_type 等字段可用",
      "Sciverse 数据库覆盖学术文献和部分专利，具体覆盖范围请参考数据深度页面",
      "建议对关键片段调用 content 接口验证完整上下文后再下结论",
    ],
    nextSteps: [
      { label: "查看 agentic-search 接口", hash: "sciverse/api/agentic-search" },
      { label: "结构化论文筛选", hash: "cookbook/structured-paper-filter" },
      { label: "查看数据深度", hash: "data-depth" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 8. Citation Grounding
  // ═══════════════════════════════════════════════════════════
  {
    slug: "citation-grounding",
    coverImage: "/manus-storage/cookbook-cover-8-citation-grounding_fe386fa5.png",
    title: "用 Sciverse 做科学问答的 Citation Grounding",
    subtitle: "为 LLM 回答的每一句话找到可验证的文献来源，消除幻觉",
    tags: ["RAG", "Agent"],
    difficulty: "高级",
    estimatedCalls: "~10–25 次 API 调用",
    tools: ["agentic-search", "content"],
    pipeline: ["LLM 生成草稿", "→ 拆句", "→ agentic-search(逐句)", "→ content(验证原文)", "→ 标注引用"],
    scenario: "开发者构建高可信度科学问答系统，需要对 LLM 生成的每个论点进行事实核查，通过检索文献并验证原文来确认或标记为不可验证。",
    inputExample: `LLM 生成的草稿回答：\n"mRNA 疫苗使用可电离脂质纳米颗粒(iLNP)包裹 mRNA。其中 MC3 是最广泛使用的可电离脂质。LNP 的粒径通常在 80-100nm。"`,
    outputExample: `{\n  "grounded_answer": "mRNA 疫苗使用可电离脂质纳米颗粒(iLNP)包裹 mRNA [1]。其中 MC3 是最广泛使用的可电离脂质 [2]。LNP 的粒径通常在 80-100nm [1]。",\n  "citations": [\n    {"id": 1, "doc_id": "lnp_review_2021", "offset": 4200, "quote": "iLNP encapsulates mRNA...", "verified": true},\n    {"id": 2, "doc_id": "mc3_study_2018", "offset": 1800, "quote": "MC3 (DLin-MC3-DMA) remains the most widely...", "verified": true}\n  ],\n  "unverified_claims": []\n}`,
    agentPrompt: `你是一个 Citation Grounding Agent。工作流程：\n1. 接收 LLM 生成的草稿回答\n2. 将草稿拆分为独立论点/句子\n3. 对每个论点调用 agentic-search 查找支持证据\n4. 对高分结果调用 content 读取原文，确认证据是否真正支持该论点\n5. 输出每句话的来源（doc_id + offset + 原文引用），无法验证的标记为 [unverified]`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置环境变量",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"` },
      },
      {
        title: "Step 2: 拆分草稿并逐句检索",
        desc: "将 LLM 回答拆分为独立论点，对每个论点调用 agentic-search",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\ndef split_claims(draft: str) -> list:\n    """将草稿拆分为独立论点句子"""\n    sentences = [s.strip() for s in draft.split("。") if s.strip()]\n    return [s for s in sentences if len(s) > 10]\n\nasync def search_evidence(claim: str):\n    """对单个论点检索支持证据"""\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.post(\n            f"{BASE}/agentic-search",\n            headers=HEADERS,\n            json={"query": claim, "top_k": 5}\n        )\n        resp.raise_for_status()\n        return resp.json()["hits"]\n\ndraft = "mRNA 疫苗使用可电离脂质纳米颗粒(iLNP)包裹 mRNA。其中 MC3 是最广泛使用的可电离脂质。LNP 的粒径通常在 80-100nm。"\nclaims = split_claims(draft)\nprint(f"Split into {len(claims)} claims")` },
      },
      {
        title: "Step 3: 调用 content 验证原文",
        desc: "对高分 hit 调用 content 读取原文，确认是否真正支持论点",
        code: { lang: "python", label: "Python", code: `async def verify_with_content(hit: dict, claim: str) -> dict:\n    """读取原文验证证据是否真正支持论点"""\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.get(\n            f"{BASE}/content",\n            headers=HEADERS,\n            params={"doc_id": hit["doc_id"], "offset": hit.get("offset", 0), "limit": 1000}\n        )\n        resp.raise_for_status()\n        data = resp.json()\n        # 检查原文中是否包含与论点相关的关键词\n        text = data["text"].lower()\n        claim_keywords = [w for w in claim.lower().split() if len(w) > 3]\n        match_count = sum(1 for kw in claim_keywords if kw in text)\n        match_ratio = match_count / max(len(claim_keywords), 1)\n        return {\n            "doc_id": hit["doc_id"],\n            "offset": hit.get("offset", 0),\n            "quote": data["text"][:150],\n            "match_ratio": match_ratio,\n            "verified": match_ratio >= 0.3 and hit["score"] >= 0.7\n        }\n\nasync def ground_claims(claims: list):\n    results = []\n    for claim in claims:\n        hits = await search_evidence(claim)\n        if hits and hits[0]["score"] >= 0.6:\n            verification = await verify_with_content(hits[0], claim)\n            results.append({"claim": claim, **verification})\n        else:\n            results.append({"claim": claim, "verified": False, "doc_id": None})\n        status = "\\u2713" if results[-1]["verified"] else "\\u2717"\n        print(f"  {status} {claim[:50]}...")\n    return results\n\nresults = asyncio.run(ground_claims(claims))` },
      },
      {
        title: "Step 4: 生成带引用的最终回答",
        desc: "将验证结果组装为带 citation 的最终输出",
        code: { lang: "python", label: "Python", code: `def build_grounded_answer(results: list) -> dict:\n    citations = []\n    grounded_parts = []\n    unverified = []\n\n    for r in results:\n        if r["verified"]:\n            cite_id = len(citations) + 1\n            citations.append({\n                "id": cite_id,\n                "doc_id": r["doc_id"],\n                "offset": r.get("offset", 0),\n                "quote": r.get("quote", ""),\n                "verified": True\n            })\n            grounded_parts.append(f"{r['claim']} [{cite_id}]")\n        else:\n            grounded_parts.append(f"{r['claim']} [unverified]")\n            unverified.append(r["claim"])\n\n    return {\n        "grounded_answer": "\\u3002".join(grounded_parts) + "\\u3002",\n        "citations": citations,\n        "unverified_claims": unverified\n    }\n\nfinal = build_grounded_answer(results)\nprint(f"\\nGrounded answer:\\n{final['grounded_answer']}")\nprint(f"\\nCitations: {len(final['citations'])}")\nprint(f"Unverified: {len(final['unverified_claims'])}")\nfor c in final["citations"]:\n    print(f"  [{c['id']}] {c['doc_id']} (offset: {c['offset']})")` },
      },
    ],
    notes: [
      "仅靠 score 判定 verified 不够严谨；本示例增加了 content 原文验证步骤",
      "match_ratio 关键词匹配仅为简化示例，生产环境建议使用 LLM/NLI 模型判断原文是否真正支持论点",
      "验证逻辑可根据需求增强：如使用 LLM 判断原文是否支持论点（NLI 任务）",
      "score 阈值 0.7 是建议值，医学领域建议 0.8+",
      "生产环境建议并发验证多个 claims（asyncio.gather）以提升速度",
      "对于 unverified 的论点，建议在最终输出中明确标注或要求用户确认",
    ],
    nextSteps: [
      { label: "查看 agentic-search 接口", hash: "sciverse/api/agentic-search" },
      { label: "查看 content 接口", hash: "sciverse/api/content" },
      { label: "科学 RAG 数据源", hash: "cookbook/scientific-rag" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 9. 多模态图表检索 Demo
  // ═══════════════════════════════════════════════════════════
  {
    slug: "multimodal-figure-retrieval",
    coverImage: "/manus-storage/cookbook-cover-9-multimodal-chart_5e8cc9b7.png",
    title: "用 Sciverse 做论文图表提取与分析 Demo",
    subtitle: "先检索论文，再从全文 Markdown 中定位图表路径并下载，结合多模态模型分析",
    tags: ["多模态", "检索", "Agent"],
    difficulty: "高级",
    estimatedCalls: "~8–20 次 API 调用",
    tools: ["agentic-search", "content", "resource"],
    pipeline: ["agentic-search(论文主题)", "→ content(提取图表路径)", "→ resource(下载图片)", "→ 多模态 LLM 分析"],
    scenario: "研究人员需要从论文中提取特定图表并进行分析。流程是先通过语义检索找到相关论文，再从全文中定位图表路径，下载后用多模态模型提取信息。",
    inputExample: `用户提问：\n"找到 AlphaFold2 论文中展示预测精度的图表，帮我分析其中的 GDT-TS 分布。"`,
    outputExample: `## 图表分析结果\n\n### Figure 2 - AlphaFold2 vs Experimental (Nature 2021)\n来源: doc_id=<由 agentic-search 返回>, 路径: dt=<doc_id>/p_5/fig2.png\n\n分析：\n- GDT-TS 中位数: 92.4\n- 超过 90 的比例: 67%\n- 关键发现: 在单域蛋白上接近实验精度`,
    agentPrompt: `你是一个论文图表提取与分析 Agent。工作流程：\n1. 用 agentic-search 检索包含目标图表的论文\n2. 用 content 读取全文 Markdown，提取 ![...](path) 中的图表路径\n3. 用 resource(file_name=path) 下载图表图片\n4. 用多模态模型分析图表内容\n5. 返回结构化的图表信息和分析结果\n\n注意：这不是"按视觉内容直接检索图表"，而是先找论文再提取图表`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置环境变量",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx anthropic\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"\nexport ANTHROPIC_API_KEY="sk-ant-..."` },
      },
      {
        title: "Step 2: 检索论文并提取图表路径",
        desc: "先通过语义检索找到相关论文，再从全文中定位图表",
        code: { lang: "python", label: "Python", code: `import os\nimport re\nimport asyncio\nimport httpx\nfrom pathlib import Path\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def search_papers(query: str, top_k: int = 10):\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.post(\n            f"{BASE}/agentic-search", headers=HEADERS,\n            json={"query": query, "top_k": top_k}\n        )\n        resp.raise_for_status()\n        return resp.json()["hits"]\n\nasync def get_figures_from_doc(doc_id: str):\n    """读取全文并提取图表路径"""\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.get(\n            f"{BASE}/content", headers=HEADERS,\n            params={"doc_id": doc_id, "offset": 0, "limit": 4000}\n        )\n        resp.raise_for_status()\n        text = resp.json()["text"]  # 注意：字段是 text\n        figure_paths = re.findall(r'!\\[.*?\\]\\((.*?)\\)', text)\n        return figure_paths\n\nasync def main():\n    hits = await search_papers("AlphaFold2 protein structure prediction accuracy")\n    print(f"Found {len(hits)} relevant papers")\n    # 对 top 3 论文提取图表\n    all_figures = []\n    for hit in hits[:3]:\n        paths = await get_figures_from_doc(hit["doc_id"])\n        print(f"  {hit['title'][:50]}: {len(paths)} figures")\n        all_figures.extend([(hit["doc_id"], p) for p in paths])\n    return all_figures\n\nall_figures = asyncio.run(main())` },
      },
      {
        title: "Step 3: 下载图表并用多模态模型分析",
        desc: "调用 resource 下载图片，传给多模态 LLM 分析",
        code: { lang: "python", label: "Python", code: `import base64\nfrom anthropic import Anthropic\n\nasync def download_figure(file_name: str, save_dir: str = "./figures"):\n    Path(save_dir).mkdir(exist_ok=True)\n    async with httpx.AsyncClient(timeout=60) as client:\n        resp = await client.get(\n            f"{BASE}/resource", headers=HEADERS,\n            params={"file_name": file_name}  # 参数是 file_name\n        )\n        resp.raise_for_status()\n        local = f"{save_dir}/{file_name.split('/')[-1]}"\n        Path(local).write_bytes(resp.content)\n        return local\n\ndef analyze_figure(image_path: str, question: str) -> str:\n    """用多模态 LLM 分析图表"""\n    client = Anthropic()\n    with open(image_path, "rb") as f:\n        img_data = base64.b64encode(f.read()).decode()\n\n    msg = client.messages.create(\n        model="claude-sonnet-4-20250514",\n        max_tokens=2048,\n        messages=[{\n            "role": "user",\n            "content": [\n                {"type": "image", "source": {\n                    "type": "base64", "media_type": "image/png", "data": img_data\n                }},\n                {"type": "text", "text": question}\n            ]\n        }]\n    )\n    return msg.content[0].text\n\nasync def main():\n    if all_figures:\n        doc_id, path = all_figures[0]\n        try:\n            local = await download_figure(path)\n            analysis = analyze_figure(local, "请描述这张图表的主要发现，提取关键数值。")\n            print(f"\\nFigure from {doc_id}:\\n{analysis}")\n        except httpx.HTTPStatusError as e:\n            print(f"Download failed: {e.response.status_code}")\n\nasyncio.run(main())` },
      },
    ],
    notes: [
      "这不是按视觉内容直接检索图表的功能，而是：先找论文 → 提取图表路径 → 下载 → 分析",
      "resource 接口参数是 file_name，传入 content 中提取的相对路径",
      "部分论文可能没有可下载的图表资源（resource 返回 404）",
      "多模态分析质量取决于图表清晰度和 LLM 能力",
      "建议对图表分析结果做结构化提取（JSON schema）便于下游使用",
    ],
    nextSteps: [
      { label: "下载论文图表资源", hash: "cookbook/download-figures" },
      { label: "查看 resource 接口", hash: "sciverse/api/resource" },
      { label: "科学 RAG 数据源", hash: "cookbook/scientific-rag" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 10. 论文去重与版本聚合 Agent
  // ═══════════════════════════════════════════════════════════
  {
    slug: "paper-dedup-agent",
    coverImage: "/manus-storage/cookbook-cover-10-paper-dedup_9f4eacd8.png",
    title: "论文标题相似度去重 Demo",
    subtitle: "基于标题相似度将重复文献分组，选择最权威版本作为主记录（不保证能完整聚合 preprint 与正式版）",
    tags: ["Agent", "元数据"],
    difficulty: "进阶",
    estimatedCalls: "~10–20 次 API 调用 / 一次去重任务",
    tools: ["agentic-search", "meta-search", "content"],
    pipeline: ["agentic-search", "→ 候选文献列表", "→ meta-search 按 DOI/标题聚合", "→ 去重合并", "→ canonical pack"],
    scenario: "科研 Agent 在检索时常遇到同一篇论文的 preprint（arXiv）、正式发表版（Nature/Science）、以及 PDF/Web 多来源副本。需要将它们聚合为一条 canonical 记录，避免重复引用。",
    inputExample: `Agent 检索“Attention Is All You Need”相关文献，返回了 arXiv 预印本、NeurIPS 正式版、以及多个 PDF 镜像。\n需要合并为一条记录，保留最权威版本的元数据。`,
    outputExample: `{\n  "canonical": {\n    "title": "Attention Is All You Need",\n    "doi": "10.5555/3295222.3295349",\n    "venue": "NeurIPS 2017",\n    "versions": [\n      {"source": "arxiv", "doc_id": "arxiv_1706.03762"},\n      {"source": "neurips", "doc_id": "nips_2017_xxx"},\n      {"source": "pdf_mirror", "doc_id": "pdf_att_yyy"}\n    ],\n    "primary_doc_id": "nips_2017_xxx"\n  }\n}`,
    agentPrompt: `你是一个论文去重 Agent。当收到一组检索结果时：\n1. 按标题相似度和 DOI 分组\n2. 对每组调用 meta-search 确认正式发表版本\n3. 选择最权威版本作为 primary_doc_id\n4. 输出 canonical evidence pack`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置 API Token",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"` },
      },
      {
        title: "Step 2: 语义检索候选文献",
        desc: "用 agentic-search 获取与某主题相关的所有片段",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\nfrom collections import defaultdict\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def search_candidates(query: str, top_k: int = 50):\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.post(\n            f"{BASE}/agentic-search", headers=HEADERS,\n            json={"query": query, "top_k": top_k}\n        )\n        resp.raise_for_status()\n        return resp.json()["hits"]\n\nhits = asyncio.run(search_candidates("Attention Is All You Need transformer"))\nprint(f"Raw hits: {len(hits)}")` },
      },
      {
        title: "Step 3: 按标题相似度聚合",
        desc: "将同一篇论文的不同版本分组",
        code: { lang: "python", label: "Python", code: `from difflib import SequenceMatcher\n\ndef title_similarity(a: str, b: str) -> float:\n    return SequenceMatcher(None, a.lower(), b.lower()).ratio()\n\ndef cluster_by_title(hits, threshold=0.85):\n    clusters = []\n    used = set()\n    for i, h in enumerate(hits):\n        if i in used:\n            continue\n        group = [h]\n        used.add(i)\n        for j in range(i + 1, len(hits)):\n            if j in used:\n                continue\n            if title_similarity(h["title"], hits[j]["title"]) >= threshold:\n                group.append(hits[j])\n                used.add(j)\n        clusters.append(group)\n    return clusters\n\nclusters = cluster_by_title(hits)\nprint(f"Clustered into {len(clusters)} unique papers")\nfor c in clusters[:3]:\n    print(f"  [{len(c)} versions] {c[0]['title'][:60]}")` },
      },
      {
        title: "Step 4: 确认正式版本并生成 canonical pack",
        desc: "用 meta-search 查询 DOI 信息，选择最权威版本",
        code: { lang: "python", label: "Python", code: `async def find_primary(cluster):\n    """\u4ece\u4e00\u7ec4\u7248\u672c\u4e2d\u627e\u5230\u6700\u6743\u5a01\u7684\u6b63\u5f0f\u53d1\u8868\u7248"""\n    # \u4f18\u5148\u7ea7: \u6709 DOI > \u6709 venue > arXiv\n    best = cluster[0]\n    for item in cluster:\n        # \u7528 meta-search \u67e5\u8be2\u66f4\u591a\u5143\u6570\u636e\n        async with httpx.AsyncClient(timeout=30) as client:\n            resp = await client.post(\n                f"{BASE}/meta-search", headers=HEADERS,\n                json={\n                    "query": item["title"],\n                    "filters": [],\n                    "page": 1, "page_size": 1\n                }\n            )\n            if resp.status_code == 200:\n                results = resp.json().get("results", [])\n                if results and results[0].get("doi"):\n                    best = item\n                    break\n    return {\n        "title": best["title"],\n        "primary_doc_id": best["doc_id"],\n        "versions": [{"doc_id": v["doc_id"], "title": v["title"]} for v in cluster]\n    }\n\nasync def build_canonical_pack(clusters):\n    pack = []\n    for cluster in clusters[:10]:\n        canonical = await find_primary(cluster)\n        pack.append(canonical)\n    return pack\n\npack = asyncio.run(build_canonical_pack(clusters))\nprint(f"Canonical pack: {len(pack)} unique papers")` },
      },
    ],
    notes: [
      "标题相似度阈值 0.85 适合大多数场景，可根据领域调整",
      "对于有 DOI 的论文，可直接用 DOI 做精确去重",
      "建议保留所有版本的 doc_id，以便后续读取不同版本的全文",
      "canonical pack 可作为下游 RAG/Agent 的标准输入",
    ],
    nextSteps: [
      { label: "查看 meta-search 接口", hash: "sciverse/api/meta-search" },
      { label: "Evidence Pack 模板", hash: "cookbook/evidence-pack" },
      { label: "科研文献综述 Agent", hash: "cookbook/literature-review-agent" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 11. DOI / 标题精确解析
  // ═══════════════════════════════════════════════════════════
  {
    slug: "doi-pmid-resolver",
    coverImage: "/manus-storage/cookbook-cover-11-doi-resolver_6042ecaf.png",
    title: "DOI / 标题精确解析",
    subtitle: "快速拉取元数据、全文和引用证据，科研 Agent 的基础入口",
    tags: ["元数据", "检索"],
    difficulty: "入门",
    estimatedCalls: "~3–5 次 API 调用 / 一次解析",
    tools: ["meta-search", "content"],
    pipeline: ["DOI/标题", "→ meta-search 精确查询", "→ 元数据", "→ content 全文"],
    scenario: "用户已有 DOI 或论文标题，只想快速拉取元数据、全文和引用证据。这是科研 Agent 最基础的入口操作。",
    inputExample: `用户输入：\n"DOI: 10.1038/s41586-021-03819-2"\n或："论文标题: Highly accurate protein structure prediction with AlphaFold"\n\n注意：请替换为你的真实 DOI 或标题`,
    outputExample: `{\n  "title": "Highly accurate protein structure prediction with AlphaFold",\n  "doi": "10.1038/s41586-021-03819-2",\n  "venue": "Nature",\n  "year": 2021,\n  "authors": ["Jumper, J.", "Evans, R.", ...],\n  "doc_id": "由 meta-search 返回的真实 ID",\n  "full_text_preview": "The prediction of protein three-dimensional structure..."\n}`,
    agentPrompt: `你是一个文献解析 Agent。当用户提供 DOI 或标题时：\n1. 调用 meta-search 精确查找该文献\n2. 返回元数据（标题、作者、年份、期刊、DOI）\n3. 调用 content 读取全文摘要\n4. 结构化输出`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置 API Token",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"` },
      },
      {
        title: "Step 2: 通过 DOI 精确查找文献",
        desc: "用 meta-search 按 DOI 精确匹配",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def resolve_doi(doi: str):\n    """\u901a\u8fc7 DOI \u7cbe\u786e\u67e5\u627e\u6587\u732e\u5143\u6570\u636e"""\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.post(\n            f"{BASE}/meta-search", headers=HEADERS,\n            json={\n                "query": doi,\n                "filters": [{"field": "doi", "operator": "FILTER_OP_EQ", "value": doi}],\n                "page": 1, "page_size": 1\n            }\n        )\n        resp.raise_for_status()\n        data = resp.json()\n        if data["total_count"] > 0:\n            return data["results"][0]\n        return None\n\nasync def resolve_title(title: str):\n    """\u901a\u8fc7\u6807\u9898\u6a21\u7cca\u67e5\u627e"""\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.post(\n            f"{BASE}/meta-search", headers=HEADERS,\n            json={"query": title, "filters": [], "page": 1, "page_size": 5}\n        )\n        resp.raise_for_status()\n        return resp.json()["results"]\n\n# \u793a\u4f8b\uff1a\u901a\u8fc7 DOI \u89e3\u6790\npaper = asyncio.run(resolve_doi("10.1038/s41586-021-03819-2"))\nif paper:\n    print(f"Title: {paper['title']}")\n    print(f"Venue: {paper.get('publication_venue_name', 'N/A')}")\n    print(f"Year: {paper.get('publication_published_year', 'N/A')}")\n    print(f"Doc ID: {paper.get('doc_id', 'N/A')}")` },
      },
      {
        title: "Step 3: 读取全文摘要",
        desc: "用 content 接口拉取论文开头段落",
        code: { lang: "python", label: "Python", code: `async def read_abstract(doc_id: str):\n    """\u8bfb\u53d6\u8bba\u6587\u5f00\u5934 1500 \u5b57\u7b26\u4f5c\u4e3a\u6458\u8981"""\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.get(\n            f"{BASE}/content", headers=HEADERS,\n            params={"doc_id": doc_id, "offset": 0, "limit": 1500}\n        )\n        resp.raise_for_status()\n        return resp.json()["text"]\n\nif paper and paper.get("doc_id"):\n    abstract = asyncio.run(read_abstract(paper["doc_id"]))\n    print(f"\\nFull text preview:\\n{abstract[:500]}...")` },
      },
    ],
    notes: [
      "DOI 精确查询使用 FILTER_OP_EQ 操作符",
      "如果 DOI 查不到，可回退到标题模糊查询",
      "content 接口返回的是 text 字段，非 content",
      "这是科研 Agent 最基础的入口操作，建议封装为通用工具函数",
    ],
    nextSteps: [
      { label: "查看 meta-search 接口", hash: "sciverse/api/meta-search" },
      { label: "论文阅读助手", hash: "cookbook/paper-reader" },
      { label: "Evidence Pack 模板", hash: "cookbook/evidence-pack" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 12. 系统综述初筛助手
  // ═══════════════════════════════════════════════════════════
  {
    slug: "systematic-review-screener",
    coverImage: "/manus-storage/cookbook-cover-12-systematic-review_a702dc03.png",
    title: "系统综述初筛助手",
    subtitle: "用 meta-catalog → meta-search → agentic-search 做 PRISMA-style 初筛",
    tags: ["综述", "Agent"],
    difficulty: "高级",
    estimatedCalls: "~30–80 次 API 调用 / 一次初筛任务",
    tools: ["meta-catalog", "meta-search", "agentic-search", "content"],
    pipeline: ["meta-catalog", "→ 确认可筛字段", "→ meta-search 广撒网", "→ agentic-search 精筛", "→ PRISMA 流程图"],
    scenario: "医学、生命科学、材料等领域的研究者需要做系统综述，第一步是 PRISMA-style 初筛：从海量文献中筛选出符合纳入标准的候选论文。",
    inputExample: `系统综述主题：“CAR-T 细胞疗法在实体瘤中的临床试验”\n纳入标准：2019–2024年、英文、临床试验类型\n排除标准：综述文章、动物实验`,
    outputExample: `PRISMA Flow:\n- Identification: 2,847 records (meta-search)\n- Screening: 892 records (agentic-search relevance > 0.7)\n- Eligibility: 156 records (full-text review)\n- Included: 43 studies\n\nExport: CSV with title, DOI, year, relevance_score, inclusion_reason`,
    agentPrompt: `你是一个系统综述初筛 Agent。按 PRISMA 流程执行：\n1. meta-catalog 确认可用筛选字段\n2. meta-search 广撒网（年份+关键词）\n3. agentic-search 语义精筛\n4. content 读取摘要判断纳入/排除\n5. 输出 PRISMA 流程图和纳入文献列表`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置 API Token",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx pandas\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"` },
      },
      {
        title: "Step 2: 查询可用筛选字段",
        desc: "用 meta-catalog 确认数据库支持哪些筛选条件",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def get_catalog():\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.get(f"{BASE}/meta-catalog", headers=HEADERS)\n        resp.raise_for_status()\n        return resp.json()["fields"]\n\nfields = asyncio.run(get_catalog())\nfor f in fields:\n    print(f"{f['name']} ({f['type']}): operators={f['operators']}")` },
      },
      {
        title: "Step 3: 广撒网检索",
        desc: "用 meta-search 按年份和关键词获取候选池",
        code: { lang: "python", label: "Python", code: `import pandas as pd\n\nasync def broad_search(query: str, year_from: int, year_to: int, page_size: int = 100):\n    """\u5e7f\u6492\u7f51: \u6309\u5e74\u4efd\u8303\u56f4\u68c0\u7d22\u6240\u6709\u5019\u9009\u6587\u732e"""\n    all_results = []\n    page = 1\n    while True:\n        async with httpx.AsyncClient(timeout=30) as client:\n            resp = await client.post(\n                f"{BASE}/meta-search", headers=HEADERS,\n                json={\n                    "query": query,\n                    "filters": [\n                        {"field": "publication_published_year", "operator": "FILTER_OP_GTE", "value": year_from},\n                        {"field": "publication_published_year", "operator": "FILTER_OP_LTE", "value": year_to},\n                    ],\n                    "page": page, "page_size": page_size\n                }\n            )\n            resp.raise_for_status()\n            data = resp.json()\n            all_results.extend(data["results"])\n            if len(all_results) >= data["total_count"] or len(data["results"]) < page_size:\n                break\n            page += 1\n    return all_results, data["total_count"]\n\nresults, total = asyncio.run(broad_search(\n    "CAR-T cell therapy solid tumor clinical trial", 2019, 2024\n))\nprint(f"Identification: {total} records found")` },
      },
      {
        title: "Step 4: 语义精筛与纳入判断",
        desc: "用 agentic-search 对候选文献做语义相关性评分，筛选符合纳入标准的论文",
        code: { lang: "python", label: "Python", code: `async def semantic_screen(query: str, top_k: int = 100):\n    """\u8bed\u4e49\u7cbe\u7b5b: \u7528 agentic-search \u5bf9\u5019\u9009\u6587\u732e\u8bc4\u5206"""\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.post(\n            f"{BASE}/agentic-search", headers=HEADERS,\n            json={"query": query, "top_k": top_k}\n        )\n        resp.raise_for_status()\n        return resp.json()["hits"]\n\nhits = asyncio.run(semantic_screen(\n    "CAR-T cell therapy clinical trial solid tumor patients outcomes"\n))\n\n# \u6309\u76f8\u5173\u6027\u5206\u6570\u7b5b\u9009\nscreened = [h for h in hits if h["score"] >= 0.7]\nprint(f"Screening: {len(screened)} records (score >= 0.7)")\n\n# \u8f93\u51fa PRISMA \u6d41\u7a0b\u6570\u636e\nprisma = {\n    "identification": total,\n    "screening": len(screened),\n    "included": len([h for h in screened if h["score"] >= 0.85])\n}\nprint(f"\\nPRISMA Flow: {prisma}")\n\n# \u5bfc\u51fa CSV\ndf = pd.DataFrame(screened)\ndf.to_csv("screened_papers.csv", index=False)\nprint("Exported to screened_papers.csv")` },
      },
    ],
    notes: [
      "适合医学、生命科学、材料等高频系统综述场景",
      "meta-search 广撒网阶段可能需要分页拉取，注意 page_size 上限，建议设置 max_pages 防止无限循环",
      "agentic-search 的 score 阈值建议根据领域调整（0.7–0.85）",
      "完整 PRISMA 流程还需人工全文审阅，本案例覆盖自动化初筛部分",
      "建议将筛选结果导出为 CSV 便于团队协作审阅",
    ],
    nextSteps: [
      { label: "查看 meta-catalog 接口", hash: "sciverse/api/meta-catalog" },
      { label: "科研文献综述 Agent", hash: "cookbook/literature-review-agent" },
      { label: "结构化筛选与排序", hash: "cookbook/structured-paper-filter" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 13. 论文可信引用包 Evidence Pack
  // ═══════════════════════════════════════════════════════════
  {
    slug: "evidence-pack",
    coverImage: "/manus-storage/cookbook-cover-13-evidence-pack_3acea4a6.png",
    title: "论文可信引用包 Evidence Pack",
    subtitle: "将 claim / quote / doc_id / chunk_id / offset / page_no / title 标准化，RAG/Agent 的底层模板",
    tags: ["RAG", "工具"],
    difficulty: "进阶",
    estimatedCalls: "~8–15 次 API 调用 / 一次构建",
    tools: ["agentic-search", "content"],
    pipeline: ["claim 列表", "→ agentic-search 逐条检索", "→ content 定位原文", "→ 标准化 evidence pack"],
    scenario: "所有 RAG/Agent 案例都需要一个标准化的引用包格式。本案例定义了 Evidence Pack 的标准结构，并展示如何从 Sciverse 检索结果构建它。",
    inputExample: `Agent 需要为以下 claim 构建引用包：\n1. "AlphaFold2 在 CASP14 中达到了实验精度"\n2. "mRNA 的 LNP 递送系统显著提高了细胞内化效率"`,
    outputExample: `{\n  "evidence_pack": [\n    {\n      "claim": "AlphaFold2 \u5728 CASP14 \u4e2d\u8fbe\u5230\u4e86\u5b9e\u9a8c\u7cbe\u5ea6",\n      "quote": "AlphaFold2 achieved a median GDT score of 92.4...",\n      "doc_id": "由 agentic-search 返回的真实 ID",
      "offset": 12480,
      "title": "Highly accurate protein structure prediction...",,\n      "venue": "Nature",\n      "year": 2021,\n      "confidence": 0.95\n    }\n  ]\n}`,
    agentPrompt: `你是一个 Evidence Pack 构建 Agent。对每个 claim：\n1. 调用 agentic-search 查找支持证据\n2. 调用 content 定位原文确切引用\n3. 标准化为 {claim, quote, doc_id, offset, title, venue, year, confidence}\n4. confidence 基于语义匹配度和来源权威性`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置 API Token",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"` },
      },
      {
        title: "Step 2: 定义 Evidence Pack 标准结构",
        desc: "定义标准化的引用包数据结构",
        code: { lang: "python", label: "Python", code: `from dataclasses import dataclass, asdict\nfrom typing import Optional\nimport json\n\n@dataclass\nclass EvidenceItem:\n    claim: str\n    quote: str\n    doc_id: str\n    offset: int\n    title: str\n    venue: Optional[str] = None\n    year: Optional[int] = None\n    confidence: float = 0.0\n\n@dataclass\nclass EvidencePack:\n    items: list[EvidenceItem]\n\n    def to_json(self) -> str:\n        return json.dumps({"evidence_pack": [asdict(i) for i in self.items]}, ensure_ascii=False, indent=2)\n\n# \u793a\u4f8b\npack = EvidencePack(items=[])\nprint(pack.to_json())` },
      },
      {
        title: "Step 3: 为每个 claim 检索并构建引用",
        desc: "逐条检索 claim 对应的文献证据",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def build_evidence(claim: str) -> Optional[EvidenceItem]:\n    """\u4e3a\u5355\u4e2a claim \u68c0\u7d22\u5e76\u6784\u5efa\u5f15\u7528"""\n    async with httpx.AsyncClient(timeout=30) as client:\n        # Step 1: \u8bed\u4e49\u68c0\u7d22\n        resp = await client.post(\n            f"{BASE}/agentic-search", headers=HEADERS,\n            json={"query": claim, "top_k": 5}\n        )\n        resp.raise_for_status()\n        hits = resp.json()["hits"]\n        if not hits:\n            return None\n        best = hits[0]\n\n        # Step 2: \u8bfb\u53d6\u539f\u6587\u5b9a\u4f4d\u786e\u5207\u5f15\u7528\n        resp2 = await client.get(\n            f"{BASE}/content", headers=HEADERS,\n            params={"doc_id": best["doc_id"], "offset": best.get("offset", 0), "limit": 800}\n        )\n        resp2.raise_for_status()\n        text = resp2.json()["text"]\n\n        return EvidenceItem(\n            claim=claim,\n            quote=text[:200],  # \u53d6\u524d 200 \u5b57\u7b26\u4f5c\u4e3a\u5f15\u7528\n            doc_id=best["doc_id"],\n            offset=best.get("offset", 0),\n            title=best["title"],\n            confidence=best["score"]\n        )\n\nclaims = [\n    "AlphaFold2 \u5728 CASP14 \u4e2d\u8fbe\u5230\u4e86\u5b9e\u9a8c\u7cbe\u5ea6",\n    "mRNA \u7684 LNP \u9012\u9001\u7cfb\u7edf\u663e\u8457\u63d0\u9ad8\u4e86\u7ec6\u80de\u5185\u5316\u6548\u7387",\n]\n\nasync def main():\n    items = []\n    for claim in claims:\n        evidence = await build_evidence(claim)\n        if evidence:\n            items.append(evidence)\n            print(f"\u2713 {claim[:40]}... -> {evidence.doc_id}")\n        else:\n            print(f"\u2717 {claim[:40]}... -> no evidence found")\n    pack = EvidencePack(items=items)\n    print(f"\\nEvidence Pack ({len(items)}/{len(claims)} claims grounded):")\n    print(pack.to_json())\n\nasyncio.run(main())` },
      },
    ],
    notes: [
      "Evidence Pack 是所有 RAG/Agent 案例的底层模板，建议封装为通用工具",
      "confidence 基于 agentic-search 的 score，可结合来源权威性进一步调整",
      "quote 应从 content 返回的 text 中截取，而非 LLM 生成",
      "可扩展字段：page_no、chunk_id、section_title 等",
      "生产环境建议对每个 claim 并发检索以提高速度",
    ],
    nextSteps: [
      { label: "Citation Grounding 案例", hash: "cookbook/citation-grounding" },
      { label: "科研文献综述 Agent", hash: "cookbook/literature-review-agent" },
      { label: "论文去重与版本聚合", hash: "cookbook/paper-dedup-agent" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 14. 研究方向趋势扫描
  // ═══════════════════════════════════════════════════════════
  {
    slug: "research-trend-scanner",
    coverImage: "/manus-storage/cookbook-cover-14-trend-scanner_7be35c35.png",
    title: "研究方向趋势扫描",
    subtitle: "查看某方向近 5 年热度、头部期刊、高被引论文和关键词变化",
    tags: ["元数据", "检索"],
    difficulty: "进阶",
    estimatedCalls: "~10–25 次 API 调用 / 一次扫描",
    tools: ["meta-search"],
    pipeline: ["研究方向关键词", "→ meta-search 按年分组", "→ 统计趋势", "→ 排序高被引", "→ 趋势报告"],
    scenario: "研究者想了解某个方向近 5 年的发展趋势：发文量变化、头部期刊分布、高被引论文、关键词演变。可用 meta-search 分年统计支撑。",
    inputExample: `用户输入："我想了解 large language model 领域 2020–2024 年的发展趋势"`,
    outputExample: `## LLM 研究趋势报告 (2020–2024)\n\n| 年份 | 发文量 | 头部期刊 | 高被引论文 |\n|------|--------|----------|----------|\n| 2020 | 1,247  | NeurIPS, ICML | GPT-3 (Brown et al.) |\n| 2021 | 2,891  | ACL, EMNLP | FLAN (Wei et al.) |\n| 2022 | 5,432  | Nature, Science | ChatGPT, InstructGPT |\n| 2023 | 12,876 | Nature, ICML | GPT-4, LLaMA |\n| 2024 | 18,234 | NeurIPS, ICLR | Claude 3, Gemini |`,
    agentPrompt: `你是一个研究趋势分析 Agent。当用户指定研究方向时：\n1. 用 meta-search 按年分组查询，统计每年发文量\n2. 按 citation_count 排序找出高被引论文\n3. 统计头部期刊分布\n4. 输出结构化趋势报告`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置 API Token",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx pandas\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"` },
      },
      {
        title: "Step 2: 按年统计发文量",
        desc: "用 meta-search 分年查询，统计每年的发文数量",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\nimport pandas as pd\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def count_by_year(query: str, year: int) -> int:\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.post(\n            f"{BASE}/meta-search", headers=HEADERS,\n            json={\n                "query": query,\n                "filters": [\n                    {"field": "publication_published_year", "operator": "FILTER_OP_EQ", "value": year}\n                ],\n                "page": 1, "page_size": 1\n            }\n        )\n        resp.raise_for_status()\n        return resp.json()["total_count"]\n\nasync def trend_scan(query: str, start_year: int = 2020, end_year: int = 2024):\n    tasks = [count_by_year(query, y) for y in range(start_year, end_year + 1)]\n    counts = await asyncio.gather(*tasks)\n    return list(zip(range(start_year, end_year + 1), counts))\n\ntrend = asyncio.run(trend_scan("large language model"))\ndf = pd.DataFrame(trend, columns=["year", "count"])\nprint(df.to_string(index=False))` },
      },
      {
        title: "Step 3: 查找高被引论文和头部期刊",
        desc: "按引用数排序，找出各年最具影响力的论文",
        code: { lang: "python", label: "Python", code: `async def top_cited_papers(year: int, top_n: int = 5):\n    \"\"\"查找某年度高被引论文（按引用数排序时不传 query）\"\"\"\n    async with httpx.AsyncClient(timeout=30) as client:\n        resp = await client.post(\n            f\"{BASE}/meta-search\", headers=HEADERS,\n            json={\n                \"filters\": [\n                    {\"field\": \"publication_published_year\", \"operator\": \"FILTER_OP_EQ\", \"value\": year}\n                ],\n                \"sort\": [{\"field\": \"citation_count\", \"order\": \"SORT_ORDER_DESC\"}],\n                \"page\": 1, \"page_size\": top_n\n            }\n        )\n        resp.raise_for_status()\n        return resp.json()["results"]\n\nasync def main():\n    for year in [2022, 2023, 2024]:\n        papers = await top_cited_papers(year)\n        print(f"\\n=== {year} Top Cited ===")\n        for p in papers:\n            venue = p.get("publication_venue_name", "N/A")\n            cites = p.get("citation_count", 0)\n            print(f"  [{cites} cites] {p['title'][:60]} ({venue})")\n\nasyncio.run(main())` },
      },
    ],
    notes: [
      "meta-search 的 sort 和 query 不能同时传；按引用数排序时只传 filters + sort",
      "分年查询可并发执行（asyncio.gather）提高效率",
      "total_count 可直接作为当年发文量，无需拉取全部结果",
      "可进一步统计 venue 分布、作者网络等",
    ],
    nextSteps: [
      { label: "查看 meta-search 接口", hash: "sciverse/api/meta-search" },
      { label: "结构化筛选与排序", hash: "cookbook/structured-paper-filter" },
      { label: "科研文献综述 Agent", hash: "cookbook/literature-review-agent" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 15. 论文阅读助手
  // ═══════════════════════════════════════════════════════════
  {
    slug: "paper-reader",
    coverImage: "/manus-storage/cookbook-cover-15-paper-reader_cf1e2363.png",
    title: "论文阅读助手",
    subtitle: "给定 doc_id 后分段读取全文，抽取方法、数据、结论、局限",
    tags: ["工具", "RAG"],
    difficulty: "入门",
    estimatedCalls: "~5–12 次 API 调用 / 一篇论文",
    tools: ["content"],
    pipeline: ["doc_id", "→ content 循环读取", "→ 分段拼接全文", "→ LLM 抽取结构"],
    scenario: "用户已知论文 doc_id，需要分段读取全文并抽取关键信息（方法、数据、结论、局限）。比直接综述 Agent 更基础，也更容易跑通。",
    inputExample: `用户输入：\n"请帮我阅读这篇论文（先用 agentic-search 获取 doc_id）\n提取方法、数据、结论和局限。"`,
    outputExample: `## \u8bba\u6587\u9605\u8bfb\u62a5\u544a\n\n### \u65b9\u6cd5\n- \u4f7f\u7528 Evoformer \u6a21\u5757\u8fdb\u884c\u591a\u5e8f\u5217\u6bd4\u5bf9\u548c\u7ed3\u6784\u9884\u6d4b...\n\n### \u6570\u636e\n- CASP14 \u6d4b\u8bd5\u96c6: 87 \u4e2a\u86cb\u767d\u8d28\u7ed3\u6784\u57df...\n\n### \u7ed3\u8bba\n- \u4e2d\u4f4d GDT \u5f97\u5206 92.4\uff0c\u8fdc\u8d85\u5176\u4ed6\u65b9\u6cd5...\n\n### \u5c40\u9650\n- \u5bf9\u591a\u805a\u4f53\u590d\u5408\u7269\u7684\u9884\u6d4b\u7cbe\u5ea6\u8f83\u4f4e...`,
    agentPrompt: `你是一个论文阅读助手。当用户提供 doc_id 时：\n1. 循环调用 content(doc_id, offset, limit=4000) 读取全文\n2. 用 next_offset 继续读取直到 more=false\n3. 将全文传给 LLM 抽取结构化信息\n4. 输出：方法、数据、结论、局限`,
    steps: [
      {
        title: "Step 1: 环境准备",
        desc: "安装依赖并配置 API Token",
        code: { lang: "bash", label: "安装依赖", code: `pip install httpx anthropic\n\nexport SCIVERSE_API_TOKEN="sv-your-token-here"\nexport ANTHROPIC_API_KEY="sk-ant-..."` },
      },
      {
        title: "Step 2: 分段读取全文",
        desc: "循环调用 content 接口，用 next_offset 拼接完整全文",
        code: { lang: "python", label: "Python", code: `import os\nimport asyncio\nimport httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = os.environ["SCIVERSE_API_TOKEN"]\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def read_full_text(doc_id: str, chunk_size: int = 4000) -> str:\n    """\u5faa\u73af\u8bfb\u53d6\u5168\u6587\uff0c\u76f4\u5230 more=false"""\n    full_text = []\n    offset = 0\n    async with httpx.AsyncClient(timeout=30) as client:\n        while True:\n            resp = await client.get(\n                f"{BASE}/content", headers=HEADERS,\n                params={"doc_id": doc_id, "offset": offset, "limit": chunk_size}\n            )\n            resp.raise_for_status()\n            data = resp.json()\n            full_text.append(data["text"])\n            if not data.get("more", False):\n                break\n            offset = data["next_offset"]\n    return "".join(full_text)\n\n# \u5148\u901a\u8fc7 agentic-search \u83b7\u53d6\u771f\u5b9e doc_id\nhits_resp = await client.post(f\"{BASE}/agentic-search\", headers=HEADERS, json={\"query\": \"AlphaFold2\", \"top_k\": 1})\nhits_resp.raise_for_status()\ndoc_id = hits_resp.json()[\"hits\"][0][\"doc_id\"]\ntext = asyncio.run(read_full_text(doc_id))\nprint(f"Full text length: {len(text)} chars")\nprint(f"Preview: {text[:300]}...")` },
      },
      {
        title: "Step 3: LLM 抽取结构化信息",
        desc: "将全文传给 LLM，抽取方法、数据、结论、局限",
        code: { lang: "python", label: "Python", code: `from anthropic import Anthropic\n\nclient = Anthropic()\n\ndef extract_structure(full_text: str) -> str:\n    """\u7528 LLM \u62bd\u53d6\u8bba\u6587\u7ed3\u6784\u5316\u4fe1\u606f"""\n    # \u5982\u679c\u5168\u6587\u592a\u957f\uff0c\u53d6\u524d 15000 \u5b57\u7b26\n    content = full_text[:15000] if len(full_text) > 15000 else full_text\n\n    msg = client.messages.create(\n        model="claude-sonnet-4-20250514",\n        max_tokens=3000,\n        messages=[{\n            "role": "user",\n            "content": f"""\u8bf7\u9605\u8bfb\u4ee5\u4e0b\u8bba\u6587\u5168\u6587\uff0c\u63d0\u53d6\u4ee5\u4e0b\u56db\u4e2a\u65b9\u9762\u7684\u5173\u952e\u4fe1\u606f\uff1a\n\n1. **\u65b9\u6cd5**: \u6838\u5fc3\u6280\u672f\u65b9\u6cd5\u548c\u521b\u65b0\u70b9\n2. **\u6570\u636e**: \u4f7f\u7528\u7684\u6570\u636e\u96c6\u3001\u5b9e\u9a8c\u8bbe\u7f6e\u3001\u5173\u952e\u6570\u503c\n3. **\u7ed3\u8bba**: \u4e3b\u8981\u53d1\u73b0\u548c\u8d21\u732e\n4. **\u5c40\u9650**: \u5df2\u77e5\u5c40\u9650\u548c\u672a\u6765\u5de5\u4f5c\u65b9\u5411\n\n\u8bba\u6587\u5168\u6587:\n{content}"""\n        }]\n    )\n    return msg.content[0].text\n\nreport = extract_structure(text)\nprint(report)` },
      },
    ],
    notes: [
      "content 接口返回 {text, next_offset, more}，循环读取直到 more=false",
      "建议 chunk_size=4000，避免单次请求超时",
      "如果全文超过 LLM 上下文窗口，可分段抽取后合并",
      "这是最基础的论文阅读流程，可作为更复杂 Agent 的子模块",
      "部分论文可能无全文（content 返回 404），需做异常处理",
    ],
    nextSteps: [
      { label: "查看 content 接口", hash: "sciverse/api/content" },
      { label: "DOI 精确解析", hash: "cookbook/doi-pmid-resolver" },
      { label: "科研文献综述 Agent", hash: "cookbook/literature-review-agent" },
    ],
  },
];
