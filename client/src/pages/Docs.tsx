/*
 * Sciverse · 接入指南 (/docs) — v32
 * 基于「开发者文档编写规范」与负责人最新材料统一重写
 *
 * 信息架构（左侧两层菜单 + URL hash）：
 *   - overview                   概览（三产品 × 接入形态 + 统一鉴权 + 统一错误码 + FAQ 入口）
 *   - auth                       统一鉴权（API Key 体系）
 *   - errors                     统一错误码（网关通用报错）
 *   - faq                        常见问题
 *   - sciverse/overview          Sciverse 产品概览 + 快速开始
 *   - sciverse/api/{endpoint}    Sciverse 五个 REST 接口（agentic-search / content / resource / meta-catalog / meta-search）
 *   - sciverse/cli               Sciverse CLI · SDK（占位，材料未提供）
 *   - sciverse/skills            Sciverse Skills（占位，材料未提供）
 *   - dianshi/overview           点石 产品概览 + 快速开始
 *   - dianshi/api/{endpoint}     点石 三个 REST 接口（inverse-synthesis / rxn-diff / rxn-similar）
 *   - dianshi/skills             点石 MCP Skills（14 个工具）
 *   - seqstudio/overview         SeqStudio 概览 + 快速开始（仅在线访问）
 *
 * 设计原则：
 *   - 内容来自负责人材料原文，不做新增编造；缺失能力（如 SeqStudio API、Sciverse SDK）保留占位说明
 *   - 每个接口页结构对齐规范：概述 / 适用场景 / 鉴权 / 请求 / 参数 / 响应 / 错误码 / 调用限制 / 示例
 *   - 锚点稳定、Heading 语义化，方便 Agent 爬取与 LLM 检索增强
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Cable,
  Terminal,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Atom,
  FlaskConical,
  Dna,
  KeyRound,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Layers,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

// ─── 类型与配置 ────────────────────────────────────────

type ProductKey = "sciverse" | "dianshi" | "seqstudio";

type Param = {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  range?: string;
  desc: string;
};

type RespField = {
  name: string;
  type: string;
  desc: string;
};

type ErrRow = {
  code: string;
  msg: string;
  desc: string;
};

type CodeSample = {
  lang: string;
  label: string;
  code: string;
};

type Endpoint = {
  key: string;             // 子路径 key
  method: "GET" | "POST";
  path: string;            // 完整路径或相对路径
  title: string;
  summary: string;         // 一句话说明
  desc: string;            // 概述段
  useCases?: string[];     // 适用场景
  params?: Param[];        // 请求参数
  paramsTitle?: string;    // 参数表标题（默认"请求参数"）
  paramsNote?: string;     // 参数表上方注释
  response?: RespField[];  // 响应字段
  responseNote?: string;
  responseExample?: string; // JSON 响应示例
  errors?: ErrRow[];        // 接口级错误码
  limits?: { name: string; value: string }[]; // 调用限制
  retry?: string[];         // 重试建议（建议重试 / 不重试）
  samples: CodeSample[];   // 多语言请求示例
  notes?: string[];        // 额外提示（说明、引用规范等）
};

type SkillTool = {
  category: string;
  name: string;
  desc: string;
  latency?: string;
  params?: Param[];
  returns?: string;
  warning?: string;
};

type Product = {
  key: ProductKey;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  brand: string;
  oneLine: string;
  scope: string;
  highlights: string[];
  supports: ("api" | "cli" | "skills" | "online")[];
  intro: {
    coreData?: { name: string; value: string }[];
    capabilities?: string[];
    quickStart?: CodeSample[];
    notes?: string[];
  };
  endpoints?: Endpoint[];          // REST API 列表
  skills?: {
    transport: string;
    endpoint: string;
    auth: string;
    config: CodeSample;
    test?: CodeSample[];
    tools: SkillTool[];
    limits: { name: string; value: string }[];
    errors: { scene: string; status: string; desc: string }[];
  };
  cliPlaceholder?: { title: string; desc: string };
  online?: {
    title: string;
    desc: string;
    url?: string;
    steps?: string[];
    requirements?: { name: string; value: string }[];
    install?: CodeSample;
    runChecks?: CodeSample;
    entries?: { name: string; desc: string }[];
  };
};

// ─── 产品数据（来自负责人材料原文，不做编造）────────────

const SCIVERSE: Product = {
  key: "sciverse",
  name: "Sciverse",
  shortName: "Sciverse",
  icon: Atom,
  brand: "#5B5BF7",
  oneLine: "面向 Agent 的科学文献检索与元数据查询平台",
  scope: "5.16 亿条知识记录 · 814 种语言 · 1.3M+ 期刊与会议",
  highlights: [
    "agentic-search 返回文献片段与可回链定位",
    "meta-search 支持字段级过滤、排序与分面",
    "content / resource 接口可读取原文与附件",
  ],
  supports: ["api", "cli", "skills"],
  intro: {
    coreData: [
      { name: "学术文献", value: "3.41 亿篇" },
      { name: "图书", value: "1.05 亿册" },
      { name: "全球专利", value: "约 7000 万件" },
      { name: "AI-Ready 全文", value: "1.02 亿篇" },
      { name: "语言覆盖", value: "814 种" },
      { name: "期刊 / 会议", value: "1,329,902 个" },
    ],
    capabilities: [
      "agentic-search：基于查询规划的文献片段检索",
      "content：按 doc_id 读取原文文本内容",
      "resource：按相对路径下载附件等二进制资源",
      "meta-catalog：查看元数据字段目录、能力与枚举",
      "meta-search：按字段过滤与排序检索元数据",
    ],
    quickStart: [
      {
        lang: "bash",
        label: "curl",
        code: `curl -X POST https://sciverse.opendatalab.com/api/v1/meta-search \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "graphene battery",
    "page": 1,
    "page_size": 10
  }'`,
      },
      {
        lang: "python",
        label: "Python",
        code: `import requests

resp = requests.post(
    "https://sciverse.opendatalab.com/api/v1/meta-search",
    headers={"Authorization": "Bearer YOUR_API_TOKEN"},
    json={"query": "graphene battery", "page": 1, "page_size": 10},
)
print(resp.json())`,
      },
    ],
    notes: [
      "Sciverse / 点石 / SeqStudio 共用同一套 API Key 体系，一个 Key 即可调用三个产品全部接口。",
      "Token 永久有效，每个账号最多 10 个；请勿提交到 Git 仓库或公开分享。",
    ],
  },
  endpoints: [
    // 由于材料目前主要提供了 meta-search 的完整规范，其余四个仅有路径与一句话说明；
    // 先按"已知字段"完整填充 meta-search，其它接口填占位与一句话说明，待材料补齐后再扩展。
    {
      key: "agentic-search",
      method: "POST",
      path: "/api/v1/agentic-search",
      title: "agentic-search 检索文献并返回片段",
      summary: "传入一段自然语言查询，返回相关文献及可定位的文本片段（chunk）。",
      desc: "agentic-search 面向 LLM Agent 与 RAG 应用，输入一段自然语言查询，平台会自动进行查询规划、检索与片段抽取，返回与查询最相关的文献片段（chunk）及其元信息。",
      useCases: [
        "RAG 应用：为大模型补充含引用的文献证据",
        "Agent 工具调用：让 Agent 直接拿到可引用的文献片段",
      ],
      samples: [
        {
          lang: "bash",
          label: "curl",
          code: `curl -X POST https://sciverse.opendatalab.com/api/v1/agentic-search \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "graphene battery cycle stability"
  }'`,
        },
      ],
      notes: [
        "请求与响应字段详见 Sciverse 团队后续补充的接口规范，本页将随材料更新同步扩展。",
      ],
    },
    {
      key: "content",
      method: "GET",
      path: "/api/v1/content",
      title: "content 按 doc_id 读取原文",
      summary: "按文献 doc_id 读取原文文本内容。",
      desc: "content 接口按 doc_id 读取该文献的原文文本内容，常与 meta-search / agentic-search 命中的 doc_id 配合使用，用于二次摘要、引用核对或长上下文输入。",
      samples: [
        {
          lang: "bash",
          label: "curl",
          code: `curl -G https://sciverse.opendatalab.com/api/v1/content \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  --data-urlencode "doc_id=YOUR_DOC_ID"`,
        },
      ],
      notes: [
        "请求与响应字段详见 Sciverse 团队后续补充的接口规范，本页将随材料更新同步扩展。",
      ],
    },
    {
      key: "resource",
      method: "GET",
      path: "/api/v1/resource",
      title: "resource 按相对路径下载附件",
      summary: "按资源相对路径下载二进制文件（附件流）。",
      desc: "resource 接口用于按资源相对路径下载与文献关联的二进制文件（附件流），例如表格、图片或 PDF。响应为二进制内容，请按文件类型自行处理。",
      samples: [
        {
          lang: "bash",
          label: "curl",
          code: `curl -G https://sciverse.opendatalab.com/api/v1/resource \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  --data-urlencode "path=YOUR_RESOURCE_PATH" \\
  -o resource.bin`,
        },
      ],
      notes: [
        "请求与响应字段详见 Sciverse 团队后续补充的接口规范，本页将随材料更新同步扩展。",
      ],
    },
    {
      key: "meta-catalog",
      method: "GET",
      path: "/api/v1/meta-catalog",
      title: "meta-catalog 查看元数据字段目录",
      summary: "查看元数据字段目录、字段能力和枚举值样本。",
      desc: "meta-catalog 接口返回 meta-search 可用的全部元数据字段、字段能力（过滤、排序、分面等）与典型枚举值样本，是构建过滤器与下拉选项的来源。",
      samples: [
        {
          lang: "bash",
          label: "curl",
          code: `curl -G https://sciverse.opendatalab.com/api/v1/meta-catalog \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
        },
      ],
      notes: [
        "请求与响应字段详见 Sciverse 团队后续补充的接口规范，本页将随材料更新同步扩展。",
      ],
    },
    {
      key: "meta-search",
      method: "POST",
      path: "/api/v1/meta-search",
      title: "meta-search 按字段过滤与排序检索元数据",
      summary: "提供基于自然语言查询、字段过滤、排序与分页的文献元数据检索。",
      desc: "meta-search 接口提供基于自然语言查询的文献元数据检索能力，支持字段过滤、排序与分页。常用于元数据筛选与列表浏览场景。",
      useCases: [
        "按学科 / 年份 / 来源等字段筛选文献",
        "需要排序与分页的检索结果列表",
        "结合 meta-catalog 构建可视化过滤器",
      ],
      paramsTitle: "请求参数",
      paramsNote: "请求体使用 JSON。filters、sort、facets 等字段的取值范围与能力可通过 meta-catalog 接口查询。",
      params: [
        { name: "query", type: "string", required: false, desc: "自然语言查询。" },
        { name: "filters", type: "object", required: false, desc: "字段过滤条件，结构由 meta-catalog 提供。" },
        { name: "sort", type: "array", required: false, desc: "排序字段与方向。" },
        { name: "facets", type: "array", required: false, desc: "需要返回的分面字段。" },
        { name: "page", type: "integer", required: false, default: "1", desc: "页码，从 1 开始。" },
        { name: "page_size", type: "integer", required: false, default: "10", range: "1–100", desc: "每页大小。" },
      ],
      response: [
        { name: "total", type: "integer", desc: "命中结果总数。" },
        { name: "page", type: "integer", desc: "当前页码。" },
        { name: "page_size", type: "integer", desc: "当前页大小。" },
        { name: "items", type: "array", desc: "结果列表，每项为一条文献元数据。" },
        { name: "facets", type: "object", desc: "请求 facets 时返回的分面聚合结果。" },
      ],
      samples: [
        {
          lang: "bash",
          label: "curl",
          code: `curl -X POST https://sciverse.opendatalab.com/api/v1/meta-search \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "graphene battery",
    "filters": {"year": {"gte": 2022}},
    "sort": [{"field": "year", "order": "desc"}],
    "page": 1,
    "page_size": 10
  }'`,
        },
        {
          lang: "python",
          label: "Python",
          code: `import requests

resp = requests.post(
    "https://sciverse.opendatalab.com/api/v1/meta-search",
    headers={"Authorization": "Bearer YOUR_API_TOKEN"},
    json={
        "query": "graphene battery",
        "filters": {"year": {"gte": 2022}},
        "sort": [{"field": "year", "order": "desc"}],
        "page": 1,
        "page_size": 10,
    },
)
print(resp.json())`,
        },
      ],
      notes: [
        "字段名称、可用过滤算子与排序键以 meta-catalog 实时返回为准。",
      ],
    },
  ],
  cliPlaceholder: {
    title: "CLI · SDK",
    desc: "Sciverse 的 CLI 与多语言 SDK 正在跟进中，待对应仓库就绪后将在此补充安装、配置与代码示例。当前请优先使用 REST API 与 Skills 接入方式。",
  },
};

const DIANSHI: Product = {
  key: "dianshi",
  name: "点石 DianShi",
  shortName: "点石",
  icon: FlaskConical,
  brand: "#7C5CFC",
  oneLine: "大规模化学信息检索与逆合成 RAG 平台",
  scope: "6.3M+ 物质 · 6.6M+ 反应组 · 24M+ 反应实例 · 608K+ 专利",
  highlights: [
    "Morgan 指纹逆合成 RAG 检索",
    "差异指纹与结构指纹反应相似度",
    "MCP 14 工具，主流 Agent 装载即用",
  ],
  supports: ["api", "skills"],
  intro: {
    coreData: [
      { name: "专利文献", value: "608,000+ 篇" },
      { name: "化学物质", value: "6,300,000+ 种" },
      { name: "反应组", value: "6,600,000+ 个" },
      { name: "反应实例", value: "24,000,000+ 条" },
    ],
    capabilities: [
      "物质检索：名称 / SMILES / InChIKey / 子结构与 Morgan 相似度",
      "反应检索：SMILES / 产物 / 反应指纹搜索，含条件与产率",
      "文献检索：全文检索专利与论文",
      "逆合成分析：Morgan 指纹 RAG 检索与多步路线规划",
    ],
    quickStart: [
      {
        lang: "bash",
        label: "curl",
        code: `curl -X POST https://dianshi.opendatalab.com/rag/inverse-synthesis \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product_smiles": "CC(=O)Oc1ccccc1C(=O)O",
    "top_k": 3
  }'`,
      },
      {
        lang: "python",
        label: "Python",
        code: `import requests

response = requests.post(
    "https://dianshi.opendatalab.com/rag/inverse-synthesis",
    headers={"Authorization": "Bearer YOUR_API_TOKEN"},
    json={"product_smiles": "CC(=O)Oc1ccccc1C(=O)O", "top_k": 3}
)
print(response.json())`,
      },
    ],
    notes: [
      "点石与 Sciverse、SeqStudio 共用同一套 API Key 鉴权体系，详见统一鉴权章节。",
    ],
  },
  endpoints: [
    {
      key: "inverse-synthesis",
      method: "POST",
      path: "/rag/inverse-synthesis",
      title: "inverse-synthesis 逆合成 RAG 检索",
      summary: "基于 Morgan 分子指纹的逆合成 RAG 检索接口。",
      desc: "输入目标产物的 SMILES，返回数据库中能生成相似产物的已知反应，包含反应物、产率、条件和来源文献。",
      useCases: [
        "逆合成路线探索：给定目标分子，寻找已知的合成路径",
        "RAG 增强生成：为大语言模型提供真实反应数据作为上下文",
        "反应数据库查询：获取特定产物的已知合成方法和实验条件",
      ],
      params: [
        { name: "product_smiles", type: "string", required: true, desc: "目标产物的 SMILES 字符串（非空）。" },
        { name: "top_k", type: "integer", required: false, default: "1", range: "1–500", desc: "返回的最大反应数量。" },
        { name: "substance_top_k", type: "integer", required: false, default: "5", range: "1–50", desc: "相似物质候选数量上限。" },
        { name: "morgan_radius", type: "integer", required: false, default: "2", range: "1–4", desc: "Morgan 指纹半径。" },
        { name: "min_similarity", type: "float", required: false, default: "0.15", range: "0.0–1.0", desc: "最低 Tanimoto 相似度阈值。" },
      ],
      response: [
        { name: "query_id", type: "string", desc: "请求唯一 ID（UUID）。" },
        { name: "status", type: "string", desc: '"success" 或 "error"。' },
        { name: "results", type: "array", desc: "反应结果列表。" },
        { name: "results[].rank", type: "integer", desc: "排序序号。" },
        { name: "results[].reaction_id", type: "string", desc: "反应实例 ID（CUID）。" },
        { name: "results[].product_similarity", type: "float", desc: "产物 Tanimoto 相似度。" },
        { name: "results[].reactants", type: "string", desc: "反应物 SMILES。" },
        { name: "results[].products", type: "string", desc: "产物 SMILES。" },
        { name: "results[].reaction_smiles", type: "string", desc: "完整反应 SMILES。" },
        { name: "results[].canonical_rxn_smiles", type: "string", desc: "标准化反应 SMILES。" },
        { name: "results[].yield_value", type: "float | null", desc: "产率数值（百分比）。" },
        { name: "results[].yield_text", type: "string | null", desc: "产率文本描述。" },
        { name: "results[].conditions", type: "object | null", desc: "反应条件（溶剂、温度等）。" },
        { name: "results[].stages", type: "array | null", desc: "反应阶段信息。" },
        { name: "results[].publication_title", type: "string", desc: "来源文献标题。" },
        { name: "results[].publication_doi", type: "string", desc: "来源文献 DOI。" },
        { name: "result_count", type: "integer", desc: "结果数量。" },
        { name: "execution_time_ms", type: "float", desc: "查询耗时（毫秒）。" },
        { name: "parameters", type: "object", desc: "回显请求参数。" },
        { name: "timestamp", type: "string", desc: "响应时间戳（ISO 8601）。" },
      ],
      responseExample: `{
  "query_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "success",
  "results": [
    {
      "rank": 1,
      "reaction_id": "cm3x7k9a0000108l5a1b2c3d4",
      "product_similarity": 0.8523,
      "reactants": "OC(=O)c1ccccc1O.CC(=O)Cl",
      "products": "CC(=O)Oc1ccccc1C(=O)O",
      "reaction_smiles": "OC(=O)c1ccccc1O.CC(=O)Cl>>CC(=O)Oc1ccccc1C(=O)O",
      "canonical_rxn_smiles": "CC(=O)Cl.OC(=O)c1ccccc1O>>CC(=O)Oc1ccccc1C(=O)O",
      "yield_value": 92.5,
      "yield_text": "92.5%",
      "conditions": {
        "solvent": "dichloromethane",
        "temperature": "0-25 °C",
        "catalyst": "pyridine"
      },
      "publication_title": "Process for preparing acetylsalicylic acid",
      "publication_doi": "US-7234567-B2"
    }
  ],
  "result_count": 1,
  "execution_time_ms": 245.3,
  "timestamp": "2026-05-13T10:30:00Z"
}`,
      errors: [
        { code: "400", msg: "product_smiles 为空或格式不合法", desc: "检查 SMILES 字符串是否有效。" },
      ],
      limits: [
        { name: "请求频率", value: "60 次/分钟（滑动窗口）" },
        { name: "每日调用量", value: "根据账户配额，详见 Token 管理页" },
        { name: "product_smiles 长度", value: "无硬性限制，但过长会导致指纹计算超时" },
        { name: "top_k 最大值", value: "500" },
      ],
      retry: [
        "建议重试：500 / 502 / 503",
        "不应重试：400 / 401 / 429（需等配额重置）",
      ],
      samples: [
        {
          lang: "bash",
          label: "curl",
          code: `curl -X POST https://dianshi.opendatalab.com/rag/inverse-synthesis \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product_smiles": "CC(=O)Oc1ccccc1C(=O)O",
    "top_k": 5,
    "min_similarity": 0.3
  }'`,
        },
        {
          lang: "python",
          label: "Python",
          code: `import requests

response = requests.post(
    "https://dianshi.opendatalab.com/rag/inverse-synthesis",
    headers={"Authorization": "Bearer YOUR_API_TOKEN"},
    json={
        "product_smiles": "CC(=O)Oc1ccccc1C(=O)O",
        "top_k": 5,
        "min_similarity": 0.3,
    },
)
data = response.json()
for r in data["results"]:
    print(f"#{r['rank']} sim={r['product_similarity']:.3f} yield={r['yield_text']} {r['reaction_smiles']}")`,
        },
        {
          lang: "python",
          label: "Python · 重试",
          code: `import time, requests

def call_with_retry(url, headers, payload, max_retries=3):
    for attempt in range(max_retries):
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()
        if response.status_code in [500, 502, 503]:
            time.sleep(2 ** attempt)
            continue
        response.raise_for_status()
    raise Exception("超过最大重试次数")`,
        },
      ],
    },
    {
      key: "rxn-diff",
      method: "POST",
      path: "/rag/rxn-diff",
      title: "rxn-diff 反应差异指纹检索",
      summary: "基于反应差异指纹（Difference Fingerprint）的相似反应检索接口。",
      desc: "输入一条反应 SMILES，找到数据库中具有相似化学转化的反应——即「做了类似的事」的反应。",
      useCases: [
        "发现类似化学转化：找到与目标反应「变化方式」类似的其他反应",
        "反应类型归类：定位属于同一反应类别的反应",
        "RAG 增强：为 LLM 提供相似转化的先例数据",
      ],
      params: [
        { name: "rxn_smiles", type: "string", required: true, desc: "查询反应 SMILES（格式：反应物>>产物，非空）。" },
        { name: "top_k", type: "integer", required: false, default: "20", range: "1–500", desc: "返回最大反应数量。" },
        { name: "min_similarity", type: "float", required: false, default: "0.5", range: "-1.0–1.0", desc: "最低 Tanimoto 相似度阈值。" },
        { name: "fp_type", type: "integer", required: false, default: "3", range: "1 或 3", desc: "指纹类型：1=AtomPair 差异指纹，3=Morgan/ECFP4 差异指纹。" },
      ],
      paramsNote: "指纹类型：3（默认）= Morgan/ECFP4 差异指纹，捕捉环形子结构变化；1 = AtomPair 差异指纹，关注原子连接性。相似度阈值：0.7+ 非常相似，0.5 同一反应类别（推荐），0.3 较宽泛。",
      response: [
        { name: "query_id", type: "string", desc: "请求唯一 ID（UUID）。" },
        { name: "status", type: "string", desc: '"success" 或 "error"。' },
        { name: "results", type: "array", desc: "反应结果列表。" },
        { name: "results[].rank", type: "integer", desc: "排序序号。" },
        { name: "results[].reaction_hash", type: "string", desc: "反应组哈希（SHA-256）。" },
        { name: "results[].similarity", type: "float", desc: "Tanimoto 相似度。" },
        { name: "results[].canonical_rxn_smiles", type: "string", desc: "标准化反应 SMILES。" },
        { name: "results[].instance_count", type: "integer", desc: "该反应在数据库中的实例数量。" },
        { name: "results[].reaction_id", type: "string | null", desc: "代表性反应实例 ID。" },
        { name: "results[].yield_value", type: "float | null", desc: "产率数值。" },
        { name: "results[].conditions", type: "object | null", desc: "反应条件。" },
        { name: "result_count", type: "integer", desc: "结果数量。" },
        { name: "execution_time_ms", type: "float", desc: "查询耗时（毫秒）。" },
        { name: "timestamp", type: "string", desc: "响应时间戳。" },
      ],
      errors: [
        { code: "400", msg: "rxn_smiles 为空或格式不合法", desc: "检查反应 SMILES 格式，需包含 >> 分隔符。" },
      ],
      limits: [
        { name: "请求频率", value: "60 次/分钟（滑动窗口）" },
        { name: "每日调用量", value: "根据账户配额" },
        { name: "响应时间", value: "约 100–300 毫秒（GiST 索引加速）" },
        { name: "top_k 最大值", value: "500" },
      ],
      retry: [
        "建议重试：500 / 502 / 503",
        "不应重试：400 / 401 / 429（需等配额重置）",
      ],
      samples: [
        {
          lang: "bash",
          label: "curl",
          code: `curl -X POST https://dianshi.opendatalab.com/rag/rxn-diff \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "rxn_smiles": "CC(=O)O.CCO>>CC(=O)OCC",
    "top_k": 10,
    "min_similarity": 0.5
  }'`,
        },
        {
          lang: "python",
          label: "Python",
          code: `import requests

response = requests.post(
    "https://dianshi.opendatalab.com/rag/rxn-diff",
    headers={"Authorization": "Bearer YOUR_API_TOKEN"},
    json={
        "rxn_smiles": "CC(=O)O.CCO>>CC(=O)OCC",
        "top_k": 10,
        "min_similarity": 0.5,
    },
)
data = response.json()
for r in data["results"]:
    print(f"#{r['rank']} sim={r['similarity']:.3f} instances={r['instance_count']} {r['canonical_rxn_smiles']}")`,
        },
      ],
    },
    {
      key: "rxn-similar",
      method: "POST",
      path: "/rag/rxn-similar",
      title: "rxn-similar 反应结构指纹检索",
      summary: "基于 AtomPair 结构指纹的相似反应检索接口。",
      desc: "输入一条反应 SMILES，按底物与产物的结构相似性找到相似反应。适合关注底物/产物结构相似性而非转化相似性的场景。",
      params: [
        { name: "rxn_smiles", type: "string", required: true, desc: "查询反应 SMILES（格式：反应物>>产物，非空）。" },
        { name: "top_k", type: "integer", required: false, default: "20", range: "1–500", desc: "返回最大反应数量。" },
        { name: "min_similarity", type: "float", required: false, default: "0.3", range: "0.0–1.0", desc: "最低 Tanimoto 相似度阈值。" },
        { name: "radius", type: "integer", required: false, default: "2", range: "1–4", desc: "AtomPair 最大拓扑距离。" },
      ],
      paramsNote: "相似度阈值：0.6+ 非常相似的底物/产物结构，0.4 明显共享的结构母核，0.2 探索模式覆盖面广。",
      response: [
        { name: "query_id", type: "string", desc: "请求唯一 ID。" },
        { name: "status", type: "string", desc: '"success" 或 "error"。' },
        { name: "results", type: "array", desc: "反应结果列表。" },
        { name: "results[].similarity", type: "float", desc: "Tanimoto 相似度。" },
        { name: "results[].canonical_rxn_smiles", type: "string", desc: "标准化反应 SMILES。" },
        { name: "results[].instance_count", type: "integer", desc: "实例数量。" },
        { name: "results[].yield_value", type: "float | null", desc: "产率数值。" },
        { name: "results[].conditions", type: "object | null", desc: "反应条件。" },
      ],
      errors: [
        { code: "400", msg: "rxn_smiles 为空或格式不合法", desc: "检查反应 SMILES 格式，需包含 >> 分隔符。" },
      ],
      limits: [
        { name: "请求频率", value: "60 次/分钟（滑动窗口）" },
        { name: "每日调用量", value: "根据账户配额" },
        { name: "top_k 最大值", value: "500" },
      ],
      retry: [
        "建议重试：500 / 502 / 503",
        "不应重试：400 / 401 / 429（需等配额重置）",
      ],
      samples: [
        {
          lang: "bash",
          label: "curl",
          code: `curl -X POST https://dianshi.opendatalab.com/rag/rxn-similar \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "rxn_smiles": "c1ccc(Br)cc1.OB(O)c1ccccc1>>c1ccc(-c2ccccc2)cc1",
    "top_k": 10,
    "min_similarity": 0.4
  }'`,
        },
      ],
    },
  ],
  skills: {
    transport: "Streamable HTTP",
    endpoint: "https://dianshi.opendatalab.com/api/mcp",
    auth: "Bearer Token（与 REST API 共用同一 Token）",
    config: {
      lang: "json",
      label: "Claude Desktop / Cursor",
      code: `{
  "mcpServers": {
    "dianshi": {
      "url": "https://dianshi.opendatalab.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}`,
    },
    test: [
      {
        lang: "bash",
        label: "tools/list",
        code: `curl -X POST https://dianshi.opendatalab.com/api/mcp \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'`,
      },
      {
        lang: "bash",
        label: "tools/call",
        code: `curl -X POST https://dianshi.opendatalab.com/api/mcp \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "substance_search",
      "arguments": { "query": "aspirin", "limit": 5 }
    }
  }'`,
      },
    ],
    tools: [
      // 物质
      { category: "物质", name: "substance_get_by_id", desc: "按 ID 获取物质详情。", latency: "~10ms",
        params: [{ name: "substance_id", type: "string", required: true, desc: "物质 ID（CUID 格式）。" }],
        returns: "id · inchi_key · canonical_smiles · molecular_formula · molecular_weight · common_name · iupac_name · synonyms · reference_count · reaction_count" },
      { category: "物质", name: "substance_search", desc: "按名称/SMILES/InChIKey 搜索物质，结果按关联文献数降序。", latency: "~50ms",
        params: [
          { name: "query", type: "string", required: true, desc: "搜索词（名称、SMILES、InChIKey 或同义词）。" },
          { name: "limit", type: "integer", required: false, default: "20", range: "1–100", desc: "最大结果数。" },
          { name: "offset", type: "integer", required: false, default: "0", desc: "分页偏移量。" },
        ],
        returns: "total · limit · offset · items[]（id · inchi_key · canonical_smiles · common_name · molecular_weight · reference_count · reaction_count）" },
      { category: "物质", name: "substance_similarity", desc: "Morgan 指纹 Tanimoto 相似度搜索（GiST KNN 索引，630 万物质）。", latency: "~200ms",
        params: [
          { name: "smiles", type: "string", required: true, desc: "查询分子的 SMILES。" },
          { name: "threshold", type: "float", required: false, default: "0.5", range: "0.0–1.0", desc: "最低 Tanimoto 相似度。" },
          { name: "limit", type: "integer", required: false, default: "20", range: "1–100", desc: "最大结果数。" },
        ],
        returns: "items[]（id · canonical_smiles · common_name · molecular_weight · reference_count · similarity）" },
      { category: "物质", name: "substance_substructure", desc: "子结构搜索，支持 SMILES 和 SMARTS。", latency: "~100ms",
        params: [
          { name: "smiles", type: "string", required: true, desc: "子结构查询（SMILES 或 SMARTS）。" },
          { name: "limit", type: "integer", required: false, default: "20", range: "1–100", desc: "最大结果数。" },
        ],
        returns: "items[]（id · canonical_smiles · common_name · molecular_weight · reference_count）" },

      // 反应
      { category: "反应", name: "reaction_search", desc: "按反应 SMILES 子串搜索反应组，按实例数降序。", latency: "~50ms",
        params: [
          { name: "query", type: "string", required: true, desc: "反应 SMILES 子串。" },
          { name: "limit", type: "integer", required: false, default: "20", range: "1–100", desc: "最大结果数。" },
          { name: "offset", type: "integer", required: false, default: "0", desc: "分页偏移量。" },
        ],
        returns: "total · items[]（reaction_hash · canonical_rxn_smiles · instance_count）" },
      { category: "反应", name: "reaction_get_by_hash", desc: "按反应哈希获取反应组详情及代表实例。", latency: "~20ms",
        params: [{ name: "reaction_hash", type: "string", required: true, desc: "反应组哈希（SHA-256）。" }],
        returns: "reaction_hash · canonical_rxn_smiles · instance_count · reaction_instance[]" },
      { category: "反应", name: "reaction_conditions", desc: "获取指定反应组的聚合条件信息（最多 20 个实例，按产率降序）。", latency: "~30ms",
        params: [{ name: "reaction_hash", type: "string", required: true, desc: "反应组哈希。" }],
        returns: "实例条件、产率与 SOLVENT / CATALYST / REAGENT 角色物质" },
      { category: "反应", name: "reaction_by_product", desc: "基于产物 Morgan 指纹相似度搜索反应。", latency: "~200ms",
        params: [
          { name: "smiles", type: "string", required: true, desc: "目标产物 SMILES。" },
          { name: "threshold", type: "float", required: false, default: "0.5", range: "0.0–1.0", desc: "最低相似度。" },
          { name: "limit", type: "integer", required: false, default: "20", range: "1–100", desc: "最大结果数。" },
        ],
        returns: "items[]（reaction_hash · canonical_rxn_smiles · instance_count · product_sim）" },

      // 反应相似度
      { category: "反应相似度", name: "reaction_similar_struct", desc: "AtomPair 结构指纹反应相似度（4096-bit bfp，GiST KNN）。", latency: "~150ms",
        params: [
          { name: "rxn_smiles", type: "string", required: true, desc: "查询反应 SMILES。" },
          { name: "threshold", type: "float", required: false, default: "0.4", range: "0.0–1.0", desc: "最低相似度。" },
          { name: "limit", type: "integer", required: false, default: "20", range: "1–100", desc: "最大结果数。" },
        ],
        returns: "items[]（reaction_hash · canonical_rxn_smiles · instance_count · similarity）" },
      { category: "反应相似度", name: "reaction_similar_diff_bfp", desc: "AtomPair 差异指纹反应相似度（GiST KNN，速度快）。", latency: "~150ms",
        params: [
          { name: "rxn_smiles", type: "string", required: true, desc: "查询反应 SMILES。" },
          { name: "threshold", type: "float", required: false, default: "0.3", range: "0.0–1.0", desc: "最低相似度。" },
          { name: "limit", type: "integer", required: false, default: "20", range: "1–100", desc: "最大结果数。" },
        ],
        returns: "items[]（reaction_hash · canonical_rxn_smiles · instance_count · similarity）" },
      { category: "反应相似度", name: "reaction_similar_diff_morgan", desc: "Morgan 差异指纹反应相似度（精度最高，全表扫描）。", latency: "~13s",
        warning: "此工具需要全表扫描 660 万条反应，单次查询约 13 秒。如对延迟敏感，优先使用 reaction_similar_diff_bfp。",
        params: [
          { name: "rxn_smiles", type: "string", required: true, desc: "查询反应 SMILES。" },
          { name: "threshold", type: "float", required: false, default: "0.3", range: "-1.0–1.0", desc: "最低相似度（sfp 范围）。" },
          { name: "limit", type: "integer", required: false, default: "20", range: "1–100", desc: "最大结果数。" },
        ],
        returns: "items[]（reaction_hash · canonical_rxn_smiles · instance_count · similarity）" },

      // 文献
      { category: "文献", name: "reference_get_by_id", desc: "按 ID 获取文献详情（标题、DOI、作者、摘要、分类号）。", latency: "~10ms",
        params: [{ name: "reference_id", type: "string", required: true, desc: "文献 ID（CUID 格式）。" }],
        returns: "id · doi · title · type · publish_date · filing_date · kind_code · authors[] · assignees[] · keywords[] · abstract_preview · reaction_count · substance_count" },
      { category: "文献", name: "reference_search", desc: "PostgreSQL 全文检索（tsvector + GIN），按相关度排序。", latency: "~100ms",
        params: [
          { name: "query", type: "string", required: true, desc: "搜索关键词。" },
          { name: "limit", type: "integer", required: false, default: "20", range: "1–100", desc: "最大结果数。" },
          { name: "offset", type: "integer", required: false, default: "0", desc: "分页偏移量。" },
        ],
        returns: "total · items[]（id · doi · title · type · publish_date · abstract_preview · rank）" },

      // 系统
      { category: "系统", name: "health_check", desc: "检查数据库连通性，返回核心表行数。", latency: "~50ms",
        returns: "status（OK）· substance · reaction_group · publication" },
    ],
    limits: [
      { name: "MCP 每分钟调用", value: "20 次（滑动窗口）" },
      { name: "MCP 每日每工具调用", value: "10 次（默认，可按账户调整）" },
      { name: "单次返回上限", value: "100 条" },
      { name: "tools/list 与 initialize", value: "不计入配额" },
    ],
    errors: [
      { scene: "未提供 Token 或 Token 无效", status: "401", desc: "检查 Authorization 头。" },
      { scene: "每日配额耗尽", status: "429", desc: "等待次日配额重置。" },
      { scene: "MCP 服务未启用", status: "503", desc: "联系管理员。" },
      { scene: "工具参数错误", status: "200", desc: "响应 isError=true，检查参数。" },
    ],
  },
};

const SEQSTUDIO: Product = {
  key: "seqstudio",
  name: "SeqStudio",
  shortName: "SeqStudio",
  icon: Dna,
  brand: "#10B981",
  oneLine: "蛋白质功能注释的 AI 推理平台",
  scope: "整合 BLAST · InterProScan · Foldseek · TMHMM 多源证据",
  highlights: [
    "整合序列同源、结构相似、结构域与膜拓扑多源证据",
    "结合 LLM 生成结构化注释、置信度与证据综述",
    "支持 FASTA + PDB 及 UniProt 风格 JSON.gz 批处理",
  ],
  supports: ["online"],
  intro: {
    capabilities: [
      "对未知或低注释质量蛋白进行功能预测",
      "结合序列、结构、结构域、膜拓扑证据综合判断",
      "生成可读的蛋白功能解释与结构化注释结果",
      "批量处理 FASTA + PDB 数据或 UniProt 风格 JSON.gz",
    ],
    notes: [
      "当前 SeqStudio 文档仅覆盖产品概述与快速开始。暂不编写公开 API 接口、限流、错误码和鉴权页面内容；如后续开放 HTTP API，再按照统一接口文档规范补充。",
      "SeqStudio 不是一个纯 Python 包。完整运行通常需要本地生物信息学工具、数据库文件、辅助 JSON 数据以及可选的 LLM HTTP API 配置。",
    ],
  },
  online: {
    title: "在线访问 · 本地部署",
    desc: "当前 SeqStudio 主要以在线访问形式开放使用，支持 FASTA 序列与 PDB 结构上传，生成结构化的蛋白功能注释、置信度与证据综述。同时提供本地部署方式。",
    url: "https://sciverse.opendatalab.com/seqstudio",
    requirements: [
      { name: "Java", value: "11+（供 InterProScan 使用）" },
      { name: "TMHMM", value: "按授权要求安装并加入 PATH" },
      { name: "BLASTDB / FOLDSEEK_DB", value: "需要配置数据库路径" },
      { name: "EXTERNAL_API_KEY", value: "如需 LLM 推理需配置" },
    ],
    install: {
      lang: "bash",
      label: "安装步骤",
      code: `git clone https://github.com/OpenRaiser/SeqStudio.git
cd SeqStudio

conda env create -f environment.yml
conda activate bioanalysis
pip install -r requirements.txt

bash setup.sh`,
    },
    runChecks: {
      lang: "bash",
      label: "环境检查",
      code: `source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate bioanalysis

which python blastp foldseek interproscan.sh tmhmm 2>/dev/null || true
java -version 2>&1 | head -1

echo "BLASTDB=\${BLASTDB:-<unset>}"
echo "FOLDSEEK_DB=\${FOLDSEEK_DB:-<unset>}"

test -f data/raw_data/go.json && echo "go.json OK" || echo "missing go.json"`,
    },
    entries: [
      { name: "FASTA + PDB 单条分析", desc: "上传 FASTA 序列与 PDB 文件，运行整合分析。" },
      { name: "批量分析", desc: "批量处理 FASTA + PDB 或 UniProt 风格 JSON.gz 数据。" },
      { name: "结果导出", desc: "输出 JSON / JSONL，含功能字段、置信度、证据来源与自然语言解释。" },
    ],
  },
};

const PRODUCTS: Product[] = [SCIVERSE, DIANSHI, SEQSTUDIO];

// ─── 统一鉴权 / 统一错误码 / FAQ 数据 ─────────────────

const GATEWAY_ERRORS: ErrRow[] = [
  { code: "400", msg: "请求参数错误", desc: "请求参数缺失、格式不合法或不满足取值范围。检查请求体与字段说明。" },
  { code: "401", msg: "鉴权失败", desc: "Token 缺失、过期或无效。检查 Authorization 头，重新生成 Token 或确认账户状态。" },
  { code: "403", msg: "无权访问", desc: "当前账户无权限调用该资源或接口。" },
  { code: "404", msg: "资源不存在", desc: "请求的资源（doc_id、reaction_hash 等）不存在或已删除。" },
  { code: "429", msg: "请求过于频繁", desc: "触发限流或每日配额耗尽。等待限流窗口结束或次日配额重置。" },
  { code: "500", msg: "服务器内部错误", desc: "网关或服务异常。建议按指数退避策略重试。" },
  { code: "502", msg: "网关错误", desc: "上游服务暂不可用。建议重试。" },
  { code: "503", msg: "服务暂不可用", desc: "服务维护或临时不可用。建议短暂等待后重试。" },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "三个产品的 API Key 是同一个吗？",
    a: "是。Sciverse、点石 DianShi、SeqStudio 共用同一套 API Key 体系，一个 Token 即可调用三个产品全部接口。在 Token 管理页可以查看每个产品的调用量与使用情况。",
  },
  {
    q: "Token 在哪里生成？是否会过期？",
    a: "前往 https://sciverse.opendatalab.com/tokens 创建 Token。Token 创建后仅展示一次，需立即保存。Token 永久有效，每个账号最多 10 个。请勿将 Token 提交到 Git 仓库或公开分享。",
  },
  {
    q: "怎么把这些能力装到 Manus / Claude / Cursor 等 Agent？",
    a: "点石 DianShi 已经按 MCP 协议暴露 14 个工具，按本页「点石 · Skills」章节的配置即可在 Claude Desktop、Cursor、Manus 等支持 MCP 的客户端中装载。Sciverse 与 SeqStudio 的 Skills 形态也会跟随接口能力陆续补齐。",
  },
  {
    q: "调用限制是怎么计的？超额怎么办？",
    a: "REST API 默认 60 次/分钟滑动窗口；MCP Skills 默认 20 次/分钟滑动窗口、单工具每日 10 次。每日配额按账户配置，超额返回 HTTP 429，可在 Token 管理页查看用量，等待限流窗口结束或次日配额重置即可恢复。",
  },
  {
    q: "请求失败时应该如何重试？",
    a: "5xx 类错误（500 / 502 / 503）建议按指数退避策略重试（如 1s / 2s / 4s）。4xx 类错误（400 / 401 / 429）不建议盲目重试：400 应检查参数，401 应检查 Token，429 应等限流窗口结束或次日配额重置。",
  },
  {
    q: "SeqStudio 现在能用 API 调用吗？",
    a: "暂时不开放公开 API。当前 SeqStudio 以在线访问与本地部署形式提供，公开 API 能力会在后续按统一接口规范补充。",
  },
];

// ─── 路由 hash ─────────────────────────────────────────

type Active =
  | { kind: "overview" }
  | { kind: "auth" }
  | { kind: "errors" }
  | { kind: "faq" }
  | { kind: "product"; product: ProductKey; section: "overview" }
  | { kind: "endpoint"; product: ProductKey; endpointKey: string }
  | { kind: "skills"; product: ProductKey }
  | { kind: "cli"; product: ProductKey }
  | { kind: "online"; product: ProductKey };

function parseHash(hash: string): Active {
  const h = hash.replace(/^#/, "");
  if (!h || h === "overview") return { kind: "overview" };
  if (h === "auth") return { kind: "auth" };
  if (h === "errors") return { kind: "errors" };
  if (h === "faq") return { kind: "faq" };
  const parts = h.split("/");
  const p = PRODUCTS.find((x) => x.key === parts[0]);
  if (!p) return { kind: "overview" };
  if (parts.length === 1 || parts[1] === "overview")
    return { kind: "product", product: p.key, section: "overview" };
  if (parts[1] === "api" && parts[2]) {
    const ep = p.endpoints?.find((e) => e.key === parts[2]);
    if (ep) return { kind: "endpoint", product: p.key, endpointKey: ep.key };
  }
  if (parts[1] === "skills" && p.skills) return { kind: "skills", product: p.key };
  if (parts[1] === "cli" && p.cliPlaceholder) return { kind: "cli", product: p.key };
  if (parts[1] === "online" && p.online) return { kind: "online", product: p.key };
  return { kind: "product", product: p.key, section: "overview" };
}

function activeToHash(a: Active): string {
  switch (a.kind) {
    case "overview":
      return "overview";
    case "auth":
      return "auth";
    case "errors":
      return "errors";
    case "faq":
      return "faq";
    case "product":
      return `${a.product}/overview`;
    case "endpoint":
      return `${a.product}/api/${a.endpointKey}`;
    case "skills":
      return `${a.product}/skills`;
    case "cli":
      return `${a.product}/cli`;
    case "online":
      return `${a.product}/online`;
  }
}

// ─── 主组件 ────────────────────────────────────────────

export default function Docs() {
  const [active, setActive] = useState<Active>(() =>
    typeof window !== "undefined" ? parseHash(window.location.hash) : { kind: "overview" },
  );

  useEffect(() => {
    const onHash = () => setActive(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (a: Active) => {
    const h = activeToHash(a);
    if (typeof window !== "undefined") window.location.hash = h;
    setActive(a);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar active="docs" />
      <main className="flex-1 min-w-0 flex">
        <DocsNav active={active} onGo={go} />
        <div className="flex-1 min-w-0">
          <div className="max-w-[920px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
            {active.kind === "overview" && <OverviewPage onGo={go} />}
            {active.kind === "auth" && <AuthPage />}
            {active.kind === "errors" && <ErrorsPage />}
            {active.kind === "faq" && <FaqPage />}
            {active.kind === "product" && <ProductOverviewPage product={getProduct(active.product)} onGo={go} />}
            {active.kind === "endpoint" && (
              <EndpointPage
                product={getProduct(active.product)}
                endpoint={getProduct(active.product).endpoints!.find((e) => e.key === active.endpointKey)!}
              />
            )}
            {active.kind === "skills" && <SkillsPage product={getProduct(active.product)} />}
            {active.kind === "cli" && <CliPlaceholderPage product={getProduct(active.product)} />}
            {active.kind === "online" && <OnlinePage product={getProduct(active.product)} />}
            {active.kind !== "overview" && active.kind !== "auth" && active.kind !== "errors" && active.kind !== "faq" && (
              <KeyBanner />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function getProduct(key: ProductKey) {
  return PRODUCTS.find((p) => p.key === key)!;
}

// ─── 左侧导航 ──────────────────────────────────────────

function DocsNav({ active, onGo }: { active: Active; onGo: (a: Active) => void }) {
  const isProductExpanded = (key: ProductKey) =>
    (active.kind === "product" && active.product === key) ||
    (active.kind === "endpoint" && active.product === key) ||
    (active.kind === "skills" && active.product === key) ||
    (active.kind === "cli" && active.product === key) ||
    (active.kind === "online" && active.product === key);

  return (
    <aside className="hidden lg:block w-[260px] shrink-0 border-r hairline px-5 py-10 sticky top-0 self-start h-screen overflow-y-auto bg-[var(--paper)]">
      <div className="font-display text-[18px] tracking-tight text-[var(--ink)]">接入指南</div>
      <div className="mt-1 text-[12px] text-[var(--ink-3)]">三个产品，一个 Token 通用</div>

      <NavLink label="概览" icon={BookOpen} active={active.kind === "overview"} onClick={() => onGo({ kind: "overview" })} />
      <NavLink label="统一鉴权" icon={ShieldCheck} active={active.kind === "auth"} onClick={() => onGo({ kind: "auth" })} />
      <NavLink label="错误码" icon={AlertTriangle} active={active.kind === "errors"} onClick={() => onGo({ kind: "errors" })} />
      <NavLink label="常见问题" icon={HelpCircle} active={active.kind === "faq"} onClick={() => onGo({ kind: "faq" })} />

      <div className="mt-5 mb-2 px-3 text-[11px] tracking-[0.2em] text-[var(--ink-3)] uppercase">产品</div>
      {PRODUCTS.map((p) => {
        const PIcon = p.icon;
        const expanded = isProductExpanded(p.key);
        return (
          <div key={p.key}>
            <button
              onClick={() => onGo({ kind: "product", product: p.key, section: "overview" })}
              className={cn(
                "w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-[13px] transition-colors",
                expanded
                  ? "text-[var(--ink)] font-medium bg-[var(--ink)]/[0.04]"
                  : "text-[var(--ink-2)] hover:bg-[var(--ink)]/[0.04] hover:text-[var(--ink)]",
              )}>
              <PIcon className="h-3.5 w-3.5 shrink-0" style={{ color: p.brand }} />
              <span className="flex-1 truncate">{p.name}</span>
              {expanded ? <ChevronDown className="h-3.5 w-3.5 opacity-50" /> : <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
            </button>
            {expanded && (
              <div className="ml-7 mt-0.5 space-y-0.5 border-l hairline pl-3">
                <SubNavLink
                  label="概览 · 快速开始"
                  isActive={active.kind === "product" && active.product === p.key}
                  onClick={() => onGo({ kind: "product", product: p.key, section: "overview" })}
                />
                {p.endpoints && p.endpoints.length > 0 && (
                  <div className="mt-1">
                    <div className="px-2.5 py-1 text-[10.5px] tracking-[0.18em] text-[var(--ink-3)] uppercase">API 接口</div>
                    {p.endpoints.map((e) => (
                      <SubNavLink
                        key={e.key}
                        label={e.key}
                        isActive={active.kind === "endpoint" && active.product === p.key && active.endpointKey === e.key}
                        onClick={() => onGo({ kind: "endpoint", product: p.key, endpointKey: e.key })}
                      />
                    ))}
                  </div>
                )}
                {p.skills && (
                  <SubNavLink
                    label="Skills（MCP）"
                    icon={Sparkles}
                    isActive={active.kind === "skills" && active.product === p.key}
                    onClick={() => onGo({ kind: "skills", product: p.key })}
                  />
                )}
                {p.cliPlaceholder && (
                  <SubNavLink
                    label="CLI · SDK"
                    icon={Terminal}
                    isActive={active.kind === "cli" && active.product === p.key}
                    onClick={() => onGo({ kind: "cli", product: p.key })}
                  />
                )}
                {p.online && (
                  <SubNavLink
                    label="在线访问 · 本地部署"
                    icon={Layers}
                    isActive={active.kind === "online" && active.product === p.key}
                    onClick={() => onGo({ kind: "online", product: p.key })}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

function NavLink({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "mt-1.5 w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-[13px] transition-colors",
        active
          ? "bg-[var(--ink)]/[0.06] text-[var(--ink)] font-medium"
          : "text-[var(--ink-2)] hover:bg-[var(--ink)]/[0.04] hover:text-[var(--ink)]",
      )}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">{label}</span>
    </button>
  );
}

function SubNavLink({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors font-mono",
        isActive
          ? "bg-[var(--ink)] text-white"
          : "text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--ink)]/[0.04]",
      )}>
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─── 概览页 ────────────────────────────────────────────

function OverviewPage({ onGo }: { onGo: (a: Active) => void }) {
  return (
    <>
      <PageHeader
        eyebrow="接入指南"
        title="三个产品，按场景接入"
        subtitle={
          <>
            Sciverse 团队对外提供 <strong>Sciverse</strong>、<strong>点石 DianShi</strong>、<strong>SeqStudio</strong> 三类科学能力。三产品共用同一套 API Key 体系，一个 Token 即可调用所有接口与 Skills。
          </>
        }
      />

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRODUCTS.map((p) => {
          const PIcon = p.icon;
          return (
            <div key={p.key} className="card-paper p-5 flex flex-col">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-9 w-9 rounded-xl border hairline grid place-items-center"
                  style={{ background: `${p.brand}10`, color: p.brand }}>
                  <PIcon className="h-4 w-4" />
                </span>
                <div className="font-display text-[18px] text-[var(--ink)] tracking-tight">{p.name}</div>
              </div>
              <p className="mt-2 text-[12.5px] text-[var(--ink-2)] leading-relaxed">{p.oneLine}</p>
              <div className="mt-3 pt-3 border-t hairline">
                <p className="text-[11.5px] text-[var(--ink-3)]">数据范围</p>
                <p className="mt-1 text-[12.5px] text-[var(--ink-2)] line-clamp-2">{p.scope}</p>
              </div>
              <ul className="mt-3 space-y-1">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-1.5 text-[12px] text-[var(--ink-2)]">
                    <span className="h-1.5 w-1.5 rounded-full mt-[6px] shrink-0" style={{ background: p.brand }} />
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t hairline">
                <p className="text-[11.5px] text-[var(--ink-3)] mb-1.5">接入形态</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.supports.includes("api") && <Chip>API 接口</Chip>}
                  {p.supports.includes("skills") && <Chip>Skills（MCP）</Chip>}
                  {p.supports.includes("cli") && <Chip>CLI · SDK</Chip>}
                  {p.supports.includes("online") && <Chip>在线访问</Chip>}
                </div>
                <button
                  onClick={() => onGo({ kind: "product", product: p.key, section: "overview" })}
                  className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-[var(--ink)] hover:opacity-80 transition-opacity">
                  查看接入指南 <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-[22px] text-[var(--ink)]">从哪里开始</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <ShortcutCard icon={ShieldCheck} title="统一鉴权" desc="一个 Token 调用三个产品的全部能力。" onClick={() => onGo({ kind: "auth" })} />
          <ShortcutCard icon={AlertTriangle} title="网关错误码" desc="所有接口共用的网关级错误码定义。" onClick={() => onGo({ kind: "errors" })} />
          <ShortcutCard icon={HelpCircle} title="常见问题" desc="鉴权、配额、重试、Skills 装载等。" onClick={() => onGo({ kind: "faq" })} />
        </div>
      </section>

      <KeyBanner />
    </>
  );
}

// ─── 产品 · 概览页 ────────────────────────────────────

function ProductOverviewPage({ product, onGo }: { product: Product; onGo: (a: Active) => void }) {
  const PIcon = product.icon;
  return (
    <>
      <Breadcrumb items={[{ label: "接入指南" }, { label: product.name, brand: product.brand }, { label: "概览" }]} />
      <div className="mt-3 flex items-center gap-2.5">
        <span
          className="h-10 w-10 rounded-xl border hairline grid place-items-center"
          style={{ background: `${product.brand}10`, color: product.brand }}>
          <PIcon className="h-4 w-4" />
        </span>
        <h1 className="font-display text-[34px] text-[var(--ink)] tracking-[-0.01em]">{product.name}</h1>
      </div>
      <p className="mt-2 text-[14.5px] text-[var(--ink-2)] max-w-[680px] leading-relaxed">{product.oneLine}。{product.scope}</p>

      <section className="mt-8">
        <H2>概述</H2>
        {product.intro.coreData && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {product.intro.coreData.map((d) => (
              <div key={d.name} className="card-paper p-3.5">
                <div className="text-[11.5px] text-[var(--ink-3)]">{d.name}</div>
                <div className="mt-1 font-display text-[20px] text-[var(--ink)] tracking-tight">{d.value}</div>
              </div>
            ))}
          </div>
        )}
        {product.intro.capabilities && (
          <ul className="mt-5 space-y-1.5">
            {product.intro.capabilities.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[13.5px] text-[var(--ink-2)]">
                <span className="h-1.5 w-1.5 rounded-full mt-[8px] shrink-0" style={{ background: product.brand }} />
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {product.intro.quickStart && (
        <section className="mt-10">
          <H2>快速开始</H2>
          <div className="mt-2 text-[13px] text-[var(--ink-2)]">
            前往 <a href="https://sciverse.opendatalab.com/tokens" target="_blank" rel="noreferrer" className="text-[var(--ink)] underline underline-offset-2">Token 管理页</a> 获取 API Token，然后用下面的请求验证调用。
          </div>
          <CodeTabs samples={product.intro.quickStart} />
        </section>
      )}

      <section className="mt-10">
        <H2>接入方式</H2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {product.endpoints && product.endpoints.length > 0 && (
            <MethodLinkCard
              icon={Cable}
              title="API 接口"
              desc={`${product.endpoints.length} 个 REST 接口，HTTP 直接调用。`}
              onClick={() => onGo({ kind: "endpoint", product: product.key, endpointKey: product.endpoints![0].key })}
            />
          )}
          {product.skills && (
            <MethodLinkCard
              icon={Sparkles}
              title="Skills（MCP）"
              desc={`${product.skills.tools.length} 个 MCP 工具，主流 Agent 装载即用。`}
              onClick={() => onGo({ kind: "skills", product: product.key })}
            />
          )}
          {product.cliPlaceholder && (
            <MethodLinkCard
              icon={Terminal}
              title="CLI · SDK"
              desc={product.cliPlaceholder.desc.slice(0, 56) + "…"}
              onClick={() => onGo({ kind: "cli", product: product.key })}
            />
          )}
          {product.online && (
            <MethodLinkCard
              icon={Layers}
              title="在线访问 · 本地部署"
              desc="在线工作台与本地部署两种使用方式。"
              onClick={() => onGo({ kind: "online", product: product.key })}
            />
          )}
        </div>
      </section>

      {product.intro.notes && product.intro.notes.length > 0 && (
        <section className="mt-10">
          <H2>说明</H2>
          <ul className="mt-3 space-y-1.5">
            {product.intro.notes.map((n) => (
              <li key={n} className="text-[13px] text-[var(--ink-2)] leading-relaxed">· {n}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

// ─── 接口详情页 ───────────────────────────────────────

function EndpointPage({ product, endpoint }: { product: Product; endpoint: Endpoint }) {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "接入指南" },
          { label: product.name, brand: product.brand },
          { label: "API 接口" },
          { label: endpoint.key },
        ]}
      />
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[11px] px-2 py-0.5 rounded border hairline bg-[var(--paper-2)] text-[var(--ink-2)]">
          {endpoint.method}
        </span>
        <span className="font-mono text-[12.5px] text-[var(--ink-2)] truncate">{endpoint.path}</span>
      </div>
      <h1 className="mt-2 font-display text-[30px] text-[var(--ink)] tracking-[-0.01em]">{endpoint.title}</h1>
      <p className="mt-2 text-[14px] text-[var(--ink-2)] max-w-[700px] leading-relaxed">{endpoint.summary}</p>

      <Section title="概述">
        <p className="text-[13.5px] text-[var(--ink-2)] leading-relaxed">{endpoint.desc}</p>
      </Section>

      {endpoint.useCases && (
        <Section title="适用场景">
          <ul className="space-y-1.5">
            {endpoint.useCases.map((u) => (
              <li key={u} className="text-[13.5px] text-[var(--ink-2)]">· {u}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="鉴权">
        <p className="text-[13.5px] text-[var(--ink-2)] leading-relaxed">
          统一使用 API Key Bearer Token 鉴权，详见统一鉴权章节。在 HTTP Header 中加入：
        </p>
        <pre className="mt-2 rounded-lg bg-[var(--paper-2)] border hairline px-3 py-2 text-[12.5px] font-mono text-[var(--ink)] overflow-x-auto">
{`Authorization: Bearer YOUR_API_TOKEN`}
        </pre>
      </Section>

      <Section title="请求示例">
        <CodeTabs samples={endpoint.samples} />
      </Section>

      {endpoint.params && (
        <Section title={endpoint.paramsTitle || "请求参数"}>
          {endpoint.paramsNote && <p className="text-[12.5px] text-[var(--ink-2)] mb-3 leading-relaxed">{endpoint.paramsNote}</p>}
          <ParamTable rows={endpoint.params} />
        </Section>
      )}

      {endpoint.response && (
        <Section title="响应结构">
          {endpoint.responseNote && <p className="text-[12.5px] text-[var(--ink-2)] mb-3 leading-relaxed">{endpoint.responseNote}</p>}
          <RespTable rows={endpoint.response} />
        </Section>
      )}

      {endpoint.responseExample && (
        <Section title="响应示例">
          <pre className="rounded-2xl bg-[#16161d] text-white/85 p-4 text-[12px] font-mono overflow-x-auto leading-[1.7]">
{endpoint.responseExample}
          </pre>
        </Section>
      )}

      {endpoint.errors && (
        <Section title="错误码">
          <ErrorTable rows={endpoint.errors} />
          <p className="mt-3 text-[12.5px] text-[var(--ink-3)]">通用错误码请参考「错误码」章节。</p>
        </Section>
      )}

      {endpoint.limits && (
        <Section title="调用限制">
          <LimitTable rows={endpoint.limits} />
        </Section>
      )}

      {endpoint.retry && (
        <Section title="重试建议">
          <ul className="space-y-1.5">
            {endpoint.retry.map((r) => (
              <li key={r} className="text-[13px] text-[var(--ink-2)]">· {r}</li>
            ))}
          </ul>
        </Section>
      )}

      {endpoint.notes && (
        <Section title="说明">
          <ul className="space-y-1.5">
            {endpoint.notes.map((n) => (
              <li key={n} className="text-[13px] text-[var(--ink-2)] leading-relaxed">· {n}</li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

// ─── Skills 页（点石）─────────────────────────────────

function SkillsPage({ product }: { product: Product }) {
  if (!product.skills) return null;
  const s = product.skills;
  const grouped = groupBy(s.tools, (t) => t.category);
  return (
    <>
      <Breadcrumb items={[{ label: "接入指南" }, { label: product.name, brand: product.brand }, { label: "Skills" }]} />
      <h1 className="mt-3 font-display text-[30px] text-[var(--ink)] tracking-[-0.01em]">{product.shortName} · Skills（MCP）</h1>
      <p className="mt-2 text-[14px] text-[var(--ink-2)] max-w-[700px] leading-relaxed">
        点石通过 Model Context Protocol（MCP）向 LLM Agent 暴露 {s.tools.length} 个化学数据库工具，涵盖物质、反应、文献检索与相似度搜索。
      </p>

      <Section title="连接方式">
        <ul className="text-[13.5px] text-[var(--ink-2)] space-y-1.5">
          <li><span className="text-[var(--ink-3)]">传输协议：</span><span className="font-mono">{s.transport}</span></li>
          <li><span className="text-[var(--ink-3)]">端点：</span><span className="font-mono">{s.endpoint}</span></li>
          <li><span className="text-[var(--ink-3)]">鉴权：</span>{s.auth}</li>
        </ul>
      </Section>

      <Section title="客户端配置">
        <CodeTabs samples={[s.config]} />
      </Section>

      {s.test && (
        <Section title="手动测试">
          <CodeTabs samples={s.test} />
        </Section>
      )}

      <Section title="工具总览">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-[var(--ink-3)] border-b hairline">
              <th className="py-2 pr-3 font-medium">类别</th>
              <th className="py-2 pr-3 font-medium">工具名</th>
              <th className="py-2 pr-3 font-medium">说明</th>
              <th className="py-2 font-medium">典型延迟</th>
            </tr>
          </thead>
          <tbody>
            {s.tools.map((t) => (
              <tr key={t.name} className="border-b hairline last:border-0">
                <td className="py-2 pr-3 text-[var(--ink-2)] whitespace-nowrap">{t.category}</td>
                <td className="py-2 pr-3 font-mono text-[var(--ink)] whitespace-nowrap">{t.name}</td>
                <td className="py-2 pr-3 text-[var(--ink-2)]">{t.desc}</td>
                <td className="py-2 font-mono text-[var(--ink-3)] whitespace-nowrap">{t.latency || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {Object.entries(grouped).map(([cat, tools]) => (
        <Section key={cat} title={`${cat}工具`}>
          <div className="space-y-5">
            {tools.map((t) => (
              <div key={t.name} className="card-paper p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="font-mono text-[14px] text-[var(--ink)]">{t.name}</div>
                  {t.latency && <div className="font-mono text-[11.5px] text-[var(--ink-3)]">{t.latency}</div>}
                </div>
                <p className="mt-1.5 text-[13px] text-[var(--ink-2)] leading-relaxed">{t.desc}</p>
                {t.warning && (
                  <div className="mt-2 text-[12.5px] text-[#B95C00] bg-[#FFF6E8] border hairline rounded-lg px-3 py-2">{t.warning}</div>
                )}
                {t.params && t.params.length > 0 && (
                  <div className="mt-3">
                    <ParamTable rows={t.params} dense />
                  </div>
                )}
                {t.returns && (
                  <div className="mt-3 text-[12.5px] text-[var(--ink-2)]">
                    <span className="text-[var(--ink-3)]">返回字段：</span>{t.returns}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      ))}

      <Section title="调用限制">
        <LimitTable rows={s.limits} />
      </Section>

      <Section title="错误响应">
        <pre className="rounded-lg bg-[var(--paper-2)] border hairline px-3 py-2 text-[12px] font-mono text-[var(--ink)] overflow-x-auto">
{`{
  "content": [{ "type": "text", "text": "错误信息" }],
  "isError": true
}`}
        </pre>
        <div className="mt-3">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[var(--ink-3)] border-b hairline">
                <th className="py-2 pr-3 font-medium">场景</th>
                <th className="py-2 pr-3 font-medium">HTTP 状态码</th>
                <th className="py-2 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              {s.errors.map((e) => (
                <tr key={e.scene} className="border-b hairline last:border-0">
                  <td className="py-2 pr-3 text-[var(--ink-2)]">{e.scene}</td>
                  <td className="py-2 pr-3 font-mono text-[var(--ink)] whitespace-nowrap">{e.status}</td>
                  <td className="py-2 text-[var(--ink-2)]">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

// ─── CLI 占位 ─────────────────────────────────────────

function CliPlaceholderPage({ product }: { product: Product }) {
  if (!product.cliPlaceholder) return null;
  return (
    <>
      <Breadcrumb items={[{ label: "接入指南" }, { label: product.name, brand: product.brand }, { label: "CLI · SDK" }]} />
      <h1 className="mt-3 font-display text-[30px] text-[var(--ink)] tracking-[-0.01em]">{product.shortName} · {product.cliPlaceholder.title}</h1>
      <div className="mt-6 card-paper p-5 text-[13.5px] text-[var(--ink-2)] leading-relaxed">
        {product.cliPlaceholder.desc}
      </div>
    </>
  );
}

// ─── SeqStudio · 在线访问 + 本地部署 ─────────────────

function OnlinePage({ product }: { product: Product }) {
  if (!product.online) return null;
  const o = product.online;
  return (
    <>
      <Breadcrumb items={[{ label: "接入指南" }, { label: product.name, brand: product.brand }, { label: "在线访问 · 本地部署" }]} />
      <h1 className="mt-3 font-display text-[30px] text-[var(--ink)] tracking-[-0.01em]">{product.shortName} · {o.title}</h1>
      <p className="mt-2 text-[14px] text-[var(--ink-2)] leading-relaxed max-w-[700px]">{o.desc}</p>

      {o.url && (
        <a
          href={o.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] text-[var(--ink)] hover:opacity-80 transition-opacity">
          打开 SeqStudio 在线工作台 <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      )}

      {o.entries && (
        <Section title="常用入口">
          <ul className="space-y-1.5">
            {o.entries.map((e) => (
              <li key={e.name} className="text-[13.5px] text-[var(--ink-2)]">
                <span className="text-[var(--ink)] font-medium">{e.name}</span>　<span className="text-[var(--ink-3)]">·</span>　{e.desc}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {o.requirements && (
        <Section title="环境要求">
          <table className="w-full text-[13px]">
            <tbody>
              {o.requirements.map((r) => (
                <tr key={r.name} className="border-b hairline last:border-0">
                  <td className="py-2 pr-3 text-[var(--ink-2)] whitespace-nowrap w-[200px]">{r.name}</td>
                  <td className="py-2 text-[var(--ink)]">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {o.install && (
        <Section title="安装步骤">
          <CodeTabs samples={[o.install]} />
        </Section>
      )}

      {o.runChecks && (
        <Section title="环境检查">
          <CodeTabs samples={[o.runChecks]} />
        </Section>
      )}

      {product.intro.notes && (
        <Section title="说明">
          <ul className="space-y-1.5">
            {product.intro.notes.map((n) => (
              <li key={n} className="text-[13px] text-[var(--ink-2)] leading-relaxed">· {n}</li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

// ─── 统一鉴权页 ───────────────────────────────────────

function AuthPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "接入指南" }, { label: "统一鉴权" }]} />
      <PageHeader
        eyebrow="所有接口共用"
        title="统一鉴权"
        subtitle={
          <>
            Sciverse、点石 DianShi、SeqStudio 共用同一套 API Key 体系，<strong>一个 Token 即可调用三个产品的全部接口与 Skills</strong>。
          </>
        }
      />

      <Section title="获取 Token">
        <ol className="text-[13.5px] text-[var(--ink-2)] leading-relaxed space-y-1.5">
          <li>1. 前往 <a className="text-[var(--ink)] underline underline-offset-2" href="https://sciverse.opendatalab.com/tokens" target="_blank" rel="noreferrer">Token 管理页</a></li>
          <li>2. 点击「创建 Token」</li>
          <li>3. 复制 Token（创建后仅显示一次，请立即保存）</li>
        </ol>
        <div className="mt-3 text-[12.5px] text-[var(--ink-3)]">
          Token 永久有效，每个账号最多 10 个。请勿将 Token 提交到 Git 仓库或公开分享。
        </div>
      </Section>

      <Section title="请求头格式">
        <p className="text-[13.5px] text-[var(--ink-2)] leading-relaxed">在所有 API 请求的 HTTP Header 中加入：</p>
        <pre className="mt-2 rounded-lg bg-[var(--paper-2)] border hairline px-3 py-2 text-[12.5px] font-mono text-[var(--ink)] overflow-x-auto">
{`Authorization: Bearer YOUR_API_TOKEN`}
        </pre>
      </Section>

      <Section title="MCP / Skills 装载">
        <p className="text-[13.5px] text-[var(--ink-2)] leading-relaxed">
          在 Claude Desktop、Cursor、Manus 等支持 MCP 的客户端中按下面格式装载（以点石为例）：
        </p>
        <pre className="mt-2 rounded-2xl bg-[#16161d] text-white/85 px-4 py-3 text-[12.5px] font-mono overflow-x-auto leading-[1.7]">
{`{
  "mcpServers": {
    "dianshi": {
      "url": "https://dianshi.opendatalab.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}`}
        </pre>
      </Section>

      <Section title="安全建议">
        <ul className="text-[13px] text-[var(--ink-2)] leading-relaxed space-y-1.5">
          <li>· 仅在受信任的服务端或本地环境保存 Token；不要写入前端代码或公开仓库。</li>
          <li>· 在 CI / 容器中使用环境变量注入 Token，而非硬编码。</li>
          <li>· 定期在 Token 管理页查看用量，发现异常立即注销重建。</li>
        </ul>
      </Section>
    </>
  );
}

// ─── 错误码页 ─────────────────────────────────────────

function ErrorsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "接入指南" }, { label: "错误码" }]} />
      <PageHeader
        eyebrow="网关通用报错"
        title="错误码"
        subtitle="所有接口共用的网关级错误码。各接口可能补充业务级错误码，详见对应接口页。"
      />

      <Section title="HTTP 状态码">
        <ErrorTable rows={GATEWAY_ERRORS} />
      </Section>

      <Section title="错误响应结构">
        <p className="text-[13.5px] text-[var(--ink-2)] leading-relaxed">REST 接口失败时返回 JSON 错误体（示例）：</p>
        <pre className="mt-2 rounded-2xl bg-[#16161d] text-white/85 px-4 py-3 text-[12.5px] font-mono overflow-x-auto leading-[1.7]">
{`{
  "code": "invalid_parameter",
  "message": "product_smiles is required",
  "request_id": "..."
}`}
        </pre>
        <p className="mt-3 text-[12.5px] text-[var(--ink-3)]">
          Skills（MCP）错误响应结构为 <span className="font-mono">{`{ content: [...], isError: true }`}</span>，详见对应 Skills 页。
        </p>
      </Section>

      <Section title="重试建议">
        <ul className="text-[13px] text-[var(--ink-2)] leading-relaxed space-y-1.5">
          <li>· <span className="text-[var(--ink)]">建议重试：</span>500 / 502 / 503，使用指数退避（如 1s / 2s / 4s）。</li>
          <li>· <span className="text-[var(--ink)]">不建议重试：</span>400 / 401 / 403 / 404，应先修复请求或鉴权；429 应等限流窗口结束或次日配额重置。</li>
        </ul>
      </Section>
    </>
  );
}

// ─── FAQ 页 ───────────────────────────────────────────

function FaqPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "接入指南" }, { label: "常见问题" }]} />
      <PageHeader eyebrow="支持" title="常见问题" subtitle="鉴权、配额、错误处理、Skills 装载等场景速查。" />
      <Section>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, idx) => (
            <details key={idx} className="card-paper p-4 group">
              <summary className="flex items-start gap-2.5 cursor-pointer list-none">
                <ChevronRight className="h-4 w-4 mt-0.5 text-[var(--ink-3)] transition-transform group-open:rotate-90 shrink-0" />
                <span className="font-medium text-[14px] text-[var(--ink)]">{item.q}</span>
              </summary>
              <div className="mt-2.5 ml-6 text-[13px] text-[var(--ink-2)] leading-relaxed whitespace-pre-wrap">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </Section>
      <Section>
        <div className="card-paper p-5 flex items-start gap-3">
          <HelpCircle className="h-4 w-4 mt-0.5 text-[var(--ink-3)] shrink-0" />
          <div className="text-[13px] text-[var(--ink-2)] leading-relaxed">
            未在以上覆盖的问题？可在控制台「反馈」处提交，工单将转发至对应产品的负责人。
          </div>
        </div>
      </Section>
    </>
  );
}
// ─── 通用辅助组件 ─────────────────────────────────────
function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <header>
      <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-3)]">{eyebrow}</p>
      <h1 className="mt-2 font-display text-[34px] lg:text-[40px] leading-[1.15] tracking-tight text-[var(--ink)]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 text-[14px] text-[var(--ink-2)] leading-relaxed max-w-[640px]">{subtitle}</p>
      )}
      <div className="mt-5 h-px w-12 bg-[var(--ink)]" />
    </header>
  );
}
function Breadcrumb({ items }: { items: { label: string; onClick?: () => void; brand?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[12px] text-[var(--ink-3)] mb-3">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {it.onClick ? (
            <button onClick={it.onClick} className="hover:text-[var(--ink)] transition-colors">
              {it.label}
            </button>
          ) : (
            <span className={i === items.length - 1 ? "text-[var(--ink-2)]" : ""}>{it.label}</span>
          )}
          {i < items.length - 1 && <span>/</span>}
        </span>
      ))}
    </nav>
  );
}
function Section({ children, id, title }: { children: React.ReactNode; id?: string; title?: string }) {
  return (
    <section id={id} className="mt-10">
      {title && (
        <h2 className="font-display text-[18px] text-[var(--ink)] tracking-tight mb-3">{title}</h2>
      )}
      {children}
    </section>
  );
}
function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="font-display text-[22px] text-[var(--ink)] tracking-tight scroll-mt-24">
      {children}
    </h2>
  );
}
function H3({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3 id={id} className="font-display text-[16px] text-[var(--ink)] tracking-tight scroll-mt-24">
      {children}
    </h3>
  );
}
function Para({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[13.5px] text-[var(--ink-2)] leading-[1.75]">{children}</p>;
}
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md border hairline bg-[var(--paper)] font-mono text-[10.5px] tracking-[0.04em] text-[var(--ink-2)]">
      {children}
    </span>
  );
}
function Tag({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "brand" | "warn" }) {
  const cls =
    tone === "brand"
      ? "border-[var(--brand)]/40 text-[var(--brand)] bg-[var(--brand)]/5"
      : tone === "warn"
      ? "border-amber-400/40 text-amber-700 bg-amber-50"
      : "border-[var(--ink-4)] text-[var(--ink-3)] bg-[var(--paper)]";
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] tracking-wider border", cls)}>
      {children}
    </span>
  );
}
function Note({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  const isWarn = tone === "warn";
  return (
    <div
      className={cn(
        "mt-3 p-3 border-l-2 rounded-r-md text-[13px] leading-relaxed",
        isWarn
          ? "border-amber-400 bg-amber-50 text-amber-900"
          : "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--ink-2)]",
      )}>
      {children}
    </div>
  );
}
function CodeBlock({ samples }: { samples: CodeSample[] }) {
  const [active, setActive] = useState(0);
  const sample = samples[active] ?? samples[0];
  return (
    <div className="mt-3 card-paper overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 border-b hairline bg-[var(--paper-2)]">
        {samples.map((s, i) => (
          <button
            key={s.lang + i}
            onClick={() => setActive(i)}
            className={cn(
              "px-2 py-0.5 rounded text-[11.5px] font-mono tracking-wider transition-colors",
              i === active
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "text-[var(--ink-3)] hover:text-[var(--ink)]",
            )}>
            {s.label}
          </button>
        ))}
      </div>
      <pre className="text-[12.5px] leading-[1.7] font-mono p-4 overflow-x-auto text-[var(--ink-2)]">
        <code>{sample.code}</code>
      </pre>
    </div>
  );
}
function ParamTable({ params, rows, dense: _dense }: { params?: Param[]; rows?: Param[]; dense?: boolean }) {
  const list = (params ?? rows ?? []) as Param[];
  if (!list.length) return <Para>该接口无请求参数。</Para>;
  return <ParamTableInner params={list} />;
}
function ParamTableInner({ params }: { params: Param[] }) {
  if (!params.length) return <Para>该接口无请求参数。</Para>;
  return (
    <div className="mt-3 card-paper overflow-hidden">
      <table className="w-full text-[12.5px]">
        <thead className="bg-[var(--paper-2)] border-b hairline">
          <tr className="text-left text-[var(--ink-3)]">
            <th className="px-3 py-2 font-medium w-[28%]">参数</th>
            <th className="px-3 py-2 font-medium w-[14%]">类型</th>
            <th className="px-3 py-2 font-medium w-[10%]">必填</th>
            <th className="px-3 py-2 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr key={p.name + i} className={cn("align-top", i > 0 && "border-t hairline")}>
              <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--ink)]">{p.name}</td>
              <td className="px-3 py-2.5 font-mono text-[11.5px] text-[var(--ink-2)]">{p.type}</td>
              <td className="px-3 py-2.5">
                {p.required ? (
                  <Tag tone="brand">是</Tag>
                ) : (
                  <Tag>否</Tag>
                )}
              </td>
              <td className="px-3 py-2.5 text-[var(--ink-2)] leading-relaxed">
                {p.desc}
                {(p.default || p.range) && (
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-[var(--ink-3)] font-mono">
                    {p.default && <span>默认 {p.default}</span>}
                    {p.range && <span>范围 {p.range}</span>}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function RespTable({ rows }: { rows: RespField[] }) {
  return (
    <div className="mt-3 card-paper overflow-hidden">
      <table className="w-full text-[12.5px]">
        <thead className="bg-[var(--paper-2)] border-b hairline">
          <tr className="text-left text-[var(--ink-3)]">
            <th className="px-3 py-2 font-medium w-[34%]">字段</th>
            <th className="px-3 py-2 font-medium w-[16%]">类型</th>
            <th className="px-3 py-2 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name + i} className={cn("align-top", i > 0 && "border-t hairline")}>
              <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--ink)]">{r.name}</td>
              <td className="px-3 py-2.5 font-mono text-[11.5px] text-[var(--ink-2)]">{r.type}</td>
              <td className="px-3 py-2.5 text-[var(--ink-2)] leading-relaxed">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ErrorTable({ rows }: { rows: ErrRow[] }) {
  return (
    <div className="mt-3 card-paper overflow-hidden">
      <table className="w-full text-[12.5px]">
        <thead className="bg-[var(--paper-2)] border-b hairline">
          <tr className="text-left text-[var(--ink-3)]">
            <th className="px-3 py-2 font-medium w-[18%]">code</th>
            <th className="px-3 py-2 font-medium w-[28%]">message</th>
            <th className="px-3 py-2 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.code + i} className={cn("align-top", i > 0 && "border-t hairline")}>
              <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--ink)]">{r.code}</td>
              <td className="px-3 py-2.5 font-mono text-[11.5px] text-[var(--ink-2)]">{r.msg}</td>
              <td className="px-3 py-2.5 text-[var(--ink-2)] leading-relaxed">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ShortcutCard({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card-paper p-4 text-left flex items-start gap-3 group transition-all">
      <span className="h-9 w-9 rounded-xl border hairline grid place-items-center text-[var(--ink-2)] group-hover:text-[var(--brand)] group-hover:border-[var(--brand)]/40 transition-colors shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="font-display text-[15px] text-[var(--ink)] tracking-tight block">{title}</span>
        <span className="text-[12.5px] text-[var(--ink-3)] block mt-0.5 leading-relaxed">{desc}</span>
      </span>
      <ArrowRight className="h-4 w-4 mt-1 ml-auto text-[var(--ink-3)] group-hover:text-[var(--brand)] group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}
function KeyBanner() {
  return (
    <section className="mt-14 card-paper p-5 lg:p-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
      <span className="h-10 w-10 rounded-xl border hairline grid place-items-center bg-[var(--brand)]/5 text-[var(--brand)] shrink-0">
        <KeyRound className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[16px] text-[var(--ink)] tracking-tight">还没有 API Key？</p>
        <p className="mt-0.5 text-[12.5px] text-[var(--ink-2)] leading-relaxed">
          登录控制台「密钥」即可创建。<strong>一个 Token 通用于 Sciverse、点石、Skills 全部接口</strong>，免费额度对开发者完全开放。
        </p>
      </div>
      <Link href="/keys">
        <a className="inline-flex items-center gap-1.5 text-[13px] text-[var(--brand)] hover:opacity-80 transition-opacity shrink-0">
          前往控制台 <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </Link>
    </section>
  );
}

// ─── 兼容别名与小组件 ─────────────────────────────────
function CodeTabs(props: { samples: CodeSample[] }) {
  return <CodeBlock samples={props.samples} />;
}
type LimitRow = { item?: string; name?: string; value: string; note?: string };
function LimitTable({ rows }: { rows: LimitRow[] }) {
  if (!rows?.length) return null;
  const list = rows.map((r) => ({ ...r, item: r.item ?? r.name ?? "" }));
  return (
    <div className="mt-3 card-paper overflow-hidden">
      <table className="w-full text-[12.5px]">
        <thead className="bg-[var(--paper-2)] border-b hairline">
          <tr className="text-left text-[var(--ink-3)]">
            <th className="px-3 py-2 font-medium w-[34%]">限制项</th>
            <th className="px-3 py-2 font-medium w-[22%]">值</th>
            <th className="px-3 py-2 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={r.item + i} className={cn("align-top", i > 0 && "border-t hairline")}>
              <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--ink)]">{r.item}</td>
              <td className="px-3 py-2.5 font-mono text-[11.5px] text-[var(--ink-2)]">{r.value}</td>
              <td className="px-3 py-2.5 text-[var(--ink-2)] leading-relaxed">{r.note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function MethodLinkCard({
  method,
  path,
  title,
  desc,
  onClick,
  icon: Icon,
}: {
  method?: "GET" | "POST";
  path?: string;
  title: string;
  desc?: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className="card-paper p-4 text-left flex items-start gap-3 w-full group transition-all">
      {Icon && (
        <span className="h-9 w-9 rounded-xl border hairline grid place-items-center text-[var(--ink-2)] group-hover:text-[var(--brand)] group-hover:border-[var(--brand)]/40 transition-colors shrink-0">
          <Icon className="h-4 w-4" />
        </span>
      )}
      {method && (
        <span className={cn(
          "px-1.5 py-0.5 rounded font-mono text-[10.5px] tracking-wider border shrink-0 mt-0.5",
          method === "GET"
            ? "border-emerald-400/40 text-emerald-700 bg-emerald-50"
            : "border-[var(--brand)]/40 text-[var(--brand)] bg-[var(--brand)]/5",
        )}>
          {method}
        </span>
      )}
      <span className="min-w-0 flex-1">
        {path && (
          <span className="font-mono text-[12.5px] text-[var(--ink)] block truncate">{path}</span>
        )}
        <span className="font-display text-[14px] text-[var(--ink)] tracking-tight block">{title}</span>
        {desc && <span className="text-[12px] text-[var(--ink-3)] block mt-0.5 leading-relaxed">{desc}</span>}
      </span>
      <ArrowRight className="h-4 w-4 mt-1 text-[var(--ink-3)] group-hover:text-[var(--brand)] group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}
function groupBy<T, K extends string>(list: T[], keyFn: (item: T) => K): Record<K, T[]> {
  return list.reduce((acc, item) => {
    const k = keyFn(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}
