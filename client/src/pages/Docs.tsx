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
import { useEffect, useMemo, useRef, useState } from "react";
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
  Github,
  Package,
  Boxes,
  Terminal as TerminalIcon,
  Zap,
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
  group?: string;
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
  scopeNumbers?: string;
  supports: ("api" | "cli" | "skills" | "online")[];
  intro: {
    coreData?: { name: string; value: string }[];
    capabilities?: string[];
    quickStart?: CodeSample[];
    notes?: string[];
  };
  repo?: {
    name: string;            // 包名 / 仓库名
    title: string;           // 仓库标题
    version: string;         // 当前版本
    baseUrl: string;         // 仓库默认 base URL
    url?: string;            // GitHub / GitLab 地址
    status: "stable" | "beta" | "preview"; // 状态
    description: string;     // 一句话介绍
    changelog?: { version: string; date: string; notes: string[] }[];
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
  applyForAccess?: {
    title: string;
    desc: string;
    formUrl: string;
    formLabel: string;
  };
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

// ─── Sciverse 接口数据（贴合开发者文档 docx 字段表） ────────
const SCIVERSE_BASE = "https://api.sciverse.space";

const SCIVERSE_ENDPOINTS: Endpoint[] = [
  {
    key: "agentic-search",
    method: "POST",
    path: "/agentic-search",
    title: "agentic-search 智能检索与片段返回",
    summary: "传入一句自然语言问题，返回可引用的文献片段（chunk）与元信息。",
    desc: "agentic-search 面向 LLM Agent 与 RAG 场景，平台会自动对 query 进行查询改写、检索与片段抽取，返回与问题最相关的 chunk、原文定位（page_no / offset）、所属文献与摸底打分。",
    useCases: [
      "RAG 应用：为 LLM 补充含引用的文献证据",
      "Agent 工具调用：一屏拿到可回链的片段与原文位置",
      "问答系统：结合文献原文与片段生成带出处的回答",
    ],
    paramsTitle: "请求体（JSON）",
    params: [
      { name: "query", type: "string", required: true, desc: "你的检索问题；不能为空。", range: "最大 400 字符" },
      { name: "top_k", type: "integer", required: false, default: "10", range: "1–150", desc: "返回片段数量。" },
      { name: "sub_queries", type: "integer", required: false, default: "0", range: "0–4", desc: "查询改写数量，0 表示不改写。" },
    ],
    response: [
      { name: "hits", type: "array", desc: "命中片段列表。" },
      { name: "hits[].chunk_id", type: "string", desc: "片段 ID。" },
      { name: "hits[].chunk", type: "string", desc: "片段文本内容。" },
      { name: "hits[].doc_id", type: "string", desc: "所属文献 ID，可传给 /content 读取原文。" },
      { name: "hits[].title", type: "string", desc: "文献标题。" },
      { name: "hits[].abstract", type: "string", desc: "文献摘要。" },
      { name: "hits[].score", type: "float", desc: "相关度得分。" },
      { name: "hits[].source_type", type: "string", desc: "pdf / web 等来源类型。" },
      { name: "hits[].offset", type: "integer", desc: "片段在原文中的字符偏移（Unicode 码点数）。" },
      { name: "hits[].page_no", type: "integer", desc: "原文页码（仅 pdf 类有）。" },
      { name: "hits[].model_name", type: "string", desc: "用于打分的模型名。" },
      { name: "hits[].model_version", type: "string", desc: "模型版本。" },
    ],
    errors: [
      { code: "400", msg: "INVALID_REQUEST", desc: "请求参数错误，检查 query / top_k 等取值。" },
      { code: "401", msg: "UNAUTHORIZED", desc: "鉴权失败，检查 Authorization 请求头。" },
      { code: "429", msg: "RATE_LIMITED", desc: "触发限流或配额耗尽，等窗口恢复后重试。" },
      { code: "500", msg: "INTERNAL_ERROR", desc: "服务错误，指数退避重试。" },
      { code: "502/503", msg: "UPSTREAM_UNAVAILABLE", desc: "服务暂不可用，指数退避重试。" },
    ],
    limits: [
      { name: "query 长度", value: "≤ 400 字符" },
      { name: "top_k 上限", value: "150" },
      { name: "默认限流", value: "60 次 / 分钟" },
    ],
    retry: [
      "建议重试：500 / 502 / 503",
      "不应重试：400 / 401；429 请等窗口恢复",
    ],
    samples: [
      {
        lang: "bash",
        label: "curl",
        code: `curl -X POST https://api.sciverse.space/agentic-search \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "graphene battery cycle stability",
    "top_k": 10
  }'`,
      },
      {
        lang: "python",
        label: "Python",
        code: `import requests

resp = requests.post(
    "https://api.sciverse.space/agentic-search",
    headers={"Authorization": "Bearer YOUR_API_TOKEN"},
    json={"query": "graphene battery cycle stability", "top_k": 10},
)
print(resp.json())`,
      },
    ],
    responseExample: `{
  "hits": [
    {
      "chunk_id": "c_8c1f...",
      "chunk": "Graphene-based cathodes exhibit improved cycle stability ...",
      "doc_id": "d_2a91...",
      "title": "Cycle stability of graphene composite cathodes",
      "abstract": "...",
      "score": 0.873,
      "source_type": "pdf",
      "offset": 18432,
      "page_no": 4,
      "model_name": "sciverse-retriever",
      "model_version": "v2.3"
    }
  ]
}`,
  },
  {
    key: "content",
    method: "GET",
    path: "/content",
    title: "content 按 doc_id 读取原文",
    summary: "按 doc_id 读取文献原文文本内容，支持分段读取。",
    desc: "content 接口按 doc_id 读取该文献的原文文本（Markdown / 纯文本）。支持 offset / limit 分段拉取以适配长上下文场景，默认返回全文。",
    useCases: [
      "以 agentic-search 返回的 doc_id 拉取原文打二次摘要",
      "分段读取超长文献以避免超出上下文窗口",
      "根据 next_offset / more 完成多轮流式读取",
    ],
    paramsTitle: "请求参数（URL query）",
    params: [
      { name: "doc_id", type: "string", required: true, desc: "文献 ID（由 agentic-search / meta-search 返回）。" },
      { name: "offset", type: "integer", required: false, range: "≥ 0", desc: "字符偏移（Unicode 码点数）；未传时返回全文。" },
      { name: "limit", type: "integer", required: false, default: "700", desc: "单次最大字符数（Unicode 码点数），默认 700；仅在传入 offset 时生效。" },
    ],
    response: [
      { name: "text", type: "string", desc: "文本内容（Markdown 或纯文本）。" },
      { name: "chars_returned", type: "integer", desc: "本次返回的字符数（Unicode 码点数）。" },
      { name: "next_offset", type: "integer", desc: "下一段读取的字符偏移。" },
      { name: "more", type: "bool", desc: "是否还有更多内容。" },
    ],
    errors: [
      { code: "400", msg: "INVALID_REQUEST", desc: "doc_id 缺失或参数非法。" },
      { code: "401", msg: "UNAUTHORIZED", desc: "鉴权失败。" },
      { code: "404", msg: "NOT_FOUND", desc: "文档不存在。" },
      { code: "405", msg: "METHOD_NOT_ALLOWED", desc: "仅支持 GET。" },
      { code: "429", msg: "RATE_LIMITED", desc: "触发限流。" },
      { code: "502/503", msg: "UPSTREAM_UNAVAILABLE", desc: "服务暂不可用。" },
    ],
    limits: [
      { name: "offset", value: "字符偏移（Unicode 码点数）；未传时返回全文" },
      { name: "limit", value: "单次最大字符数（Unicode 码点数），默认 700；仅在传入 offset 时生效" },
    ],
    retry: [
      "建议重试：502 / 503",
      "不应重试：400 / 401 / 405",
    ],
    samples: [
      {
        lang: "bash",
        label: "curl",
        code: `curl -G https://api.sciverse.space/content \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  --data-urlencode "doc_id=YOUR_DOC_ID" \\
  --data-urlencode "offset=0" \\
  --data-urlencode "limit=700"`,
      },
      {
        lang: "python",
        label: "Python 流式拉取",
        code: `import requests

base = "https://api.sciverse.space/content"
headers = {"Authorization": "Bearer YOUR_API_TOKEN"}
offset, parts = 0, []
while True:
    r = requests.get(base, headers=headers,
                     params={"doc_id": "YOUR_DOC_ID", "offset": offset, "limit": 700}).json()
    parts.append(r["text"])
    if not r.get("more"):
        break
    offset = r["next_offset"]
print("".join(parts))`,
      },
    ],
  },
  {
    key: "resource",
    method: "GET",
    path: "/resource",
    title: "resource 按相对路径下载附件",
    summary: "按资源相对路径下载与文献关联的二进制文件。",
    desc: "resource 接口用于拉取文献相关的二进制附件（图片 / 表格 / PDF 等）。响应为二进制流，带 Content-Type 与 Content-Disposition，以及跟踪用 X-Request-ID。",
    paramsTitle: "请求参数（URL query）",
    params: [
      { name: "file_name", type: "string", required: true, desc: "资源相对路径；不得包含 \\、..，且不得以 / 开头。" },
    ],
    responseNote: "响应为二进制流；常见 Content-Type：image/jpeg、image/png、application/pdf 等。",
    response: [
      { name: "Content-Type", type: "header", desc: "附件的 MIME 类型。" },
      { name: "Content-Disposition", type: "header", desc: "文件名与下载提示。" },
      { name: "X-Request-ID", type: "header", desc: "请求追踪 ID。" },
      { name: "body", type: "binary", desc: "附件原始二进制内容。" },
    ],
    errors: [
      { code: "400", msg: "INVALID_REQUEST", desc: "file_name 缺失或路径非法。" },
      { code: "401", msg: "UNAUTHORIZED", desc: "鉴权失败。" },
      { code: "404", msg: "NOT_FOUND", desc: "资源不存在。" },
      { code: "429", msg: "RATE_LIMITED", desc: "限流。" },
      { code: "500/502/503", msg: "UPSTREAM_UNAVAILABLE", desc: "服务异常。" },
    ],
    limits: [
      { name: "默认限流", value: "60 次 / 分钟" },
      { name: "路径限制", value: "不得包含 \\、..，且不得以 / 开头" },
    ],
    retry: [
      "建议重试：500 / 502 / 503",
      "不应重试：400 / 401",
    ],
    samples: [
      {
        lang: "bash",
        label: "curl",
        code: `curl -G https://api.sciverse.space/resource \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  --data-urlencode "file_name=papers/2025/abcd/fig1.png" \\
  -o fig1.png`,
      },
    ],
  },
  {
    key: "meta-catalog",
    method: "GET",
    path: "/meta-catalog",
    title: "meta-catalog 查看元数据字段目录",
    summary: "返回 meta-search 可用全部字段、字段能力与枚举样本，用于动态构造过滤器。",
    desc: "meta-catalog 返回 meta-search 可用的全部字段及其能力（可过滤 / 可排序 / 可检索）、默认返回字段集合、全局支持的过滤算子，以及选择是否返回枚举样本值。推荐在运行期实时读取，勿硬编码字段名。",
    paramsTitle: "请求参数（URL query）",
    params: [
      { name: "include_sample_values", type: "bool", required: false, default: "false", desc: "是否返回枚举字段的样本值（OpenSearch terms aggregation，24h 缓存）。" },
    ],
    response: [
      { name: "fields", type: "array", desc: "字段列表。" },
      { name: "fields[].name", type: "string", desc: "字段名。" },
      { name: "fields[].type", type: "string", desc: "类型：String / Integer / Float / List[...]。" },
      { name: "fields[].filterable", type: "bool", desc: "是否可作为 filters 字段。" },
      { name: "fields[].sortable", type: "bool", desc: "是否可排序。" },
      { name: "fields[].searchable", type: "bool", desc: "是否可被全文检索。" },
      { name: "fields[].default_returned", type: "bool", desc: "是否为默认返回字段。" },
      { name: "fields[].description", type: "string", desc: "字段说明。" },
      { name: "fields[].sample_values", type: "array", desc: "枚举样本值，仅在 include_sample_values=true 时返回。" },
      { name: "fields[].operators", type: "array", desc: "该字段支持的算子；Integer/Float 通常全集，List 类型多为 IN/NIN/CONTAINS，不可过滤字段为空数组。" },
      { name: "default_fields", type: "array", desc: "默认返回的字段集合。" },
      { name: "filter_operators", type: "array", desc: "全局支持的过滤算子：EQ / NE / GT / GTE / LT / LTE / IN / NIN / CONTAINS。" },
    ],
    errors: [
      { code: "401", msg: "UNAUTHORIZED", desc: "鉴权失败。" },
      { code: "429", msg: "RATE_LIMITED", desc: "限流。" },
      { code: "502", msg: "UPSTREAM_UNAVAILABLE", desc: "服务异常。" },
      { code: "503", msg: "METADATA_GRPC_NOT_CONFIGURED / UPSTREAM_ERROR", desc: "元数据 gRPC 未配置或上游错误。" },
    ],
    limits: [
      { name: "样本值默认", value: "默认不拉取，需 include_sample_values=true" },
      { name: "doc_id", value: "始终可见" },
      { name: "默认限流", value: "60 次 / 分钟" },
    ],
    retry: [
      "建议重试：502 / 503 / 504",
      "不应重试：401",
    ],
    samples: [
      {
        lang: "bash",
        label: "curl",
        code: `curl -G https://api.sciverse.space/meta-catalog \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  --data-urlencode "include_sample_values=true"`,
      },
    ],
  },
  {
    key: "meta-search",
    method: "POST",
    path: "/meta-search",
    title: "meta-search 按字段过滤与排序检索元数据",
    summary: "支持全文模糊检索、多维 filters / sort 与分页 / 游标翻页的文献元数据检索。",
    desc: "meta-search 提供基于字段的检索与检索质量控制。你可以不传 query 仅以 filters / sort 进行精准检索；也可以传入 query 进行全文模糊检索（此时不能同时使用 sort，由相关性接管排序）。为了性能，深翻页必须使用 cursor 而非 page。",
    useCases: [
      "按学科 / 年份 / 期刊 / 语言等字段筛选文献列表",
      "结合 meta-catalog 动态生成 UI 过滤器",
      "需要跨页检索的场景，使用 cursor 翻页",
    ],
    paramsTitle: "请求体（JSON）",
    paramsNote: "FilterItem：{ field, operator?, value }，operator 默认 EQ，可选值 FILTER_OP_EQ/NE/GT/GTE/LT/LTE/IN/NIN/CONTAINS。SortItem：{ field, order }，order 默认 SORT_ORDER_DESC。",
    params: [
      { name: "query", type: "string", required: false, desc: "全文模糊检索词；与 sort 不能同时使用。" },
      { name: "filters", type: "array<FilterItem>", required: false, desc: "字段过滤条件列表。" },
      { name: "sort", type: "array<SortItem>", required: false, desc: "排序字段集合。可排序字段：publication_published_year / reference_count / citation_count / influential_citation_count / fwci。" },
      { name: "fields", type: "array<string>", required: false, desc: "字段投影。doc_id 始终返回。" },
      { name: "page", type: "integer", required: false, default: "1", range: "≥ 1", desc: "页码。" },
      { name: "page_size", type: "integer", required: false, default: "25", range: "1–200", desc: "每页条数。" },
      { name: "cursor", type: "string", required: false, desc: "游标翻页令牌；与 page>1 互斥。" },
    ],
    response: [
      { name: "results", type: "array", desc: "命中记录；doc_id 总会返回，其余字段受 fields 与 Token 权限影响。" },
      { name: "results[].doc_id", type: "string", desc: "文献 ID。" },
      { name: "results[].title", type: "string", desc: "标题。" },
      { name: "results[].doi", type: "string", desc: "DOI。" },
      { name: "results[].author", type: "array", desc: "作者列表。" },
      { name: "results[].abstract", type: "string", desc: "摘要。" },
      { name: "results[].language", type: "string", desc: "语言。" },
      { name: "results[].publication_published_year", type: "integer", desc: "发表年份。" },
      { name: "results[].publication_venue_name", type: "string", desc: "期刊 / 会议名。" },
      { name: "results[].publication_id", type: "string", desc: "期刊 ID。" },
      { name: "results[].metadata_type", type: "string", desc: "文献类型。" },
      { name: "results[].indexed_in", type: "array", desc: "被哪些数据库收录。" },
      { name: "results[].access_oa_status", type: "string", desc: "开放访问状态。" },
      { name: "results[].access_xinghe_repository_page_cnt", type: "integer", desc: "星河仓储页数。" },
      { name: "results[].keywords", type: "array", desc: "关键词。" },
      { name: "results[].citation_count", type: "integer", desc: "被引用次数。" },
      { name: "results[].influential_citation_count", type: "integer", desc: "重要被引用次数。" },
      { name: "results[].reference_count", type: "integer", desc: "参考文献数。" },
      { name: "results[].fwci", type: "float", desc: "领域加权引用指数。" },
      { name: "total_count", type: "integer", desc: "命中总数。" },
      { name: "page", type: "integer", desc: "当前页。" },
      { name: "page_size", type: "integer", desc: "每页条数。" },
      { name: "total_pages", type: "integer", desc: "总页数。" },
      { name: "search_time_ms", type: "float", desc: "检索耗时（毫秒）。" },
      { name: "next_cursor", type: "string", desc: "下一段 cursor（深翻页用）。" },
    ],
    errors: [
      { code: "400", msg: "INVALID_REQUEST / INVALID_ARGUMENT", desc: "参数错误，含 query/sort 冲突、cursor/page 互斥。" },
      { code: "401", msg: "UNAUTHORIZED / UNAUTHENTICATED", desc: "鉴权失败。" },
      { code: "403", msg: "PERMISSION_DENIED", desc: "字段无访问权限，调整 fields 或使用其他 Token。" },
      { code: "429", msg: "RATE_LIMITED", desc: "限流。" },
      { code: "500/502/503/504", msg: "UPSTREAM_UNAVAILABLE", desc: "服务异常。" },
    ],
    limits: [
      { name: "page 下限", value: "≥ 1" },
      { name: "page_size", value: "1–200，默认 25" },
      { name: "浅翻页", value: "page * page_size ≤ 10000" },
      { name: "深翻页", value: "使用 cursor；cursor 与 page>1 互斥" },
      { name: "query 与 sort", value: "不能同时使用；带 query 时按相关性排序" },
      { name: "默认限流", value: "60 次 / 分钟" },
    ],
    retry: [
      "建议重试：502 / 503 / 504",
      "不应重试：400 / 401 / 403；429 请等窗口恢复",
    ],
    samples: [
      {
        lang: "bash",
        label: "curl",
        code: `curl -X POST https://api.sciverse.space/meta-search \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "filters": [
      {"field": "publication_published_year", "operator": "FILTER_OP_GTE", "value": 2022}
    ],
    "sort": [
      {"field": "citation_count", "order": "SORT_ORDER_DESC"}
    ],
    "page": 1,
    "page_size": 25
  }'`,
      },
      {
        lang: "python",
        label: "Python 游标翻页",
        code: `import requests

url = "https://api.sciverse.space/meta-search"
headers = {"Authorization": "Bearer YOUR_API_TOKEN"}
payload = {
    "filters": [
        {"field": "publication_published_year", "operator": "FILTER_OP_GTE", "value": 2022}
    ],
    "sort": [{"field": "citation_count", "order": "SORT_ORDER_DESC"}],
    "page_size": 100,
}
while True:
    r = requests.post(url, headers=headers, json=payload).json()
    for it in r["results"]:
        print(it.get("title"))
    if not r.get("next_cursor"):
        break
    payload = {**payload, "cursor": r["next_cursor"]}`,
      },
    ],
    responseExample: `{
  "results": [
    {
      "doc_id": "d_2a91...",
      "title": "Cycle stability of graphene composite cathodes",
      "doi": "10.1234/xyz",
      "language": "en",
      "publication_published_year": 2024,
      "publication_venue_name": "Adv. Energy Mater.",
      "citation_count": 42,
      "fwci": 1.84
    }
  ],
  "total_count": 318,
  "page": 1,
  "page_size": 25,
  "total_pages": 13,
  "search_time_ms": 56.4,
  "next_cursor": "eyJvZmZzZXQiOjI1fQ=="
}`,
  },
];

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
        code: `curl -X POST https://api.sciverse.space/meta-search \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "filters": [{"field": "publication_published_year", "operator": "FILTER_OP_GTE", "value": 2022}],
    "page": 1,
    "page_size": 10
  }'`,
      },
      {
        lang: "python",
        label: "Python",
        code: `import requests

resp = requests.post(
    "https://api.sciverse.space/meta-search",
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
  repo: {
    name: "sciverse-api",
    title: "Sciverse API 仓库",
    version: "v1.2.0",
    baseUrl: "https://api.sciverse.space",
    status: "stable",
    description: "面向 LLM Agent / RAG 与检索应用的学术检索 REST 接口集，包含 5 个端点：agentic-search、content、resource、meta-catalog、meta-search。",
    changelog: [
      { version: "v1.2.0", date: "2026-04-22", notes: ["meta-search 增加 cursor 深翻页与 fwci 排序字段", "meta-catalog 补充 include_sample_values、sample_values 24h 缓存", "agentic-search 响应补充 page_no / offset / model_version"] },
      { version: "v1.1.0", date: "2026-02-10", notes: ["content 接口支持 offset / limit / next_offset / more 分段拉取", "resource 响应增加 X-Request-ID 与 Content-Disposition"] },
      { version: "v1.0.0", date: "2025-12-18", notes: ["首版发布：5 个接口与统一鉴权、语义 OK"] },
    ],
  },
  endpoints: SCIVERSE_ENDPOINTS,
  cliPlaceholder: {
    title: "CLI · SDK",
    desc: "Sciverse 的 CLI 与多语言 SDK 正在跟进中，待对应仓库就绪后将在此补充安装、配置与代码示例。当前请优先使用 REST API 与 Skills 接入方式。",
  },
  skills: {
    transport: "sciverse-mcp-server / SDK / ClawHub Skill",
    endpoint: "https://github.com/opendatalab/Sciverse-Agent-Tools",
    auth: "统一使用 Sciverse API Token（SCIVERSE_API_TOKEN 环境变量）。ClawHub 一键装载时在面板填写；Claude Code / Cursor / Codex CLI / Windsurf 等均通过 sciverse-mcp-server 接入。",
    config: {
      lang: "json",
      label: "任意 MCP 客户端·.mcp.json",
      code: `{
  "mcpServers": {
    "sciverse": {
      "command": "npx",
      "args": ["-y", "sciverse-mcp-server"],
      "env": {
        "SCIVERSE_API_TOKEN": "sv-..."
      }
    }
  }
}`,
    },
    test: [
      {
        lang: "bash",
        group: "装载",
        label: "npx skills add",
        // 推荐给支持 `npx skills` 的 Codex / Claude Code / Cursor / Codex CLI / Windsurf 等环境
        code: `# 方式 A：一键安装 Agent Skill（推荐给支持 npx skills 的环境）

# 1) 从官方域名安装
npx skills add https://sciverse.space

# 2) 或从 GitHub 安装
npx skills add opendatalab/Sciverse-Agent-Tools --skill sciverse

# 3) 设置 Token
export SCIVERSE_API_TOKEN=sv-xxx`,
      },
      {
        lang: "bash",
        group: "装载",
        label: "OpenClaw · ClawHub",
        // 方式 B：OpenClaw · ClawHub 一行装载
        code: `# 适用任意 OpenClaw 兼容客户端
clawhub install sciverse

# 可选：从 ClawHub Skill 页面选择客户端与填写 Token
#   https://clawhub.ai/sciverse/academic-retrieval`,
      },
      {
        lang: "bash",
        group: "装载",
        label: "Claude Plugin",
        code: `claude /plugin marketplace add https://github.com/opendatalab/Sciverse-Agent-Tools
claude /plugin install sciverse

# 配套安装 MCP 服务
npm install -g sciverse-mcp-server
export SCIVERSE_API_TOKEN=sv-...`,
      },
      {
        lang: "bash",
        group: "装载",
        label: "手动 Skill",
        code: `git clone https://github.com/opendatalab/Sciverse-Agent-Tools.git
cd Sciverse-Agent-Tools

# 用户级
cp -r skill-claude-code ~/.claude/skills/sciverse

# 或项目级
cp -r skill-claude-code .claude/skills/sciverse

# 同样需要 sciverse-mcp-server
npm install -g sciverse-mcp-server
export SCIVERSE_API_TOKEN=sv-...`,
      },
      {
        lang: "bash",
        group: "装载",
        label: "SDK 安装",
        code: `# Python
pip install sciverse

# TypeScript / Node.js
npm install sciverse`,
      },
      {
        lang: "python",
        group: "SDK 调用",
        label: "Python",
        code: `import asyncio
from sciverse import AgentToolsClient

async def main():
    async with AgentToolsClient(
        base_url="https://api.sciverse.space",
        token="<TOKEN>",
    ) as c:
        r = await c.semantic_search(query="Transformer attention mechanism")
        for hit in r["hits"][:3]:
            print(hit["title"], hit["score"])

asyncio.run(main())`,
      },
      {
        lang: "typescript",
        group: "SDK 调用",
        label: "TypeScript",
        code: `import { AgentToolsClient } from "sciverse";

const c = new AgentToolsClient({
  baseUrl: "https://api.sciverse.space",
  token: process.env.SCIVERSE_API_TOKEN!,
});

const r: any = await c.semanticSearch({ query: "Transformer attention mechanism" });
r.hits.slice(0, 3).forEach((h: any) => console.log(h.title, h.score));`,
      },
      {
        lang: "python",
        group: "框架接入",
        label: "Anthropic Claude",
        code: `from anthropic import Anthropic
from sciverse import ANTHROPIC_TOOLS

client = Anthropic()
msg = client.messages.create(
    model="claude-opus-4-7",
    max_tokens=2048,
    tools=ANTHROPIC_TOOLS,
    messages=[{"role": "user", "content": "Find a few papers on Transformers"}]
)`,
      },
      {
        lang: "typescript",
        group: "框架接入",
        label: "OpenAI Tools",
        code: `import OpenAI from "openai";
import { OPENAI_TOOLS } from "sciverse";

const openai = new OpenAI();
const resp = await openai.chat.completions.create({
  model: "gpt-4o",
  tools: OPENAI_TOOLS as any,
  messages: [{ role: "user", content: "Find a few Transformer papers" }],
});`,
      },
    ],
    tools: [
      { category: "SDK", name: "list_catalog", desc: "枚举可用字段、过滤算子与示例值；首次集成或拼装精确 filters 之前调用一次。", latency: "~120ms",
        params: [
          { name: "include_sample_values", type: "boolean", required: false, default: "false", desc: "是否随枚举字段返回示例值，便于 LLM 自校验。" },
        ],
        returns: "fields[]（name · type · operators[] · sample_values?）" },
      { category: "SDK", name: "search_papers", desc: "结构化元数据检索（作者 / 年份 / 期刊 / 学科），适合精确过滤后交给语义检索。", latency: "~150–500ms",
        params: [
          { name: "query", type: "string", required: false, desc: "补充的自然语言词。" },
          { name: "authors", type: "string[]", required: false, desc: "作者名列表。" },
          { name: "year_from", type: "integer", required: false, desc: "起始年份。" },
          { name: "filters_advanced", type: "object[]", required: false, desc: "由 list_catalog 返回字段拼装的精确过滤表达式。" },
          { name: "page_size", type: "integer", required: false, default: "10", range: "1–100", desc: "每页返回条数。" },
        ],
        returns: "hits[]（title · doc_id · authors · year · venue · abstract）" },
      { category: "SDK", name: "semantic_search", desc: "以自然语言在文献片段层面进行语义检索，是 RAG 场景的核心入口。", latency: "~500–1500ms",
        params: [
          { name: "query", type: "string", required: true, desc: "自然语言查询，1–2048 字符。" },
          { name: "top_k", type: "integer", required: false, default: "10", range: "1–50", desc: "返回片段上限。" },
          { name: "mode", type: "string", required: false, default: "balanced", range: "fast / balanced / quality", desc: "语义检索质量 / 耗时权衡。" },
        ],
        returns: "hits[]（doc_id · chunk_id · text · score · source.title · source.year · offset）" },
      { category: "SDK", name: "read_content", desc: "按字节范围切片读取原文以扩展 RAG 上下文，配合 semantic_search 返回的 doc_id / offset 使用。", latency: "~200ms",
        params: [
          { name: "doc_id", type: "string", required: true, desc: "文献 ID（由 search_papers / semantic_search 返回）。" },
          { name: "offset", type: "integer", required: false, default: "0", desc: "起始字节偏移。" },
          { name: "limit", type: "integer", required: false, default: "4096", desc: "本次拉取的字节上限。" },
        ],
        returns: "Markdown 片段（含 ![](dt=…/p_…/f*.png) 引用）· next_offset · more" },
      { category: "SDK", name: "get_resource", desc: "拉取 read_content Markdown 中引用的图 / 表二进制（图像字节 + MIME），用于多模态 RAG。", latency: "~200ms",
        params: [
          { name: "file_name", type: "string", required: true, desc: "形如 dt=xxx/p_yyy/f3.png，由 read_content 返回的 Markdown 中给出。" },
        ],
        returns: "bytes（image/png 等）· mime_type" },
    ],
    limits: [
      { name: "默认限流", value: "与 REST API 共享 Token 额度，429 表示超额（仅生产网关返回）" },
      { name: "安装方式", value: "npx skills add https://sciverse.space / clawhub install sciverse / pip install sciverse / npm install sciverse / Plugin Marketplace / 手动拷贝 skill-claude-code" },
      { name: "环境变量", value: "SCIVERSE_API_TOKEN（sv- 开头）；npm install -g sciverse-mcp-server 后可被任意 MCP 客户端调用" },
      { name: "语言 / 框架", value: "Python httpx 异步 SDK、TypeScript / Node.js SDK、ANTHROPIC_TOOLS、OPENAI_TOOLS 预生成 schema" },
    ],
    errors: [
      { scene: "Token 缺失或无效", status: "401", desc: "检查 SCIVERSE_API_TOKEN 是否填入客户端或环境变量。" },
      { scene: "请求参数错误", status: "400", desc: "由 Python httpx.HTTPStatusError / TypeScript Error(\"SciVerse API 400: …\") 抛出。" },
      { scene: "超出额度", status: "429", desc: "仅生产网关返回；请重试或联系管理员调整额度。" },
      { scene: "上游不可用", status: "502 / 503", desc: "按指数退避重试（1s / 2s / 4s）。" },
    ],
  },
};
const DIANSHI: Product = {
  key: "dianshi",
  name: "点石 DianShi",
  shortName: "点石",
  icon: FlaskConical,
  brand: "#7C5CFC",
  oneLine: "大规模化学信息检索与逆合成 RAG 平台",
  scope: "千万级化学物质·亿级反应·百万级专利文献",
  scopeNumbers: "6M+ 化学物质 · 10M+ 化学反应 · 1M+ 专利文献",
  highlights: [
    "申请开通后以 Skill / MCP 方式装载到 Agent 使用",
    "包含逆合成 RAG、差异指纹、结构指纹反应相似度检索",
    "MCP 14 工具，覆盖物质 / 反应 / 文献 / 逆合成场景",
  ],
  supports: ["skills"],
  intro: {
    coreData: [
      { name: "化学物质", value: "6M+" },
      { name: "化学反应", value: "10M+" },
      { name: "专利文献", value: "1M+" },
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
  applyForAccess: {
    title: "点石平台 · 申请开通",
    desc: "点石目前采取「申请—授权—开通」流程，请前往飞书表单填写申请，工作人员将在 1–2 个工作日内为你的账号开通点石访问权限。",
    formUrl: "https://aicarrier.feishu.cn/share/base/form/shrcn5mrFzHxFpUZayrgyMr6Vs2?prefill_%E6%82%A8%E7%9A%84UID=9208166",
    formLabel: "前往飞书表单填写申请",
  },
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

// ─── 点石 / SeqStudio Product 数据 ──────────────────────
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
  repo: {
    name: "SeqStudio",
    title: "SeqStudio 仓库",
    version: "v0.6.0",
    baseUrl: "https://sciverse.opendatalab.com/seqstudio",
    url: "https://github.com/OpenRaiser/SeqStudio",
    status: "beta",
    description: "蛋白质功能注释 AI 推理平台，整合 BLAST / InterProScan / Foldseek / TMHMM 多源证据与 LLM 推理；现阶段以在线访问与本地部署为主。",
    changelog: [
      { version: "v0.6.0", date: "2026-04-15", notes: ["在线工作台支持 FASTA + PDB 批量汇总", "本地部署补充 InterProScan / Foldseek 环境检查脚本"] },
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
    q: "Sciverse 的 API Token 如何获取？多久过期？",
    a: "前往 https://sciverse.opendatalab.com/tokens 创建 Token，创建后仅展示一次请立即保存。Token 永久有效，每个账号最多 10 个；Sciverse / 点石 / SeqStudio 三个产品共用同一 Token。请勿将 Token 提交到 Git 仓库或以明文分享。",
  },
  {
    q: "agentic-search 与 meta-search 有什么区别？什么场景选哪个？",
    a: "agentic-search 面向 LLM Agent 与 RAG：输入一句自然语言，返回可引用的文献片段 chunk；meta-search 面向检索与列表场景：支持字段过滤、排序与分面，可跟进 meta-catalog 动态构造 UI 过滤器。带 RAG、证据引用场景优先 agentic-search；列表与二次分析优先 meta-search。",
  },
  {
    q: "调用限流是怎么计的？超额了会怎么样？",
    a: "REST API 默认 60 次 / 分钟滑动窗口；Skills（MCP / ClawHub）默认 20 次 / 分钟，单工具每日 10 次。超额返回 HTTP 429，请等限流窗口结束后重试；需要提高额度可在 Token 管理页提交申请。",
  },
  {
    q: "meta-search 的 filters / sort 字段名从哪里查？",
    a: "调用 GET /api/v1/meta-catalog 可返回全部可用字段、字段能力（是否可 filter / sort / facet）与枚举样本。推荐前端 / Agent 在运行期读取该接口以动态构造过滤器，不要硬编码字段名，以免后续平台扩充时需调整代码。",
  },
  {
    q: "如何在 Manus / Claude Desktop / Cursor 里装载 Sciverse Skills？",
    a: "以 https://github.com/opendatalab/Sciverse-Agent-Tools 为准。推荐 5 种方式：① 一键安装（推荐，适用支持 npx skills 的 Codex / Claude Code / Cursor / Codex CLI / Windsurf 等）：`npx skills add https://sciverse.space` 或 `npx skills add opendatalab/Sciverse-Agent-Tools --skill sciverse`；② OpenClaw：`clawhub install sciverse`；③ Claude Code Plugin Marketplace：`claude /plugin marketplace add https://github.com/opendatalab/Sciverse-Agent-Tools && claude /plugin install sciverse`；④ Claude Code 手动拷贝 `skill-claude-code/` 到 `~/.claude/skills/sciverse/`；⑤ Python（`pip install sciverse`）或 TypeScript（`npm install sciverse`）SDK 直接调用。以上任一方式调用都需 SCIVERSE_API_TOKEN 环境变量。",
  },
  {
    q: "Sciverse 能返回哪些语种的文献？是否需要指定语言？",
    a: "数据库覆盖 814 种语言，默认检索跨语种返回。可在 meta-search filters 中以 lang 字段限定语种（如 lang=zh / en），具体枚举请以 meta-catalog 返回为准。",
  },
  {
    q: "数据多久更新一次？能拿到最新发表的文献吗？",
    a: "主流期刊 / 预印本源按 T+1 增量入库，全量快照按月刷新；高优先级数据源（Nature / Science / Cell 等顶刊）以当天为粒度接入。查询时在 filters 中设置 year / date_published 可快速获取最新发表。",
  },
  {
    q: "content 接口返回的正文包含哪些内容？如何读取表格 / 图片？",
    a: "content 返回纯文本正文（以及可选的章节划分）；表格、图片、公式等附件以资源相对路径给出，请调用 resource 接口传入 path 下载二进制流。多模态内容推荐在 Agent 侧独立缓存以减少重复拉取。",
  },
  {
    q: "请求失败时应该如何重试？",
    a: "5xx 类错误（500 / 502 / 503）建议指数退避重试（如 1s / 2s / 4s）。4xx 类错误（400 / 401 / 429）不建议盲目重试：400 检查请求体与参数名；401 检查 Token；429 等限流窗口结束或次日额度重置。",
  },
  {
    q: "点石 / SeqStudio 与 Sciverse 是什么关系？",
    a: "Sciverse 是面向全学科的检索与元数据平台；点石 DianShi 是化学领域深化（物质 / 反应 / 逆合成）；SeqStudio 为蛋白质 / 序列分析平台。三者共用同一 Token 与帐号体系，错误码与限流机制全平台一致。",
  },
];

// ─── Cookbook 案例数据 ─────────────────────────────────────

import { COOKBOOKS, type CookbookItem, type CookbookTag, type CodeSample as CookbookCodeSample } from "@/data/cookbooks";


// ─── 路由 hash ─────────────────────────────────────────

type Active =
  | { kind: "overview" }
  | { kind: "auth" }
  | { kind: "errors" }
  | { kind: "faq" }
  | { kind: "cookbook" }
  | { kind: "cookbook-detail"; slug: string }
  | { kind: "product"; product: ProductKey; section: "overview" }
  | { kind: "endpoint-index"; product: ProductKey; anchor?: string }
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
  if (h === "cookbook") return { kind: "cookbook" };
  if (h.startsWith("cookbook/")) {
    const slug = h.replace("cookbook/", "");
    if (slug && COOKBOOKS.find((c) => c.slug === slug)) return { kind: "cookbook-detail", slug };
    return { kind: "cookbook" };
  }
  const parts = h.split("/");
  const p = PRODUCTS.find((x) => x.key === parts[0]);
  if (!p) return { kind: "overview" };
  if (parts.length === 1 || parts[1] === "overview")
    return { kind: "product", product: p.key, section: "overview" };
  if (parts[1] === "api") {
    if (parts[2]) {
      const ep = p.endpoints?.find((e) => e.key === parts[2]);
      if (ep) return { kind: "endpoint-index", product: p.key, anchor: ep.key };
    }
    return { kind: "endpoint-index", product: p.key };
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
    case "cookbook":
      return "cookbook";
    case "cookbook-detail":
      return `cookbook/${a.slug}`;
    case "product":
      return `${a.product}/overview`;
    case "endpoint-index":
      return a.anchor ? `${a.product}/api/${a.anchor}` : `${a.product}/api`;
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
            {active.kind === "cookbook" && <CookbookIndexPage onGo={go} />}
            {active.kind === "cookbook-detail" && <CookbookDetailPage slug={active.slug} onGo={go} />}
            {active.kind === "product" && <ProductOverviewPage product={getProduct(active.product)} onGo={go} />}
            {active.kind === "endpoint-index" && (
              <EndpointIndexPage
                product={getProduct(active.product)}
                anchor={active.anchor}
                onGo={go}
              />
            )}
            {active.kind === "endpoint" && (
              <EndpointPage
                product={getProduct(active.product)}
                endpoint={getProduct(active.product).endpoints!.find((e) => e.key === active.endpointKey)!}
              />
            )}
            {active.kind === "skills" && <SkillsPage product={getProduct(active.product)} />}
            {active.kind === "cli" && <CliPlaceholderPage product={getProduct(active.product)} />}
            {active.kind === "online" && <OnlinePage product={getProduct(active.product)} />}
            {active.kind !== "overview" && active.kind !== "auth" && active.kind !== "errors" && active.kind !== "faq" && active.kind !== "endpoint-index" && (
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
    (active.kind === "endpoint-index" && active.product === key) ||
    (active.kind === "skills" && active.product === key) ||
    (active.kind === "cli" && active.product === key) ||
    (active.kind === "online" && active.product === key);

  return (
    <aside className="hidden lg:block w-[260px] shrink-0 border-r hairline px-5 py-10 sticky top-0 self-start h-screen overflow-y-auto bg-[var(--paper)]">
        <div className="font-display text-[18px] tracking-tight text-[var(--ink)]">接入指南</div>
      <div className="mt-1 text-[12px] text-[var(--ink-3)]">三个产品，一个 Token 通用</div>
      <NavLink label="概览" icon={BookOpen} active={active.kind === "overview"} onClick={() => onGo({ kind: "overview" })} />
      <div className="mt-4 mb-2 px-3 text-[11px] tracking-[0.2em] text-[var(--ink-3)] uppercase">产品</div>
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
                  <SubNavLink
                    label={`API 接口 · ${p.endpoints.length}`}
                    icon={Cable}
                    isActive={active.kind === "endpoint-index" && active.product === p.key}
                    onClick={() => onGo({ kind: "endpoint-index", product: p.key })}
                  />
                )}
                {p.skills && (
                  <SubNavLink
                    label="Skills"
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
      <div className="mt-5 mb-2 px-3 text-[11px] tracking-[0.2em] text-[var(--ink-3)] uppercase">场景案例</div>
      <NavLink label={`Cookbook · ${COOKBOOKS.length}`} icon={BookOpen} active={active.kind === "cookbook" || active.kind === "cookbook-detail"} onClick={() => onGo({ kind: "cookbook" })} />
      <div className="mt-5 mb-2 px-3 text-[11px] tracking-[0.2em] text-[var(--ink-3)] uppercase">通用</div>
      <NavLink label="统一鉴权" icon={ShieldCheck} active={active.kind === "auth"} onClick={() => onGo({ kind: "auth" })} />
      <NavLink label="错误码" icon={AlertTriangle} active={active.kind === "errors"} onClick={() => onGo({ kind: "errors" })} />
      <NavLink label="常见问题" icon={HelpCircle} active={active.kind === "faq"} onClick={() => onGo({ kind: "faq" })} />
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
        "w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors",
        isActive
          ? "text-[var(--brand)] bg-[var(--brand)]/[0.08] font-medium"
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

      {/* 热门 Cookbook */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[22px] text-[var(--ink)]">热门 Cookbook</h2>
          <button
            onClick={() => onGo({ kind: "cookbook" })}
            className="text-[12px] text-[var(--brand)] hover:underline flex items-center gap-0.5">
            查看全部 {COOKBOOKS.length} 个案例 <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <p className="mt-1 text-[13px] text-[var(--ink-3)]">
          可复制、可运行的场景化开发者案例 — 展示如何用 Sciverse 构建真实应用。
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {COOKBOOKS.slice(0, 3).map((item) => (
            <button
              key={item.slug}
              onClick={() => onGo({ kind: "cookbook-detail", slug: item.slug })}
              className="group text-left p-4 rounded-xl border hairline bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-1.5 mb-2">
                {item.tags.slice(0, 2).map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--brand)]/[0.06] text-[var(--brand)] border border-[var(--brand)]/15">
                    {t}
                  </span>
                ))}
                <span className="ml-auto text-[10px] text-[var(--ink-3)]">{item.difficulty}</span>
              </div>
              <h3 className="text-[13.5px] font-semibold text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors leading-snug">
                {item.title}
              </h3>
              <p className="mt-1 text-[12px] text-[var(--ink-3)] leading-relaxed line-clamp-2">
                {item.subtitle}
              </p>
              <div className="mt-2.5 flex items-center gap-1 text-[11px] text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-opacity">
                查看详情 <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
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

      {product.applyForAccess && (
        <section className="mt-8">
          <div
            className="rounded-2xl border hairline p-5 flex items-start gap-4 flex-wrap"
            style={{ background: `${product.brand}08`, borderColor: `${product.brand}33` }}>
            <div
              className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
              style={{ background: `${product.brand}1A`, color: product.brand }}>
              <KeyRound className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[17px] text-[var(--ink)] tracking-[-0.01em]">
                {product.applyForAccess.title}
              </div>
              <p className="mt-1 text-[13px] text-[var(--ink-2)] leading-relaxed">
                {product.applyForAccess.desc}
              </p>
            </div>
            <a
              href={product.applyForAccess.formUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium text-white transition-opacity hover:opacity-90 shrink-0"
              style={{ background: product.brand }}>
              {product.applyForAccess.formLabel}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>
      )}

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
              onClick={() => onGo({ kind: "endpoint-index", product: product.key })}
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

// ─── 接口详情页 ───────────// ─── 接口仓库总览页（sticky TOC + 全部端点顺序展开）────
function EndpointIndexPage({ product, anchor, onGo: _onGo }: { product: Product; anchor?: string; onGo: (a: Active) => void }) {
  const endpoints = product.endpoints ?? [];
  const repo = product.repo;
  const [activeAnchor, setActiveAnchor] = useState<string>(anchor || endpoints[0]?.key || "");

  useEffect(() => {
    if (!anchor) return;
    const el = document.getElementById(`ep-${anchor}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveAnchor(anchor);
  }, [anchor]);

  useEffect(() => {
    if (!endpoints.length) return;
    const handler = () => {
      let current = endpoints[0].key;
      for (const ep of endpoints) {
        const el = document.getElementById(`ep-${ep.key}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top - 120 <= 0) current = ep.key;
        else break;
      }
      setActiveAnchor(current);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [endpoints]);

  const statusTone =
    repo?.status === "stable" ? "#0E8C5A" : repo?.status === "beta" ? "#B95C00" : "#5B5BF7";

  return (
    <>
      <Breadcrumb
        items={[
          { label: "接入指南" },
          { label: product.name, brand: product.brand },
          { label: "API 接口" },
        ]}
      />

      {repo && (
        <header className="mt-3 card-paper p-5 lg:p-6 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span
                  className="font-mono text-[11px] tracking-[0.06em] px-2 py-0.5 rounded border hairline"
                  style={{ color: statusTone, borderColor: `${statusTone}40`, background: `${statusTone}10` }}>
                  {repo.status.toUpperCase()}
                </span>
                <span className="font-mono text-[12px] text-[var(--ink-3)]">{repo.name}</span>
                <span className="font-mono text-[12px] text-[var(--ink-3)]">{repo.version}</span>
              </div>
              <h1 className="mt-2 font-display text-[28px] text-[var(--ink)] tracking-[-0.01em]">
                {repo.title}
              </h1>
              <p className="mt-1.5 text-[13.5px] text-[var(--ink-2)] max-w-[640px] leading-relaxed">
                {repo.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] tracking-[0.18em] text-[var(--ink-3)] uppercase">Endpoints</div>
              <div className="mt-1 font-display text-[28px] text-[var(--ink)]">{endpoints.length}</div>
            </div>
          </div>
        </header>
      )}

      {endpoints.length > 0 && (
        <div className="mt-4 -mx-2 px-2 sticky top-0 z-10 bg-[var(--paper)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--paper)]/80">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-b hairline">
            <span className="text-[11px] tracking-[0.18em] uppercase text-[var(--ink-3)] mr-2 shrink-0">端点</span>
            {endpoints.map((ep) => {
              const act = activeAnchor === ep.key;
              return (
                <a
                  key={ep.key}
                  href={`#${product.key}/api/${ep.key}`}
                  onClick={() => setActiveAnchor(ep.key)}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-mono transition-colors border",
                    act
                      ? "text-[var(--brand)] bg-[var(--brand)]/10 border-[var(--brand)]/35"
                      : "text-[var(--ink-2)] border-transparent hover:bg-[var(--ink)]/[0.05]",
                  )}>
                  <span className={cn(
                    "text-[9.5px] px-1 py-px rounded border",
                    ep.method === "GET"
                      ? "border-emerald-400/40 text-emerald-700 bg-emerald-50"
                      : "border-[var(--brand)]/40 text-[var(--brand)] bg-[var(--brand)]/5",
                  )}>{ep.method}</span>
                  {ep.key}
                </a>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="min-w-0">
          {endpoints.map((ep, i) => (
            <article
              key={ep.key}
              id={`ep-${ep.key}`}
              className={cn("scroll-mt-24", i > 0 && "mt-14 pt-14 border-t hairline")}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "font-mono text-[11px] px-2 py-0.5 rounded border",
                  ep.method === "GET"
                    ? "border-emerald-400/40 text-emerald-700 bg-emerald-50"
                    : "border-[var(--brand)]/40 text-[var(--brand)] bg-[var(--brand)]/5",
                )}>
                  {ep.method}
                </span>
                <span className="font-mono text-[12.5px] text-[var(--ink-2)] truncate">{ep.path}</span>
                <span className="font-mono text-[11px] text-[var(--ink-4)]">#{ep.key}</span>
              </div>
              <h2 className="mt-2 font-display text-[24px] text-[var(--ink)] tracking-[-0.01em]">{ep.title}</h2>
              <p className="mt-1.5 text-[14px] text-[var(--ink-2)] max-w-[680px] leading-relaxed">{ep.summary}</p>

              <Section title="概述">
                <p className="text-[13.5px] text-[var(--ink-2)] leading-relaxed">{ep.desc}</p>
              </Section>

              {ep.useCases && (
                <Section title="适用场景">
                  <ul className="space-y-1.5">
                    {ep.useCases.map((u) => (
                      <li key={u} className="text-[13.5px] text-[var(--ink-2)]">· {u}</li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section title="请求示例">
                <CodeTabs samples={ep.samples} />
              </Section>

              {ep.params && (
                <Section title={ep.paramsTitle || "请求参数"}>
                  {ep.paramsNote && <p className="text-[12.5px] text-[var(--ink-2)] mb-3 leading-relaxed">{ep.paramsNote}</p>}
                  <ParamTable rows={ep.params} />
                </Section>
              )}

              {ep.response && (
                <Section title="响应结构">
                  {ep.responseNote && <p className="text-[12.5px] text-[var(--ink-2)] mb-3 leading-relaxed">{ep.responseNote}</p>}
                  <RespTable rows={ep.response} />
                </Section>
              )}

              {ep.responseExample && (
                <Section title="响应示例">
                  <pre className="rounded-2xl bg-[#16161d] text-white/85 p-4 text-[12px] font-mono overflow-x-auto leading-[1.7]">
{ep.responseExample}
                  </pre>
                </Section>
              )}

              {ep.errors && (
                <Section title="错误码">
                  <ErrorTable rows={ep.errors} />
                </Section>
              )}

              {ep.limits && (
                <Section title="调用限制">
                  <LimitTable rows={ep.limits} />
                </Section>
              )}

              {ep.retry && (
                <Section title="重试建议">
                  <ul className="space-y-1.5">
                    {ep.retry.map((r) => (
                      <li key={r} className="text-[13px] text-[var(--ink-2)]">· {r}</li>
                    ))}
                  </ul>
                </Section>
              )}
            </article>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── 接口详情页 ───────────────────────

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
  const isSciverse = product.key === "sciverse";
  return (
    <>
      <Breadcrumb items={[{ label: "接入指南" }, { label: product.name, brand: product.brand }, { label: "Skills" }]} />
      <h1 className="mt-3 font-display text-[30px] text-[var(--ink)] tracking-[-0.01em]">{product.shortName} · Skills</h1>

      {isSciverse ? (
        <>
          <p className="mt-2 text-[14px] text-[var(--ink-2)] max-w-[720px] leading-relaxed">
            以 <span className="text-[var(--ink)]">opendatalab/Sciverse-Agent-Tools</span> 仓库为准，提供 5 个标准化 Agent 工具与 Python / TypeScript SDK，支持 5 种装载路径。
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            {/* 仓库头牌 */}
            <div className="card-paper p-4">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-xl border hairline grid place-items-center bg-[var(--paper-2)]">
                  <Github className="h-4 w-4 text-[var(--ink-2)]" />
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] text-[var(--ink-3)]">GitHub</div>
                  <a
                    href="https://github.com/opendatalab/Sciverse-Agent-Tools"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[13px] text-[var(--ink)] hover:text-[var(--brand)] tracking-tight truncate inline-flex items-center gap-1">
                    opendatalab/Sciverse-Agent-Tools
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[12px]">
                {[
                  { name: "list_catalog", note: "字段查询" },
                  { name: "search_papers", note: "结构化检索" },
                  { name: "semantic_search", note: "语义检索" },
                  { name: "read_content", note: "原文切片" },
                  { name: "get_resource", note: "图表资源" },
                ].map((t) => (

                  <div key={t.name} className="rounded-md border hairline px-2.5 py-2 bg-[var(--paper-2)]/40">
                    <div className="font-mono text-[11.5px] text-[var(--ink)] truncate">{t.name}</div>
                    <div className="text-[11px] text-[var(--ink-3)] mt-0.5">{t.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 装载径徽章 */}
            <div className="card-paper p-4">
              <div className="text-[12px] text-[var(--ink-3)]">装载路径</div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {[
                  { icon: Zap, title: "npx skills add", desc: "npx skills add https://sciverse.space" },
                  { icon: Sparkles, title: "OpenClaw · ClawHub", desc: "clawhub install sciverse", href: "https://clawhub.ai/sciverse/academic-retrieval" },
                  { icon: Boxes, title: "Claude Plugin", desc: "/plugin install sciverse" },
                  { icon: TerminalIcon, title: "手动 Skill", desc: "clone 后 cp 至 .claude/skills" },
                  { icon: Package, title: "Python · TS SDK", desc: "pip / npm install sciverse" },
                ].map((p, i) => (
                  <div key={i} className="rounded-md border hairline px-2.5 py-2 flex items-start gap-2 bg-[var(--paper-2)]/40">
                    <span className="h-6 w-6 rounded-md border hairline grid place-items-center text-[var(--ink-2)] shrink-0">
                      <p.icon className="h-3 w-3" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[12px] text-[var(--ink)] tracking-tight truncate">
                        {p.href ? (
                          <a href={p.href} target="_blank" rel="noreferrer" className="hover:text-[var(--brand)] inline-flex items-center gap-1">
                            {p.title}
                            <ArrowUpRight className="h-3 w-3 opacity-60" />
                          </a>
                        ) : p.title}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--ink-3)] truncate">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 text-[11.5px] text-[var(--ink-3)] leading-relaxed">
                兼容 Claude Code / Cursor / Codex CLI / Windsurf 等主流 Agent 客户端，统一通过 sciverse-mcp-server 连接。
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-2 text-[14px] text-[var(--ink-2)] max-w-[700px] leading-relaxed">
          点石通过 Model Context Protocol（MCP）向 LLM Agent 暴露 {s.tools.length} 个化学数据库工具，涵盖物质、反应、文献检索与相似度搜索。
        </p>
      )}

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
        <Section title={isSciverse ? "装载方式" : "手动测试"}>
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
  "message": "product_smiles is required"
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
  // 如果存在 group 字段，启用「分组 segmented + chip 列」布局；否则退化为原服单行 tabs。
  const groups = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const s of samples) {
      if (s.group && !seen.has(s.group)) {
        seen.add(s.group);
        list.push(s.group);
      }
    }
    return list;
  }, [samples]);
  const grouped = groups.length > 0;
  const [activeGroup, setActiveGroup] = useState(grouped ? groups[0] : "");
  const visible = useMemo(
    () => (grouped ? samples.filter((s) => s.group === activeGroup) : samples),
    [samples, grouped, activeGroup],
  );
  const [active, setActive] = useState(0);
  // group 切换时重置 chip 选中
  const lastGroup = useRef(activeGroup);
  if (lastGroup.current !== activeGroup) {
    lastGroup.current = activeGroup;
    if (active !== 0) setTimeout(() => setActive(0), 0);
  }
  const sample = visible[active] ?? visible[0];
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    if (!sample?.code) return;
    navigator.clipboard?.writeText(sample.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <div className="mt-3 card-paper overflow-hidden">
      {grouped && (
        <div className="flex flex-wrap items-center gap-1 px-3 pt-2.5 pb-2 border-b hairline bg-[var(--paper-2)]">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[12px] tracking-tight transition-colors whitespace-nowrap",
                g === activeGroup
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper)]",
              )}>
              {g}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b hairline bg-[var(--paper-2)]/60 overflow-x-auto no-scrollbar">
        {visible.map((s, i) => (
          <button
            key={s.lang + i + (s.group ?? "")}
            onClick={() => setActive(i)}
            className={cn(
              "px-2 py-0.5 rounded text-[11.5px] font-mono tracking-wider transition-colors whitespace-nowrap shrink-0",
              i === active
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "text-[var(--ink-3)] hover:text-[var(--ink)]",
            )}>
            {s.label}
          </button>
        ))}
        <span className="flex-1" />
        <button
          onClick={onCopy}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wider transition-all duration-300 shrink-0 border",
            copied
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 scale-105"
              : "border-slate-200 text-[var(--ink-3)] hover:text-[var(--ink)] hover:border-slate-300 hover:shadow-sm",
          )}>
          {copied ? (
            <>
              <svg className="h-3.5 w-3.5 animate-[bounceIn_0.3s_ease-out]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>已复制</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              <span>复制</span>
            </>
          )}
        </button>
      </div>
      <pre className="text-[12.5px] leading-[1.7] font-mono p-4 overflow-x-auto text-[var(--ink-2)]">
        <code>{sample?.code}</code>
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
      <Link href="/keys" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--brand)] hover:opacity-80 transition-opacity shrink-0">
          前往控制台 <ArrowUpRight className="h-3.5 w-3.5" />
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


// ─── Cookbook 页面组件 ─────────────────────────────────────

const TAG_COLORS: Record<CookbookTag, string> = {
  RAG: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Agent: "bg-violet-50 text-violet-700 border-violet-200",
  "检索": "bg-blue-50 text-blue-700 border-blue-200",
  "多模态": "bg-amber-50 text-amber-700 border-amber-200",
  Skill: "bg-rose-50 text-rose-700 border-rose-200",
  "专利": "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const DIFF_COLORS: Record<string, string> = {
  "入门": "text-green-600",
  "进阶": "text-amber-600",
  "高级": "text-red-600",
};

function CookbookIndexPage({ onGo }: { onGo: (a: Active) => void }) {
  const [filter, setFilter] = useState<CookbookTag | "all">("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const [visibleSet, setVisibleSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slug = (entry.target as HTMLElement).dataset.slug;
            if (slug) setVisibleSet((prev) => new Set(prev).add(slug));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    el.querySelectorAll("[data-slug]").forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [filter]);
  const allTags: CookbookTag[] = ["RAG", "Agent", "检索", "多模态", "Skill", "专利"];
  const filtered = filter === "all" ? COOKBOOKS : COOKBOOKS.filter((c) => c.tags.includes(filter));

  return (
    <div className="ed-in">
      {/* Hero header with brand accent */}
      <div className="relative overflow-hidden rounded-2xl border hairline bg-white px-7 pt-7 pb-6 mb-8" style={{ backgroundImage: "linear-gradient(135deg, rgba(91,91,247,0.04) 0%, rgba(91,91,247,0) 60%)" }}>
        <div aria-hidden className="absolute left-0 top-5 bottom-5 w-[2px] rounded-r" style={{ background: "var(--brand)" }} />
        <div className="flex items-center gap-2 text-[11px] tracking-[0.28em] text-[var(--ink-3)] uppercase font-mono">
          <span className="inline-block h-px w-4 bg-[var(--ink-3)]/50" />
          Cookbook
        </div>
        <h1 className="mt-2.5 text-[26px] lg:text-[30px] font-display tracking-tight text-[var(--ink)] leading-tight">
          Sciverse Cookbook
        </h1>
        <p className="mt-2 text-[14px] text-[var(--ink-2)] leading-relaxed max-w-[580px]">
          场景化开发者案例库—用真实任务展示如何把 Sciverse 接入 Agent、RAG、科研检索。每个案例可复制、可运行。
        </p>
        <div className="mt-4 flex items-center gap-3 text-[12px] text-[var(--ink-3)]">
          <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{COOKBOOKS.length} 个案例</span>
          <span className="h-3 w-px bg-[var(--hairline)]" />
          <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />5 个接口覆盖</span>
          <span className="h-3 w-px bg-[var(--hairline)]" />
          <span className="flex items-center gap-1.5"><Cable className="h-3.5 w-3.5" />Colab 可运行</span>
        </div>
      </div>

      {/* 标签筛选 — 更精致的胶囊样式 */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all duration-200",
            filter === "all"
              ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-sm"
              : "bg-white text-[var(--ink-2)] border-[var(--hairline)] hover:border-[var(--ink)]/25 hover:text-[var(--ink)]",
          )}>
          全部 · {COOKBOOKS.length}
        </button>
        {allTags.map((tag) => {
          const count = COOKBOOKS.filter((c) => c.tags.includes(tag)).length;
          if (count === 0) return null;
          return (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all duration-200",
                filter === tag
                  ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-sm"
                  : "bg-white text-[var(--ink-2)] border-[var(--hairline)] hover:border-[var(--ink)]/25 hover:text-[var(--ink)]",
              )}>
              {tag} · {count}
            </button>
          );
        })}
      </div>

      {/* 卡片网格 — Editorial card-paper 风格 */}
      <div ref={gridRef} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((item, idx) => (
          <button
            key={item.slug}
            data-slug={item.slug}
            onClick={() => onGo({ kind: "cookbook-detail", slug: item.slug })}
            className={`group relative text-left p-0 overflow-hidden rounded-xl bg-white transition-all duration-500 hover:-translate-y-[2px] hover:shadow-[0_8px_30px_-8px_rgba(91,91,247,0.15)] ${
              visibleSet.has(item.slug) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: `${idx * 70}ms` }}>
            {/* 渐变边框容器 */}
            <div className="absolute inset-0 rounded-xl border border-[var(--hairline)] group-hover:border-transparent transition-colors duration-300" />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ padding: '1px', background: 'linear-gradient(135deg, rgba(91,91,247,0.4) 0%, rgba(91,91,247,0.08) 50%, rgba(91,91,247,0.25) 100%)', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', borderRadius: 'inherit' }} />
            {/* 卡片顶部彩色条 */}
            <div className="relative h-[3px] w-full" style={{ background: `linear-gradient(90deg, var(--brand) 0%, rgba(91,91,247,0.2) 100%)` }} />
            <div className="relative px-5 pt-4 pb-4">
              {/* 头部：标签 + 难度 */}
              <div className="flex items-center gap-1.5 mb-3">
                {item.tags.map((t) => (
                  <span key={t} className={cn("px-2 py-[2px] rounded-[4px] text-[10.5px] font-medium", TAG_COLORS[t])}>
                    {t}
                  </span>
                ))}
                <span className={cn("ml-auto text-[10.5px] font-medium tracking-wide", DIFF_COLORS[item.difficulty])}>
                  {item.difficulty}
                </span>
              </div>
              {/* 标题 */}
              <h3 className="text-[15px] font-semibold text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors duration-280 leading-snug tracking-tight">
                {item.title}
              </h3>
              {/* 副标题 */}
              <p className="mt-1.5 text-[12.5px] text-[var(--ink-3)] leading-relaxed line-clamp-2">
                {item.subtitle}
              </p>
              {/* 底部元信息 */}
              <div className="mt-4 pt-3 border-t border-[var(--hairline)] flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-[var(--ink-3)]">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-[var(--brand)]/60" />
                    {item.estimatedCalls}
                  </span>
                  <span className="flex items-center gap-1">
                    <Cable className="h-3 w-3" />
                    {item.tools.length} 接口
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[11.5px] font-medium text-[var(--brand)] opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-280">
                  查看 <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CookbookDetailPage({ slug, onGo }: { slug: string; onGo: (a: Active) => void }) {
  const item = COOKBOOKS.find((c) => c.slug === slug);
  if (!item) return <div className="text-[var(--ink-3)]">案例不存在</div>;

  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2200);
    });
  };

  const CopyBtn = ({ code, idx }: { code: string; idx: number }) => {
    const isCopied = copiedIdx === idx;
    return (
      <button
        onClick={() => copyCode(code, idx)}
        className={cn(
          "absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all duration-300",
          isCopied
            ? "bg-emerald-50 border-emerald-200 text-emerald-700 scale-105"
            : "bg-white/90 backdrop-blur-sm border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:shadow-sm"
        )}>
        {isCopied ? (
          <>
            <svg className="h-3.5 w-3.5 animate-[bounceIn_0.3s_ease-out]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>已复制</span>
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            <span>复制</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div>
      {/* 面包屑 */}
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-3)] mb-4">
        <button onClick={() => onGo({ kind: "cookbook" })} className="hover:text-[var(--brand)] transition-colors">
          Cookbook
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--ink-2)]">{item.title}</span>
      </div>

      {/* 标题区 */}
      <div className="flex items-center gap-2 mb-2">
        {item.tags.map((t) => (
          <span key={t} className={cn("px-2 py-0.5 rounded text-[11px] font-medium border", TAG_COLORS[t])}>
            {t}
          </span>
        ))}
        <span className={cn("text-[11px] font-medium", DIFF_COLORS[item.difficulty])}>
          {item.difficulty}
        </span>
      </div>
      <h1 className="text-[24px] lg:text-[28px] font-display tracking-tight text-[var(--ink)]">
        {item.title}
      </h1>
      <p className="mt-2 text-[14px] text-[var(--ink-2)] leading-relaxed">{item.subtitle}</p>

      {/* 在 Colab 中打开 */}
      <div className="mt-4 flex items-center gap-3">
        <a
          href={`https://colab.research.google.com/github/veeicwgy/sciverse-experience/blob/main/cookbooks/${item.slug}.ipynb`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F9AB00]/10 border border-[#F9AB00]/30 text-[13px] font-medium text-[#E37400] hover:bg-[#F9AB00]/20 hover:border-[#F9AB00]/50 transition-all duration-200">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path d="M4.54 9.46 2.19 7.1a8.94 8.94 0 0 1 12.73 0l-2.36 2.36a5.58 5.58 0 0 0-8.02 0Z" fill="#E8710A"/>
            <path d="M9.81 14.73 7.46 12.37a5.58 5.58 0 0 1 0-8.02l2.35 2.36a2.22 2.22 0 0 0 0 3.3l-0.01 4.72Z" fill="#F9AB00"/>
            <path d="M14.19 14.73l2.35-2.36a5.58 5.58 0 0 0 0-8.02l-2.35 2.36a2.22 2.22 0 0 1 0 3.3v4.72Z" fill="#F9AB00"/>
            <path d="M19.46 9.46l2.35-2.36a8.94 8.94 0 0 0-12.73 0l2.36 2.36a5.58 5.58 0 0 1 8.02 0Z" fill="#E8710A"/>
          </svg>
          在 Google Colab 中打开
        </a>
        <a
          href={`https://github.com/veeicwgy/sciverse-experience/blob/main/cookbooks/${item.slug}.ipynb`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border hairline text-[12px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)]/30 transition-all duration-200">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
          </svg>
          在 GitHub 查看
        </a>
      </div>

      {/* 概览信息 */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50/80 border hairline grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
        <div>
          <div className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider mb-1">用户场景</div>
          <div className="text-[var(--ink)]">{item.scenario}</div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider mb-1">预估调用量</div>
          <div className="text-[var(--ink)]">{item.estimatedCalls}</div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider mb-1">适用工具</div>
          <div className="flex flex-wrap gap-1.5">
            {item.tools.map((t) => (
              <code key={t} className="px-1.5 py-0.5 rounded bg-white border hairline text-[11px] text-[var(--ink-2)]">{t}</code>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider mb-1">调用链路</div>
          <div className="flex flex-wrap items-center gap-1 text-[12px] text-[var(--ink-2)]">
            {item.pipeline.map((p, i) => (
              <span key={i} className={p.startsWith("→") ? "text-[var(--brand)]" : "font-mono"}>{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 输入 / 输出示例 */}
      <div className="mt-8">
        <h2 className="text-[16px] font-semibold text-[var(--ink)] mb-3">输入示例</h2>
        <pre className="p-4 rounded-lg bg-slate-50 border hairline text-[12px] text-[var(--ink-2)] whitespace-pre-wrap overflow-x-auto">{item.inputExample}</pre>
      </div>
      <div className="mt-6">
        <h2 className="text-[16px] font-semibold text-[var(--ink)] mb-3">输出示例</h2>
        <pre className="p-4 rounded-lg bg-slate-50 border hairline text-[12px] text-[var(--ink-2)] whitespace-pre-wrap overflow-x-auto">{item.outputExample}</pre>
      </div>

      {/* Agent Prompt */}
      <div className="mt-8">
        <h2 className="text-[16px] font-semibold text-[var(--ink)] mb-3">Agent Prompt 示例</h2>
        <div className="relative">
          <pre className="p-4 rounded-lg bg-violet-50/60 border border-violet-100 text-[12px] text-violet-900 whitespace-pre-wrap overflow-x-auto">{item.agentPrompt}</pre>
          <CopyBtn code={item.agentPrompt} idx={-1} />
        </div>
      </div>

      {/* 分步代码 */}
      <div className="mt-8">
        <h2 className="text-[16px] font-semibold text-[var(--ink)] mb-4">分步实现</h2>
        <div className="space-y-6">
          {item.steps.map((step, idx) => (
            <div key={idx} className="border hairline rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/60 border-b hairline">
                <h3 className="text-[14px] font-semibold text-[var(--ink)]">{step.title}</h3>
                <p className="text-[12px] text-[var(--ink-3)] mt-0.5">{step.desc}</p>
              </div>
              <div className="relative">
                <pre className="p-4 text-[12px] text-[var(--ink)] bg-white overflow-x-auto leading-relaxed"><code>{step.code.code}</code></pre>
                <CopyBtn code={step.code.code} idx={idx} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 注意事项 */}
      {item.notes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[16px] font-semibold text-[var(--ink)] mb-3">注意事项</h2>
          <ul className="space-y-2">
            {item.notes.map((n, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--ink-2)]">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 下一步 */}
      {item.nextSteps.length > 0 && (
        <div className="mt-8 p-4 rounded-xl bg-[var(--brand)]/[0.04] border border-[var(--brand)]/10">
          <h3 className="text-[13px] font-semibold text-[var(--ink)] mb-2">下一步</h3>
          <div className="flex flex-wrap gap-2">
            {item.nextSteps.map((ns) => (
              <button
                key={ns.hash}
                onClick={() => {
                  if (typeof window !== "undefined") window.location.hash = ns.hash;
                  onGo(parseHash(ns.hash));
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--brand)] bg-white border border-[var(--brand)]/20 hover:bg-[var(--brand)]/[0.06] transition-colors">
                {ns.label}
                <ArrowUpRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
