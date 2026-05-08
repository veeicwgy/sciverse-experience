/*
 * Sciverse · Usage Stats (/stats) — v11
 * 顶部：时间粒度（日/周/月） · 密钥筛选（全部 + 最多 10 个 key）
 * 总览：单一核心数字（调用量）
 * 主图：按粒度变化 X 轴 — 日=24h / 周=近 7 天 / 月=本月每日
 * 明细：分接口（Sciverse / 点石 / SeqStudio）调用量 + 占比，去成功率
 */
import { useMemo, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { TrendingUp, KeyRound, ChevronDown } from "lucide-react";

// ─── 资源 ──────────────────────────────────────────────
const LOGO_MAP: Record<string, string> = {
  sciverse: "/manus-storage/sciverse-logo_532e83dd.svg",
  dianshi: "/manus-storage/dianshi_8cef3dfd.svg",
  seqstudio: "/manus-storage/seqstudio_3990637c.svg",
};
const BRAND_COLOR: Record<string, string> = {
  sciverse: "#5B5BF7",
  dianshi: "#7C5CFC",
  seqstudio: "#10B981",
};

// ─── 时间粒度 ───────────────────────────────────────────
const GRANS = ["日", "周", "月"] as const;
type Gran = (typeof GRANS)[number];
const GRAN_LABEL: Record<Gran, string> = {
  日: "今日 · 按小时",
  周: "近 7 天 · 按日",
  月: "本月 · 按日",
};

// ─── 密钥列表（演示数据，与 Tokens 页保持一致风格） ───────
type KeyOpt = { id: string; name: string; weight: number };
const KEYS: KeyOpt[] = [
  { id: "all", name: "全部密钥", weight: 1 },
  { id: "k1", name: "my-key", weight: 0.46 },
  { id: "k2", name: "mcp test", weight: 0.22 },
  { id: "k3", name: "research-bot", weight: 0.14 },
  { id: "k4", name: "lab-prod", weight: 0.1 },
  { id: "k5", name: "weekly-digest", weight: 0.05 },
  { id: "k6", name: "ad-hoc", weight: 0.03 },
];

// ─── 数据生成（确定性，无后端） ───────────────────────────
function seedRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
function buildSeries(gran: Gran, keyId: string): { x: string; v: number }[] {
  const w = KEYS.find((k) => k.id === keyId)?.weight ?? 1;
  const seed = (gran.charCodeAt(0) * 31 + keyId.length * 7) | 0;
  const rng = seedRandom(seed);
  if (gran === "日") {
    return Array.from({ length: 24 }, (_, h) => {
      const base = 200 + Math.sin(((h - 6) / 24) * Math.PI * 2) * 180;
      const noise = (rng() - 0.5) * 80;
      const v = Math.max(0, Math.round((base + noise) * w));
      return { x: `${String(h).padStart(2, "0")}:00`, v };
    });
  }
  if (gran === "周") {
    const labels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    return labels.map((d) => {
      const base = 9000 + (rng() - 0.4) * 4200;
      const v = Math.max(0, Math.round(base * w));
      return { x: d, v };
    });
  }
  // 月：本月每日
  const today = new Date();
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    const base = 9500 + (rng() - 0.4) * 5000;
    const v = Math.max(0, Math.round(base * w));
    return { x: String(i + 1), v };
  });
}

// ─── 分接口明细（按粒度近似） ────────────────────────────
type AppRow = {
  key: "sciverse" | "dianshi" | "seqstudio";
  name: string;
  desc: string;
  share: number; // 0-100
};
const APP_BASE: AppRow[] = [
  { key: "sciverse", name: "Sciverse", desc: "agentic-search · meta-search · content-search", share: 66 },
  { key: "dianshi", name: "点石 DianShi", desc: "化学反应 / 物质 / 专利", share: 20 },
  { key: "seqstudio", name: "SeqStudio", desc: "蛋白注释 · BLAST · Foldseek", share: 14 },
];

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

// ─── 组件 ──────────────────────────────────────────────
export default function Stats() {
  const [gran, setGran] = useState<Gran>("周");
  const [keyId, setKeyId] = useState<string>("all");
  const [openKey, setOpenKey] = useState(false);

  const series = useMemo(() => buildSeries(gran, keyId), [gran, keyId]);
  const total = useMemo(() => series.reduce((a, b) => a + b.v, 0), [series]);
  const peak = useMemo(() => series.reduce((m, b) => (b.v > m.v ? b : m), series[0]), [series]);
  const avg = useMemo(() => Math.round(total / series.length), [total, series]);
  const apps = APP_BASE.map((a) => ({ ...a, calls: Math.round(total * (a.share / 100)) }));

  const currentKey = KEYS.find((k) => k.id === keyId) ?? KEYS[0];

  return (
    <div className="min-h-screen flex">
      <Sidebar active="stats" />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1080px] mx-auto px-8 lg:px-12 py-10">
          {/* HEADER */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-[34px] tracking-[-0.02em] text-[var(--ink)]">
                调用统计
              </h1>
              <p className="mt-1.5 text-[13.5px] text-[var(--ink-2)]">
                按时间粒度查看调用量趋势，可按密钥维度筛选 · 最多展示 10 个密钥
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* 密钥筛选 */}
              <div className="relative">
                <button
                  onClick={() => setOpenKey((v) => !v)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border hairline bg-white text-[12.5px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
                  <KeyRound className="h-3.5 w-3.5" />
                  {currentKey.name}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", openKey && "rotate-180")} />
                </button>
                {openKey && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenKey(false)} />
                    <div className="absolute right-0 top-10 z-20 w-[220px] card-paper p-1.5 shadow-md ed-in">
                      <div className="px-2.5 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                        筛选密钥 · {KEYS.length - 1}/10
                      </div>
                      {KEYS.map((k) => (
                        <button
                          key={k.id}
                          onClick={() => {
                            setKeyId(k.id);
                            setOpenKey(false);
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between text-[13px] transition-colors",
                            keyId === k.id
                              ? "bg-[#f1f0eb] text-[var(--ink)]"
                              : "text-[var(--ink-2)] hover:bg-[#f6f5f0] hover:text-[var(--ink)]",
                          )}>
                          <span className="truncate">{k.name}</span>
                          {k.id !== "all" && (
                            <span className="font-mono text-[10.5px] text-[var(--ink-3)]">
                              {Math.round(k.weight * 100)}%
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* 时间粒度 */}
              <div className="inline-flex p-0.5 rounded-full border hairline bg-white">
                {GRANS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGran(g)}
                    className={cn(
                      "px-3.5 py-1.5 text-[12.5px] rounded-full transition-colors",
                      gran === g
                        ? "bg-[var(--ink)] text-white"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                    )}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* OVERVIEW: 单一核心数字 + 趋势上下文 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1 card-paper p-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-[var(--ink-3)]" />
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                  总调用次数
                </span>
              </div>
              <div className="mt-3 font-display text-[36px] tracking-[-0.02em] text-[var(--ink)]">
                {fmt(total)}
              </div>
              <div className="mt-1 text-[12px] text-[var(--ink-3)]">
                {GRAN_LABEL[gran]} · {currentKey.name}
              </div>
            </div>
            <div className="card-paper p-5">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                单点峰值
              </span>
              <div className="mt-3 font-display text-[28px] text-[var(--ink)]">
                {fmt(peak.v)}
              </div>
              <div className="mt-1 text-[12px] text-[var(--ink-3)]">
                出现于 <span className="font-mono">{peak.x}</span>
              </div>
            </div>
            <div className="card-paper p-5">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                单点均值
              </span>
              <div className="mt-3 font-display text-[28px] text-[var(--ink)]">
                {fmt(avg)}
              </div>
              <div className="mt-1 text-[12px] text-[var(--ink-3)]">
                {gran === "日" ? "每小时平均" : gran === "周" ? "每天平均" : "每天平均"}
              </div>
            </div>
          </div>

          {/* MAIN CHART */}
          <div className="mt-8 card-paper p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                  调用量趋势
                </div>
                <div className="mt-1 font-display text-[20px] text-[var(--ink)]">
                  {GRAN_LABEL[gran]}
                </div>
              </div>
              <div className="text-[11.5px] text-[var(--ink-3)] font-mono">
                {series.length} pts
              </div>
            </div>
            <BarChart series={series} gran={gran} />
          </div>

          {/* APP BREAKDOWN */}
          <div className="mt-10">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-display text-[22px] text-[var(--ink)]">
                分接口调用明细
              </h2>
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                3 endpoints · {currentKey.name}
              </span>
            </div>

            <div className="mt-3 card-paper overflow-hidden">
              <div className="grid grid-cols-[1.8fr_1fr_1.4fr] text-[11.5px] tracking-[0.12em] uppercase font-mono text-[var(--ink-3)] px-5 py-3 bg-[var(--paper-2)] border-b hairline">
                <span>接口 / 站点</span>
                <span>调用量</span>
                <span>占比</span>
              </div>
              {apps.map((row, i) => (
                <div
                  key={row.key}
                  className={cn(
                    "grid grid-cols-[1.8fr_1fr_1.4fr] px-5 py-4 items-center",
                    i !== 0 && "border-t hairline",
                  )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-8 w-8 rounded-full border hairline grid place-items-center bg-white shrink-0 overflow-hidden">
                      <img
                        src={LOGO_MAP[row.key]}
                        alt={row.name}
                        className="h-5 w-5 object-contain"
                        draggable={false}
                        onError={(e) => {
                          const img = e.currentTarget;
                          const parent = img.parentElement;
                          if (!parent) return;
                          img.style.display = "none";
                          if (parent.querySelector("[data-fb]")) return;
                          const span = document.createElement("span");
                          span.dataset.fb = "1";
                          span.className =
                            "h-5 w-5 rounded-md text-white text-[11px] font-semibold leading-none";
                          span.style.background = BRAND_COLOR[row.key] || "#5B5BF7";
                          span.style.display = "grid";
                          span.style.alignItems = "center";
                          span.style.justifyContent = "center";
                          span.textContent = row.name.slice(0, 1);
                          parent.appendChild(span);
                        }}
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-[15px] text-[var(--ink)] truncate">
                        {row.name}
                      </div>
                      <div className="font-mono text-[10.5px] tracking-[0.04em] text-[var(--ink-3)] truncate">
                        {row.desc}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-[13px] text-[var(--ink)]">
                    {fmt(row.calls)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[3px] rounded-full bg-[var(--ink-3)]/15 overflow-hidden">
                      <div
                        className="h-full bg-[var(--ink)] transition-[width] duration-700 ease-out"
                        style={{ width: `${row.share}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-[var(--ink-2)] w-9 text-right">
                      {row.share}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── 柱状图（纯 SVG，浅色 hairline 网格 + 紫蓝渐变柱） ───
function BarChart({
  series,
  gran,
}: {
  series: { x: string; v: number }[];
  gran: Gran;
}) {
  const width = 980;
  const height = 220;
  const padX = 28;
  const padTop = 12;
  const padBottom = 28;
  const max = Math.max(1, ...series.map((p) => p.v));
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const barGap = gran === "月" ? 2 : 6;
  const barW = (innerW - barGap * (series.length - 1)) / series.length;

  // x 轴标签抽样：日每 4h 一个、月每 5 日一个、周全部
  const labelEvery = gran === "日" ? 4 : gran === "月" ? 5 : 1;

  // y 轴 4 条网格
  const ySteps = 4;
  const gridYs = Array.from({ length: ySteps + 1 }, (_, i) => padTop + (innerH * i) / ySteps);

  return (
    <div className="mt-4 -mx-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[220px]"
        preserveAspectRatio="none">
        <defs>
          <linearGradient id="sv-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B5BF7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#5B5BF7" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {/* 网格 */}
        {gridYs.map((y, i) => (
          <line
            key={i}
            x1={padX}
            x2={width - padX}
            y1={y}
            y2={y}
            stroke="rgba(20,20,30,0.08)"
            strokeDasharray={i === ySteps ? "0" : "2 4"}
          />
        ))}
        {/* 柱体 */}
        {series.map((p, i) => {
          const x = padX + i * (barW + barGap);
          const h = (p.v / max) * innerH;
          const y = padTop + innerH - h;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(2, h)}
                rx={Math.min(3, barW / 2)}
                fill="url(#sv-bar)">
                <title>
                  {p.x} · {p.v.toLocaleString("en-US")}
                </title>
              </rect>
            </g>
          );
        })}
        {/* x 轴标签 */}
        {series.map((p, i) => {
          if (i % labelEvery !== 0 && i !== series.length - 1) return null;
          const x = padX + i * (barW + barGap) + barW / 2;
          return (
            <text
              key={`l-${i}`}
              x={x}
              y={height - 8}
              textAnchor="middle"
              className="fill-[var(--ink-3)]"
              style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)" }}>
              {p.x}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
