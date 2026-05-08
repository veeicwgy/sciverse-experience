/*
 * Sciverse · 接入指南 (/docs) — v14
 * 结构：左侧二级菜单 + 右侧主内容
 *   - 概览（overview，默认）：三方式简介卡 + 对比表 + 底部 CTA
 *   - API 接口（api）：适用场景 / 优势 / 主要能力 + cURL 代码块 + 新窗口外链
 *   - CLI · SDK（cli）：同结构，pip+npm+Python 示例
 *   - Skills（skills）：同结构，yaml MCP 配置
 * 二级菜单 sticky；URL hash 同步（#api / #cli / #skills / 默认空=overview）
 * 所有「查看完整文档 / 安装到我的 Agent」按钮都在新窗口打开外链
 */
import { useEffect, useState } from "react";
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
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";

type SecKey = "overview" | "api" | "cli" | "skills";

type Method = {
  key: Exclude<SecKey, "overview">;
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
  ctaHref: string;
};

const METHODS: Method[] = [
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
      "content · 全文级片段命中与回链",
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
      "类型完备的 Python / TypeScript SDK",
      "CLI 支持流式输出与 JSON Lines",
    ],
    features: [
      "sciverse search 直出 markdown / json",
      "Python: SciverseClient 同步 + 异步双 API",
      "Node: ESM/CJS 双导出，开箱即用",
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

const NAV: { key: SecKey; label: string; icon: any }[] = [
  { key: "overview", label: "概览", icon: LayoutGrid },
  { key: "api", label: "API 接口", icon: Cable },
  { key: "cli", label: "CLI · SDK", icon: Terminal },
  { key: "skills", label: "Skills", icon: Sparkles },
];

// 对比表行
const COMPARE_ROWS: { label: string; values: Record<Exclude<SecKey, "overview">, string> }[] = [
  {
    label: "适合人群",
    values: {
      api: "后端 / 自研 Agent 团队",
      cli: "研究员 / 数据分析 / CI",
      skills: "Agent · IDE 助手用户",
    },
  },
  {
    label: "接入成本",
    values: {
      api: "需自行实现请求与解析",
      cli: "一行 pip / npm",
      skills: "三行 YAML 配置",
    },
  },
  {
    label: "灵活度",
    values: {
      api: "★★★★★ 完全可控",
      cli: "★★★★ 可脚本编排",
      skills: "★★★ 由 Agent 自动调度",
    },
  },
  {
    label: "支持平台",
    values: {
      api: "全平台 · 任意语言",
      cli: "macOS · Linux · Windows",
      skills: "Manus / Claude / Cursor / Continue",
    },
  },
  {
    label: "结果引用",
    values: {
      api: "JSON 字段直返",
      cli: "JSON Lines / Markdown",
      skills: "Agent 回答内嵌引用",
    },
  },
];

export default function Docs() {
  const [active, setActive] = useState<SecKey>(() => {
    if (typeof window === "undefined") return "overview";
    const h = window.location.hash.replace("#", "");
    if (h === "api" || h === "cli" || h === "skills") return h as SecKey;
    return "overview";
  });

  // 同步 hash → state
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "api" || h === "cli" || h === "skills") setActive(h as SecKey);
      else setActive("overview");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (k: SecKey) => {
    setActive(k);
    if (typeof window === "undefined") return;
    if (k === "overview") {
      history.replaceState(null, "", window.location.pathname);
    } else {
      history.replaceState(null, "", `${window.location.pathname}#${k}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentMethod = METHODS.find((m) => m.key === active);

  return (
    <div className="min-h-screen flex">
      <Sidebar active="docs" />
      <main className="flex-1 min-w-0 flex">
        {/* 二级菜单 */}
        <aside className="hidden lg:block w-[220px] shrink-0 border-r hairline px-5 py-10 sticky top-0 self-start h-screen overflow-y-auto bg-[var(--paper)]">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--ink-3)]">
            Integration Guide
          </div>
          <div className="mt-1.5 font-display text-[18px] tracking-tight text-[var(--ink)]">
            接入指南
          </div>
          <nav className="mt-6 space-y-0.5">
            {NAV.map((n) => {
              const Icon = n.icon;
              const isActive = active === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => go(n.key)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] transition-colors",
                    isActive
                      ? "bg-[var(--paper-2)] text-[var(--ink)]"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]",
                  )}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{n.label}</span>
                </button>
              );
            })}
          </nav>
          <Link
            href="/tokens"
            className="mt-8 inline-flex items-center gap-1 text-[12px] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
            <KeyRound className="h-3 w-3" />
            申请 API Key
            <ArrowRight className="h-3 w-3" />
          </Link>
        </aside>

        {/* 主内容 */}
        <div className="flex-1 min-w-0">
          <div className="max-w-[920px] mx-auto px-8 lg:px-12 py-12">
            {/* 移动端 sticky tab */}
            <div
              className="lg:hidden sticky top-0 z-20 -mx-8 px-8 py-3"
              style={{
                backgroundColor: "rgba(250,250,247,0.85)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                borderBottom: "1px solid rgba(20,20,30,0.08)",
              }}>
              <div className="overflow-x-auto sv-scrollbar">
                <div className="inline-flex p-0.5 rounded-full border hairline bg-white">
                  {NAV.map((n) => (
                    <button
                      key={n.key}
                      onClick={() => go(n.key)}
                      className={cn(
                        "px-3.5 py-1.5 text-[12.5px] rounded-full transition-colors whitespace-nowrap",
                        active === n.key
                          ? "bg-[var(--ink)] text-white"
                          : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                      )}>
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {active === "overview" && <Overview onGo={go} />}
            {active !== "overview" && currentMethod && <MethodPage method={currentMethod} />}

            {/* 底部 CTA（所有子页都展示） */}
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
        </div>
      </main>
    </div>
  );
}

// ─── 概览页 ────────────────────────────────────────────
function Overview({ onGo }: { onGo: (k: SecKey) => void }) {
  return (
    <>
      {/* HERO */}
      <section>
        <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[var(--ink-3)]">
          Integration Guide · Overview
        </span>
        <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-[-0.02em] text-[var(--ink)]">
          三种方式，按需选择
        </h1>
        <p className="mt-3 max-w-[640px] text-[14.5px] leading-relaxed text-[var(--ink-2)]">
          Sciverse 的科学检索能力可通过 <span className="text-[var(--ink)]">API 接口</span>、<span className="text-[var(--ink)]">CLI / SDK</span>、<span className="text-[var(--ink)]">Skills</span> 三种方式接入你的工作流。一个 API Key 全部通用，调用按次计费、未用不扣。
        </p>
      </section>

      {/* 三方式概览卡 */}
      <section className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {METHODS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                onClick={() => onGo(m.key)}
                className="group relative card-paper p-5 text-left hover:border-[var(--ink)] hover:shadow-[0_8px_24px_-12px_rgba(20,20,30,0.18)] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <span className="h-9 w-9 rounded-xl bg-[var(--paper-2)] border hairline grid place-items-center text-[var(--ink)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[10.5px] tracking-[0.18em] text-[var(--ink-3)]">
                    {m.no}
                  </span>
                </div>
                <div className="mt-4 font-display text-[18px] text-[var(--ink)] tracking-tight">
                  {m.title}
                </div>
                <p className="mt-1.5 text-[12.5px] text-[var(--ink-2)] leading-relaxed line-clamp-2">
                  {m.oneLine}
                </p>
                <div className="mt-3 pt-3 border-t hairline">
                  <span className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                    适合
                  </span>
                  <p className="mt-1 text-[12px] text-[var(--ink-2)] line-clamp-2">
                    {m.bestFor}
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-[12px] text-[var(--ink)] group-hover:gap-2 transition-all">
                  查看详情
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 对比表 */}
      <section className="mt-12">
        <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[var(--ink-3)]">
          Compare
        </span>
        <h2 className="mt-1 font-display text-[22px] text-[var(--ink)]">三种方式横向对比</h2>
        <p className="mt-1.5 text-[13px] text-[var(--ink-2)] max-w-[640px]">
          按团队角色、接入成本、灵活度、平台覆盖等维度横向比较，帮助你快速选定适合的接入方式。
        </p>

        <div className="mt-4 card-paper overflow-hidden">
          <div className="grid grid-cols-[1.1fr_1fr_1fr_1fr] text-[11.5px] tracking-[0.12em] uppercase font-mono text-[var(--ink-3)] px-5 py-3 bg-[var(--paper-2)] border-b hairline">
            <span></span>
            <span>API 接口</span>
            <span>CLI · SDK</span>
            <span>Skills</span>
          </div>
          {COMPARE_ROWS.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                "grid grid-cols-[1.1fr_1fr_1fr_1fr] px-5 py-3.5 items-center text-[13px]",
                i !== 0 && "border-t hairline",
              )}>
              <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--ink-3)]">
                {row.label}
              </span>
              <span className="text-[var(--ink)]">{row.values.api}</span>
              <span className="text-[var(--ink)]">{row.values.cli}</span>
              <span className="text-[var(--ink)]">{row.values.skills}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {METHODS.map((m) => (
            <button
              key={m.key}
              onClick={() => onGo(m.key)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border hairline bg-white text-[12.5px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
              进入「{m.title}」
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

// ─── 方式子页 ──────────────────────────────────────────
function MethodPage({ method }: { method: Method }) {
  const Icon = method.icon;
  return (
    <section>
      {/* 区头 */}
      <div className="flex items-start gap-3">
        <span className="font-mono text-[12px] tracking-[0.18em] text-[var(--ink-3)] mt-2">
          {method.no}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-[var(--paper-2)] border hairline grid place-items-center text-[var(--ink)]">
              <Icon className="h-4 w-4" />
            </span>
            <h1 className="font-display text-[34px] text-[var(--ink)] tracking-[-0.01em]">
              {method.title}
            </h1>
          </div>
          <p className="mt-2 text-[14.5px] text-[var(--ink-2)] leading-relaxed max-w-[720px]">
            {method.oneLine}
          </p>
        </div>
      </div>

      {/* 主体两栏 */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5">
        <div className="card-paper p-5">
          <div>
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
              适用场景
            </span>
            <p className="mt-1.5 text-[13.5px] text-[var(--ink)] leading-relaxed">
              {method.bestFor}
            </p>
          </div>
          <div className="mt-5">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
              优势
            </span>
            <ul className="mt-2 space-y-1.5">
              {method.pros.map((p) => (
                <li key={p} className="flex items-start gap-2 text-[13px] text-[var(--ink-2)]">
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
              {method.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-[var(--ink-2)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink)]/40 mt-[7px] shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <a
            href={method.ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--ink)] hover:gap-2.5 transition-all">
            {method.ctaLabel}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <CodeBlock lang={method.codeLang} code={method.code} />
      </div>
    </section>
  );
}

// ─── 代码块 ────────────────────────────────────────────
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
  const KEYWORDS = ["curl", "pip", "install", "npm", "i", "from", "import", "for", "in", "print", "type", "name", "command", "env"];
  const tokens = line.split(/(\s+|"[^"]*"|'[^']*'|https?:\/\/[^\s]+)/g);
  return tokens.map((t, i) => {
    if (!t) return null;
    if (/^"[^"]*"$|^'[^']*'$/.test(t)) return <span key={i} style={{ color: "#A6E3A1" }}>{t}</span>;
    if (/^https?:\/\//.test(t)) return <span key={i} style={{ color: "#89B4FA", textDecoration: "underline" }}>{t}</span>;
    if (KEYWORDS.includes(t)) return <span key={i} style={{ color: "#F5C2E7" }}>{t}</span>;
    return <span key={i}>{t}</span>;
  });
}
