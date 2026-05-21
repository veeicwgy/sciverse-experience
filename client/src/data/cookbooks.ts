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
 */

export type CookbookTag = "RAG" | "Agent" | "检索" | "多模态" | "Skill" | "专利";

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
  scenario: string;
  inputExample: string;
  outputExample: string;
  agentPrompt: string;
  steps: { title: string; desc: string; code: CodeSample }[];
  notes: string[];
  nextSteps: { label: string; hash: string }[];
};

export const COOKBOOKS: CookbookItem[] = [
  {
    slug: "literature-review-agent",
    title: "用 Sciverse 构建科研文献综述 Agent",
    subtitle: "从一句研究问题出发，自动检索、摘要、生成带引用的文献综述",
    tags: ["Agent", "RAG"],
    difficulty: "进阶",
    estimatedCalls: "~15–30 次 API 调用 / 一次综述任务",
    tools: ["semantic_search", "read_content"],
    pipeline: ["semantic_search", "→ doc_id + chunk", "→ read_content", "→ evidence markdown"],
    scenario: "科研人员或 AI Agent 需要针对一个研究问题，自动检索相关文献、提取关键证据段落，并生成一份带引用的文献综述。",
    inputExample: `用户在 Claude / Cursor 中提问：\n"请帮我综述 2020–2024 年 Transformer 在蛋白质结构预测领域的应用进展，列出关键论文和核心贡献。"`,
    outputExample: `## 文献综述：Transformer 在蛋白质结构预测中的应用（2020–2024）\n\n### 1. AlphaFold2 的突破\nJumper et al. (2021) 提出 AlphaFold2，利用 Evoformer 模块...\n[来源: Nature, doc_id: af2_xxx, chunk_id: c_001]\n\n### 2. ESMFold 的端到端预测\nLin et al. (2023) 提出 ESMFold...\n[来源: Science, doc_id: esm_yyy, chunk_id: c_042]\n\n---\n共检索 12 篇核心文献，提取 28 个证据片段。`,
    agentPrompt: `你是一个科研文献综述 Agent。当用户提出研究问题时：\n1. 调用 semantic_search(query=用户问题, top_k=20) 获取相关片段\n2. 对每个高分片段，调用 read_content(doc_id=hit.doc_id, offset=hit.offset, limit=4096) 获取上下文\n3. 整理为结构化综述，每个论点必须标注来源 [doc_id, chunk_id]\n4. 不要编造任何引用，所有信息必须来自 Sciverse 返回`,
    steps: [
      {
        title: "Step 1: 语义检索相关片段",
        desc: "使用 semantic_search 获取与研究问题最相关的文献片段",
        code: { lang: "python", label: "Python", code: `import httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = "sv-..."\n\nasync def search_literature(query: str, top_k: int = 20):\n    async with httpx.AsyncClient() as client:\n        resp = await client.post(\n            f"{BASE}/agentic-search",\n            headers={"Authorization": f"Bearer {TOKEN}"},\n            json={"query": query, "top_k": top_k}\n        )\n        return resp.json()["hits"]\n\nhits = await search_literature(\n    "Transformer applications in protein structure prediction 2020-2024"\n)\nprint(f"Found {len(hits)} relevant chunks")` },
      },
      {
        title: "Step 2: 读取原文上下文",
        desc: "对高分片段调用 read_content 获取更完整的上下文",
        code: { lang: "python", label: "Python", code: `async def read_context(doc_id: str, offset: int = 0, limit: int = 4096):\n    async with httpx.AsyncClient() as client:\n        resp = await client.get(\n            f"{BASE}/content",\n            headers={"Authorization": f"Bearer {TOKEN}"},\n            params={"doc_id": doc_id, "offset": offset, "limit": limit}\n        )\n        return resp.json()\n\n# 对 top 5 高分片段读取上下文\nevidences = []\nfor hit in sorted(hits, key=lambda x: x["score"], reverse=True)[:5]:\n    ctx = await read_context(hit["doc_id"], hit.get("offset", 0))\n    evidences.append({\n        "title": hit["title"],\n        "doc_id": hit["doc_id"],\n        "chunk": hit["chunk"],\n        "context": ctx["text"],\n        "score": hit["score"]\n    })` },
      },
      {
        title: "Step 3: 生成带引用的综述",
        desc: "将证据传给 LLM 生成结构化综述",
        code: { lang: "python", label: "Python", code: `from anthropic import Anthropic\n\nclient = Anthropic()\n\nevidence_text = "\\n\\n".join([\n    f"[{e['doc_id']}] {e['title']}\\n{e['context']}"\n    for e in evidences\n])\n\nmsg = client.messages.create(\n    model="claude-opus-4-7",\n    max_tokens=4096,\n    messages=[{\n        "role": "user",\n        "content": f"""基于以下文献证据，生成一份关于 Transformer 在蛋白质结构预测中应用的综述。\n每个论点必须标注来源 [doc_id]。\n\n{evidence_text}"""\n    }]\n)\nprint(msg.content[0].text)` },
      },
    ],
    notes: [
      "所有引用必须来自 Sciverse 返回的真实 doc_id，不要让 LLM 编造",
      "semantic_search 默认 top_k=10，综述场景建议 top_k=20 以获取更全面的证据",
      "content 接口默认 limit=700，可传入更大值；如需全文请循环调用并拼接",
    ],
    nextSteps: [
      { label: "查看 semantic_search 接口文档", hash: "sciverse/api/agentic-search" },
      { label: "查看 content 接口文档", hash: "sciverse/api/content" },
      { label: "申请 API Token", hash: "auth" },
    ],
  },
  {
    slug: "scientific-rag",
    title: "用 Sciverse 做科学 RAG 数据源",
    subtitle: "将 Sciverse 作为 RAG pipeline 的检索后端，为 LLM 提供可信科学证据",
    tags: ["RAG", "Agent"],
    difficulty: "进阶",
    estimatedCalls: "~5–15 次 API 调用 / 一次 RAG 查询",
    tools: ["agentic-search", "content"],
    pipeline: ["agentic-search", "→ chunks + scores", "→ rerank", "→ answer grounding"],
    scenario: "开发者构建科学问答系统或 RAG 应用，需要从权威学术文献中检索证据来 ground LLM 的回答，避免幻觉。",
    inputExample: `RAG 系统收到用户问题：\n"mRNA 疫苗的脂质纳米颗粒递送系统有哪些最新改进？"`,
    outputExample: `{\n  "answer": "近年来 LNP 递送系统的改进主要集中在...",\n  "citations": [\n    {"doc_id": "lnp_001", "title": "Ionizable lipids for...", "chunk": "...", "score": 0.92},\n    {"doc_id": "lnp_002", "title": "Biodegradable LNP...", "chunk": "...", "score": 0.87}\n  ],\n  "confidence": 0.89\n}`,
    agentPrompt: `你是一个科学 RAG 系统。对于每个用户问题：\n1. 调用 agentic-search 获取相关文献片段\n2. 根据 score 筛选 top 片段作为证据\n3. 基于证据生成回答，每句话标注来源\n4. 如果证据不足以回答，明确告知用户`,
    steps: [
      {
        title: "Step 1: 调用 agentic-search 获取证据",
        desc: "一次调用即可获得经过改写、检索、打分的文献片段",
        code: { lang: "python", label: "Python", code: `import httpx\n\nasync def sciverse_retrieve(query: str, top_k: int = 10):\n    async with httpx.AsyncClient() as client:\n        resp = await client.post(\n            "https://api.sciverse.space/agentic-search",\n            headers={"Authorization": "Bearer sv-..."},\n            json={"query": query, "top_k": top_k, "sub_queries": 2}\n        )\n        data = resp.json()\n        return [\n            {"text": h["chunk"], "doc_id": h["doc_id"],\n             "title": h["title"], "score": h["score"]}\n            for h in data["hits"]\n        ]` },
      },
      {
        title: "Step 2: 证据过滤与 Rerank",
        desc: "按 score 阈值过滤低质量片段，可选接入外部 reranker",
        code: { lang: "python", label: "Python", code: `def filter_and_rerank(hits, threshold=0.6):\n    """过滤低分片段，按 score 降序排列"""\n    filtered = [h for h in hits if h["score"] >= threshold]\n    return sorted(filtered, key=lambda x: x["score"], reverse=True)\n\nhits = await sciverse_retrieve("mRNA LNP delivery improvements")\ntop_evidence = filter_and_rerank(hits, threshold=0.65)\nprint(f"Filtered to {len(top_evidence)} high-quality chunks")` },
      },
      {
        title: "Step 3: 基于证据生成 Grounded Answer",
        desc: "将证据注入 LLM prompt，生成带引用的回答",
        code: { lang: "python", label: "Python", code: `from openai import OpenAI\n\nclient = OpenAI()\n\ncontext = "\\n\\n".join([\n    f"[{i+1}] {e['title']}\\n{e['text']}"\n    for i, e in enumerate(top_evidence[:5])\n])\n\nresp = client.chat.completions.create(\n    model="gpt-4o",\n    messages=[\n        {"role": "system", "content": "基于提供的文献证据回答问题。每个论点用 [编号] 标注来源。如果证据不足，说明无法确定。"},\n        {"role": "user", "content": f"问题：mRNA LNP 递送系统最新改进？\\n\\n证据：\\n{context}"}\n    ]\n)\nprint(resp.choices[0].message.content)` },
      },
    ],
    notes: [
      "sub_queries=2 可让平台自动改写查询，提升召回多样性",
      "score 阈值建议 0.6–0.7，过低会引入噪声，过高可能丢失相关证据",
      "生产环境建议缓存高频查询结果，减少 API 调用",
    ],
    nextSteps: [
      { label: "查看 agentic-search 接口", hash: "sciverse/api/agentic-search" },
      { label: "了解统一鉴权", hash: "auth" },
      { label: "查看调用限制与重试策略", hash: "faq" },
    ],
  },
  {
    slug: "fulltext-evidence",
    title: "用 Sciverse 查找论文全文证据",
    subtitle: "从检索片段出发，定位并读取原文完整段落作为可引用证据",
    tags: ["RAG", "检索"],
    difficulty: "入门",
    estimatedCalls: "~3–8 次 API 调用",
    tools: ["agentic-search", "content"],
    pipeline: ["agentic-search", "→ doc_id", "→ content (offset + limit)", "→ 全文证据"],
    scenario: "Agent 通过 agentic-search 找到了相关片段，但需要更完整的上下文来确认论点或生成精确引用。",
    inputExample: `Agent 已获得 chunk："AlphaFold2 achieves atomic accuracy..."\ndoc_id: "af2_nature_2021"\noffset: 12480`,
    outputExample: `{\n  "content": "## Methods\\n\\nAlphaFold2 achieves atomic accuracy in protein structure prediction through a novel architecture combining...(完整段落 ~2000 字符)",\n  "next_offset": 16576,\n  "more": true\n}`,
    agentPrompt: `当你需要验证或扩展一个文献片段时：\n1. 使用 chunk 中的 doc_id 和 offset\n2. 调用 content 接口读取该位置前后的完整段落\n3. 确认原文是否支持你的论点\n4. 如需更多上下文，使用 next_offset 继续读取`,
    steps: [
      {
        title: "Step 1: 从检索结果获取定位信息",
        desc: "agentic-search 返回的每个 hit 包含 doc_id 和 offset",
        code: { lang: "python", label: "Python", code: `# 假设已有检索结果\nhit = {\n    "doc_id": "af2_nature_2021",\n    "chunk": "AlphaFold2 achieves atomic accuracy...",\n    "offset": 12480,\n    "score": 0.94\n}\n\n# 用 offset 定位原文位置\nprint(f"Will read from doc {hit['doc_id']} at offset {hit['offset']}")` },
      },
      {
        title: "Step 2: 读取完整上下文",
        desc: "调用 content 接口，以 offset 为起点读取原文",
        code: { lang: "python", label: "Python", code: `import httpx\n\nasync def get_fulltext(doc_id: str, offset: int = 0, limit: int = 4096):\n    async with httpx.AsyncClient() as client:\n        resp = await client.get(\n            "https://api.sciverse.space/content",\n            headers={"Authorization": "Bearer sv-..."},\n            params={"doc_id": doc_id, "offset": offset, "limit": limit}\n        )\n        return resp.json()\n\n# 读取 chunk 所在位置的完整上下文\nresult = await get_fulltext(hit["doc_id"], offset=max(0, hit["offset"] - 500), limit=4096)\nprint(result["text"][:200] + "...")\nprint(f"Has more: {result['more']}, next_offset: {result.get('next_offset')}")` },
      },
      {
        title: "Step 3: 迭代读取（可选）",
        desc: "如果需要更多上下文，使用 next_offset 继续",
        code: { lang: "python", label: "Python", code: `# 如果 more=True，可以继续读取\nfull_text = result["text"]\nwhile result.get("more") and len(full_text) < 16000:\n    result = await get_fulltext(\n        hit["doc_id"],\n        offset=result["next_offset"],\n        limit=4096\n    )\n    full_text += result["text"]\n\nprint(f"Total context length: {len(full_text)} chars")` },
      },
    ],
    notes: [
      "offset 是 Unicode 码点数，不是字节数",
      "建议向前偏移 500 字符读取，以获取片段的前文语境",
      "content 默认 limit=700，可传入更大值；如需全文请循环调用",
    ],
    nextSteps: [
      { label: "查看 content 接口文档", hash: "sciverse/api/content" },
      { label: "下载论文图表", hash: "cookbook/download-figures" },
    ],
  },
  {
    slug: "download-figures",
    title: "用 Sciverse 下载论文图表资源",
    subtitle: "从全文 Markdown 中提取图表路径，通过 resource 接口获取二进制文件",
    tags: ["多模态", "检索"],
    difficulty: "入门",
    estimatedCalls: "~3–10 次 API 调用",
    tools: ["content", "resource"],
    pipeline: ["content", "→ markdown 中 ![](path)", "→ resource(path)", "→ 图片二进制"],
    scenario: "用户需要提取论文中的图表（如实验结果图、流程图、表格截图）用于报告、演示或多模态 RAG。",
    inputExample: `content 返回的 Markdown 中包含：\n![Figure 3](dt=af2_nature/p_12/f3.png)\n![Table 2](dt=af2_nature/p_15/t2.png)`,
    outputExample: `成功下载：\n- f3.png (image/png, 245KB) → ./figures/figure3.png\n- t2.png (image/png, 180KB) → ./figures/table2.png`,
    agentPrompt: `当你需要论文中的图表时：\n1. 先调用 content 获取全文 Markdown\n2. 用正则提取所有 ![...](path) 中的 path\n3. 对每个 path 调用 resource 接口下载\n4. 返回图片供用户查看或传给多模态模型分析`,
    steps: [
      {
        title: "Step 1: 从全文中提取图表路径",
        desc: "content 返回的 Markdown 中，图表以标准 Markdown 图片语法引用",
        code: { lang: "python", label: "Python", code: `import re\n\n# 假设已调用 content 接口获得 markdown\nmarkdown_content = result["text"]\n\n# 提取所有图片路径\nfigure_paths = re.findall(r'!\\[.*?\\]\\((.*?)\\)', markdown_content)\nprint(f"Found {len(figure_paths)} figures:")\nfor p in figure_paths:\n    print(f"  {p}")` },
      },
      {
        title: "Step 2: 调用 resource 下载图表",
        desc: "对每个路径调用 resource 接口获取二进制数据",
        code: { lang: "python", label: "Python", code: `import httpx\nfrom pathlib import Path\n\nasync def download_resource(file_name: str, save_dir: str = "./figures"):\n    Path(save_dir).mkdir(exist_ok=True)\n    async with httpx.AsyncClient() as client:\n        resp = await client.get(\n            "https://api.sciverse.space/resource",\n            headers={"Authorization": "Bearer sv-..."},\n            params={"file_name": file_name}\n        )\n        # 保存文件\n        local_name = file_name.split("/")[-1]\n        save_path = f"{save_dir}/{local_name}"\n        Path(save_path).write_bytes(resp.content)\n        return save_path\n\n# 下载所有图表\nfor path in figure_paths:\n    saved = await download_resource(path)\n    print(f"Saved: {saved}")` },
      },
      {
        title: "Step 3: 多模态分析（可选）",
        desc: "将图表传给多模态 LLM 进行分析",
        code: { lang: "python", label: "Python", code: `import base64\nfrom anthropic import Anthropic\n\nclient = Anthropic()\n\n# 读取下载的图片\nwith open("./figures/f3.png", "rb") as f:\n    img_data = base64.b64encode(f.read()).decode()\n\nmsg = client.messages.create(\n    model="claude-opus-4-7",\n    max_tokens=1024,\n    messages=[{\n        "role": "user",\n        "content": [\n            {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": img_data}},\n            {"type": "text", "text": "请描述这张图表的主要发现和结论。"}\n        ]\n    }]\n)\nprint(msg.content[0].text)` },
      },
    ],
    notes: [
      "resource 接口返回原始二进制流，Content-Type 为实际 MIME 类型",
      "图表路径格式为 dt=文献ID/p_页码/f文件名，由 content 接口给出",
      "建议在 Agent 侧缓存已下载的图表，避免重复请求",
    ],
    nextSteps: [
      { label: "查看 resource 接口文档", hash: "sciverse/api/resource" },
      { label: "查看 content 接口文档", hash: "sciverse/api/content" },
    ],
  },
  {
    slug: "structured-paper-filter",
    title: "用 Sciverse 做结构化论文筛选",
    subtitle: "通过 meta-catalog 获取可用字段，用 meta-search 精确过滤论文",
    tags: ["检索", "Agent"],
    difficulty: "进阶",
    estimatedCalls: "~2–5 次 API 调用",
    tools: ["meta-catalog", "meta-search"],
    pipeline: ["meta-catalog", "→ 可用字段 + 算子", "→ meta-search(filters)", "→ 结构化结果"],
    scenario: "用户需要按年份、期刊、作者、学科等条件精确筛选论文，类似学术搜索引擎的高级检索功能。",
    inputExample: `用户需求：\n"帮我找 2022–2024 年发表在 Nature 或 Science 上关于 CRISPR 基因编辑的论文，按引用数排序。"`,
    outputExample: `{\n  "total": 47,\n  "hits": [\n    {"title": "Prime editing for...", "year": 2023, "venue": "Nature", "citations": 892},\n    {"title": "CRISPR-Cas13...", "year": 2022, "venue": "Science", "citations": 654}\n  ]\n}`,
    agentPrompt: `当用户需要按条件筛选论文时：\n1. 先调用 meta-catalog 获取可用字段和算子\n2. 根据用户条件构造 filters 表达式\n3. 调用 meta-search 执行检索\n4. 如果用户条件模糊，先用 meta-catalog 的 sample_values 确认字段值`,
    steps: [
      {
        title: "Step 1: 查询可用字段",
        desc: "meta-catalog 返回所有可过滤、可排序的字段及其算子",
        code: { lang: "python", label: "Python", code: `import httpx\n\nasync def get_catalog():\n    async with httpx.AsyncClient() as client:\n        resp = await client.get(\n            "https://api.sciverse.space/meta-catalog",\n            headers={"Authorization": "Bearer sv-..."}\n        )\n        return resp.json()\n\ncatalog = await get_catalog()\n# 查看可用字段\nfor field in catalog["fields"]:\n    print(f"{field['name']} ({field['type']}) - operators: {field['operators']}")` },
      },
      {
        title: "Step 2: 构造过滤条件并检索",
        desc: "根据 catalog 信息构造 filters，调用 meta-search",
        code: { lang: "python", label: "Python", code: `async def search_papers(query: str, filters: list, sort: str = None, top_k: int = 20):\n    async with httpx.AsyncClient() as client:\n        body = {"query": query, "filters": filters, "page_size": top_k}\n        if sort:\n            body["sort"] = sort\n        resp = await client.post(\n            "https://api.sciverse.space/meta-search",\n            headers={"Authorization": "Bearer sv-..."},\n            json=body\n        )\n        return resp.json()\n\n# 构造过滤条件\nresults = await search_papers(\n    query="CRISPR gene editing",\n    filters=[\n        {"field": "publication_published_year", "operator": "FILTER_OP_GTE", "value": 2022},\n        {"field": "publication_published_year", "operator": "FILTER_OP_LTE", "value": 2024},\n        {"field": "publication_venue_name", "operator": "FILTER_OP_IN", "value": ["Nature", "Science"]}\n    ],\n    sort=[{"field": "citation_count", "order": "SORT_ORDER_DESC"}]\n)\nprint(f"Total: {results['total_count']} papers")\nfor h in results["results"][:5]:\n    print(f"  {h['title']} ({h.get('publication_published_year','')}, {h.get('publication_venue_name','')}, citations: {h.get('citations', 'N/A')})")` },
      },
      {
        title: "Step 3: 结合语义检索深入分析",
        desc: "对筛选结果中感兴趣的论文进一步语义检索",
        code: { lang: "python", label: "Python", code: `# 对 top 论文做语义检索获取关键片段\nfor paper in results["results"][:3]:\n    chunks = await sciverse_retrieve(\n        f"{paper['title']} main contribution methodology"\n    )\n    print(f"\\n{paper['title']}:")\n    for c in chunks[:2]:\n        print(f"  - {c['text'][:100]}...")` },
      },
    ],
    notes: [
      "meta-catalog 建议缓存结果（字段列表变化频率低），避免每次查询都调用",
      "filters 中的字段名和算子必须与 meta-catalog 返回一致",
      "sort 字段前加 - 表示降序（如 -citations 表示引用数从高到低）",
    ],
    nextSteps: [
      { label: "查看 meta-catalog 接口", hash: "sciverse/api/meta-catalog" },
      { label: "查看 meta-search 接口", hash: "sciverse/api/meta-search" },
    ],
  },
  {
    slug: "skill-integration",
    title: "在 Claude / Cursor / Codex 中接入 Sciverse Skill",
    subtitle: "一键安装 Sciverse Agent 工具，让 AI 助手直接调用科学文献检索",
    tags: ["Skill", "Agent"],
    difficulty: "入门",
    estimatedCalls: "~2–5 次工具调用 / 一次对话",
    tools: ["npx skills add", "semantic_search", "read_content", "list_catalog"],
    pipeline: ["安装 Skill", "→ 配置 Token", "→ AI 助手自动调用", "→ 输出带引用的证据"],
    scenario: "开发者希望在日常使用的 AI 编程助手（Claude Code、Cursor、Codex CLI）中直接调用 Sciverse 检索科学文献，无需手动写 API 调用代码。",
    inputExample: `在 Claude Code 中直接提问：\n"帮我查找关于 Graph Neural Networks 在药物发现中应用的最新论文，给出关键发现。"`,
    outputExample: `Claude 自动调用 semantic_search 工具，返回：\n\n## 检索结果\n\n找到 8 篇高相关论文：\n\n1. **"GNN-based molecular property prediction"** (2024, Nature MI)\n   - 关键发现：提出 3D-aware GNN 架构，AUROC 提升 12%...\n   [evidence from Sciverse, score: 0.91]\n\n2. **"Drug-target interaction via attention GNN"** (2023, ICML)\n   - 关键发现：注意力机制显著提升 DTI 预测...\n   [evidence from Sciverse, score: 0.87]`,
    agentPrompt: `（无需手动编写 — Skill 安装后 AI 助手自动获得工具描述）\n\nSciverse Skill 为 AI 助手提供 5 个工具：\n- list_catalog: 查询可用字段\n- search_papers: 结构化论文检索\n- semantic_search: 语义片段检索\n- read_content: 读取原文\n- get_resource: 下载图表`,
    steps: [
      {
        title: "Step 1: 一键安装 Skill",
        desc: "在支持 npx skills 的工具中一行命令完成安装",
        code: { lang: "bash", label: "安装", code: `# 方式 A：官方域名安装（推荐）\nnpx skills add https://sciverse.space\n\n# 方式 B：从 GitHub 源安装\nnpx skills add opendatalab/Sciverse-Agent-Tools --skill sciverse\n\n# 方式 C：OpenClaw 安装\nclawhub install sciverse\n\n# 方式 D：Claude Code Plugin Marketplace\nclaude /plugin marketplace add https://github.com/opendatalab/Sciverse-Agent-Tools\nclaude /plugin install sciverse` },
      },
      {
        title: "Step 2: 配置 API Token",
        desc: "设置环境变量，Skill 会自动读取",
        code: { lang: "bash", label: "配置", code: `# 在 shell 配置文件中添加（~/.bashrc 或 ~/.zshrc）\nexport SCIVERSE_API_TOKEN="sv-your-token-here"\n\n# 或在项目 .env 文件中\nSCIVERSE_API_TOKEN=sv-your-token-here\n\n# 验证安装成功\nnpx skills list | grep sciverse\n# 输出: sciverse (5 tools) - v0.4.3` },
      },
      {
        title: "Step 3: 在 AI 助手中使用",
        desc: "安装后直接在对话中提问，AI 会自动调用 Sciverse 工具",
        code: { lang: "markdown", label: "使用示例", code: `# 在 Claude Code / Cursor / Codex 中直接提问：\n\n> 帮我查找 2023 年以来关于 LLM 幻觉检测的论文\n\nAI 助手会自动：\n1. 调用 semantic_search(query="LLM hallucination detection", top_k=10)\n2. 返回相关论文片段和引用\n3. 如需详情，继续调用 read_content 获取全文\n\n> 用 meta-search 按 Nature 期刊过滤\n\nAI 助手会：\n1. 调用 list_catalog() 确认字段名\n2. 调用 search_papers(filters=[{field:"venue", op:"eq", value:"Nature"}])` },
      },
    ],
    notes: [
      "SCIVERSE_API_TOKEN 环境变量必须设置，否则所有工具调用会返回 401",
      "Skill 安装后对所有支持 MCP 的 AI 助手生效，无需逐个配置",
      "每个工具每日默认 10 次调用限制，需要更多请在 Token 管理页申请",
      "5 种安装方式任选其一即可，推荐 npx skills add 最简单",
    ],
    nextSteps: [
      { label: "查看 Skills 完整文档", hash: "sciverse/skills" },
      { label: "申请 API Token", hash: "auth" },
      { label: "构建文献综述 Agent", hash: "cookbook/literature-review-agent" },
    ],
  },
  {
    slug: "patent-literature-cross",
    title: "用 Sciverse 做专利与文献交叉探索",
    subtitle: "同时检索专利和学术文献，发现技术转化与竞争格局",
    tags: ["专利", "检索", "Agent"],
    difficulty: "进阶",
    estimatedCalls: "~10–20 次 API 调用",
    tools: ["agentic-search", "meta-search", "content"],
    pipeline: ["agentic-search(专利)", "→ meta-search(文献)", "→ 交叉对比", "→ content(全文验证)"],
    scenario: "研发人员或知识产权分析师需要了解某项技术的专利布局与学术研究进展，发现专利与论文之间的关联、技术转化路径和竞争对手布局。",
    inputExample: `用户提问：\n"分析 CRISPR base editing 领域的专利布局与学术研究关联，找出主要专利持有人和对应的学术团队。"`,
    outputExample: `## 专利与文献交叉分析：CRISPR Base Editing\n\n### 专利布局\n| 专利持有人 | 专利数 | 核心技术 |\n|---|---|---|\n| Broad Institute | 12 | ABE/CBE 基础架构 |\n| Beam Therapeutics | 8 | 临床应用优化 |\n\n### 学术关联\n- Broad 专利对应 David Liu 团队 Nature 2016/2017 原创论文\n- Beam 专利基于 Gaudelli et al. 2017 ABE 工作...\n[doc_id: crispr_pat_001, doc_id: liu_nature_2017]`,
    agentPrompt: `你是一个专利与文献交叉分析 Agent。当用户提出技术领域时：\n1. 调用 agentic-search 检索相关专利文献\n2. 调用 meta-search 按年份、作者筛选对应学术论文\n3. 对比专利权利要求与论文核心贡献，找出关联\n4. 调用 content 验证关键技术细节\n5. 输出结构化分析报告，标注所有来源`,
    steps: [
      {
        title: "Step 1: 检索专利文献",
        desc: "使用 agentic-search 获取相关专利片段",
        code: { lang: "python", label: "Python", code: `import httpx\n\nBASE = "https://api.sciverse.space"\nTOKEN = "sv-..."\nHEADERS = {"Authorization": f"Bearer {TOKEN}"}\n\nasync def search_patents(query: str):\n    async with httpx.AsyncClient() as client:\n        resp = await client.post(\n            f"{BASE}/agentic-search",\n            headers=HEADERS,\n            json={"query": f"{query} patent", "top_k": 15}\n        )\n        return resp.json()["hits"]\n\npatent_hits = await search_patents("CRISPR base editing")\nprint(f"Found {len(patent_hits)} patent-related chunks")` },
      },
      {
        title: "Step 2: 检索对应学术文献",
        desc: "用 meta-search 按作者、年份筛选学术论文",
        code: { lang: "python", label: "Python", code: `async def search_academic(query: str, authors: list = None):\n    async with httpx.AsyncClient() as client:\n        filters = []\n        if authors:\n            filters.append({"field": "author", "operator": "FILTER_OP_IN", "value": authors})\n        resp = await client.post(\n            f"{BASE}/meta-search",\n            headers=HEADERS,\n            json={"query": query, "filters": filters, "page_size": 20}\n        )\n        return resp.json()["results"]\n\n# 检索与专利发明人对应的学术论文\nacademic_hits = await search_academic(\n    "CRISPR base editing adenine cytosine",\n    authors=["David Liu", "Nicole Gaudelli"]\n)\nprint(f"Found {len(academic_hits)} academic papers")` },
      },
      {
        title: "Step 3: 交叉分析与报告生成",
        desc: "将专利与文献关联，生成结构化分析",
        code: { lang: "python", label: "Python", code: `from anthropic import Anthropic\n\nclient = Anthropic()\n\npatent_summary = "\\n".join([\n    f"- [{h['doc_id']}] {h['title']}: {h['chunk'][:100]}..."\n    for h in patent_hits[:8]\n])\nacademic_summary = "\\n".join([\n    f"- [{h['doc_id']}] {h['title']} ({h.get('year','')})"\n    for h in academic_hits[:8]\n])\n\nmsg = client.messages.create(\n    model="claude-opus-4-7",\n    max_tokens=4096,\n    messages=[{\n        "role": "user",\n        "content": f"""分析以下专利与学术文献的关联：\n\n专利：\n{patent_summary}\n\n学术论文：\n{academic_summary}\n\n请输出：1) 专利持有人分布 2) 专利-论文关联 3) 技术转化路径"""\n    }]\n)\nprint(msg.content[0].text)` },
      },
    ],
    notes: [
      "Sciverse 数据库同时覆盖专利和学术文献，无需切换数据源",
      "专利文献的 source_type 为 patent，可用于区分检索结果类型",
      "建议先用 meta-catalog 确认专利相关字段（如 patent_assignee、filing_date）",
    ],
    nextSteps: [
      { label: "查看 agentic-search 接口", hash: "sciverse/api/agentic-search" },
      { label: "查看 meta-search 接口", hash: "sciverse/api/meta-search" },
      { label: "结构化论文筛选", hash: "cookbook/structured-paper-filter" },
    ],
  },
  {
    slug: "citation-grounding",
    title: "用 Sciverse 做科学问答的 Citation Grounding",
    subtitle: "为 LLM 回答的每一句话找到可验证的文献来源，消除幻觉",
    tags: ["RAG", "Agent"],
    difficulty: "高级",
    estimatedCalls: "~10–25 次 API 调用",
    tools: ["agentic-search", "content"],
    pipeline: ["LLM 生成草稿", "→ 拆句", "→ agentic-search(逐句)", "→ content(验证)", "→ 标注引用"],
    scenario: "开发者构建高可信度科学问答系统，需要对 LLM 生成的每个论点进行事实核查，找到文献来源或标记为'无法验证'。",
    inputExample: `LLM 生成的草稿回答：\n"mRNA 疫苗使用可电离脂质纳米颗粒(iLNP)包裹 mRNA。其中 MC3 是最广泛使用的可电离脂质。LNP 的粒径通常在 80-100nm。"`,
    outputExample: `{\n  "grounded_answer": "mRNA 疫苗使用可电离脂质纳米颗粒(iLNP)包裹 mRNA [1]。其中 MC3 是最广泛使用的可电离脂质 [2]。LNP 的粒径通常在 80-100nm [1]。",\n  "citations": [\n    {"id": 1, "doc_id": "lnp_review_2021", "title": "Lipid nanoparticles for mRNA delivery", "verified": true},\n    {"id": 2, "doc_id": "mc3_study_2018", "title": "Ionizable lipid MC3 optimization", "verified": true}\n  ],\n  "unverified_claims": []\n}`,
    agentPrompt: `你是一个 Citation Grounding Agent。工作流程：\n1. 接收 LLM 生成的草稿回答\n2. 将草稿拆分为独立论点/句子\n3. 对每个论点调用 agentic-search 查找支持证据\n4. 对高分结果调用 content 验证具体内容\n5. 标注每句话的来源，无法验证的标记为 [unverified]`,
    steps: [
      {
        title: "Step 1: 拆分草稿为独立论点",
        desc: "将 LLM 生成的回答拆分为可独立验证的句子",
        code: { lang: "python", label: "Python", code: `def split_claims(draft: str) -> list[str]:\n    """将草稿拆分为独立论点句子"""\n    sentences = [s.strip() for s in draft.split("。") if s.strip()]\n    # 过滤连接词、过渡句\n    claims = [s for s in sentences if len(s) > 10]\n    return claims\n\ndraft = "mRNA 疫苗使用可电离脂质纳米颗粒(iLNP)包裹 mRNA。其中 MC3 是最广泛使用的可电离脂质。LNP 的粒径通常在 80-100nm。"\nclaims = split_claims(draft)\nprint(f"Split into {len(claims)} claims:")\nfor c in claims:\n    print(f"  - {c}")` },
      },
      {
        title: "Step 2: 逐句检索证据",
        desc: "对每个论点调用 agentic-search 查找支持文献",
        code: { lang: "python", label: "Python", code: `import httpx\n\nasync def verify_claim(claim: str):\n    async with httpx.AsyncClient() as client:\n        resp = await client.post(\n            "https://api.sciverse.space/agentic-search",\n            headers={"Authorization": "Bearer sv-..."},\n            json={"query": claim, "top_k": 5}\n        )\n        hits = resp.json()["hits"]\n        # 判断是否有高分证据支持\n        top_hit = hits[0] if hits else None\n        return {\n            "claim": claim,\n            "verified": top_hit and top_hit["score"] >= 0.7,\n            "evidence": hits[:2] if hits else []\n        }\n\n# 逐句验证\nresults = []\nfor claim in claims:\n    r = await verify_claim(claim)\n    results.append(r)\n    status = "✓" if r["verified"] else "✗"\n    print(f"  {status} {claim[:50]}...")` },
      },
      {
        title: "Step 3: 生成带引用的最终回答",
        desc: "将验证结果组装为带 citation 的最终输出",
        code: { lang: "python", label: "Python", code: `def build_grounded_answer(results: list) -> dict:\n    citations = []\n    grounded_parts = []\n    unverified = []\n\n    for r in results:\n        if r["verified"]:\n            cite_id = len(citations) + 1\n            citations.append({\n                "id": cite_id,\n                "doc_id": r["evidence"][0]["doc_id"],\n                "title": r["evidence"][0]["title"],\n                "verified": True\n            })\n            grounded_parts.append(f"{r['claim']} [{cite_id}]")\n        else:\n            grounded_parts.append(f"{r['claim']} [unverified]")\n            unverified.append(r["claim"])\n\n    return {\n        "grounded_answer": "。".join(grounded_parts) + "。",\n        "citations": citations,\n        "unverified_claims": unverified\n    }\n\nfinal = build_grounded_answer(results)\nprint(final["grounded_answer"])\nprint(f"\\nCitations: {len(final['citations'])}")\nprint(f"Unverified: {len(final['unverified_claims'])}")` },
      },
    ],
    notes: [
      "score 阈值 0.7 是建议值，可根据领域调整；医学领域建议 0.8+",
      "对于 unverified 的论点，建议在最终输出中明确标注或移除",
      "生产环境建议并发验证多个 claims 以提升速度",
      "可结合 content 接口读取原文确认证据准确性",
    ],
    nextSteps: [
      { label: "查看 agentic-search 接口", hash: "sciverse/api/agentic-search" },
      { label: "科学 RAG 数据源", hash: "cookbook/scientific-rag" },
      { label: "全文证据查找", hash: "cookbook/fulltext-evidence" },
    ],
  },
  {
    slug: "multimodal-figure-retrieval",
    title: "用 Sciverse 做多模态图表检索 Demo",
    subtitle: "根据自然语言描述检索论文图表，结合多模态模型分析图表内容",
    tags: ["多模态", "检索", "Agent"],
    difficulty: "高级",
    estimatedCalls: "~8–20 次 API 调用",
    tools: ["agentic-search", "content", "resource"],
    pipeline: ["agentic-search(图表描述)", "→ content(定位图表)", "→ resource(下载)", "→ 多模态分析"],
    scenario: "研究人员需要查找特定类型的论文图表（如'蛋白质结构对比图'、'性能归纳表'），并用多模态模型自动提取图表中的关键信息。",
    inputExample: `用户提问：\n"找一些展示 AlphaFold2 与实验结构对比的图表，帮我分析其中的 GDT-TS 分布。"`,
    outputExample: `## 图表检索结果\n\n找到 3 张相关图表：\n\n### Figure 2 - AlphaFold2 vs Experimental (Nature 2021)\n- GDT-TS 中位数: 92.4\n- 超过 90 的比例: 67%\n- 关键发现: 在单域蛋白上接近实验精度\n\n### Table 3 - CASP14 Results Comparison\n- AlphaFold2 GDT-TS: 92.4 (平均)\n- 第二名: 67.8\n[doc_id: af2_nature, figures: f2.png, t3.png]`,
    agentPrompt: `你是一个多模态图表检索 Agent。工作流程：\n1. 用 agentic-search 检索包含目标图表的文献\n2. 用 content 读取全文，提取图表路径\n3. 用 resource 下载图表图片\n4. 用多模态模型分析图表内容\n5. 返回结构化的图表信息和分析结果`,
    steps: [
      {
        title: "Step 1: 检索包含目标图表的文献",
        desc: "用自然语言描述检索相关文献",
        code: { lang: "python", label: "Python", code: `import httpx\nimport re\n\nBASE = "https://api.sciverse.space"\nHEADERS = {"Authorization": "Bearer sv-..."}\n\nasync def search_figures(description: str):\n    """检索包含特定图表的文献"""\n    async with httpx.AsyncClient() as client:\n        resp = await client.post(\n            f"{BASE}/agentic-search",\n            headers=HEADERS,\n            json={"query": f"figure table {description}", "top_k": 10}\n        )\n        return resp.json()["hits"]\n\nhits = await search_figures("AlphaFold2 experimental structure comparison GDT-TS")\nprint(f"Found {len(hits)} relevant documents")` },
      },
      {
        title: "Step 2: 定位并下载图表",
        desc: "读取全文找到图表路径，调用 resource 下载",
        code: { lang: "python", label: "Python", code: `from pathlib import Path\n\nasync def get_figures_from_doc(doc_id: str):\n    async with httpx.AsyncClient() as client:\n        # 读取全文获取图表路径\n        resp = await client.get(\n            f"{BASE}/content",\n            headers=HEADERS,\n            params={"doc_id": doc_id, "offset": 0, "limit": 4096}\n        )\n        text = resp.json()["text"]\n        # 提取图表路径\n        figure_paths = re.findall(r'!\\[.*?\\]\\((.*?)\\)', text)\n        return figure_paths\n\nasync def download_figure(file_name: str, save_dir: str = "./figures"):\n    Path(save_dir).mkdir(exist_ok=True)\n    async with httpx.AsyncClient() as client:\n        resp = await client.get(\n            f"{BASE}/resource",\n            headers=HEADERS,\n            params={"file_name": file_name}\n        )\n        local = f"{save_dir}/{file_name.split('/')[-1]}"\n        Path(local).write_bytes(resp.content)\n        return local\n\n# 下载 top 文献的图表\nfor hit in hits[:3]:\n    paths = await get_figures_from_doc(hit["doc_id"])\n    for p in paths[:2]:\n        local = await download_figure(p)\n        print(f"Downloaded: {local}")` },
      },
      {
        title: "Step 3: 多模态分析图表内容",
        desc: "用多模态 LLM 提取图表中的关键数据",
        code: { lang: "python", label: "Python", code: `import base64\nfrom anthropic import Anthropic\n\nclient = Anthropic()\n\nasync def analyze_figure(image_path: str, question: str):\n    with open(image_path, "rb") as f:\n        img_data = base64.b64encode(f.read()).decode()\n\n    msg = client.messages.create(\n        model="claude-opus-4-7",\n        max_tokens=2048,\n        messages=[{\n            "role": "user",\n            "content": [\n                {"type": "image", "source": {\n                    "type": "base64",\n                    "media_type": "image/png",\n                    "data": img_data\n                }},\n                {"type": "text", "text": question}\n            ]\n        }]\n    )\n    return msg.content[0].text\n\n# 分析下载的图表\nanalysis = await analyze_figure(\n    "./figures/f2.png",\n    "请描述这张图表中 GDT-TS 分布情况，提取关键数值和结论。"\n)\nprint(analysis)` },
      },
    ],
    notes: [
      "图表检索的关键是在 query 中加入 figure/table 等关键词",
      "resource 接口返回原始分辨率图片，适合多模态分析",
      "建议对图表分析结果做结构化提取（JSON schema）便于下游使用",
      "复杂图表可能需要多轮对话才能完整提取信息",
    ],
    nextSteps: [
      { label: "下载论文图表资源", hash: "cookbook/download-figures" },
      { label: "查看 resource 接口", hash: "sciverse/api/resource" },
      { label: "科学 RAG 数据源", hash: "cookbook/scientific-rag" },
    ],
  },
];
