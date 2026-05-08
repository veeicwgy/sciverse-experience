/*
 * Sciverse · 接入指南 (/docs) — v13
 * 五段式：
 *   1. Hero          标题 + 副标题 + 一句话介绍
 *   2. 锚点 Tab      sticky 三段：API · CLI/SDK · Skills
 *   3. 三快速开始卡   点击锚定到对应模块
 *   4. 三模块详解     适用场景 / 优势 / 主要能力 / 调用示例（带"复制"按钮）
 *   5. 底部 CTA      获取 API Key → /tokens
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Terminal,
  Cable,
  Copy,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

type SecKey = "api" | "cli" | "skills";

const SECTIONS: {
  key: SecKey;
  no: string;
  icon: any;
  title: string;
  oneLine: string;
  bestFor: string;
  pros: string[];
  features: string[];
  codeLang: string;
  code: string;
  ctaLabel: string;
  ctaHref?: string;
}[] = [
  {
    key: "api",
    no: "01",
    icon: Cable,
    title: "API 接口",
    oneLine: "RESTful · 单次 HTTP 调用即可拿到清洗后的科学结果",
    bestFor:
      "已有后端服务、自定义 Agent 工具调用、希望对返回结果做二次加工的团队。",
    pros: [
      "零依赖，所有语言可调",
      "agentic / meta / content 三种模式按需切换",
      "返回结构化 JSON，含原文片段、PDF 页码与引用",
    ],
    features: [
      "agentic-search · 多源并行 + 自动去重",
      "meta-search · PubMed / arXiv / OpenAlex 检索",
      "content-search · 全文级片段命中与回链",
    ],
    codeLang: "bash",
    code: `curl https://api.sciverse.space/agentic-search \\
  -H "Authorization: Bearer $SCIVERSE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "对比 CRISPR-Cas9 与 Cas12a 的脱靶效应",
    "source_types": ["pdf", "web"]
  }'`,
    ctaLabel: "查看完整 API 参考",
    ctaHref: "https://docs.sciverse.space/api",
  },
  {
    key: "cli",
    no: "02",
    icon: Terminal,
    title: "CLI / SDK",
    oneLine: "命令行 + Python / Node SDK，本地脚本与流水线最快接入",
    bestFor:
      "数据分析师、研究员、需要本地批处理与 CI 流水线集成的工程团队。",
    pros: [
      "一行 npm/pip 安装即可使用",
      "类型完备的 Python / TypeScript SDK，IDE 自动补全",
      "CLI 支持流式输出与 JSON Lines，便于 jq / pandas 后处理",
    ],
    features: [
      "sciverse search 直出 markdown / json",
      "Python: SciverseClient 同步 + 异步双 API",
      "Node: ESM/CJS 双导出，开箱即用 fetch 适配",
    ],
    codeLang: "shell",
    code: `# 安装
pip install sciverse              # Python
npm i @sciverse/sdk               # Node

# Python 示例
from sciverse import SciverseClient
client = SciverseClient(api_key="sk-...")
res = client.search("阿尔茨海默症 tau 蛋白靶点", mode="agentic")
for hit in res.hits:
    print(hit.title, hit.score, hit.url)`,
    ctaLabel: "下载 SDK 与示例",
    ctaHref: "https://docs.sciverse.space/sdk",
  },
  {
    key: "skills",
    no: "03",
    icon: Sparkles,
    title: "Sciverse Skills",
    oneLine: "三行配置，让 Manus / Claude / Cursor 等 Agent 直接调用科学检索",
    bestFor:
      "已经在使用 Agent / IDE 助手、希望「无侵入」获得科学检索能力的开发者。",
    pros: [
      "MCP 标准协议，主流 Agent 即插即用",
      "内置三接口路由，Agent 自动选择最合适的检索方式",
      "片段级引用 + PDF 页码回链，让回答可被验证",
    ],
    features: [
      "适配 Manus · Claude Desktop · Cursor · Continue",
      "自动清洗、去重、合并跨数据源结果",
      "权限托管在 API Key，单 Key 即可装载多端",
    ],
    codeLang: "yaml",
    code: `# ~/.config/manus/skills.yaml
- name: sciverse
  type: mcp
  command: npx -y @sciverse/skill
  env:
    SCIVERSE_API_KEY: \${SCIVERSE_API_KEY}`,
    ctaLabel: "安装到我的 Agent",
    ctaHref: "https://docs.sciverse.space/skills",
  },
];

export default function Docs() {
  const [active, setActive] = useState<SecKey>("api");
  const refs = useRef<Record<SecKey, HTMLElement | null>>({
    api: null,
    cli: null,
    skills: null,
  });

  useEffect(() => {
    const els = SECTIONS.map((s) => refs.current[s.key]).filter(
      Boolean,
    ) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id as SecKey);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (key: SecKey) => {
    const el = refs.current[key];
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar active="docs" />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1080px] mx-auto px-8 lg:px-12 py-12">
          {/* HERO */}
          <section>
            <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[var(--ink-3)]">
              Integration Guide
            </span>
            <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-[-0.02em] text-[var(--ink)]">
              Sciverse 接入指南
            </h1>
            <p className="mt-3 max-w-[640px] text-[14.5px] leading-relaxed text-[var(--ink-2)]">
              Sciverse 提供三种接入方式 ——
              <span className="text-[var(--ink)]"> API 接口</span>、
              <span className="text-[var(--ink)]">CLI / SDK</span>、
              <span className="text-[var(--ink)]">Skills</span>，覆盖从「自建后端」到「Agent 即插即用」的不同场景。一个 API Key 全部通用，按调用次数计费，未用不扣。
            </p>
          </section>

          {/* 锚点 Tab — sticky */}
          <div
            className="sticky top-0 z-20 -mx-8 lg:-mx-12 px-8 lg:px-12 mt-8 py-3"
            style={{
              backgroundColor: "rgba(250,250,247,0.85)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderBottom: "1px solid rgba(20,20,30,0.08)",
            }}>
            <div className="inline-flex p-0.5 rounded-full border hairline bg-white">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => scrollTo(s.key)}
                  className={cn(
                    "px-4 py-1.5 text-[12.5px] rounded-full transition-colors flex items-center gap-1.5",
                    active === s.key
                      ? "bg-[var(--ink)] text-white"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                  )}>
                  <span className="font-mono opacity-70">{s.no}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 三快速开始卡片 */}
          <section className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[var(--ink-3)]">
                  Quick Start
                </span>
                <h2 className="mt-1 font-display text-[22px] text-[var(--ink)]">
                  选一条路径，开始使用
                </h2>
              </div>
              <Link
                href="/tokens"
                className="text-[12.5px] text-[var(--ink-2)] hover:text-[var(--ink)] inline-flex items-center gap-1">
                先去申请 Key
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => scrollTo(s.key)}
                    className="group relative card-paper p-5 text-left hover:border-[var(--ink)] hover:shadow-[0_8px_24px_-12px_rgba(20,20,30,0.18)] transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <span className="h-9 w-9 rounded-xl bg-[var(--paper-2)] border hairline grid place-items-center text-[var(--ink)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-mono text-[10.5px] tracking-[0.18em] text-[var(--ink-3)]">
                        {s.no}
                      </span>
                    </div>
                    <div className="mt-4 font-display text-[18px] text-[var(--ink)] tracking-tight">
                      {s.title}
                    </div>
                    <p className="mt-1.5 text-[12.5px] text-[var(--ink-2)] leading-relaxed line-clamp-2">
                      {s.oneLine}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1 text-[12px] text-[var(--ink)] group-hover:gap-2 transition-all">
                      去查看
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 三模块详解 */}
          <div className="mt-14 space-y-16">
            {SECTIONS.map((s) => (
              <SectionBlock
                key={s.key}
                section={s}
                bindRef={(el) => (refs.current[s.key] = el)}
              />
            ))}
          </div>

          {/* 底部 CTA */}
          <section className="mt-20 mb-4 relative overflow-hidden rounded-2xl border hairline bg-[var(--ink)] text-white p-8 lg:p-10">
            <div
              className="absolute -right-24 -top-24 h-[260px] w-[260px] rounded-full opacity-50 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(124,92,252,0.45) 0%, rgba(91,91,247,0) 70%)",
              }}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-[560px]">
                <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-white/55">
                  Get Started
                </span>
                <h3 className="mt-2 font-display text-[28px] leading-tight tracking-[-0.01em]">
                  申请 API Key，5 分钟完成接入
                </h3>
                <p className="mt-2 text-[13.5px] text-white/70 leading-relaxed">
                  一个 Key 通用 API · CLI · Skills 三种方式，调用按次计费、未用不扣，免费额度足够日常研究使用。
                </p>
              </div>
              <Link
                href="/tokens"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white text-[var(--ink)] text-[13.5px] font-medium hover:bg-white/90 transition-colors">
                <KeyRound className="h-4 w-4" />
                获取 API Key
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SectionBlock({
  section,
  bindRef,
}: {
  section: (typeof SECTIONS)[number];
  bindRef: (el: HTMLElement | null) => void;
}) {
  const Icon = section.icon;
  return (
    <section
      id={section.key}
      ref={bindRef as any}
      className="scroll-mt-24">
      <div className="flex items-start gap-3">
        <span className="font-mono text-[12px] tracking-[0.18em] text-[var(--ink-3)] mt-2">
          {section.no}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-[var(--paper-2)] border hairline grid place-items-center text-[var(--ink)]">
              <Icon className="h-4 w-4" />
            </span>
            <h2 className="font-display text-[28px] text-[var(--ink)] tracking-[-0.01em]">
              {section.title}
            </h2>
          </div>
          <p className="mt-2 text-[14px] text-[var(--ink-2)] leading-relaxed max-w-[720px]">
            {section.oneLine}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5">
        <div className="card-paper p-5">
          <div>
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
              适用场景
            </span>
            <p className="mt-1.5 text-[13.5px] text-[var(--ink)] leading-relaxed">
              {section.bestFor}
            </p>
          </div>
          <div className="mt-5">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
              优势
            </span>
            <ul className="mt-2 space-y-1.5">
              {section.pros.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-2 text-[13px] text-[var(--ink-2)]">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-[2px] text-[var(--brand)] shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
              主要能力
            </span>
            <ul className="mt-2 space-y-1.5">
              {section.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-[13px] text-[var(--ink-2)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink)]/40 mt-[7px] shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          {section.ctaHref && (
            <button
              onClick={() =>
                toast(`${section.ctaLabel}`, {
                  description: "外部文档链接已在演示中模拟",
                })
              }
              className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--ink)] hover:gap-2.5 transition-all">
              {section.ctaLabel}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <CodeBlock lang={section.codeLang} code={section.code} />
      </div>
    </section>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast("复制失败");
    }
  };
  return (
    <div className="relative rounded-2xl overflow-hidden border hairline bg-[#16161d] text-[#E4E4F0] shadow-[0_2px_18px_-12px_rgba(20,20,30,0.4)]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-white/45">
          {lang}
        </span>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-[11.5px] text-white/55 hover:text-white transition-colors">
          {copied ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> 已复制
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> 复制
            </>
          )}
        </button>
      </div>
      <pre className="px-4 py-4 text-[12.5px] leading-[1.7] overflow-x-auto font-mono">
        <code>
          {code.split("\n").map((line, i) => (
            <span key={i} className="block">
              {line.trimStart().startsWith("#") ? (
                <span style={{ color: "#9D9DEC" }}>{line}</span>
              ) : (
                colorize(line)
              )}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function colorize(line: string) {
  const KEYWORDS = [
    "curl",
    "pip",
    "install",
    "npm",
    "i",
    "from",
    "import",
    "for",
    "in",
    "print",
    "type",
    "name",
    "command",
    "env",
  ];
  const tokens = line.split(/(\s+|"[^"]*"|'[^']*'|https?:\/\/[^\s]+)/g);
  return tokens.map((t, i) => {
    if (!t) return null;
    if (/^"[^"]*"$|^'[^']*'$/.test(t)) {
      return (
        <span key={i} style={{ color: "#A6E3A1" }}>
          {t}
        </span>
      );
    }
    if (/^https?:\/\//.test(t)) {
      return (
        <span key={i} style={{ color: "#89B4FA", textDecoration: "underline" }}>
          {t}
        </span>
      );
    }
    if (KEYWORDS.includes(t)) {
      return (
        <span key={i} style={{ color: "#F5C2E7" }}>
          {t}
        </span>
      );
    }
    return <span key={i}>{t}</span>;
  });
}
