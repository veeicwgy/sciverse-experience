/*
 * Sciverse · Docs (Claude-style 三栏文档)
 * 左：接口列表 + 锚点目录（Overview · Auth · Parameters · Response · Errors）
 * 中：正文（编辑式排版 · hairline 表格）
 * 右：固定示例（语言切换 cURL/Python/Node · 复制 · Try-it 跳 Experience）
 * 注意：所有 API 端点 / HTTP 方法 / 字段命名严格按 sciverse.space/docs 真实文档
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Check, ArrowUpRight, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

type EndpointId = "agentic-search" | "meta-search" | "content";

type Endpoint = {
  id: EndpointId;
  method: "POST" | "GET";
  path: string;
  title: string;
  oneLine: string;
  required: { name: string; note: string };
};

const ENDPOINTS: Endpoint[] = [
  {
    id: "agentic-search",
    method: "POST",
    path: "https://api.sciverse.space/agentic-search",
    title: "智能搜索 · agentic-search",
    oneLine:
      "输入自然语言问题，返回来自学术文献和可信网页的相关文本片段，并附带相关性分数。支持全文检索、向量语义搜索及两者融合。",
    required: { name: "query", note: "搜索关键词或自然语言问题，最长 4096 字符。唯一必填项。" },
  },
  {
    id: "meta-search",
    method: "POST",
    path: "https://api.sciverse.space/meta-search",
    title: "结构化元数据检索 · meta-search",
    oneLine:
      "本地 Bearer 鉴权通过后，后端调用 metadata-service 的 MetadataService.Search，按论文元数据字段过滤、排序并分页返回记录。",
    required: { name: "filters / fields", note: "filters 可为空；fields 为空时返回服务端默认字段。context 由后端注入，客户端不要传。" },
  },
  {
    id: "content",
    method: "GET",
    path: "https://api.sciverse.space/content",
    title: "原文内容回源 · content",
    oneLine:
      "按 chunk_id / doc_id 回源命中片段所在的原文内容，配合 agentic-search 结果做引用展示与 PDF 页码定位。",
    required: { name: "chunk_id 或 doc_id", note: "二者至少传一个；优先使用 agentic-search 返回的 chunk_id。" },
  },
];

const SECTIONS = [
  { id: "overview", label: "概述" },
  { id: "auth", label: "身份验证" },
  { id: "params", label: "请求参数" },
  { id: "response", label: "响应结构" },
  { id: "errors", label: "错误码" },
];

/* ---------- Right side example snippets ---------- */
type Lang = "curl" | "python" | "node";
function buildExample(ep: Endpoint, lang: Lang): string {
  if (ep.id === "agentic-search") {
    if (lang === "curl") {
      return `curl -X POST ${ep.path} \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "mRNA 疫苗递送系统在脂质纳米颗粒中的最新优化策略",
    "source_types": ["pdf", "web"],
    "filters": null,
    "request_id": null
  }'`;
    }
    if (lang === "python") {
      return `import requests

res = requests.post(
    "${ep.path}",
    headers={
        "Authorization": "Bearer YOUR_API_TOKEN",
        "Content-Type": "application/json",
    },
    json={
        "query": "mRNA 疫苗递送系统在脂质纳米颗粒中的最新优化策略",
        "source_types": ["pdf", "web"],
        "filters": None,
        "request_id": None,
    },
)
print(res.json())`;
    }
    return `import fetch from "node-fetch";

const res = await fetch("${ep.path}", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: "mRNA 疫苗递送系统在脂质纳米颗粒中的最新优化策略",
    source_types: ["pdf", "web"],
    filters: null,
    request_id: null,
  }),
});
console.log(await res.json());`;
  }

  if (ep.id === "meta-search") {
    if (lang === "curl") {
      return `curl -X POST ${ep.path} \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "filters": [
      { "field": "publication_published_year", "operator": "FILTER_OP_GTE", "value": 2023 }
    ],
    "sort": [
      { "field": "publication_published_year", "order": "SORT_ORDER_DESC" }
    ],
    "fields": [],
    "page": 1,
    "page_size": 25
  }'`;
    }
    if (lang === "python") {
      return `import requests

res = requests.post(
    "${ep.path}",
    headers={
        "Authorization": "Bearer YOUR_API_TOKEN",
        "Content-Type": "application/json",
    },
    json={
        "filters": [
            {"field": "publication_published_year", "operator": "FILTER_OP_GTE", "value": 2023}
        ],
        "sort": [
            {"field": "publication_published_year", "order": "SORT_ORDER_DESC"}
        ],
        "fields": [],
        "page": 1,
        "page_size": 25,
    },
)
data = res.json()
print(data["total_count"], "records,", data["search_time_ms"], "ms")`;
    }
    return `const res = await fetch("${ep.path}", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    filters: [
      { field: "publication_published_year", operator: "FILTER_OP_GTE", value: 2023 },
    ],
    sort: [
      { field: "publication_published_year", order: "SORT_ORDER_DESC" },
    ],
    fields: [],
    page: 1,
    page_size: 25,
  }),
});
console.log(await res.json());`;
  }

  // content (GET)
  if (lang === "curl") {
    return `curl -X GET "${ep.path}?chunk_id=YOUR_CHUNK_ID" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`;
  }
  if (lang === "python") {
    return `import requests

res = requests.get(
    "${ep.path}",
    params={"chunk_id": "YOUR_CHUNK_ID"},
    headers={"Authorization": "Bearer YOUR_API_TOKEN"},
)
print(res.json())`;
  }
  return `const url = new URL("${ep.path}");
url.searchParams.set("chunk_id", "YOUR_CHUNK_ID");
const res = await fetch(url, {
  headers: { Authorization: "Bearer YOUR_API_TOKEN" },
});
console.log(await res.json());`;
}

/* ---------- main page ---------- */
export default function Docs() {
  const [activeEp, setActiveEp] = useState<EndpointId>("agentic-search");
  const [activeSec, setActiveSec] = useState<string>("overview");
  const [lang, setLang] = useState<Lang>("curl");
  const [copied, setCopied] = useState(false);

  const ep = useMemo(() => ENDPOINTS.find((e) => e.id === activeEp)!, [activeEp]);
  const example = useMemo(() => buildExample(ep, lang), [ep, lang]);

  const articleRef = useRef<HTMLDivElement>(null);

  // hash sync ?endpoint=meta&section=params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("endpoint");
    const s = params.get("section");
    if (e === "meta") setActiveEp("meta-search");
    else if (e === "agentic") setActiveEp("agentic-search");
    else if (e === "content") setActiveEp("content");
    if (s && SECTIONS.find((x) => x.id === s)) setActiveSec(s);
  }, []);

  // when endpoint changes, scroll article to top & reset section
  useEffect(() => {
    setActiveSec("overview");
    articleRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeEp]);

  // intersection observer for section highlight
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    const els = SECTIONS.map((s) => root.querySelector<HTMLElement>(`#sec-${s.id}`)).filter(
      Boolean,
    ) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
          const id = visible.target.id.replace(/^sec-/, "");
          setActiveSec(id);
        }
      },
      { root, rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [activeEp]);

  const goSec = (id: string) => {
    const el = articleRef.current?.querySelector<HTMLElement>(`#sec-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(example);
      setCopied(true);
      toast("已复制示例代码");
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast("复制失败，请手动选择代码");
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--paper)] text-[var(--ink)]">
      <Sidebar active="docs" />

      <main className="flex-1 min-w-0 flex">
        {/* MIDDLE NAV (endpoints + sections) */}
        <aside className="w-[260px] shrink-0 border-r hairline px-5 py-7 hidden md:block sticky top-0 self-start h-screen overflow-y-auto">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
            API Reference
          </div>
          <h1 className="mt-1 font-display text-[20px] tracking-tight text-[var(--ink)]">
            开发者文档
          </h1>

          <div className="mt-5 space-y-1">
            {ENDPOINTS.map((e) => (
              <button
                key={e.id}
                onClick={() => setActiveEp(e.id)}
                className={cn(
                  "w-full text-left px-2.5 py-2 rounded-md flex items-center gap-2 text-[13px] transition-colors",
                  activeEp === e.id
                    ? "bg-[var(--paper-2)] text-[var(--ink)]"
                    : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]",
                )}>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded font-mono text-[9.5px] tracking-[0.12em]",
                    e.method === "POST"
                      ? "bg-[var(--brand-tint)] text-[var(--brand)]"
                      : "bg-[#eef7ee] text-[#15803d]",
                  )}>
                  {e.method}
                </span>
                <span className="truncate">/{e.id}</span>
              </button>
            ))}
          </div>

          <div className="mt-7 mb-1 font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
            On this page
          </div>
          <div className="space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => goSec(s.id)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded text-[12.5px] transition-colors",
                  activeSec === s.id
                    ? "text-[var(--ink)] bg-[var(--paper-2)]"
                    : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                )}>
                {s.label}
              </button>
            ))}
          </div>

          <Link href="/">
            <button className="mt-7 inline-flex items-center gap-1 text-[12.5px] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              返回 Experience
            </button>
          </Link>
        </aside>

        {/* ARTICLE */}
        <div
          ref={articleRef}
          className="flex-1 min-w-0 h-screen overflow-y-auto px-8 lg:px-14 py-10">
          <div className="max-w-[760px]">
            {/* heading */}
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--ink-3)]">
              Sciverse / API
            </div>
            <h1 className="mt-2 font-display text-[40px] leading-[1.08] tracking-tight text-[var(--ink)]">
              {ep.title}
            </h1>
            <p className="mt-4 text-[15px] leading-[1.75] text-[var(--ink-2)] max-w-[660px]">
              {ep.oneLine}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-[var(--ink-2)]">
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded font-mono text-[10px] tracking-[0.16em]",
                  ep.method === "POST"
                    ? "bg-[var(--brand-tint)] text-[var(--brand)]"
                    : "bg-[#eef7ee] text-[#15803d]",
                )}>
                {ep.method}
              </span>
              <code className="font-mono text-[12.5px] text-[var(--ink)] truncate">{ep.path}</code>
            </div>

            <div className="mt-3 inline-flex items-center gap-2 rounded-md border hairline bg-white px-3 py-1.5 text-[12px]">
              <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-3)]">
                鉴权
              </span>
              <code className="font-mono text-[var(--ink)]">Bearer Token</code>
              <span className="text-[var(--ink-3)]">·</span>
              <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-3)]">
                必填
              </span>
              <code className="font-mono text-[var(--ink)]">{ep.required.name}</code>
            </div>

            {/* OVERVIEW */}
            <Section id="overview" title="概述">
              {ep.id === "agentic-search" && (
                <>
                  <p>
                    <strong>适用场景：</strong>
                    当你想对学术问题进行智能检索时，发送一条自然语言查询，接口将在后台完成查询改写、多路召回和融合排序，直接返回最相关的文本片段。
                  </p>
                  <ModeRow
                    label="标准模式"
                    code="stream: false"
                    desc="一次性返回全部结果的 JSON 对象，适合大多数场景。"
                  />
                  <ModeRow
                    label="流式模式"
                    code="stream: true"
                    desc="通过 SSE 协议逐步推送结果，适合实时展示进度。"
                  />
                </>
              )}
              {ep.id === "meta-search" && (
                <>
                  <p>
                    <strong>适用场景：</strong>
                    当你已经知道要按年份、学科、期刊、DOI、标题等元数据字段查找论文记录时，使用 /meta-search 比自然语言搜索更直接。它返回结构化记录，不返回文本块召回过程。
                  </p>
                  <ModeRow
                    label="过滤"
                    code="filters[]"
                    desc="filters 是 FieldFilter 数组，每项包含 field、operator 和 value。operator 省略时由 metadata-service 按等值过滤处理。"
                  />
                  <ModeRow
                    label="分页"
                    code="page_size"
                    desc="page 从 1 开始，page_size 默认 25、最大 200。响应会返回 total_count 和 total_pages。"
                  />
                </>
              )}
              {ep.id === "content" && (
                <>
                  <p>
                    <strong>适用场景：</strong>
                    在 Agent UI 上展示 agentic-search 命中的引用片段时，使用 /content 回源原文，便于用户跳转到 PDF 指定页码或展开整段上下文。
                  </p>
                  <ModeRow
                    label="按片段"
                    code="chunk_id"
                    desc="使用 agentic-search 返回的 chunk_id，直接拿到该文本块原文。"
                  />
                  <ModeRow
                    label="按文档"
                    code="doc_id"
                    desc="使用文档级别 ID，可拿到完整文档的元信息与可访问字段。"
                  />
                </>
              )}
            </Section>

            {/* AUTH */}
            <Section id="auth" title="身份验证">
              <p>
                所有请求需在 HTTP Header 中携带 Bearer Token。Token 可在{" "}
                <a
                  className="text-[var(--brand)] hover:underline"
                  href="https://sciverse.space/tokens"
                  target="_blank"
                  rel="noreferrer">
                  API 令牌页
                </a>{" "}
                创建。
              </p>
              <CodeBlock label="HTTP" code={`Authorization: Bearer YOUR_API_TOKEN`} />
            </Section>

            {/* PARAMS */}
            <Section id="params" title="请求参数">
              {ep.method === "POST" ? (
                <p>
                  请求体为 JSON 格式，Content-Type 须设置为 <code>application/json</code>。
                </p>
              ) : (
                <p>请求参数以 query string 方式传递，例：?chunk_id=...&doc_id=...</p>
              )}

              <ParamTable rows={paramRowsFor(ep.id)} />

              {ep.id === "meta-search" && (
                <>
                  <Hairline />
                  <h4 className="mt-6 font-display text-[16px] text-[var(--ink)]">
                    FieldFilter — filters 数组中的每一项
                  </h4>
                  <ParamTable rows={FIELD_FILTER_ROWS} />
                  <h4 className="mt-7 font-display text-[16px] text-[var(--ink)]">
                    SortField — sort 数组中的每一项
                  </h4>
                  <ParamTable rows={SORT_FIELD_ROWS} />
                </>
              )}
            </Section>

            {/* RESPONSE */}
            <Section id="response" title="响应结构">
              {ep.id === "agentic-search" && (
                <>
                  <p>
                    成功时返回 HTTP 200，响应体包含 <code>hits</code>（搜索结果数组）、
                    <code>timings</code>（各阶段耗时）和 <code>debug</code>（调试信息，生产环境为
                    null）。
                  </p>
                  <h4 className="mt-6 font-display text-[16px] text-[var(--ink)]">
                    hits[*] — 单条结果字段
                  </h4>
                  <ParamTable rows={AGENTIC_HIT_ROWS} compact />
                </>
              )}
              {ep.id === "meta-search" && (
                <>
                  <p>
                    成功时返回 HTTP 200，响应体包含 <code>results</code>（元数据记录数组）、
                    <code>total_count</code>（总记录数）和 <code>search_time_ms</code>（metadata-service 查询耗时）。
                  </p>
                  <h4 className="mt-6 font-display text-[16px] text-[var(--ink)]">
                    SearchResponse 字段
                  </h4>
                  <ParamTable rows={META_RESPONSE_ROWS} compact />
                </>
              )}
              {ep.id === "content" && (
                <>
                  <p>
                    成功时返回 HTTP 200，响应体为命中片段的原文与所属文档元信息，便于在 Agent UI 中展示引用。
                  </p>
                  <ParamTable rows={CONTENT_RESPONSE_ROWS} compact />
                </>
              )}
            </Section>

            {/* ERRORS */}
            <Section id="errors" title="错误码">
              <p>
                {ep.id === "agentic-search" &&
                  "/agentic-search 的错误响应可能有两种格式：鉴权和连接类错误为扁平结构；请求处理类错误通常为嵌套结构。错误信息字段为 code / error.code 与 message / error.message。"}
                {ep.id === "meta-search" &&
                  "/meta-search 的错误响应通常为扁平结构；部分上游校验错误可能使用嵌套结构。错误信息字段为 code / error.code 与 message / error.message。"}
                {ep.id === "content" &&
                  "/content 的错误响应通常为扁平结构。建议根据 status code 与 message 字段处理。"}
              </p>
              <ErrorTable rows={errorRowsFor(ep.id)} />
            </Section>

            {/* footer try-it */}
            <div className="mt-14 mb-10 rounded-2xl border hairline bg-white p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-display text-[16px] text-[var(--ink)]">
                  在 Experience 实测这一接口
                </div>
                <div className="text-[12.5px] text-[var(--ink-2)] mt-0.5">
                  无需配置环境，直接在浏览器里看到检索结果。
                </div>
              </div>
              <Link href="/">
                <button className="inline-flex items-center gap-1.5 rounded-full border hairline bg-white text-[12.5px] px-3.5 py-1.5 hover:border-[var(--ink)] transition-colors">
                  打开 Experience
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT — example panel */}
        <aside className="w-[400px] shrink-0 border-l hairline px-5 py-7 hidden xl:block sticky top-0 self-start h-screen overflow-y-auto">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
            Request example
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <div className="font-display text-[16px] text-[var(--ink)]">完整调用示例</div>
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-1 rounded-full border hairline bg-white px-2.5 py-1 text-[11.5px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "已复制" : "复制"}
            </button>
          </div>

          <div className="mt-3 inline-flex p-0.5 rounded-full border hairline bg-white">
            {(["curl", "python", "node"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11.5px] uppercase font-mono tracking-[0.14em] transition-colors",
                  lang === l
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                )}>
                {l === "node" ? "Node" : l}
              </button>
            ))}
          </div>

          <pre className="mt-4 rounded-xl bg-[#0e0e12] text-[#e8e8ee] p-4 text-[12px] leading-[1.65] font-mono overflow-x-auto whitespace-pre">
{example}
          </pre>

          <div className="mt-5 rounded-xl border hairline bg-[var(--paper-2)] p-4">
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
              Response shape
            </div>
            <div className="mt-1 text-[12.5px] text-[var(--ink-2)] leading-relaxed">
              {ep.id === "agentic-search" && (
                <>
                  返回 <code className="font-mono">hits[]</code>、
                  <code className="font-mono">timings</code>、
                  <code className="font-mono">debug</code>。每条命中包含 chunk_id / title / abstract / score / pdf_page 等字段。
                </>
              )}
              {ep.id === "meta-search" && (
                <>
                  返回 <code className="font-mono">results[]</code>、
                  <code className="font-mono">total_count</code>、
                  <code className="font-mono">page</code>、
                  <code className="font-mono">page_size</code>、
                  <code className="font-mono">total_pages</code>、
                  <code className="font-mono">search_time_ms</code>。
                </>
              )}
              {ep.id === "content" && (
                <>
                  返回命中片段的 <code className="font-mono">content</code>、
                  <code className="font-mono">page_no</code>、
                  <code className="font-mono">offset</code>、
                  以及所属文档的 <code className="font-mono">title / doi / venue</code> 等元信息。
                </>
              )}
            </div>
          </div>

          <a
            href="https://sciverse.space/tokens"
            target="_blank"
            rel="noreferrer"
            className="mt-5 block rounded-xl border hairline bg-white p-4 hover:border-[var(--ink)] transition-colors">
            <div className="font-display text-[15px] text-[var(--ink)]">获取 API Token</div>
            <div className="mt-1 text-[12px] text-[var(--ink-2)] leading-relaxed">
              个人开发者免费额度 · 90 天有效期 · 单 Key 1k QPM。
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-[12px] text-[var(--ink)]">
              前往令牌页 <ArrowUpRight className="h-3 w-3" />
            </div>
          </a>
        </aside>
      </main>
    </div>
  );
}

/* ---------- subcomponents ---------- */
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`sec-${id}`} className="mt-14 scroll-mt-10">
      <h2 className="font-display text-[24px] tracking-tight text-[var(--ink)]">{title}</h2>
      <div className="mt-3 space-y-3 text-[14.5px] leading-[1.85] text-[var(--ink-2)]">
        {children}
      </div>
    </section>
  );
}

function Hairline() {
  return <div className="border-t hairline mt-6" />;
}

function ModeRow({ label, code, desc }: { label: string; code: string; desc: string }) {
  return (
    <div className="mt-3 grid grid-cols-[120px_1fr] gap-3 items-baseline">
      <div className="text-[13px] text-[var(--ink)] flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
        {label}
        <code className="font-mono text-[11px] text-[var(--ink-3)] bg-[var(--paper-2)] px-1.5 py-0.5 rounded">
          {code}
        </code>
      </div>
      <div className="text-[13px] text-[var(--ink-2)]">{desc}</div>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="mt-3 rounded-lg overflow-hidden border hairline">
      <div className="px-3 py-1.5 bg-[var(--paper-2)] font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
        {label}
      </div>
      <pre className="bg-[#0e0e12] text-[#e8e8ee] p-3 text-[12px] font-mono">{code}</pre>
    </div>
  );
}

type ParamRow = {
  name: string;
  type: string;
  required?: "必填" | "可选";
  desc: React.ReactNode;
};

function ParamTable({ rows, compact = false }: { rows: ParamRow[]; compact?: boolean }) {
  return (
    <div className="mt-4 rounded-xl border hairline overflow-hidden bg-white">
      <div className="grid grid-cols-[140px_120px_64px_1fr] gap-x-3 px-4 py-2.5 border-b hairline bg-[var(--paper-2)] font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-3)]">
        <span>参数</span>
        <span>类型</span>
        <span>必填</span>
        <span>说明</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.name}
          className={cn(
            "grid grid-cols-[140px_120px_64px_1fr] px-4 gap-x-3 text-[12.5px] items-baseline",
            compact ? "py-2.5" : "py-3.5",
            i !== rows.length - 1 && "border-b hairline",
          )}>
          <code className="font-mono text-[12.5px] text-[var(--ink)] break-all">{r.name}</code>
          <code className="font-mono text-[12px] text-[var(--ink-2)] break-all">{r.type}</code>
          <span
            className={cn(
              "text-[11.5px]",
              r.required === "必填" ? "text-[var(--brand)]" : "text-[var(--ink-3)]",
            )}>
            {r.required ?? "—"}
          </span>
          <div className="text-[var(--ink-2)] leading-[1.7]">{r.desc}</div>
        </div>
      ))}
    </div>
  );
}

function ErrorTable({ rows }: { rows: { code: number; meaning: string; advice: string }[] }) {
  return (
    <div className="mt-4 rounded-xl border hairline overflow-hidden bg-white">
      <div className="grid grid-cols-[72px_160px_1fr] gap-x-3 px-4 py-2.5 border-b hairline bg-[var(--paper-2)] font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-3)]">
        <span>状态码</span>
        <span>含义</span>
        <span>处理建议</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.code}
          className={cn(
            "grid grid-cols-[72px_160px_1fr] px-4 py-3 gap-x-3 text-[12.5px] items-baseline",
            i !== rows.length - 1 && "border-b hairline",
          )}>
          <code className="font-mono text-[var(--ink)]">{r.code}</code>
          <span className="text-[var(--ink)]">{r.meaning}</span>
          <span className="text-[var(--ink-2)] leading-[1.7]">{r.advice}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- data: param/response/error rows (按真实文档逐字录入) ---------- */
function paramRowsFor(id: EndpointId): ParamRow[] {
  if (id === "agentic-search")
    return [
      {
        name: "query",
        type: "string",
        required: "必填",
        desc: "搜索关键词或自然语言问题，最长 4096 个字符。这是唯一必填项。",
      },
      {
        name: "source_types",
        type: "array | null（默认 null）",
        required: "可选",
        desc: (
          <>
            按来源类型过滤，不填则搜索全部来源。可选值：<code>web</code> / <code>pdf</code>。
          </>
        ),
      },
      {
        name: "filters",
        type: "object | null（默认 null）",
        required: "可选",
        desc: "额外过滤条件，当前版本保留字段，传 null 即可。",
      },
      {
        name: "request_id",
        type: "string | null（默认 null）",
        required: "可选",
        desc: "自定义请求追踪 ID，方便日志关联；不填时系统自动生成。",
      },
    ];
  if (id === "meta-search")
    return [
      {
        name: "filters",
        type: "FieldFilter[]（默认 []）",
        required: "可选",
        desc: (
          <>
            过滤条件数组。例如按年份筛选时，field 写
            <code> publication_published_year</code>，operator 写
            <code> FILTER_OP_GTE</code>，value 写 <code>2023</code>。可选 operator：
            <code>FILTER_OP_EQ</code> / <code>FILTER_OP_NE</code> / <code>FILTER_OP_GT</code> /
            <code> FILTER_OP_GTE</code> / <code>FILTER_OP_LT</code> / <code>FILTER_OP_LTE</code> /
            <code> FILTER_OP_IN</code> / <code>FILTER_OP_NIN</code> / <code>FILTER_OP_CONTAINS</code>。
          </>
        ),
      },
      {
        name: "sort",
        type: "SortField[]（默认 []）",
        required: "可选",
        desc: (
          <>
            排序条件数组。当前主要用于按 <code>publication_published_year</code> 排序。可选 order：
            <code> SORT_ORDER_DESC</code> / <code>SORT_ORDER_ASC</code>。
          </>
        ),
      },
      {
        name: "fields",
        type: "string[]（默认 []）",
        required: "可选",
        desc: "返回字段投影。为空时返回 metadata-service 默认字段；只传业务需要字段可减少响应体。字段名必须使用 metadata-service 支持的元数据字段。",
      },
      {
        name: "page",
        type: "integer（默认 1）",
        required: "可选",
        desc: "页码，从 1 开始。",
      },
      {
        name: "page_size",
        type: "integer（默认 25）",
        required: "可选",
        desc: "每页数量，范围 1–200。",
      },
    ];
  // content
  return [
    {
      name: "chunk_id",
      type: "string",
      required: "可选",
      desc: "agentic-search 命中片段的 ID。chunk_id 与 doc_id 至少传一个。",
    },
    {
      name: "doc_id",
      type: "string",
      required: "可选",
      desc: "文档级别 ID，可拿到完整文档的元信息与可访问字段。chunk_id 与 doc_id 至少传一个。",
    },
  ];
}

const FIELD_FILTER_ROWS: ParamRow[] = [
  {
    name: "field",
    type: "string",
    required: "必填",
    desc: "要过滤的元数据字段名。例：publication_published_year 表示发表年份。字段名必须由服务端支持。",
  },
  {
    name: "operator",
    type: "FilterOperator",
    required: "可选",
    desc: "比较方式。不传时服务端按等值过滤处理。FILTER_OP_EQ 等于；FILTER_OP_GTE 大于等于；FILTER_OP_LTE 小于等于；FILTER_OP_IN 在数组中；FILTER_OP_CONTAINS 包含。",
  },
  {
    name: "value",
    type: "string | number | boolean | array",
    required: "必填",
    desc: "比较值。年份通常传数字，例如 2023；DOI 或标题通常传字符串；使用 FILTER_OP_IN / FILTER_OP_NIN 时传数组。",
  },
];

const SORT_FIELD_ROWS: ParamRow[] = [
  {
    name: "field",
    type: "string",
    required: "必填",
    desc: "要排序的字段。当前建议只使用 publication_published_year。",
  },
  {
    name: "order",
    type: "SortOrder",
    required: "可选",
    desc: "排序方向。SORT_ORDER_DESC 从大到小（年份从新到旧）；SORT_ORDER_ASC 从小到大（年份从旧到新）。不传时使用默认排序方向。",
  },
];

const AGENTIC_HIT_ROWS: ParamRow[] = [
  { name: "chunk_id", type: "string", desc: "文本块的唯一 ID。" },
  { name: "doc_id", type: "string", desc: "所属文档 ID；非必返字段。" },
  { name: "title", type: "string", desc: "文档或网页标题。" },
  { name: "abstract", type: "string", desc: "该文本块的摘要内容。" },
  {
    name: "chunk",
    type: "string",
    desc: "文本块正文。ES 召回或混合路径下常为索引中的 content；纯向量召回且未写入 ES 时可能为空。",
  },
  { name: "score", type: "number", desc: "相关性分数，越高越相关。" },
  { name: "source_type", type: "string", desc: "来源类型。" },
  { name: "pdf_page", type: "integer | null", desc: "命中内容所在 PDF 页码（仅 PDF 来源）。" },
  { name: "offset", type: "integer", desc: "命中文本在原文中的起始字节偏移。" },
  { name: "page_no", type: "integer", desc: "命中文本所在页码或分片页序号。" },
];

const META_RESPONSE_ROWS: ParamRow[] = [
  { name: "results", type: "object[]", desc: "元数据记录数组。字段由 fields 投影和服务端默认字段决定。" },
  { name: "total_count", type: "integer", desc: "符合条件的总记录数。" },
  { name: "page", type: "integer", desc: "当前页码。" },
  { name: "page_size", type: "integer", desc: "本次请求的每页数量。" },
  { name: "total_pages", type: "integer", desc: "总页数。" },
  { name: "search_time_ms", type: "number", desc: "metadata-service 检索耗时，单位毫秒。" },
];

const CONTENT_RESPONSE_ROWS: ParamRow[] = [
  { name: "content", type: "string", desc: "命中片段的原文文本。" },
  { name: "page_no", type: "integer", desc: "命中文本所在页码或分片页序号。" },
  { name: "pdf_page", type: "integer | null", desc: "命中内容所在 PDF 页码（仅 PDF 来源）。" },
  { name: "offset", type: "integer", desc: "命中文本在原文中的起始字节偏移。" },
  { name: "doc.title", type: "string", desc: "所属文档标题。" },
  { name: "doc.doi", type: "string | null", desc: "所属文档 DOI。" },
  { name: "doc.venue", type: "string | null", desc: "所属文档出版地名称。" },
];

function errorRowsFor(id: EndpointId) {
  if (id === "agentic-search")
    return [
      { code: 400, meaning: "请求参数错误", advice: "请求体格式或参数不符合要求，请检查 query、top_k 等字段。" },
      { code: 401, meaning: "鉴权失败", advice: "Bearer Token 缺失、无效、已过期，或 Token 所属用户不可用。" },
      { code: 405, meaning: "方法不允许", advice: "接口仅支持 POST 请求。" },
      { code: 500, meaning: "请求处理失败", advice: "服务处理请求时出错，请稍后重试；如持续出现，请联系支持并提供 request_id。" },
      { code: 502, meaning: "服务连接失败", advice: "服务暂时无法建立必要连接，请稍后重试；如持续出现，请联系支持。" },
      { code: 503, meaning: "服务暂不可用", advice: "服务暂时不可用，请稍后重试。" },
    ];
  if (id === "meta-search")
    return [
      { code: 400, meaning: "请求参数错误", advice: "请求体不是合法 SearchRequest，或 filters/sort/page/page_size 不符合约束。" },
      { code: 401, meaning: "鉴权失败", advice: "Bearer Token 缺失、无效、已过期，或 Token 所属用户不可用。" },
      { code: 403, meaning: "权限不足", advice: "metadata-service 拒绝访问当前字段或资源。" },
      { code: 404, meaning: "未找到", advice: "metadata-service 返回目标资源不存在。" },
      { code: 429, meaning: "请求过多", advice: "metadata-service 返回资源耗尽或限流。" },
      { code: 502, meaning: "元数据服务不可用", advice: "无法连接 metadata-service，或上游返回 UNKNOWN/UNAVAILABLE。" },
      { code: 503, meaning: "服务未配置", advice: "后端未配置 METADATA_GRPC_ADDR，无法调用 metadata-service。" },
      { code: 504, meaning: "上游超时", advice: "metadata-service 查询超时，请缩小条件后重试。" },
    ];
  return [
    { code: 400, meaning: "请求参数错误", advice: "未提供 chunk_id 或 doc_id，或参数格式不正确。" },
    { code: 401, meaning: "鉴权失败", advice: "Bearer Token 缺失、无效或已过期。" },
    { code: 404, meaning: "未找到", advice: "对应 chunk_id / doc_id 不存在或已被删除。" },
    { code: 503, meaning: "服务暂不可用", advice: "回源服务繁忙，请稍后重试。" },
  ];
}
