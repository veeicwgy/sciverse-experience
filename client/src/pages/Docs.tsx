/*
 * Sciverse · 接入指南 (/docs) — v16
 * 大重构：扩为三产品（Sciverse / 点石 DianShi / SeqStudio）× 接入方式
 * 结构：左侧两层菜单
 *   ─ 概览（默认） ：三产品介绍 + 各自支持的接入方式
 *   ─ Sciverse
 *       · API 接口
 *       · CLI · SDK
 *       · Skills
 *   ─ 点石 DianShi
 *       · API 接口
 *       · CLI · SDK
 *   ─ SeqStudio
 *       · API 接口
 *       · CLI · SDK
 *       · Skills
 * URL hash：product/method  例 #sciverse/api、#dianshi/cli
 * 代码示例：先放占位（"示例代码待补充"），交由研发后续接入对应仓库
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Cable,
  Terminal,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Atom,
  FlaskConical,
  Dna,
  KeyRound,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

// ─── 类型与配置 ────────────────────────────────────────
type MethodKey = "api" | "cli" | "skills";
type ProductKey = "sciverse" | "dianshi" | "seqstudio";

type Method = {
  key: MethodKey;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  oneLine: string;
  bestFor: string;
  pros: string[];
  features: string[];
  externalHref: string;
  externalLabel: string;
  codeLang: string;
  codePlaceholder: string;
};

type Product = {
  key: ProductKey;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  brand: string;     // 品牌色
  oneLine: string;
  scope: string;
  highlights: string[];
  methods: Method[]; // 该产品支持的接入方式
};

// ── 接入方式模板（不同产品的代码块占位与外链不同）──────
const METHOD_TEMPLATES: Record<MethodKey, Omit<Method, "externalHref" | "externalLabel" | "codePlaceholder">> = {
  api: {
    key: "api",
    icon: Cable,
    title: "API 接口",
    oneLine: "RESTful 接口，一次 HTTP 调用即可拿到结果",
    bestFor: "已有后端服务、自定义 Agent 工具调用、对返回结果需二次加工的团队。",
    pros: [
      "零依赖，所有语言可调",
      "返回结构化 JSON，便于二次加工",
      "稳定 SLA · 全局 CDN 就近接入",
    ],
    features: ["认证：API Key Header", "支持流式 / 同步两种返回", "细粒度参数控制"],
    codeLang: "bash",
  },
  cli: {
    key: "cli",
    icon: Terminal,
    title: "CLI · SDK",
    oneLine: "命令行 + 多语言 SDK，本地脚本与流水线即装即用",
    bestFor: "数据分析师、研究员、需要在脚本 / Notebook / CI 中调用的工程团队。",
    pros: [
      "一行命令安装，跨平台支持",
      "Python / TypeScript SDK 类型完整",
      "本地缓存与重试策略内置",
    ],
    features: ["pip / npm / brew 安装", "支持 .env 与配置文件", "并发批处理与速率控制"],
    codeLang: "python",
  },
  skills: {
    key: "skills",
    icon: Sparkles,
    title: "Skills",
    oneLine: "MCP Skills 配置，主流 Agent 装载即用",
    bestFor: "Manus / Claude / Cursor 等 Agent 用户，希望以 Skill 形式持久装载该产品能力。",
    pros: [
      "MCP 标准协议，跨 Agent 通用",
      "三行 YAML 配置完成装载",
      "支持权限作用域与会话级开关",
    ],
    features: ["Skill 包含完整工具描述", "兼容 Manus Skills / Claude Skills / Cursor Rules", "可与本产品 API Key 共用"],
    codeLang: "yaml",
  },
};

function buildMethod(
  base: MethodKey,
  product: ProductKey,
  externalHref: string,
  externalLabel: string,
  codePlaceholder: string,
): Method {
  return {
    ...METHOD_TEMPLATES[base],
    externalHref,
    externalLabel,
    codePlaceholder,
  };
}

// ── 三个产品 ──────────────────────────────────────────
const PRODUCTS: Product[] = [
  {
    key: "sciverse",
    name: "Sciverse",
    shortName: "Sciverse",
    icon: Atom,
    brand: "#5B5BF7",
    oneLine: "面向 Agent 的科学检索与知识合成",
    scope: "PubMed · arXiv · OpenAlex · 专利库等多源科学语料的检索与摘要合成",
    highlights: ["agentic-search · meta-search · content-search", "命中文献含引用片段与 PDF 页码回链", "内置查询规划与去重"],
    methods: [
      buildMethod("api", "sciverse", "https://docs.sciverse.example/api", "查看 Sciverse API 参考", "# Sciverse · API 调用示例\n# 示例代码待补充（由研发对接 Sciverse API 文档后填入）"),
      buildMethod("cli", "sciverse", "https://docs.sciverse.example/cli", "查看 Sciverse CLI · SDK 文档", "# Sciverse · CLI/SDK 调用示例\n# 示例代码待补充"),
      buildMethod("skills", "sciverse", "https://docs.sciverse.example/skills", "查看 Sciverse Skills 装载指南", "# Sciverse · Skills 配置示例\n# 示例配置待补充"),
    ],
  },
  {
    key: "dianshi",
    name: "点石 DianShi",
    shortName: "点石",
    icon: FlaskConical,
    brand: "#7C5CFC",
    oneLine: "有机化学反应数据库与化学物质 / 专利检索",
    scope: "10M+ 化学反应、6M+ 化学物质、1M+ 专利文献",
    highlights: ["反应路线检索与逆合成提示", "物质属性与谱图查询", "专利与文献交叉关联"],
    methods: [
      buildMethod("api", "dianshi", "https://docs.dianshi.example/api", "查看点石 API 参考", "# 点石 DianShi · API 调用示例\n# 示例代码待补充"),
      buildMethod("cli", "dianshi", "https://docs.dianshi.example/cli", "查看点石 CLI · SDK 文档", "# 点石 DianShi · CLI/SDK 调用示例\n# 示例代码待补充"),
    ],
  },
  {
    key: "seqstudio",
    name: "SeqStudio",
    shortName: "SeqStudio",
    icon: Dna,
    brand: "#10B981",
    oneLine: "蛋白功能 AI 推理 + LLM 注释一体化",
    scope: "57 万+ 蛋白注释，整合 BLAST / Foldseek 与结构预测",
    highlights: ["蛋白功能/结构 AI 推理", "BLAST · Foldseek 一体化", "AI 推理 + LLM 注释"],
    methods: [
      buildMethod("api", "seqstudio", "https://docs.seqstudio.example/api", "查看 SeqStudio API 参考", "# SeqStudio · API 调用示例\n# 示例代码待补充"),
      buildMethod("cli", "seqstudio", "https://docs.seqstudio.example/cli", "查看 SeqStudio CLI · SDK 文档", "# SeqStudio · CLI/SDK 调用示例\n# 示例代码待补充"),
      buildMethod("skills", "seqstudio", "https://docs.seqstudio.example/skills", "查看 SeqStudio Skills 装载指南", "# SeqStudio · Skills 配置示例\n# 示例配置待补充"),
    ],
  },
];

// ─── 主组件 ────────────────────────────────────────────
type Active =
  | { kind: "overview" }
  | { kind: "method"; product: ProductKey; method: MethodKey };

function parseHash(hash: string): Active {
  const h = hash.replace(/^#/, "");
  if (!h || h === "overview") return { kind: "overview" };
  const [p, m] = h.split("/");
  const product = PRODUCTS.find((x) => x.key === p);
  if (!product) return { kind: "overview" };
  const method = product.methods.find((x) => x.key === (m as MethodKey));
  if (!method) return { kind: "method", product: product.key, method: product.methods[0].key };
  return { kind: "method", product: product.key, method: method.key };
}
function activeToHash(a: Active): string {
  return a.kind === "overview" ? "overview" : `${a.product}/${a.method}`;
}

export default function Docs() {
  const [active, setActive] = useState<Active>(() =>
    typeof window !== "undefined" ? parseHash(window.location.hash) : { kind: "overview" },
  );

  // 同步 URL hash
  useEffect(() => {
    const onHashChange = () => setActive(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const go = (a: Active) => {
    const h = activeToHash(a);
    if (typeof window !== "undefined") window.location.hash = h;
    setActive(a);
    // 切换时回到顶部
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 当前激活产品/方式（method 视图下用）
  const current = useMemo(() => {
    if (active.kind !== "method") return null;
    const product = PRODUCTS.find((p) => p.key === active.product)!;
    const method = product.methods.find((m) => m.key === active.method)!;
    return { product, method };
  }, [active]);

  return (
    <div className="min-h-screen flex">
      <Sidebar active="docs" />
      <main className="flex-1 min-w-0 flex">
        {/* 二级菜单：产品 + 接入方式（两层） */}
        <aside className="hidden lg:block w-[240px] shrink-0 border-r hairline px-5 py-10 sticky top-0 self-start h-screen overflow-y-auto bg-[var(--paper)]">
          <div className="font-display text-[18px] tracking-tight text-[var(--ink)]">
            接入指南
          </div>
          <div className="mt-1 text-[12px] text-[var(--ink-3)]">
            选一个产品，再选接入方式
          </div>

          <button
            onClick={() => go({ kind: "overview" })}
            className={cn(
              "mt-6 w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-[13px] transition-colors",
              active.kind === "overview"
                ? "bg-[var(--ink)]/[0.06] text-[var(--ink)] font-medium"
                : "text-[var(--ink-2)] hover:bg-[var(--ink)]/[0.04] hover:text-[var(--ink)]",
            )}>
            概览
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          </button>

          <nav className="mt-2 space-y-1">
            {PRODUCTS.map((p) => {
              const PIcon = p.icon;
              const expanded =
                active.kind === "method" && active.product === p.key;
              return (
                <div key={p.key}>
                  <button
                    onClick={() =>
                      go({ kind: "method", product: p.key, method: p.methods[0].key })
                    }
                    className={cn(
                      "w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-[13px] transition-colors",
                      expanded
                        ? "text-[var(--ink)] font-medium bg-[var(--ink)]/[0.04]"
                        : "text-[var(--ink-2)] hover:bg-[var(--ink)]/[0.04] hover:text-[var(--ink)]",
                    )}>
                    <PIcon className="h-3.5 w-3.5 shrink-0" style={{ color: p.brand }} />
                    <span className="flex-1 truncate">{p.name}</span>
                    {expanded ? (
                      <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    )}
                  </button>
                  {expanded && (
                    <div className="ml-7 mt-0.5 space-y-0.5 border-l hairline pl-3">
                      {p.methods.map((m) => {
                        const isActive =
                          active.kind === "method" &&
                          active.product === p.key &&
                          active.method === m.key;
                        const MIcon = m.icon;
                        return (
                          <button
                            key={m.key}
                            onClick={() =>
                              go({ kind: "method", product: p.key, method: m.key })
                            }
                            className={cn(
                              "w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors",
                              isActive
                                ? "bg-[var(--ink)] text-white"
                                : "text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--ink)]/[0.04]",
                            )}>
                            <MIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate">{m.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* 主内容 */}
        <div className="flex-1 min-w-0">
          <div className="max-w-[920px] mx-auto px-8 lg:px-12 py-12">
            {/* 顶部 Tab（移动端） */}
            <div className="lg:hidden mb-6 -mx-2 overflow-x-auto sv-scrollbar">
              <div className="flex gap-1.5 px-2 min-w-max">
                <button
                  onClick={() => go({ kind: "overview" })}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[12.5px] transition-colors border",
                    active.kind === "overview"
                      ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                      : "hairline text-[var(--ink-2)]",
                  )}>
                  概览
                </button>
                {PRODUCTS.map((p) =>
                  p.methods.map((m) => {
                    const isActive =
                      active.kind === "method" &&
                      active.product === p.key &&
                      active.method === m.key;
                    return (
                      <button
                        key={`${p.key}-${m.key}`}
                        onClick={() => go({ kind: "method", product: p.key, method: m.key })}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[12.5px] transition-colors border whitespace-nowrap",
                          isActive
                            ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                            : "hairline text-[var(--ink-2)]",
                        )}>
                        {p.shortName} · {m.title}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>

            {active.kind === "overview" && <Overview onGo={go} />}
            {active.kind === "method" && current && (
              <MethodPage product={current.product} method={current.method} />
            )}

            {/* 底部 CTA：仅在概览页展示 */}
            {active.kind === "overview" && (
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
                    <h3 className="font-display text-[28px] leading-tight tracking-[-0.01em]">
                      免费申请 API Key，立即开始接入
                    </h3>
                    <p className="mt-2 text-[13.5px] text-white/70 leading-relaxed">
                      一个 Key 通用三产品的 API、CLI · SDK、Skills 全部接入方式，全部能力免费调用。
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── 概览页 ────────────────────────────────────────────
function Overview({ onGo }: { onGo: (a: Active) => void }) {
  return (
    <>
      <section>
        <h1 className="font-display text-[44px] leading-[1.05] tracking-[-0.02em] text-[var(--ink)]">
          三个产品，按场景接入
        </h1>
        <p className="mt-3 max-w-[660px] text-[14.5px] leading-relaxed text-[var(--ink-2)]">
          Sciverse 团队对外提供 <span className="text-[var(--ink)]">Sciverse</span>、<span className="text-[var(--ink)]">点石 DianShi</span>、<span className="text-[var(--ink)]">SeqStudio</span> 三类科学能力。每个产品支持 API 接口、CLI · SDK 与 Skills 等多种接入方式，一个 API Key 全部通用，所有能力免费调用。
        </p>
      </section>

      {/* 三产品介绍卡 */}
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
                <div className="font-display text-[18px] text-[var(--ink)] tracking-tight">
                  {p.name}
                </div>
              </div>
              <p className="mt-2 text-[12.5px] text-[var(--ink-2)] leading-relaxed">
                {p.oneLine}
              </p>
              <div className="mt-3 pt-3 border-t hairline">
                <p className="text-[11.5px] text-[var(--ink-3)]">数据范围</p>
                <p className="mt-1 text-[12.5px] text-[var(--ink-2)] line-clamp-2">
                  {p.scope}
                </p>
              </div>
              <ul className="mt-3 space-y-1">
                {p.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-1.5 text-[12px] text-[var(--ink-2)]">
                    <span
                      className="h-1.5 w-1.5 rounded-full mt-[6px] shrink-0"
                      style={{ background: p.brand }}
                    />
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>

              {/* 该产品的接入方式入口 */}
              <div className="mt-4 pt-3 border-t hairline">
                <p className="text-[11.5px] text-[var(--ink-3)] mb-1.5">支持的接入方式</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.methods.map((m) => {
                    const MIcon = m.icon;
                    return (
                      <button
                        key={m.key}
                        onClick={() => onGo({ kind: "method", product: p.key, method: m.key })}
                        className="inline-flex items-center gap-1 rounded-full border hairline px-2.5 py-1 text-[11.5px] text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)] transition-colors">
                        <MIcon className="h-3 w-3" />
                        {m.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 全部接入方式矩阵 */}
      <section className="mt-12">
        <h2 className="font-display text-[22px] text-[var(--ink)]">三产品 × 接入方式</h2>
        <p className="mt-1.5 text-[13px] text-[var(--ink-2)]">
          下表展示每个产品支持的接入方式，点击单元格直达对应文档。
        </p>
        <div className="mt-4 card-paper overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] text-[12px] text-[var(--ink-3)] px-5 py-3 bg-[var(--paper-2)] border-b hairline">
            <span></span>
            <span>API 接口</span>
            <span>CLI · SDK</span>
            <span>Skills</span>
          </div>
          {PRODUCTS.map((p, i) => (
            <div
              key={p.key}
              className={cn(
                "grid grid-cols-[1.2fr_1fr_1fr_1fr] px-5 py-3.5 items-center text-[13px]",
                i !== 0 && "border-t hairline",
              )}>
              <span className="text-[var(--ink)] font-medium">{p.name}</span>
              {(["api", "cli", "skills"] as MethodKey[]).map((mk) => {
                const m = p.methods.find((x) => x.key === mk);
                if (!m)
                  return (
                    <span key={mk} className="text-[var(--ink-3)]">
                      —
                    </span>
                  );
                return (
                  <button
                    key={mk}
                    onClick={() =>
                      onGo({ kind: "method", product: p.key, method: mk })
                    }
                    className="inline-flex items-center gap-1 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                    支持
                    <ArrowRight className="h-3 w-3" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ─── 单个 接入方式 子页 ────────────────────────────────
function MethodPage({ product, method }: { product: Product; method: Method }) {
  const PIcon = product.icon;
  const MIcon = method.icon;
  return (
    <section>
      {/* 面包屑 */}
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-3)]">
        <span>接入指南</span>
        <ChevronRight className="h-3 w-3" />
        <span style={{ color: product.brand }}>{product.name}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--ink-2)]">{method.title}</span>
      </div>

      {/* 区头 */}
      <div className="mt-3 flex items-center gap-2.5">
        <span
          className="h-9 w-9 rounded-xl border hairline grid place-items-center"
          style={{ background: `${product.brand}10`, color: product.brand }}>
          <PIcon className="h-4 w-4" />
        </span>
        <span
          className="h-9 w-9 rounded-xl bg-[var(--paper-2)] border hairline grid place-items-center text-[var(--ink)]">
          <MIcon className="h-4 w-4" />
        </span>
        <h1 className="font-display text-[34px] text-[var(--ink)] tracking-[-0.01em]">
          {product.shortName} · {method.title}
        </h1>
      </div>
      <p className="mt-2 text-[14px] text-[var(--ink-2)] max-w-[640px]">
        {method.oneLine}
      </p>

      {/* 主体两栏 */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5">
        <div className="card-paper p-5">
          <div>
            <div className="text-[12.5px] text-[var(--ink-3)]">适用场景</div>
            <p className="mt-1.5 text-[13.5px] text-[var(--ink)] leading-relaxed">
              {method.bestFor}
            </p>
          </div>
          <div className="mt-5">
            <div className="text-[12.5px] text-[var(--ink-3)]">优势</div>
            <ul className="mt-2 space-y-1.5">
              {method.pros.map((p) => (
                <li key={p} className="flex items-start gap-2 text-[13px] text-[var(--ink-2)]">
                  <CheckCircle2
                    className="h-3.5 w-3.5 mt-[2px] shrink-0"
                    style={{ color: product.brand }}
                  />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5">
            <div className="text-[12.5px] text-[var(--ink-3)]">主要能力</div>
            <ul className="mt-2 space-y-1.5">
              {method.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-[var(--ink-2)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink)]/40 mt-[7px] shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t hairline">
            <a
              href={method.externalHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ink)] hover:opacity-80 transition-opacity">
              {method.externalLabel}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <CodeBlock lang={method.codeLang} code={method.codePlaceholder} />
      </div>
    </section>
  );
}

// ─── 代码块（占位）────────────────────────────────────
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border hairline bg-[#16161d] text-[#E4E4F0] shadow-[0_2px_18px_-12px_rgba(20,20,30,0.4)]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <span className="font-mono text-[10.5px] tracking-[0.2em] text-white/45">
          {lang}
        </span>
        <span className="text-[11px] text-white/40">示例代码待补充</span>
      </div>
      <pre className="px-4 py-4 text-[12.5px] leading-[1.7] overflow-x-auto font-mono">
        <code className="text-white/75 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
