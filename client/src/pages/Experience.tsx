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

// v9: 提交瞬间的粒子扩散反馈（8 颗紫蓝粒子 + 1 圈脉冲环）
// 以 key 重新 mount 重启动画，800ms 后 DOM 仍在但动画结束，opacity 为 0
function BurstFx() {
  const dots = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 28 + Math.random() * 14; // 28-42px
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    return { tx, ty, delay: i * 12 };
  });
  return (
    <span aria-hidden className="sv-burst">
      <span className="sv-burst-ring" />
      {dots.map((d, i) => (
        <span
          key={i}
          className="sv-burst-dot"
          style={{
            ['--tx' as any]: `${d.tx}px`,
            ['--ty' as any]: `${d.ty}px`,
            animationDelay: `${d.delay}ms`,
          }}
        />
      ))}
    </span>
  );
}

// v7/v8: 科学学术蒙层组件 — 低透明度 SVG，纯装饰，不可交互
// active=true 时（搜索框 focus）渐晕呼吸、DNA 飘移、苯环微转、分子脉动同步启动
function ScienceBackdrop({ active = false }: { active?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{ zIndex: 0 }}>
      {/* 柔和紫蓝渐晕 ×2 ，以及右下深调冷调增加站位质感 */}
      <div
        className={cn(
          "absolute -top-40 -left-32 w-[640px] h-[640px] rounded-full opacity-[0.55] transition-opacity duration-500",
          active && "sv-aura-active",
        )}
        style={{
          background:
            "radial-gradient(closest-side, rgba(91,91,247,0.16), rgba(91,91,247,0) 70%)",
          filter: "blur(8px)",
          ['--sv-aura-base' as any]: 0.55,
          ['--sv-aura-peak' as any]: 0.85,
        }}
      />
      <div
        className={cn(
          "absolute top-[180px] -right-40 w-[560px] h-[560px] rounded-full opacity-[0.5] transition-opacity duration-500",
          active && "sv-aura-active",
        )}
        style={{
          background:
            "radial-gradient(closest-side, rgba(122,108,255,0.14), rgba(122,108,255,0) 70%)",
          filter: "blur(10px)",
          animationDelay: "-1.5s",
          ['--sv-aura-base' as any]: 0.5,
          ['--sv-aura-peak' as any]: 0.78,
        }}
      />
      <div
        className="absolute bottom-[-200px] left-[28%] w-[700px] h-[700px] rounded-full opacity-[0.4]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(36,42,86,0.10), rgba(36,42,86,0) 70%)",
          filter: "blur(14px)",
        }}
      />

      {/* 贴纸 SVG：苯环 + 分子 + 双螺旋 + 化学式 — 极淡 stroke #5B5BF7 */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1400 2000"
        preserveAspectRatio="xMidYMin slice"
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="sv-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 0 56" fill="none" stroke="#5B5BF7" strokeWidth="0.4" opacity="0.06" />
          </pattern>
          <radialGradient id="sv-grid-mask" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="sv-grid-mask-id">
            <rect width="100%" height="100%" fill="url(#sv-grid-mask)" />
          </mask>
        </defs>

        {/* 极淡网格，带径向遮罩 */}
        <rect width="100%" height="100%" fill="url(#sv-grid)" mask="url(#sv-grid-mask-id)" />

        {/* 右上：苯环 + 取代基×2（focus 时极慢自转） */}
        <g
          transform="translate(1140, 90)"
          stroke="#5B5BF7"
          strokeWidth="1"
          fill="none"
          opacity={active ? 0.28 : 0.18}
          style={{ transition: "opacity 600ms ease" }}
          className={active ? "sv-ring-active" : undefined}>
          <polygon points="0,0 52,0 78,45 52,90 0,90 -26,45" />
          <polygon points="110,30 162,30 188,75 162,120 110,120 84,75" />
          <line x1="52" y1="45" x2="110" y2="75" />
          <line x1="-26" y1="45" x2="-60" y2="30" />
          <line x1="188" y1="75" x2="222" y2="60" />
          <text x="-78" y="24" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#5B5BF7" opacity="0.7">CH₃</text>
          <text x="230" y="66" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#5B5BF7" opacity="0.7">OH</text>
        </g>

        {/* 左中：DNA 双螺旋（focus 时上下飘移 + 提色） */}
        <g
          transform="translate(40, 480)"
          stroke={active ? "#5B5BF7" : "#5B5BF7"}
          strokeWidth="1"
          fill="none"
          opacity={active ? 0.28 : 0.16}
          style={{ transition: "opacity 600ms ease" }}
          className={active ? "sv-helix-active" : undefined}>
          {Array.from({ length: 14 }).map((_, i) => {
            const y = i * 26;
            const off = Math.sin(i * 0.55) * 26;
            return (
              <g key={i}>
                <line x1={20 + off} y1={y} x2={80 - off} y2={y} />
                <circle cx={20 + off} cy={y} r="2" fill="#5B5BF7" opacity="0.6" />
                <circle cx={80 - off} cy={y} r="2" fill="#5B5BF7" opacity="0.6" />
              </g>
            );
          })}
          <path
            d={`M ${20 + Math.sin(0) * 26},0 ${Array.from({ length: 14 })
              .map((_, i) => `L ${20 + Math.sin(i * 0.55) * 26},${i * 26}`)
              .join(" ")}`}
            stroke="#5B5BF7"
            strokeWidth="0.8"
          />
          <path
            d={`M ${80 - Math.sin(0) * 26},0 ${Array.from({ length: 14 })
              .map((_, i) => `L ${80 - Math.sin(i * 0.55) * 26},${i * 26}`)
              .join(" ")}`}
            stroke="#5B5BF7"
            strokeWidth="0.8"
          />
        </g>

        {/* 右中：蛋白表面 · 带状折叠抽象 */}
        <g transform="translate(1080, 760)" stroke="#5B5BF7" strokeWidth="1" fill="none" opacity="0.13">
          <path d="M 0 0 C 60 -40, 140 40, 200 0 S 320 60, 380 20" />
          <path d="M 0 30 C 60 -10, 140 70, 200 30 S 320 90, 380 50" />
          <path d="M 0 60 C 60 20, 140 100, 200 60 S 320 120, 380 80" />
          <path d="M 0 90 C 60 50, 140 130, 200 90 S 320 150, 380 110" />
        </g>

        {/* 左下：化学公式×3 + Greek letters */}
        <g fontFamily="'JetBrains Mono', monospace" opacity="0.16" fill="#242A56">
          <text x="60" y="1180" fontSize="13">E = mc²</text>
          <text x="60" y="1208" fontSize="12">ΔG = ΔH − TΔS</text>
          <text x="60" y="1236" fontSize="12">ψ(x,t) = A e^(i(kx−ωt))</text>
          <text x="60" y="1264" fontSize="12">k_cat / K_M</text>
        </g>

        {/* 中部偏右：分子 ball-and-stick 节点（focus 时脉动） */}
        <g
          transform="translate(900, 1160)"
          stroke="#5B5BF7"
          strokeWidth="1"
          opacity={active ? 0.30 : 0.18}
          fill="#5B5BF7"
          style={{ transition: "opacity 600ms ease" }}
          className={active ? "sv-mol-active" : undefined}>
          <line x1="0" y1="0" x2="60" y2="30" fill="none" />
          <line x1="60" y1="30" x2="120" y2="-10" fill="none" />
          <line x1="60" y1="30" x2="50" y2="100" fill="none" />
          <line x1="120" y1="-10" x2="190" y2="20" fill="none" />
          <line x1="50" y1="100" x2="-10" y2="140" fill="none" />
          <circle cx="0" cy="0" r="4" />
          <circle cx="60" cy="30" r="5" />
          <circle cx="120" cy="-10" r="4" />
          <circle cx="50" cy="100" r="4" />
          <circle cx="190" cy="20" r="3" />
          <circle cx="-10" cy="140" r="3" />
        </g>

        {/* 下部：序列片段 ATCG · 贴纸低调 */}
        <g fontFamily="'JetBrains Mono', monospace" opacity="0.10" fill="#5B5BF7" fontSize="11">
          <text x="380" y="1620" letterSpacing="3">ATCGGAATTCAGCTAGCTAGGCTAATCGATCGTAGCTAGCAATCG</text>
          <text x="380" y="1644" letterSpacing="3">CGTAATCGATCGGCTAGCTAGCATCGGAATTCAGCTAGCTAGCTA</text>
          <text x="380" y="1668" letterSpacing="3">TGCATGCATCGTAGCTAGCATCGCTAGCTAATCGATCGCTAGCTA</text>
        </g>
      </svg>

      {/* 上方极淡白鬼蒙层，使背景元素在主区隔离不干扰阅读 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(250,250,247,0.0) 0%, rgba(250,250,247,0.55) 38%, rgba(250,250,247,0.30) 100%)",
        }}
      />
    </div>
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

// v7: 引导式打字机 placeholder 循环示例（动词开头，覆盖检索/对比/分析）
const TYPE_SAMPLES = [
  "检索 mRNA 疫苗递送系统的最新文献",
  "对比 CRISPR-Cas9 与 Cas12a 的脱靶效应",
  "分析 AlphaFold-Multimer 在跨膜受体上的预测精度",
  "总结 2024 年锂电池固态电解质的突破",
  "探索逆合成路径规划的指令微调策略",
];

function useTypewriter(samples: string[], enabled: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let sIdx = 0;
    let cIdx = 0;
    let mode: "type" | "hold" | "erase" = "type";
    const tick = () => {
      if (cancelled) return;
      const cur = samples[sIdx % samples.length];
      let delay = 55 + Math.random() * 25; // 较快的输入节奏
      if (mode === "type") {
        cIdx++;
        setText(cur.slice(0, cIdx));
        if (cIdx >= cur.length) {
          mode = "hold";
          delay = 1400;
        }
      } else if (mode === "hold") {
        mode = "erase";
        delay = 280;
      } else {
        cIdx -= 2;
        if (cIdx < 0) cIdx = 0;
        setText(cur.slice(0, cIdx));
        if (cIdx === 0) {
          mode = "type";
          sIdx++;
          delay = 320;
        } else {
          delay = 24;
        }
      }
      timer = window.setTimeout(tick, delay);
    };
    let timer = window.setTimeout(tick, 380);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [samples, enabled]);
  return text;
}

export default function Experience() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [meta, setMeta] = useState<{ count: number; ms: number } | null>(null);
  const [page, setPage] = useState(1);
  const [focused, setFocused] = useState(false);
  const [burstId, setBurstId] = useState(0); // 递增 key 触发重新 mount 以重启粒子动画
  const PAGE_SIZE = 8;
  const composing = useRef(false);
  // 仅在输入为空、未提交过查询、且未 focus 时运行打字机
  const typedPlaceholder = useTypewriter(
    TYPE_SAMPLES,
    query.length === 0 && !loading && !focused,
  );

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
    setBurstId((n) => n + 1); // 启动一次粒子反馈
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

      <main className="flex-1 min-w-0 relative">
        {/* v10: 背景蒙层保持静态装饰，不再跟随输入框 focus 动，避免干扰输入 */}
        <ScienceBackdrop active={false} />
        <div className="relative flex-1 min-w-0 max-w-[960px] mx-auto px-8 lg:px-12 py-2">
          <HeroHeader />

          {/* SEARCH */}
          <section className="relative">
            <div
              className={cn(
                "card-paper sv-search-shell px-5 pt-4 pb-3 flex flex-col gap-2",
                focused && "is-focused",
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
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={loading}
                rows={2}
                placeholder={focused ? "输入科学问题或关键词..." : (typedPlaceholder ? `${typedPlaceholder} ▊` : "")}
                className="w-full bg-transparent outline-none text-[15.5px] leading-[1.7] placeholder:text-[var(--ink-3)] disabled:opacity-60 resize-none min-h-[88px] max-h-[220px]"
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
                  <div className="relative">
                    {/* v9: 提交瞬间的粒子扩散反馈，通过 burstId 重启动画 */}
                    {burstId > 0 && <BurstFx key={burstId} />}
                    <button
                      onClick={() => submit()}
                      disabled={!canSubmit}
                      aria-label="发送"
                      className={cn(
                        "relative h-9 w-9 inline-flex items-center justify-center rounded-full transition-all",
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
