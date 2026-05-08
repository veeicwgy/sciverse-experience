/*
 * Sciverse · API Docs (三接口统一)
 * /agentic-search · /content · /meta-search
 * Layout: Sidebar + 中间内容 + 右侧请求/响应
 * Style: Editorial Lab; method badge POST绿/GET紫蓝；inline code chip；黑色药丸 CTA
 */
import { useMemo, useState } from "react";
import {
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

type Method = "POST" | "GET";
type Param = {
  name: string;
  type: string;
  required?: boolean;
  desc: string;
};

type Endpoint = {
  id: string;
  method: Method;
  path: string;
  title: string;
  summary: string;
  params: Param[];
  response: string;
  curl: string;
  python: string;
  responseJson: string;
};

const ENDPOINTS: Endpoint[] = [
  {
    id: "agentic-search",
    method: "POST",
    path: "https://api.sciverse.space/agentic-search",
    title: "智能语义检索 · Agentic Search",
    summary:
      "输入自然语言问题，返回来自学术文献和可信网页的相关文本片段并附带相关性分数。支持全文检索、向量语义搜索及两者融合，可按 source_types 过滤来源。",
    params: [
      { name: "query", type: "string", required: true, desc: "搜索关键词或自然语言问题，最长 4096 个字符。" },
      { name: "top_k", type: "integer", desc: "返回结果数，默认 10，最大 50。" },
      { name: "source_types", type: "string[]", desc: "结果来源筛选：paper · web · patent · book。" },
      { name: "stream", type: "boolean", desc: "是否启用 SSE 流式输出，默认 false。" },
    ],
    response:
      "返回 hits[]：每条包含 doc_id · title · chunk · score(0-1) · source_type · pdf_page。stream=true 时按 SSE 协议逐步推送。",
    curl: `curl -X POST https://api.sciverse.space/agentic-search \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "CRISPR 在体内基因编辑的递送策略",
    "top_k": 10,
    "source_types": ["paper", "patent"],
    "stream": false
  }'`,
    python: `import requests

res = requests.post(
    "https://api.sciverse.space/agentic-search",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "query": "CRISPR 在体内基因编辑的递送策略",
        "top_k": 10,
        "source_types": ["paper", "patent"],
    },
)
print(res.json())`,
    responseJson: `{
  "hits": [
    {
      "doc_id": "10.1038/s41591-024-02873-2",
      "title": "Long-term Pulmonary Sequelae of COVID-19",
      "chunk": "At 12-month follow-up, 23% of patients showed reduced DLCO ...",
      "score": 0.93,
      "source_type": "paper",
      "pdf_page": 4
    }
  ],
  "search_time_ms": 432,
  "total": 20
}`,
  },
  {
    id: "content",
    method: "GET",
    path: "https://api.sciverse.space/content",
    title: "原文片段获取 · Content",
    summary:
      "根据 doc_id 拉取经清洗后的原文段落，用于二次校验或写入 Agent 的引用上下文。",
    params: [
      { name: "doc_id", type: "string", required: true, desc: "文档唯一标识，可来自 agentic-search 的返回。" },
      { name: "page", type: "integer", desc: "指定页码（PDF 类来源）。" },
    ],
    response:
      "返回 content：纯文本段落数组；附带 cleaning_log（说明本次清洗的 HTML/Markdown 残片移除情况）。",
    curl: `curl -X GET "https://api.sciverse.space/content?doc_id=10.1038/s41591-024-02873-2&page=4" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
    python: `import requests

res = requests.get(
    "https://api.sciverse.space/content",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    params={"doc_id": "10.1038/s41591-024-02873-2", "page": 4},
)
print(res.json())`,
    responseJson: `{
  "doc_id": "10.1038/s41591-024-02873-2",
  "content": [
    "At 12-month follow-up, 23% of patients showed reduced DLCO ..."
  ],
  "cleaning_log": {
    "removed_html_tags": 12,
    "removed_md_artifacts": 4
  }
}`,
  },
  {
    id: "meta-search",
    method: "POST",
    path: "https://api.sciverse.space/meta-search",
    title: "结构化元数据检索 · Meta Search",
    summary:
      "调用元数据服务进行结构化筛选，可按年份、主题、DOI 与其他字段过滤论文记录，结果与 agentic-search 互补。",
    params: [
      { name: "query", type: "string", desc: "全文检索关键词（匹配 title / abstract / keywords / publication_venue_name）。" },
      { name: "filters", type: "object[]", desc: "结构化过滤条件，例如年份、学科、DOI。" },
      { name: "sort", type: "object[]", desc: "排序字段与方向，例如按发表年份倒序。" },
      { name: "fields", type: "string[]", desc: "返回字段子集，默认全部。" },
    ],
    response:
      "返回 SearchResponse：results · total_count · page · page_size · total_pages · search_time_ms。",
    curl: `curl -X POST https://api.sciverse.space/meta-search \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "filters": [
      { "field": "publication_published_year",
        "operator": "FILTER_OP_GTE", "value": 2023 }
    ],
    "sort": [
      { "field": "publication_published_year",
        "order": "SORT_ORDER_DESC" }
    ],
    "fields": []
  }'`,
    python: `import requests

res = requests.post(
    "https://api.sciverse.space/meta-search",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "filters": [
            {
                "field": "publication_published_year",
                "operator": "FILTER_OP_GTE",
                "value": 2023,
            }
        ],
        "sort": [
            {
                "field": "publication_published_year",
                "order": "SORT_ORDER_DESC",
            }
        ],
        "fields": [],
    },
)
print(res.json())`,
    responseJson: `{
  "results": [ {"...": "..."} ],
  "total_count": 70164871,
  "page": 1,
  "page_size": 10,
  "total_pages": 7016488,
  "search_time_ms": 1186.95
}`,
  },
];

const TOC = [
  { id: "overview", label: "概述" },
  { id: "auth", label: "身份验证" },
  { id: "request", label: "请求示例" },
  { id: "params", label: "请求参数" },
  { id: "response", label: "响应结构" },
  { id: "errors", label: "错误码" },
];

function CopyButton({ text, label = "复制" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        toast.success("已复制到剪贴板");
        setTimeout(() => setOk(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-[11.5px] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
      {ok ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {ok ? "已复制" : label}
    </button>
  );
}

function CodeBlock({
  language,
  code,
  copyText,
}: {
  language: string;
  code: string;
  copyText?: string;
}) {
  // simple syntax tinting via regex-coloring inside <pre>
  const html = useMemo(() => {
    let s = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    s = s.replace(/("[^"\n]*")/g, '<span class="tk-str">$1</span>');
    s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tk-num">$1</span>');
    s = s.replace(
      /\b(curl|requests|post|get|json|headers|print|import|true|false|null|None|True|False)\b/g,
      '<span class="tk-key">$1</span>',
    );
    s = s.replace(/(#[^\n]*$)/gm, '<span class="tk-cmt">$1</span>');
    s = s.replace(/(--?[a-zA-Z-]+)/g, '<span class="tk-op">$1</span>');
    return s;
  }, [code]);
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
          {language}
        </span>
        <CopyButton text={copyText ?? code} />
      </div>
      <pre
        className="code-block whitespace-pre"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function MethodPill({ method }: { method: Method }) {
  return (
    <span className={cn("method-badge", method === "POST" ? "method-post" : "method-get")}>
      {method}
    </span>
  );
}

export default function Docs() {
  const [activeId, setActiveId] = useState<string>("agentic-search");
  const [tab, setTab] = useState<"curl" | "python">("curl");
  const ep = ENDPOINTS.find((e) => e.id === activeId)!;

  return (
    <div className="min-h-screen flex">
      <Sidebar active="docs" />
      <main className="flex-1 min-w-0 flex">
        {/* SUB-NAV: endpoint list + TOC */}
        <aside className="hidden lg:block w-[240px] shrink-0 border-r hairline px-5 py-8 sticky top-0 h-screen overflow-y-auto">
          <div className="section-marker mb-4">§ Docs / v0.1</div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)] mb-2">
              接口
            </div>
            <ul className="space-y-1">
              {ENDPOINTS.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => setActiveId(e.id)}
                    className={cn(
                      "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md group transition-colors",
                      activeId === e.id
                        ? "bg-white border hairline"
                        : "hover:bg-[#f1f0eb]",
                    )}>
                    <MethodPill method={e.method} />
                    <span className="font-mono text-[12px] text-[var(--ink-2)] group-hover:text-[var(--ink)] truncate">
                      /{e.id}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-5 border-t hairline">
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)] mb-2">
              目录
            </div>
            <ul className="space-y-1">
              {TOC.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="flex items-center gap-1.5 text-[12.5px] text-[var(--ink-2)] hover:text-[var(--ink)] py-0.5">
                    <Hash className="h-3 w-3 text-[var(--ink-3)]" />
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="https://sciverse.space/docs"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-1 text-[12px] link-edit">
            <ExternalLink className="h-3 w-3" />
            访问完整在线文档
          </a>
        </aside>

        {/* MAIN content */}
        <div className="flex-1 min-w-0 grid lg:grid-cols-[1fr_440px] gap-0">
          {/* center column */}
          <section className="px-8 lg:px-12 py-10 max-w-[760px]">
            <div className="section-marker mb-4">§ {ep.id.toUpperCase()}</div>
            <div className="flex flex-wrap items-center gap-3">
              <MethodPill method={ep.method} />
              <span className="font-mono text-[13px] text-[var(--ink)] break-all">
                {ep.path}
              </span>
              <a
                href="#request"
                className="ml-auto btn-ghost !py-1 !px-2.5 text-[11.5px]">
                查看示例
                <ChevronRight className="h-3 w-3" />
              </a>
            </div>

            <h1 className="mt-5 font-display text-[34px] leading-[1.15] tracking-[-0.02em] text-[var(--ink)]">
              {ep.title}
            </h1>
            <p className="mt-3 text-[14.5px] leading-[1.8] text-[var(--ink-2)]">
              {ep.summary}
            </p>

            {/* overview */}
            <div id="overview" className="mt-10">
              <div className="section-marker mb-2">§ Overview</div>
              <h2 className="font-display text-[22px] text-[var(--ink)]">概述</h2>
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <div className="card-paper p-4">
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                    标准模式
                  </div>
                  <div className="mt-1 text-[13.5px] text-[var(--ink)]">
                    <span className="code-chip">stream: false</span> · 一次性返回完整 JSON 对象
                  </div>
                </div>
                <div className="card-paper p-4">
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                    流式模式
                  </div>
                  <div className="mt-1 text-[13.5px] text-[var(--ink)]">
                    <span className="code-chip">stream: true</span> · SSE 协议逐步推送 hits
                  </div>
                </div>
              </div>
            </div>

            {/* auth */}
            <div id="auth" className="mt-10">
              <div className="section-marker mb-2">§ Auth</div>
              <h2 className="font-display text-[22px] text-[var(--ink)]">身份验证</h2>
              <p className="mt-2 text-[14px] leading-[1.8] text-[var(--ink-2)]">
                所有接口使用 <span className="code-chip">Authorization: Bearer YOUR_TOKEN</span>{" "}
                头部完成鉴权。免费层每开发者最多 5 个 Token，单 Token 默认 1k QPM；
                可在<a href="/tokens" className="link-edit"> API Key 管理 </a>页创建与管理。
              </p>
            </div>

            {/* params */}
            <div id="params" className="mt-10">
              <div className="section-marker mb-2">§ Parameters</div>
              <h2 className="font-display text-[22px] text-[var(--ink)]">请求参数</h2>
              <div className="mt-3 card-paper overflow-hidden">
                <div className="grid grid-cols-[140px_110px_1fr] text-[11.5px] tracking-[0.12em] uppercase font-mono text-[var(--ink-3)] px-4 py-2.5 bg-[var(--paper-2)] border-b hairline">
                  <span>字段</span>
                  <span>类型</span>
                  <span>说明</span>
                </div>
                {ep.params.map((p) => (
                  <div
                    key={p.name}
                    className="grid grid-cols-[140px_110px_1fr] px-4 py-3 border-b hairline last:border-0 items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[12.5px] text-[var(--ink)]">
                        {p.name}
                      </span>
                      {p.required && (
                        <span className="text-[10px] font-mono text-[var(--brand)] bg-[var(--brand-soft)] px-1.5 py-0.5 rounded">
                          必填
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[12px] text-[var(--ink-2)]">
                      {p.type}
                    </div>
                    <div className="text-[13px] text-[var(--ink-2)] leading-relaxed">
                      {p.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* response */}
            <div id="response" className="mt-10">
              <div className="section-marker mb-2">§ Response</div>
              <h2 className="font-display text-[22px] text-[var(--ink)]">响应结构</h2>
              <p className="mt-2 text-[14px] leading-[1.8] text-[var(--ink-2)]">
                {ep.response}
              </p>
            </div>

            {/* errors */}
            <div id="errors" className="mt-10">
              <div className="section-marker mb-2">§ Errors</div>
              <h2 className="font-display text-[22px] text-[var(--ink)]">错误码</h2>
              <div className="mt-3 card-paper overflow-hidden">
                {[
                  { code: "A0202", msg: "Token 错误", hint: "检查是否包含 Bearer 前缀。" },
                  { code: "A0211", msg: "Token 过期", hint: "前往 API Key 管理页创建新 Token。" },
                  { code: "-60005", msg: "请求体过大", hint: "query 字段最长 4096，filters 体积控制在 64KB 内。" },
                  { code: "-60018", msg: "每日额度已达上限", hint: "免费层每日 1,000 次 agentic-search。" },
                ].map((e, i) => (
                  <div
                    key={e.code}
                    className={cn(
                      "grid grid-cols-[110px_140px_1fr] px-4 py-3 items-baseline",
                      i !== 0 && "border-t hairline",
                    )}>
                    <span className="font-mono text-[12.5px] text-[var(--ink)]">
                      {e.code}
                    </span>
                    <span className="text-[13px] text-[var(--ink)]">{e.msg}</span>
                    <span className="text-[12.5px] text-[var(--ink-2)]">
                      {e.hint}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 pt-6 border-t hairline flex items-center justify-between">
              {ENDPOINTS.findIndex((e) => e.id === activeId) > 0 ? (
                <button
                  onClick={() =>
                    setActiveId(ENDPOINTS[ENDPOINTS.findIndex((e) => e.id === activeId) - 1].id)
                  }
                  className="btn-ghost">
                  ← 上一接口
                </button>
              ) : <span />}
              {ENDPOINTS.findIndex((e) => e.id === activeId) < ENDPOINTS.length - 1 ? (
                <button
                  onClick={() =>
                    setActiveId(ENDPOINTS[ENDPOINTS.findIndex((e) => e.id === activeId) + 1].id)
                  }
                  className="btn-ink">
                  下一接口
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : <span />}
            </div>
          </section>

          {/* right column: request + response */}
          <aside id="request" className="px-8 lg:pl-0 lg:pr-10 py-10">
            <div className="sticky top-6 space-y-4">
              <div className="card-paper p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink-3)]">
                      请求示例
                    </span>
                  </div>
                  <div className="inline-flex rounded-full border hairline p-0.5 text-[11.5px]">
                    {(["curl", "python"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                          "px-2.5 py-1 rounded-full transition-colors font-mono uppercase tracking-[0.06em]",
                          tab === t
                            ? "bg-[var(--ink)] text-white"
                            : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                        )}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <CodeBlock
                  language={tab === "curl" ? "shell" : "python"}
                  code={tab === "curl" ? ep.curl : ep.python}
                />
              </div>

              <div className="card-paper p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink-3)]">
                    响应示例
                  </span>
                  <span className="font-mono text-[10px] text-[var(--ink-3)]">
                    application/json
                  </span>
                </div>
                <CodeBlock language="json" code={ep.responseJson} />
              </div>

              <a
                href="/experience"
                className="card-paper p-4 flex items-center gap-3 group">
                <div className="h-9 w-9 rounded-full bg-[var(--brand-soft)] grid place-items-center">
                  <ChevronRight className="h-4 w-4 text-[var(--brand)] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <div className="text-[13px] text-[var(--ink)]">
                    在 Experience 中实测此接口
                  </div>
                  <div className="text-[11.5px] text-[var(--ink-3)]">
                    实时查看清洗后的结果与计费
                  </div>
                </div>
              </a>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
