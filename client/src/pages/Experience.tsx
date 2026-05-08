/*
 * Sciverse · Experience Page (主入口)
 * Layout: Sidebar (260/64) + Main (search · skills bubble · result list · ecosystem · data capability)
 * Style: Editorial Lab — paper #FAFAF7, hairline #ECECE7, brand #5B5BF7, Fraunces+Inter+JetBrainsMono
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  ArrowUp,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  ExternalLink,
  Sparkles,
  Zap,
  Activity,
  Globe2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import SkillsBubble from "@/components/experience/SkillsBubble";
import { cn } from "@/lib/utils";

type Result = {
  id: string;
  source_type: "PDF" | "Web" | "Patent" | "Book";
  domain: string;
  title: string;
  year: number;
  venue: string;
  page?: number;
  score: number; // 0-1
  abstract: string;
  doi?: string;
};

const SAMPLES = [
  "CRISPR 基因编辑",
  "蛋白质折叠预测",
  "COVID-19 长期效应",
  "逆合成路径规划",
  "阿尔茨海默症靶点",
  "锂电池固态电解质",
];

const PRESET_RESULTS: Record<string, Result[]> = {
  default: [
    {
      id: "r1",
      source_type: "PDF",
      domain: "生命科学",
      title: "Long-term Pulmonary Sequelae of COVID-19: a 24-month Follow-up Cohort",
      year: 2024,
      venue: "Nature Medicine",
      page: 4,
      score: 0.93,
      abstract:
        "在 12 个月随访时，23% 患者的 DLCO 较健康对照下降，提示病毒感染后存在持续性肺损伤。研究在 24 个月仍观察到弥散功能未完全恢复的亚群，且与急性期严重程度独立相关。",
      doi: "10.1038/s41591-024-02873-2",
    },
    {
      id: "r2",
      source_type: "PDF",
      domain: "结构生物学",
      title:
        "AlphaFold-Multimer Improves Heterodimer Prediction for Membrane-Bound Receptors",
      year: 2023,
      venue: "Cell",
      page: 11,
      score: 0.88,
      abstract:
        "通过引入界面残基的注意力先验，AlphaFold-Multimer 在 GPCR-G 蛋白复合物上的中位 DockQ 提升 0.21；对未公开测试集的盲评显示该方法在跨膜受体上的稳健性显著优于早期版本。",
      doi: "10.1016/j.cell.2023.08.022",
    },
    {
      id: "r3",
      source_type: "Web",
      domain: "化学合成",
      title:
        "Retrosynthetic Planning with Templated Transformer and Reaction-Aware Reranking",
      year: 2024,
      venue: "JACS Au",
      score: 0.81,
      abstract:
        "提出一种结合 SMILES 模板与 reaction-aware 重排序的逆合成模型，在 USPTO-50K 上 top-10 命中率达到 92.4%；并在 1976-2024 专利反应中验证了对长链复杂分子的可扩展性。",
    },
    {
      id: "r4",
      source_type: "PDF",
      domain: "神经退行性疾病",
      title:
        "Tau-targeting Bifunctional Degraders Restore Synaptic Function in Murine Models",
      year: 2025,
      venue: "Science Translational Medicine",
      page: 7,
      score: 0.74,
      abstract:
        "针对磷酸化 Tau 设计的 PROTAC 双功能降解剂在 P301S 模型中显著降低 pS396 水平，并在 8 周给药后恢复海马 LTP；剂量-效应曲线提示存在治疗窗口的可调性。",
    },
  ],
};

function highlightKeywords(text: string, q: string) {
  if (!q.trim()) return text;
  try {
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(re);
    return parts.map((p, i) =>
      re.test(p) ? (
        <mark
          key={i}
          className="bg-transparent text-[var(--brand)] font-medium"
          style={{
            backgroundImage:
              "linear-gradient(transparent 62%, rgba(91,91,247,0.18) 62%)",
          }}>
          {p}
        </mark>
      ) : (
        <span key={i}>{p}</span>
      ),
    );
  } catch {
    return text;
  }
}

function RelevanceDots({ score }: { score: number }) {
  const filled = Math.round(score * 5);
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={cn("dot", i < filled && "on")} />
      ))}
      <span className="ml-1 font-mono text-[11px] text-[var(--ink-3)]">
        {score.toFixed(2)}
      </span>
    </div>
  );
}

function ResultCard({ r, q }: { r: Result; q: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="card-paper p-5 ed-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="method-badge method-post">{r.source_type}</span>
          <span className="code-chip">{r.domain}</span>
        </div>
        <RelevanceDots score={r.score} />
      </div>

      <h3 className="mt-3 font-display text-[20px] leading-[1.32] text-[var(--ink)]">
        {highlightKeywords(r.title, q)}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--ink-2)]">
        <span className="font-mono text-[12px]">{r.year}</span>
        <span className="text-[var(--hairline-strong)]">·</span>
        <span className="italic">{r.venue}</span>
        {r.page && (
          <>
            <span className="text-[var(--hairline-strong)]">·</span>
            <span>第 {r.page} 页</span>
          </>
        )}
        {r.doi && (
          <>
            <span className="text-[var(--hairline-strong)]">·</span>
            <a className="link-edit" href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">
              doi:{r.doi}
            </a>
          </>
        )}
      </div>

        <div
        className={cn(
          "mt-3 text-[14px] leading-[1.78] text-[var(--ink)]",
          !expanded && "line-clamp-3",
          expanded && "max-h-[320px] overflow-y-auto pr-2 result-scroll",
        )}>
        <span className="text-[var(--ink-3)] mr-1.5">“</span>
        {highlightKeywords(r.abstract, q)}
        <span className="text-[var(--ink-3)] ml-1">”</span>
      </div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 inline-flex items-center gap-1 text-[12.5px] text-[var(--brand)] hover:underline">
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {expanded ? "收起" : "展开全文"}
      </button>
    </article>
  );
}

function HeroHeader() {
  return (
    <header className="relative pt-16 pb-8">
      <h1 className="font-display text-[clamp(36px,4.6vw,52px)] leading-[1.06] tracking-[-0.02em] text-[var(--ink)] max-w-[840px]">
        让 Agent 真正读懂 <span className="text-[var(--brand)]">科学世界</span>
      </h1>
    </header>
  );
}

export default function Experience() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [meta, setMeta] = useState<{ count: number; ms: number } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const composing = useRef(false);

  // URL ?q=
  useEffect(() => {
    const u = new URL(window.location.href);
    const q = u.searchParams.get("q");
    if (q) {
      setQuery(q);
      submit(q);
    }
    // popstate
    const onPop = () => {
      const nu = new URL(window.location.href);
      const nq = nu.searchParams.get("q") || "";
      setQuery(nq);
      if (nq) submit(nq);
      else {
        setResults(null);
        setMeta(null);
        setCommitted("");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = query.trim().length > 0 && !loading;

  const submit = async (q?: string) => {
    const value = (q ?? query).trim();
    if (!value) return;
    setLoading(true);
    setCommitted(value);
    setPage(1);
    // sync URL
    const url = new URL(window.location.href);
    url.searchParams.set("q", value);
    window.history.pushState({}, "", url.toString());

    const start = performance.now();
    // 模拟检索（200-700ms）
    await new Promise((r) => setTimeout(r, 520 + Math.random() * 280));
    const elapsed = Math.round(performance.now() - start) + 1200; // 加上"三路并行+LLM 清洗"的虚拟耗时
    setResults(PRESET_RESULTS.default);
    setMeta({ count: PRESET_RESULTS.default.length, ms: elapsed });
    setLoading(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !composing.current && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const clear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar active="experience" />

      <main className="flex-1 min-w-0">
        <div className="flex-1 min-w-0 max-w-[960px] mx-auto px-8 lg:px-12 py-2">
          <HeroHeader />

          {/* SEARCH */}
          <section className="relative">
            <div
              className={cn(
                "card-paper px-5 pt-4 pb-3 flex flex-col gap-2 transition-all duration-300",
                "focus-within:border-[var(--ink)] focus-within:shadow-[0_18px_42px_-28px_rgba(20,20,30,0.25)]",
              )}>
              <textarea
                ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 220) + "px";
                }}
                onKeyDown={onKey as unknown as React.KeyboardEventHandler<HTMLTextAreaElement>}
                onCompositionStart={() => (composing.current = true)}
                onCompositionEnd={() => (composing.current = false)}
                disabled={loading}
                rows={2}
                placeholder="输入科学问题或关键词，例：mRNA 疫苗递送系统"
                className="w-full bg-transparent outline-none text-[15.5px] leading-[1.7] placeholder-fade placeholder:text-[var(--ink-3)] disabled:opacity-60 resize-none min-h-[88px] max-h-[220px]"
              />
              <div className="flex items-center justify-end pt-1">
                <div className="flex items-center gap-1.5">
                  {query && (
                    <button
                      onClick={clear}
                      aria-label="清空"
                      className="h-9 w-9 inline-flex items-center justify-center rounded-full text-[var(--ink-3)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => submit()}
                    disabled={!canSubmit}
                    aria-label="发送"
                    className={cn(
                      "h-9 w-9 inline-flex items-center justify-center rounded-full transition-all",
                      canSubmit && !loading
                        ? "bg-[var(--ink)] text-white hover:bg-black shadow-sm"
                        : "bg-[#ececec] text-[var(--ink-3)]",
                    )}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* sample tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink-3)] mr-1">
                试试
              </span>
              {SAMPLES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    submit(s);
                  }}
                  className="text-[12.5px] px-3 py-1.5 rounded-full border hairline bg-white text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* STATUS + RESULTS */}
          {meta && committed && (
            <section className="mt-10">
              <SkillsBubble />
              <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12.5px] text-[var(--ink-2)]">
                <span>
                  搜索结果{" "}
                  <span className="text-[var(--ink)]">「{committed}」</span>
                </span>
                <span className="text-[var(--hairline-strong)]">·</span>
                <span>
                  共{" "}
                  <span className="font-display text-[14px] text-[var(--ink)]">
                    {meta.count}
                  </span>{" "}
                  条结果
                </span>
                <span className="text-[var(--hairline-strong)]">·</span>
                <span className="font-mono">
                  耗时 {meta.ms.toLocaleString()} ms
                </span>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] text-[var(--ink-3)]">
                  <Sparkles className="h-3 w-3 text-[var(--brand)]" />
                  LLM 已清洗 HTML / Markdown 残片
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {results!.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => (
                  <ResultCard key={r.id} r={r} q={committed} />
                ))}
              </div>
              {results!.length > PAGE_SIZE && (
                <div className="mt-6 pt-4 border-t hairline flex items-center justify-between">
                  <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink-3)]">
                    第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, results!.length)} 条 · 共 {results!.length} 条
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[var(--ink-2)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                      aria-label="上一页">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 font-mono text-[12.5px] text-[var(--ink)]">
                      {page} <span className="text-[var(--ink-3)]">/ {Math.ceil(results!.length / PAGE_SIZE)}</span>
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(Math.ceil(results!.length / PAGE_SIZE), p + 1))}
                      disabled={page >= Math.ceil(results!.length / PAGE_SIZE)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[var(--ink-2)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                      aria-label="下一页">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* DRIFT CARDS */}
          <section className="mt-14">

            <h2 className="font-display text-[26px] text-[var(--ink)]">
              探索 <span className="italic">Sciverse</span> 生态
            </h2>
            <p className="mt-1.5 text-[13.5px] text-[var(--ink-2)]">
              当一次检索不够时，下钻到反应数据库、蛋白功能分析、开源数据集。
            </p>
            <div className="mt-5 grid md:grid-cols-3 gap-4">
              {[
                {
                  logo: "/manus-storage/dianshi_8cef3dfd.svg",
                  name: "点石 DianShi",
                  desc: "有机化学反应数据库",
                  bullets: ["10M+ 化学反应", "6M+ 化学物质", "1M+ 专利文献"],
                  cta: "前往点石",
                  href: "https://dianshi.opendatalab.org.cn/",
                  tag: "Reactions",
                },
                {
                  logo: "/manus-storage/seqstudio_3990637c.svg",
                  name: "SeqStudio",
                  desc: "蛋白质功能 AI 推理 + LLM 注释",
                  bullets: ["57万+ 蛋白注释", "BLAST · Foldseek 一体化", "AI 推理 + LLM 自动综述"],
                  cta: "前往分析",
                  href: "https://seqstudio.opendatalab.org.cn/home",
                  tag: "Proteins",
                },
                {
                  logo: "/manus-storage/scibase_43bd98d3.svg",
                  name: "Sci-Base 数据集",
                  desc: "面向科学 Agent 的开源语料",
                  bullets: ["Sci-Base · 25M+ OA 文献", "SA-Prot-Annot · 蛋白注释", "SA-RxnDiagram-15k · 反应图示"],
                  cta: "浏览数据集",
                  href: "https://sciverse.space/",
                  tag: "Datasets",
                },
              ].map((c) => {
                return (
                  <a
                    key={c.name}
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                    className="card-paper p-5 group block">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl grid place-items-center bg-white border hairline overflow-hidden">
                        <img src={c.logo} alt={c.name} className="h-7 w-7 object-contain" />
                      </div>
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                        {c.tag}
                      </span>
                    </div>
                    <div className="mt-4 font-display text-[19px] text-[var(--ink)]">
                      {c.name}
                    </div>
                    <div className="text-[12.5px] text-[var(--ink-2)] mt-0.5">
                      {c.desc}
                    </div>
                    <ul className="mt-3 space-y-1 text-[12.5px] text-[var(--ink-2)]">
                      {c.bullets.map((b) => (
                        <li key={b} className="flex items-baseline gap-2">
                          <span className="dot on" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 inline-flex items-center gap-1 text-[12.5px] text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors">
                      {c.cta}
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>

          {/* DATA SCALE */}
          <section className="mt-14">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h2 className="font-display text-[26px] text-[var(--ink)]">
                Sciverse 数据能力<span className="italic"> 全景</span>
              </h2>
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)] flex items-center gap-2">
                <span className="inline-block h-px w-8 bg-[var(--ink-3)]/40" />
                Updated · May 2026
              </div>
            </div>
            <div className="mt-6 border-y hairline">
              <div className="grid grid-cols-2 lg:grid-cols-4">
                {[
                  { num: "25M+", unit: "篇", label: "OA 文献", note: "10 大学科 · T+1 同步", pct: 92, idx: "01" },
                  { num: "50K+", unit: "册", label: "教材书籍", note: "全量 40 万 · 持续接入", pct: 12, idx: "02" },
                  { num: "10M+", unit: "条", label: "化学反应", note: "1976 — 2025 专利覆盖", pct: 78, idx: "03" },
                  { num: "570K+", unit: "条", label: "蛋白注释", note: "23 维 functional axes", pct: 64, idx: "04" },
                ].map((d, i) => (
                  <div
                    key={d.label}
                    className={cn(
                      "group relative px-5 py-7 min-w-0 transition-colors hover:bg-[#f7f6f1]",
                      i !== 0 && "lg:border-l hairline",
                      (i === 1 || i === 3) && "border-l hairline lg:border-l",
                    )}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--ink-3)]">{d.idx}</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1.5 min-w-0">
                      <span className="font-display font-semibold leading-none tracking-[-0.025em] text-[var(--ink)] text-[clamp(30px,3.2vw,44px)] truncate">
                        {d.num}
                      </span>
                      <span className="text-[12px] text-[var(--ink-2)] shrink-0">{d.unit}</span>
                    </div>
                    <div className="mt-3 text-[13px] text-[var(--ink)]">{d.label}</div>
                    <div className="mt-1 font-mono text-[10.5px] tracking-[0.02em] text-[var(--ink-3)] truncate">
                      {d.note}
                    </div>
                    <div className="mt-4 h-[2px] w-full bg-[var(--ink-3)]/15 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-[var(--ink)] transition-[width] duration-700 ease-out"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid md:grid-cols-3 gap-px bg-[var(--ink-3)]/15 rounded-xl overflow-hidden border hairline">
              {[
                { k: "最快", en: "Fastest", metric: "< 600", unit: "ms", v: "Agentic Search 平均响应", Icon: Zap },
                { k: "最新", en: "Freshest", metric: "T+1", unit: "同步", v: "每日增量文献与专利自动入库", Icon: Activity },
                { k: "最全", en: "Broadest", metric: "2,000", unit: "万+ 元数据", v: "覆盖文献 · 专利 · 反应 · 蛋白", Icon: Globe2 },
              ].map((it) => (
                <div key={it.k} className="bg-[var(--paper)] p-5 group transition-colors hover:bg-[#f7f6f1]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full border hairline grid place-items-center text-[var(--ink-2)] group-hover:text-[var(--brand)] group-hover:border-[var(--brand)] transition-colors">
                        <it.Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                        {it.en}
                      </span>
                    </div>
                    <span className="font-display italic text-[12px] text-[var(--ink-3)]">{it.k}</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-[var(--ink)]">
                      {it.metric}
                    </span>
                    <span className="text-[12px] text-[var(--ink-2)]">{it.unit}</span>
                  </div>
                  <div className="mt-2 text-[12.5px] text-[var(--ink-2)] leading-relaxed">{it.v}</div>
                </div>
              ))}
            </div>
          </section>

          <footer className="mt-20 pb-10 pt-8 border-t hairline flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-[var(--ink-3)]">
            <span className="font-mono">© 2026 Sciverse · OpenDataLab</span>
            <span>v0.1 · Editorial Lab</span>
            <a href="/docs" className="link-edit ml-auto">查看 API 文档</a>
            <a href="https://sciverse.space" className="link-edit" target="_blank" rel="noreferrer">
              访问主站
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
}
