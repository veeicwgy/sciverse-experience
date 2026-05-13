/*
 * Sciverse · 数据深度 (/depth) — v29
 * Editorial Lab 设计语言：warm off-white 背景 / hairline / Fraunces 衬线 / JetBrains Mono 数字
 * 数据来源：ads_meta_unified_unique_meta_data_acc · 数据截至 2026-04-28
 * 模块：
 *   1. Hero · 总览四组核心数字
 *   2. 四大学科域 · 双层条形比例
 *   3. Top 20 一级学科 · 两栏密集表格
 *   4. 顶刊覆盖 · Nature / Science / Cell 三家 159 种期刊 98% 覆盖
 *   5. AI 专题 · 子领域 + 核心方向 + 顶会顶刊
 *   6. 语言 Top 5
 *   7. 时间跨度 · 1400 - 2026
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Atom,
  BookOpen,
  Boxes,
  FileText,
  Globe2,
  Languages,
  Layers3,
  Microscope,
  Sparkles,
  TimerReset,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

/** CountUp · IntersectionObserver 入视口才动画 */
function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const parsed = useMemo(() => {
    const m = value.match(/^([\d,.]+)(.*)$/);
    if (!m) return { target: 0, suffix: value };
    const numStr = m[1].replace(/,/g, "");
    return { target: parseFloat(numStr), suffix: m[2] || "" };
  }, [value]);
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
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
  const formatted = useMemo(() => {
    if (parsed.target >= 100) return Math.round(display).toString();
    if (Number.isInteger(parsed.target)) return Math.round(display).toString();
    return display.toFixed(2);
  }, [display, parsed.target]);
  return (
    <span ref={ref}>
      {formatted}
      {parsed.suffix}
    </span>
  );
}

// ── 数据底表（来源：负责人 2026-04-28 提供） ──────────
const HERO_STATS = [
  { num: "516M+", unit: "条", label: "知识记录总量", note: "文献 · 图书 · 专利合计", Icon: Layers3 },
  { num: "341M+", unit: "篇", label: "学术文献", note: "1400 — 2026 跨越六个世纪", Icon: FileText },
  { num: "102M+", unit: "篇", label: "AI-Ready 全文", note: "Agent 可直接消费", Icon: Sparkles },
  { num: "814", unit: "种", label: "语言覆盖", note: "覆盖学术写作主要语种", Icon: Globe2 },
];

const FOUR_DOMAINS = [
  { name: "物理科学", en: "Physical Sciences", value: 7487 },
  { name: "社会科学", en: "Social Sciences", value: 5044 },
  { name: "健康科学", en: "Health Sciences", value: 3894 },
  { name: "生命科学", en: "Life Sciences", value: 3190 },
];

const TOP_DISCIPLINES: { name: string; en: string; value: number }[] = [
  { name: "医学", en: "Medicine", value: 3312 },
  { name: "社会科学", en: "Social Sciences", value: 2344 },
  { name: "工程学", en: "Engineering", value: 2259 },
  { name: "计算机科学", en: "Computer Science", value: 1360 },
  { name: "农业与生物科学", en: "Agri & Bio", value: 1328 },
  { name: "生化/遗传/分子生物", en: "Biochem & Mol Bio", value: 1285 },
  { name: "人文艺术", en: "Arts & Humanities", value: 1093 },
  { name: "环境科学", en: "Environmental", value: 967 },
  { name: "物理与天文", en: "Physics & Astro", value: 793 },
  { name: "材料科学", en: "Materials", value: 668 },
  { name: "化学", en: "Chemistry", value: 521 },
  { name: "心理学", en: "Psychology", value: 500 },
  { name: "经济/计量/金融", en: "Econ & Finance", value: 492 },
  { name: "地球与行星科学", en: "Earth & Planet", value: 464 },
  { name: "商业/管理/会计", en: "Business & Mgmt", value: 432 },
  { name: "健康职业", en: "Health Professions", value: 411 },
  { name: "神经科学", en: "Neuroscience", value: 310 },
  { name: "数学", en: "Mathematics", value: 288 },
  { name: "免疫与微生物", en: "Immuno & Micro", value: 195 },
  { name: "决策科学", en: "Decision Science", value: 184 },
];

const PUBLISHERS = [
  { name: "Nature Portfolio", en: "Springer Nature", journals: 91, expected: 754564, owned: 742304, rate: 98.38 },
  { name: "Science / AAAS", en: "American Assoc.", journals: 22, expected: 444415, owned: 434937, rate: 97.87 },
  { name: "Cell Press", en: "Elsevier · Cell", journals: 46, expected: 286001, owned: 278458, rate: 97.36 },
];

const AI_SUBFIELDS = [
  { name: "人工智能 AI", value: 591 },
  { name: "信息系统", value: 207 },
  { name: "计算机视觉与模式识别", value: 159 },
  { name: "网络与通信", value: 154 },
  { name: "理论与数学", value: 93 },
  { name: "信号处理", value: 42 },
  { name: "应用计算", value: 36 },
  { name: "硬件与体系结构", value: 28 },
  { name: "人机交互 HCI", value: 23 },
  { name: "图形学与 CAD", value: 14 },
  { name: "软件工程", value: 12 },
];

const AI_KEYWORDS = [
  { name: "神经网络", value: "56.7万" },
  { name: "机器人", value: "56.6万" },
  { name: "机器学习", value: "46.6万" },
  { name: "深度学习", value: "30.1万" },
  { name: "Transformer", value: "16.5万" },
  { name: "GAN", value: "14.3万" },
  { name: "大语言模型 LLM", value: "10.3万" },
  { name: "强化学习", value: "9.8万" },
];

const AI_VENUES = [
  { name: "AAAI", value: 25501 },
  { name: "IEEE TPAMI", value: 11866 },
  { name: "ACL", value: 8863 },
  { name: "ICRA", value: 8494 },
  { name: "CVPR", value: 6211 },
  { name: "ICCV", value: 3261 },
  { name: "ICML", value: 2133 },
  { name: "EMNLP", value: 872 },
];

const LANGUAGES = [
  { code: "EN", name: "English · 英文", value: "2.89亿" },
  { code: "ZH", name: "中文", value: "5,013万" },
  { code: "DE", name: "Deutsch · 德语", value: "2,145万" },
  { code: "FR", name: "Français · 法语", value: "1,262万" },
  { code: "ES", name: "Español · 西班牙语", value: "885万" },
];

// ── 工具：百分比格式化 ──────
function pctOf(v: number, max: number) {
  return Math.max(2, Math.round((v / max) * 100));
}

export default function Depth() {
  const maxDomain = Math.max(...FOUR_DOMAINS.map((d) => d.value));
  const maxDiscipline = Math.max(...TOP_DISCIPLINES.map((d) => d.value));
  const maxAI = Math.max(...AI_SUBFIELDS.map((d) => d.value));
  const maxVenue = Math.max(...AI_VENUES.map((d) => d.value));

  return (
    <div className="min-h-screen flex bg-[var(--paper)]">
      <Sidebar active="depth" />
      <main className="flex-1 min-w-0">
        <article className="max-w-[1180px] mx-auto px-6 lg:px-12 pt-16 pb-24">
          {/* Hero ─────────────────────────── */}
          <header className="border-b hairline pb-10">
            <div className="flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase text-[var(--ink-3)] font-mono">
              <Microscope className="h-3.5 w-3.5" /> Sciverse · 数据深度
            </div>
            <h1 className="mt-4 font-display text-[42px] md:text-[56px] leading-[1.05] tracking-[-0.02em] text-[var(--ink)]">
              一份可被审计的 <span className="italic text-[var(--brand)]">科学知识底表</span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-2)] max-w-[720px]">
              本页公开 Sciverse 当前可消费的全部知识资产规模、学科与期刊分布、AI 专题覆盖与语言分布；所有数字直接来源于
              <span className="font-mono text-[13.5px] text-[var(--ink)]"> ads_meta_unified_unique_meta_data_acc</span>，
              数据截至 <span className="font-mono text-[13.5px] text-[var(--ink)]">2026-04-28</span>。
            </p>

            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--brand)]/12 border hairline rounded-xl overflow-hidden">
              {HERO_STATS.map((s) => (
                <div key={s.label} className="bg-[var(--paper)] p-6 group transition-colors duration-300 hover:bg-[var(--brand-soft)]/40">
                  <div className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-[var(--ink-3)] font-mono">
                    <s.Icon className="h-3.5 w-3.5 transition-colors duration-300 group-hover:text-[var(--brand)]" strokeWidth={1.6} />
                    {s.label}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="font-display font-semibold text-[44px] leading-none tracking-[-0.02em] text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--brand)]">
                      <CountUp value={s.num} />
                    </span>
                    <span className="font-mono text-[13px] text-[var(--ink-2)]">{s.unit}</span>
                  </div>
                  <div className="mt-3 text-[12.5px] text-[var(--ink-2)] leading-relaxed">{s.note}</div>
                </div>
              ))}
            </div>
          </header>

          {/* 四大学科域 ─────────────────────────── */}
          <section className="mt-20">
            <SectionTitle index="01" cn="四大学科域" en="Four Knowledge Domains" />
            <p className="mt-3 max-w-[680px] text-[14px] text-[var(--ink-2)] leading-relaxed">
              文献体量横跨物理、社会、健康与生命四大学科域，分布均衡、无明显偏科——这是 Sciverse 区别于单一垂直库的核心结构性优势。
            </p>
            <div className="mt-8 space-y-5">
              {FOUR_DOMAINS.map((d) => (
                <div key={d.name} className="group">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-[20px] text-[var(--ink)] tracking-tight">{d.name}</span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">{d.en}</span>
                    </div>
                    <span className="font-display font-semibold text-[22px] tabular-nums text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--brand)]">
                      {d.value.toLocaleString()}
                      <span className="ml-1 text-[12px] font-normal text-[var(--ink-2)]">万篇</span>
                    </span>
                  </div>
                  <div className="mt-3 h-[6px] w-full rounded-full bg-[var(--brand)]/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand)]/55 transition-all duration-700 ease-out group-hover:from-[var(--brand)] group-hover:to-[var(--brand)]"
                      style={{ width: `${pctOf(d.value, maxDomain)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top 20 一级学科 ─────────────────────────── */}
          <section className="mt-24">
            <SectionTitle index="02" cn="Top 20 一级学科" en="Top 20 Disciplines" />
            <p className="mt-3 max-w-[680px] text-[14px] text-[var(--ink-2)] leading-relaxed">
              从医学、社科到神经科学、决策科学，前 20 个一级学科共同构成 1.7 亿+ 篇高密度文献的覆盖底盘。
            </p>
            <div className="mt-8 grid md:grid-cols-2 gap-x-12 gap-y-3.5">
              {TOP_DISCIPLINES.map((d, i) => (
                <div key={d.name} className="group flex items-baseline gap-4 py-3 border-b hairline">
                  <span className="font-mono text-[11px] text-[var(--ink-3)] w-6 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[14px] text-[var(--ink)] flex-1 transition-colors duration-300 group-hover:text-[var(--brand)]">
                    {d.name}
                    <span className="ml-2 font-mono text-[11px] text-[var(--ink-3)]">{d.en}</span>
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:block h-[3px] w-[80px] rounded-full bg-[var(--brand)]/10 overflow-hidden">
                      <span className="block h-full bg-[var(--brand)]/70" style={{ width: `${pctOf(d.value, maxDiscipline)}%` }} />
                    </span>
                    <span className="font-display font-semibold text-[16px] tabular-nums text-[var(--ink)]">
                      {d.value.toLocaleString()}
                      <span className="ml-0.5 text-[11px] font-normal text-[var(--ink-2)]">万</span>
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 顶刊覆盖 ─────────────────────────── */}
          <section className="mt-24">
            <SectionTitle index="03" cn="顶刊覆盖" en="Premier Journal Coverage" />
            <p className="mt-3 max-w-[680px] text-[14px] text-[var(--ink-2)] leading-relaxed">
              对 Nature / Science / Cell 三大出版商旗下共 <span className="font-mono text-[var(--ink)]">159</span> 种顶级期刊进行系统性收录，整体覆盖率
              <span className="font-mono text-[var(--brand)]"> 98.03%</span>，基本实现全覆盖。
            </p>
            <div className="mt-8 grid md:grid-cols-3 gap-px bg-[var(--brand)]/12 border hairline rounded-xl overflow-hidden">
              {PUBLISHERS.map((p) => (
                <div key={p.name} className="bg-[var(--paper)] p-6 group transition-colors duration-300 hover:bg-[var(--brand-soft)]/40">
                  <div className="font-display text-[22px] tracking-tight text-[var(--ink)]">{p.name}</div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">{p.en}</div>
                  <div className="mt-6 flex items-baseline justify-between">
                    <span className="font-display font-semibold text-[42px] leading-none tabular-nums text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--brand)]">
                      {p.rate}
                      <span className="ml-0.5 text-[14px] font-normal text-[var(--ink-2)]">%</span>
                    </span>
                    <span className="text-right text-[12px] text-[var(--ink-2)] leading-tight">
                      {p.journals} 种期刊
                      <br />
                      已收 {(p.owned / 10000).toFixed(1)} 万篇
                    </span>
                  </div>
                  <div className="mt-4 h-[4px] w-full rounded-full bg-[var(--brand)]/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${p.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between text-[12.5px] text-[var(--ink-2)]">
              <span className="font-mono">合计 159 种 · 1,484,980 篇预估 · 1,455,699 篇已收</span>
              <a href="#" className="link-edit inline-flex items-center gap-1">
                查看完整期刊明细 <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </section>

          {/* AI 专题 ─────────────────────────── */}
          <section className="mt-24">
            <SectionTitle index="04" cn="AI 专题覆盖" en="AI Research Coverage" />
            <p className="mt-3 max-w-[760px] text-[14px] text-[var(--ink-2)] leading-relaxed">
              SciBase 收录计算机科学文献 1,360 万篇，其中人工智能子领域 591 万篇，2025 年新增 378 万篇较 2024 年的 97 万篇增长近 4 倍，正承接大模型时代的研究爆发期。
            </p>

            {/* CS 子领域 */}
            <div className="mt-8 grid md:grid-cols-2 gap-x-12 gap-y-3">
              {AI_SUBFIELDS.map((d) => (
                <div key={d.name} className="group flex items-baseline gap-4">
                  <span className="text-[14px] text-[var(--ink)] flex-1 transition-colors duration-300 group-hover:text-[var(--brand)]">{d.name}</span>
                  <span className="hidden sm:block h-[3px] flex-1 max-w-[200px] rounded-full bg-[var(--brand)]/10 overflow-hidden">
                    <span className="block h-full bg-[var(--brand)]/70" style={{ width: `${pctOf(d.value, maxAI)}%` }} />
                  </span>
                  <span className="font-display font-semibold text-[15px] tabular-nums text-[var(--ink)] w-[64px] text-right">
                    {d.value}
                    <span className="ml-0.5 text-[11px] font-normal text-[var(--ink-2)]">万</span>
                  </span>
                </div>
              ))}
            </div>

            {/* 核心方向标签云 */}
            <div className="mt-12">
              <div className="text-[12px] tracking-[0.2em] uppercase text-[var(--ink-3)] font-mono mb-5">核心方向 · 按标题关键词</div>
              <div className="flex flex-wrap gap-2.5">
                {AI_KEYWORDS.map((k) => (
                  <span key={k.name} className="group inline-flex items-baseline gap-2 px-3.5 py-2 rounded-full border hairline bg-[var(--paper)] hover:border-[var(--brand)]/50 hover:bg-[var(--brand-soft)]/50 transition-colors">
                    <span className="text-[13px] text-[var(--ink)]">{k.name}</span>
                    <span className="font-mono text-[11.5px] text-[var(--ink-3)] group-hover:text-[var(--brand)] transition-colors">{k.value}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* AI 顶会顶刊 */}
            <div className="mt-12 border-t hairline pt-10">
              <div className="text-[12px] tracking-[0.2em] uppercase text-[var(--ink-3)] font-mono mb-5">AI 顶会与顶刊收录</div>
              <div className="grid md:grid-cols-4 gap-px bg-[var(--brand)]/8 border hairline rounded-xl overflow-hidden">
                {AI_VENUES.map((v) => (
                  <div key={v.name} className="bg-[var(--paper)] p-5 group transition-colors duration-300 hover:bg-[var(--brand-soft)]/40">
                    <div className="font-display text-[18px] tracking-tight text-[var(--ink)]">{v.name}</div>
                    <div className="mt-3 font-display font-semibold text-[28px] tabular-nums text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--brand)]">
                      {v.value.toLocaleString()}
                    </div>
                    <div className="mt-2 h-[2px] w-full rounded-full bg-[var(--brand)]/10 overflow-hidden">
                      <div className="h-full bg-[var(--brand)]/70" style={{ width: `${pctOf(v.value, maxVenue)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 语言 Top 5 ─────────────────────────── */}
          <section className="mt-24">
            <SectionTitle index="05" cn="语言覆盖" en="Top 5 Languages" />
            <p className="mt-3 max-w-[680px] text-[14px] text-[var(--ink-2)] leading-relaxed">
              共覆盖 <span className="font-mono text-[var(--ink)]">814</span> 种语言；除英文为绝对主体外，中文、德语、法语、西班牙语合计构成超过
              <span className="font-mono text-[var(--ink)]"> 9000 万</span> 篇的非英文学术语料，对中文与多语种 RAG 应用尤为友好。
            </p>
            <div className="mt-8 grid md:grid-cols-5 gap-px bg-[var(--brand)]/10 border hairline rounded-xl overflow-hidden">
              {LANGUAGES.map((l) => (
                <div key={l.code} className="bg-[var(--paper)] p-5 group transition-colors duration-300 hover:bg-[var(--brand-soft)]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-3)]">{l.code}</span>
                    <Languages className="h-3.5 w-3.5 text-[var(--ink-3)] group-hover:text-[var(--brand)] transition-colors" strokeWidth={1.6} />
                  </div>
                  <div className="mt-4 font-display font-semibold text-[22px] leading-none tracking-tight text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--brand)]">
                    {l.value}
                  </div>
                  <div className="mt-2 text-[12px] text-[var(--ink-2)] leading-relaxed">{l.name}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 时间跨度 ─────────────────────────── */}
          <section className="mt-24">
            <SectionTitle index="06" cn="时间跨度" en="Temporal Coverage" />
            <p className="mt-3 max-w-[680px] text-[14px] text-[var(--ink-2)] leading-relaxed">
              文献从 1400 年延伸至 2026 年，跨越六个世纪；图书最早收录 1000 年的古籍与手稿。当代峰值集中在 2025 年——单年 4,243 万篇，正在以 T+1 节奏继续累积。
            </p>
            <div className="mt-8 grid md:grid-cols-2 gap-px bg-[var(--brand)]/10 border hairline rounded-xl overflow-hidden">
              <div className="bg-[var(--paper)] p-6 group">
                <div className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-[var(--ink-3)] font-mono">
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={1.6} /> 论文时间跨度
                </div>
                <div className="mt-4 font-display font-semibold text-[40px] leading-none tracking-[-0.02em] text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors duration-300">
                  1400 — 2026
                </div>
                <div className="mt-3 text-[12.5px] text-[var(--ink-2)]">2025 年峰值 · 4,243 万篇</div>
              </div>
              <div className="bg-[var(--paper)] p-6 group">
                <div className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-[var(--ink-3)] font-mono">
                  <TimerReset className="h-3.5 w-3.5" strokeWidth={1.6} /> 图书时间跨度
                </div>
                <div className="mt-4 font-display font-semibold text-[40px] leading-none tracking-[-0.02em] text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors duration-300">
                  1000 — 2026
                </div>
                <div className="mt-3 text-[12.5px] text-[var(--ink-2)]">含古籍/手稿 · 2021 年峰值 438 万册</div>
              </div>
            </div>
          </section>

          {/* Footer ─────────────────────────── */}
          <footer className="mt-24 pt-8 border-t hairline flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-[var(--ink-3)]">
            <span className="font-mono">© 2026 Sciverse · OpenDataLab</span>
            <span>数据来源：ads_meta_unified_unique_meta_data_acc · 截至 2026-04-28</span>
            <a href="/docs" className="link-edit ml-auto">查看接入指南 →</a>
          </footer>
        </article>
      </main>
    </div>
  );
}

function SectionTitle({ index, cn: titleCn, en }: { index: string; cn: string; en: string }) {
  return (
    <div className="flex items-end gap-4 border-b hairline pb-4">
      <span className="font-mono text-[12px] tabular-nums text-[var(--ink-3)] tracking-[0.18em]">{index}</span>
      <h2 className="font-display text-[28px] md:text-[34px] leading-tight tracking-tight text-[var(--ink)]">
        {titleCn}
      </h2>
      <span className="hidden md:inline font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-3)] mb-1.5">
        {en}
      </span>
    </div>
  );
}
