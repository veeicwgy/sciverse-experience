/*
 * Sciverse · Experience Page (主入口)
 * Layout: Sidebar (260/64) + Main (search · skills bubble · result list · ecosystem · data capability)
 * Style: Editorial Lab — paper #FAFAF7, hairline #ECECE7, brand #5B5BF7, Fraunces+Inter+JetBrainsMono
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  ArrowUp,
  ChevronUp,
  Loader2,
  AlertOctagon,
  FileText,
  Globe,
  ExternalLink,
  Sparkles,
  Zap,
  Activity,
  Globe2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Atom,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import IntegrationBubble from "@/components/experience/IntegrationBubble";
import SearchErrorState, {
  type SearchErrorKind,
} from "@/components/experience/SearchErrorState";
import ContentSnippet from "@/components/experience/ContentSnippet";
import { cn } from "@/lib/utils";
import { useSessionHistory, findSession, findVersion } from "@/hooks/useSessionHistory";
import { GitBranch, Plus } from "lucide-react";

/**
 * CountUp · IntersectionObserver 首次入视口才跳动。
 * 支持 "25M+" / "570K+" / "50K+" / "10M+" 以及中文数量单位 "万" 。
 */
function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  // 拆解原字符串为：前缀数字 + 单位后缀（保留 + 等符号）
  const parsed = useMemo(() => {
    const m = value.match(/^([\d,.]+)(.*)$/);
    if (!m) return { target: 0, suffix: value };
    const numStr = m[1].replace(/,/g, "");
    const suffixRaw = m[2] || "";
    let target = parseFloat(numStr);
    let suffix = suffixRaw;
    if (/M/i.test(suffixRaw)) {
      // 25M+ -> 动画到 25，单位 M+
      target = parseFloat(numStr);
      suffix = suffixRaw;
    } else if (/K/i.test(suffixRaw)) {
      target = parseFloat(numStr);
      suffix = suffixRaw;
    } else if (/万/.test(suffixRaw)) {
      target = parseFloat(numStr);
      suffix = suffixRaw;
    }
    return { target, suffix };
  }, [value]);

  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState<number>(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!ref.current || startedRef.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
            const tick = (now: number) => {
              const p = Math.min(1, (now - start) / duration);
              setDisplay(parsed.target * easeOut(p));
              if (p < 1) requestAnimationFrame(tick);
              else setDisplay(parsed.target);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [duration, parsed.target]);

  // 格式化：整数保留原始小数位（最多 1 位）
  const formatted = useMemo(() => {
    if (parsed.target >= 100) return Math.round(display).toString();
    if (Number.isInteger(parsed.target)) return Math.round(display).toString();
    return display.toFixed(1);
  }, [display, parsed.target]);

  return (
    <span ref={ref}>
      {formatted}
      {parsed.suffix}
    </span>
  );
}

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
  /** v18: 含 doc_id 表示可调用 content 接口拉取原文片段 */
  doc_id?: string;
  /** v18: 估算字数（仅展示提示） */
  approxLength?: number;
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
      doc_id: "nat-med-2024-02873-2",
      approxLength: 4280,
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
      doc_id: "cell-2023-08-022",
      approxLength: 5120,
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
      doc_id: "jacs-au-2024-retro-tpl",
      approxLength: 3640,
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
      doc_id: "stm-2025-tau-protac",
      approxLength: 4760,
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
    <article className="card-paper p-5 ed-in" data-doc-id={r.doc_id}>
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

      {/* v20: 摘要 grid-rows 平滑过渡 + 可访问按钮（Tab 聚焦 / Enter・Space 触发 / 可见焦点环） */}
      <div
        className={cn(
          "mt-3 grid transition-[grid-template-rows] duration-300 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[4.5lh]",
        )}>
        <div className="relative overflow-hidden">
          <div
            className={cn(
              "text-[14px] leading-[1.78] text-[var(--ink)]",
              !expanded && "line-clamp-3",
            )}>
            <span className="text-[var(--ink-3)] mr-1.5">“</span>
            {highlightKeywords(r.abstract, q)}
            <span className="text-[var(--ink-3)] ml-1">”</span>
            {expanded && (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-expanded="true"
                aria-controls={`abs-${r.id}`}
                className="ml-1.5 inline-flex items-center rounded text-[12px] text-[var(--ink-3)] hover:text-[var(--brand)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--paper)]"
                aria-label="收起摘要">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {!expanded && (
            <button
              type="button"
              id={`abs-${r.id}`}
              onClick={() => setExpanded(true)}
              aria-expanded="false"
              aria-label="展开摘要"
              className="absolute right-0 bottom-0 px-1.5 leading-none rounded text-[14px] text-[var(--ink-3)] hover:text-[var(--brand)] bg-[var(--paper)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--paper)]">
              ···
            </button>
          )}
        </div>
      </div>
      {/* v19: 原文片段（content 接口）— 默认折叠，点击展开按需分段拉取；传入 query 高亮 */}
      {r.doc_id && (
        <ContentSnippet docId={r.doc_id} approxLength={r.approxLength} query={q} />
      )}
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

/* CookbookGrid — IntersectionObserver 驱动的交错淡入动画 */
function CookbookGrid({ items }: { items: { slug: string; cover: string; title: string; desc: string; tags: string[] }[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>('[data-cb-card]');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target as HTMLElement;
            const delay = Number(card.dataset.cbIdx || 0) * 70;
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, delay);
            io.unobserve(card);
          }
        });
      },
      { threshold: 0.15 }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [items]);
  return (
    <div ref={gridRef} className="mt-6 grid md:grid-cols-3 gap-4">
      {items.map((item, idx) => (
        <a
          key={item.slug}
          href={`/docs#cookbook/${item.slug}`}
          data-cb-card
          data-cb-idx={idx}
          style={{ opacity: 0, transform: 'translateY(16px)', transition: 'opacity 0.45s ease, transform 0.45s ease' }}
          className="group block rounded-xl border hairline bg-white overflow-hidden hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:-translate-y-[1px]">
          <div className="aspect-[3/2] overflow-hidden bg-neutral-50">
            <img src={item.cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
          </div>
          <div className="p-4 pb-5">
            <div className="flex items-center gap-2 mb-2">
              {item.tags.map((t) => (
                <span key={t} className="text-[10.5px] font-mono text-[var(--ink-3)] tracking-wide">{t}</span>
              ))}
            </div>
            <h3 className="font-display text-[15px] text-[var(--ink)] leading-snug group-hover:text-[var(--brand)] transition-colors duration-300">{item.title}</h3>
            <p className="mt-1.5 text-[12.5px] text-[var(--ink-2)] leading-relaxed line-clamp-2">{item.desc}</p>
          </div>
        </a>
      ))}
    </div>
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
  const [focused, setFocused] = useState(false);
  const [burstId, setBurstId] = useState(0); // 递增 key 触发重新 mount 以重启粒子动画
  // v18: 失败兜底状态 — kind 区分场景，首次失败后 3s 自动重试一次
  const [errorKind, setErrorKind] = useState<SearchErrorKind | null>(null);
  const [retrying, setRetrying] = useState(false);
  // v19: 强制失败演示场景—下一次 runSearch 必中，用于 「失败示例」 chip 与 ?demo=fail&kind= 一键复现
  const forceFailRef = useRef<SearchErrorKind | null>(null);
  const autoRetriedRef = useRef(false);
  const PAGE_SIZE = 8;
  const composing = useRef(false);

  // v17: 会话+版本历史模型 — 当前会话 id / 当前版本 id
  const { sessions, createSession, appendVersion } = useSessionHistory();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  // 改词重搜的默认行为：true=追加到本会话，false=另起新会话
  const [appendMode, setAppendMode] = useState(true);
  // 仅在输入为空、未提交过查询、且未 focus 时运行打字机
  const typedPlaceholder = useTypewriter(
    TYPE_SAMPLES,
    query.length === 0 && !loading && !focused,
  );

  // URL ?q= / ?s= / ?v=
  // 优先级：s+v 复现历史版本；q 兜底直接检索（也会创建会话）；都没有则空白主页
  useEffect(() => {
    const u = new URL(window.location.href);
    const s = u.searchParams.get("s");
    const v = u.searchParams.get("v");
    const q = u.searchParams.get("q");
    // v19: ?demo=fail&kind=server|network|maintenance — 开发/走查一键复现失败兜底
    const demo = u.searchParams.get("demo");
    if (demo === "fail") {
      const k = (u.searchParams.get("kind") || "server") as SearchErrorKind;
      forceFailRef.current = (["server", "network", "maintenance"] as SearchErrorKind[]).includes(k) ? k : "server";
      autoRetriedRef.current = false;
      const sample = q || "马德里 Sciverse 检索示例";
      setQuery(sample);
      submit(sample);
      return;
    }
    if (s && v) {
      const all = JSON.parse(localStorage.getItem("sciverse:sessions:v1") || "[]");
      const sess = findSession(all, s);
      const ver = findVersion(sess, v);
      if (sess && ver) {
        setCurrentSessionId(sess.id);
        setCurrentVersionId(ver.id);
        setQuery(ver.query);
        // 复现该版本检索（无上下文，独立检索）
        runSearch(ver.query);
        return;
      }
    }
    if (q) {
      setQuery(q);
      submit(q);
    }
    const onPop = () => {
      const nu = new URL(window.location.href);
      const ns = nu.searchParams.get("s");
      const nv = nu.searchParams.get("v");
      const nq = nu.searchParams.get("q") || "";
      if (ns && nv) {
        const all = JSON.parse(localStorage.getItem("sciverse:sessions:v1") || "[]");
        const sess = findSession(all, ns);
        const ver = findVersion(sess, nv);
        if (sess && ver) {
          setCurrentSessionId(sess.id);
          setCurrentVersionId(ver.id);
          setQuery(ver.query);
          runSearch(ver.query);
          return;
        }
      }
      setQuery(nq);
      if (nq) submit(nq);
      else {
        setResults(null);
        setMeta(null);
        setCommitted("");
        setCurrentSessionId(null);
        setCurrentVersionId(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = query.trim().length > 0 && !loading;

  // 内部：仅执行检索动作（不写历史、不改 URL）— 用于复现历史版本
  // v18: 加入失败概率与自动重试一次；opts.silent=true 不重置 burst
  const runSearch = async (
    value: string,
    opts: { silent?: boolean; isRetry?: boolean } = {},
  ) => {
    if (!value.trim()) return;
    if (!opts.silent) setBurstId((n) => n + 1);
    setLoading(true);
    setCommitted(value);
    setPage(1);
    setErrorKind(null);
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 520 + Math.random() * 280));
    // 模拟失败：首次提交 ~12% 失败概率；手动重试调低至 4%。
    const failChance = opts.isRetry ? 0.04 : 0.12;
    if (Math.random() < failChance) {
      setLoading(false);
      setResults(null);
      setMeta(null);
      // 随机分配场景
      const pool: SearchErrorKind[] = ["server", "network", "maintenance"];
      const kind = pool[Math.floor(Math.random() * pool.length)];
      setErrorKind(kind);
      // 首次失败后自动重试一次（仅一次）
      if (!autoRetriedRef.current && !opts.isRetry) {
        autoRetriedRef.current = true;
        setRetrying(true);
        window.setTimeout(() => {
          runSearch(value, { silent: true, isRetry: true }).finally(() =>
            setRetrying(false),
          );
        }, 3000);
      }
      return;
    }
    // v19: 如果设了强制失败，本次一定走失败分支（仅生效一次，重试后释放）
    const forced = forceFailRef.current;
    if (forced && !opts.isRetry) {
      forceFailRef.current = null;
      setLoading(false);
      setResults(null);
      setMeta(null);
      setErrorKind(forced);
      if (!autoRetriedRef.current) {
        autoRetriedRef.current = true;
        setRetrying(true);
        window.setTimeout(() => {
          runSearch(value, { silent: true, isRetry: true }).finally(() =>
            setRetrying(false),
          );
        }, 3000);
      }
      return;
    }
    const elapsed = Math.round(performance.now() - start) + 1200;
    setResults(PRESET_RESULTS.default);
    setMeta({ count: PRESET_RESULTS.default.length, ms: elapsed });
    setLoading(false);
    // 成功则释放自动重试锁，以便下一次提交后可重新启用
    autoRetriedRef.current = false;
  };

  // 用户主动提交：写入历史（追加到本会话 / 另起新会话）+ 同步 URL
  const submit = async (q?: string) => {
    const value = (q ?? query).trim();
    if (!value) return;
    // 决定写入策略
    let nextSessionId = currentSessionId;
    let nextVersionId: string | null = null;
    if (currentSessionId && appendMode) {
      const r = appendVersion(currentSessionId, value);
      nextSessionId = r.sessionId;
      nextVersionId = r.versionId;
    } else {
      const r = createSession(value);
      nextSessionId = r.sessionId;
      nextVersionId = r.versionId;
    }
    setCurrentSessionId(nextSessionId);
    setCurrentVersionId(nextVersionId);
    // sync URL
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    url.searchParams.set("s", nextSessionId!);
    url.searchParams.set("v", nextVersionId!);
    window.history.pushState({}, "", url.toString());
    // 跑独立检索
    await runSearch(value);
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

            {/* sample tags — v20: 仅在未提交检索时呈现，避免与结果页资讯重复 */}
            {!meta && !committed && !errorKind && (
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
                {/* v20: 失败示例 chip — 单击直接走通用失败兜底页 */}
                <span className="mx-1 h-3 w-px bg-[var(--hairline-strong)]" aria-hidden />
                <button
                  type="button"
                  onClick={() => {
                    forceFailRef.current = "unknown";
                    autoRetriedRef.current = false;
                    const sample = query.trim() || "马德里 Sciverse 检索示例";
                    setQuery(sample);
                    submit(sample);
                  }}
                  className="inline-flex items-center gap-1 text-[12.5px] px-3 py-1.5 rounded-full border border-dashed border-[#D2BFB7] text-[#9F4A33] bg-[#FBF4F1] hover:bg-[#F8E9E2] transition-colors">
                  <AlertOctagon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  失败示例
                </button>
              </div>
            )}
          </section>

          {/* v17: 结果页改词重搜模式切换（追加/另起） */}
          {meta && committed && currentSessionId && (
            <div className="mt-3 flex items-center gap-2 text-[12px] text-[var(--ink-3)]">
              <span>修改关键词后</span>
              <div className="inline-flex items-center rounded-full border hairline bg-white p-0.5">
                <button
                  onClick={() => setAppendMode(true)}
                  className={cn(
                    "px-2.5 py-1 rounded-full inline-flex items-center gap-1 transition-colors",
                    appendMode
                      ? "bg-[var(--ink)] text-white"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                  )}>
                  <GitBranch className="h-3 w-3" />
                  追加到本会话
                </button>
                <button
                  onClick={() => setAppendMode(false)}
                  className={cn(
                    "px-2.5 py-1 rounded-full inline-flex items-center gap-1 transition-colors",
                    !appendMode
                      ? "bg-[var(--ink)] text-white"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                  )}>
                  <Plus className="h-3 w-3" />
                  另起新会话
                </button>
              </div>
              {(() => {
                const sess = findSession(sessions, currentSessionId);
                if (!sess) return null;
                const vIdx = sess.versions.findIndex((x) => x.id === currentVersionId);
                return (
                  <span className="ml-1">
                    当前 v{vIdx >= 0 ? vIdx + 1 : sess.versions.length} / 共 {sess.versions.length} 个版本
                  </span>
                );
              })()}
            </div>
          )}

          {/* v18: 失败兜底页 — 仅在提交后失败且无 results 时出现 */}
          {errorKind && !meta && (
            <SearchErrorState
              query={committed || query}
              retrying={retrying || loading}
              onRetry={() => {
                if (loading || retrying) return;
                autoRetriedRef.current = true; // 手动重试不再触发自动重试
                runSearch(committed || query, { isRetry: true });
              }}
              onEdit={() => {
                setErrorKind(null);
                inputRef.current?.focus();
              }}
            />
          )}

          {/* STATUS + RESULTS */}
          {meta && committed && (
            <section className="mt-6">
              <IntegrationBubble />
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

          {/* COOKBOOK SHOWCASE */}
          <section className="mt-14">
            <div className="relative">
              <div className="flex items-center gap-2 text-[11px] tracking-[0.28em] text-[var(--ink-3)] uppercase font-mono">
                <span className="inline-block h-px w-5 bg-[var(--ink-3)]/50" />
                Cookbook
              </div>
              <div className="mt-2 flex items-end justify-between gap-4 flex-wrap">
                <h2 className="font-display text-[26px] text-[var(--ink)] leading-tight">
                  场景案例
                </h2>
                <a
                  href="/docs#cookbook"
                  className="text-[12.5px] text-[var(--ink-3)] hover:text-[var(--brand)] transition-colors duration-300 flex items-center gap-1 font-mono tracking-wide">
                  查看全部 9 个案例
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </a>
              </div>
              <p className="mt-2 text-[13.5px] text-[var(--ink-2)] leading-relaxed max-w-[560px]">
                用真实任务展示如何把 Sciverse 接入 Agent、RAG、科研检索。每个案例可复制、可运行。
              </p>
            </div>
            <CookbookGrid items={[
                {
                  slug: "literature-review-agent",
                  cover: "/manus-storage/cookbook-cover-1-literature-review_709a5f2b.png",
                  title: "科研文献综述 Agent",
                  desc: "从一句研究问题出发，自动检索、摘要、生成带引用的文献综述",
                  tags: ["Agent", "RAG"],
                },
                {
                  slug: "scientific-rag",
                  cover: "/manus-storage/cookbook-cover-2-rag-datasource_28fdc177.png",
                  title: "科学 RAG 数据源",
                  desc: "将 Sciverse 作为 RAG pipeline 的检索后端，为 LLM 提供可信科学证据",
                  tags: ["RAG", "Agent"],
                },
                {
                  slug: "fulltext-evidence",
                  cover: "/manus-storage/cookbook-cover-3-fulltext-evidence_d8bbb7f7.png",
                  title: "论文全文证据检索",
                  desc: "从检索片段出发，定位并读取原文完整段落作为可引用证据",
                  tags: ["RAG", "检索"],
                },
              ]} />
          </section>

          {/* DATA SCALE */}
          <section className="mt-14">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h2 className="font-display text-[26px] text-[var(--ink)]">
                Sciverse 数据能力<span className="italic"> 全景</span>
              </h2>
              <div className="text-[12px] text-[var(--ink-3)] flex items-center gap-2">
                <span className="inline-block h-px w-8 bg-[var(--ink-3)]/40" />
                更新于 2026 年 5 月
              </div>
            </div>
            <div className="mt-6 border-y hairline">
              <div className="grid grid-cols-2 lg:grid-cols-4">
                {[
                  { num: "341M+", unit: "篇", label: "学术文献", note: "1400 — 2026 · 跨越六个世纪", pct: 96, Icon: FileText },
                  { num: "105M+", unit: "册", label: "图书", note: "含古籍与手稿", pct: 78, Icon: Layers },
                  { num: "70M+", unit: "件", label: "全球专利", note: "与文献交叉引用", pct: 70, Icon: Atom },
                  { num: "102M+", unit: "篇", label: "AI-Ready 全文", note: "Agent 可直接消费", pct: 88, Icon: Boxes },
                ].map((d, i) => (
                  <div
                    key={d.label}
                    className={cn(
                      "group relative px-5 py-7 min-w-0 transition-colors hover:bg-[#f7f6f1]",
                      i !== 0 && "lg:border-l hairline",
                      (i === 1 || i === 3) && "border-l hairline lg:border-l",
                    )}>
                    <div className="flex items-center">
                      <d.Icon
                        className="h-[14px] w-[14px] text-[var(--ink-3)] transition-colors duration-300 group-hover:text-[var(--brand)]"
                        strokeWidth={1.4}
                      />
                    </div>
                    <div className="mt-3 flex items-baseline gap-1.5 min-w-0">
                      <span className="font-display font-semibold leading-none tracking-[-0.025em] text-[var(--ink)] text-[clamp(30px,3.2vw,44px)] truncate transition-colors duration-300 group-hover:text-[var(--brand)]">
                        <CountUp value={d.num} />
                      </span>
                      <span className="text-[12px] text-[var(--ink-2)] shrink-0">{d.unit}</span>
                    </div>
                    <div className="mt-3 text-[13px] text-[var(--ink)]">{d.label}</div>
                    <div className="mt-1 font-mono text-[10.5px] tracking-[0.02em] text-[var(--ink-3)] truncate">
                      {d.note}
                    </div>
                    <div className="mt-4 h-[2px] w-full bg-[var(--brand)]/12 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-out"
                        style={{
                          width: `${d.pct}%`,
                          background:
                            "linear-gradient(90deg, rgba(91,91,247,0.85) 0%, rgba(91,91,247,0.55) 100%)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid md:grid-cols-3 gap-px bg-[var(--brand)]/10 rounded-xl overflow-hidden border hairline">
              {[                { k: "原生", en: "Agent First", metric: "Agent", unit: "优先", v: "原生支持 Manus / Claude / Cursor", Icon: Zap },
                { k: "最新", en: "Freshest", metric: "T+1", unit: "同步", v: "每日新增百万级文献与专利入库", Icon: Activity },
                { k: "最全", en: "Broadest", metric: "516M+", unit: "知识记录", v: "814 种语言 · 1.3M+ 期刊与会议覆盖", Icon: Globe2 },
              ].map((it) => (
                <div key={it.k} className="bg-[var(--paper)] p-5 group transition-colors duration-300 hover:bg-[var(--brand-soft)]/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full border hairline grid place-items-center text-[var(--ink-2)] group-hover:text-[var(--brand)] group-hover:border-[var(--brand)] transition-all duration-500 ease-out group-hover:rotate-[8deg] group-hover:scale-[1.06]">
                        <it.Icon className="h-3.5 w-3.5 transition-[stroke-width] duration-500 ease-out group-hover:[stroke-width:2]" strokeWidth={1.6} />
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                        {it.en}
                      </span>
                    </div>
                    <span className="font-display italic text-[12px] text-[var(--ink-3)]">{it.k}</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1 transition-transform duration-500 ease-out group-hover:-translate-y-[2px]">
                    <span className="font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--brand)]">
                      {it.metric}
                    </span>
                    <span className="text-[12px] text-[var(--ink-2)] transition-colors duration-300 group-hover:text-[var(--brand)]/70">{it.unit}</span>
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
