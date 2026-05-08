/*
 * Sciverse · Usage Stats (/stats) — v12
 * 顶部：标题 + 时间粒度 日/周/月（右上）
 * 总览：单卡 — 总调用次数（按所选粒度 + 当前密钥聚合）
 * 主图区：上方密钥胶囊条（含 sparkline + 调用量），下方折线+面积渐变图，鼠标 hover crosshair + tooltip
 * 明细：分接口调用量 + 占比
 */
import { useMemo, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

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

// ─── 密钥列表 ──────────────────────────────────────────
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

// ─── 数据生成（确定性） ────────────────────────────────
function seedRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
function buildSeries(gran: Gran, keyId: string): { x: string; v: number }[] {
  const w = KEYS.find((k) => k.id === keyId)?.weight ?? 1;
  const seed = (gran.charCodeAt(0) * 31 + keyId.length * 7 + (keyId === "all" ? 11 : 1)) | 0;
  const rng = seedRandom(seed);
  if (gran === "日") {
    return Array.from({ length: 24 }, (_, h) => {
      const base = 220 + Math.sin(((h - 6) / 24) * Math.PI * 2) * 180;
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
  const today = new Date();
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    const base = 9500 + (rng() - 0.4) * 5000;
    const v = Math.max(0, Math.round(base * w));
    return { x: String(i + 1), v };
  });
}
// 胶囊里 mini sparkline 固定使用近 7 天（与时间粒度无关，仅做识别）
function buildSparkline(keyId: string): number[] {
  return buildSeries("周", keyId).map((p) => p.v);
}

// ─── 分接口明细 ────────────────────────────────────────
type AppRow = {
  key: "sciverse" | "dianshi" | "seqstudio";
  name: string;
  desc: string;
  share: number;
};
const APP_BASE: AppRow[] = [
  { key: "sciverse", name: "Sciverse", desc: "agentic-search · meta-search · content-search", share: 66 },
  { key: "dianshi", name: "点石 DianShi", desc: "化学反应 / 物质 / 专利", share: 20 },
  { key: "seqstudio", name: "SeqStudio", desc: "蛋白注释 · BLAST · Foldseek", share: 14 },
];

const fmt = (n: number) => n.toLocaleString("en-US");

// ─── 主组件 ────────────────────────────────────────────
export default function Stats() {
  const [gran, setGran] = useState<Gran>("周");
  const [keyId, setKeyId] = useState<string>("all");

  const series = useMemo(() => buildSeries(gran, keyId), [gran, keyId]);
  const total = useMemo(() => series.reduce((a, b) => a + b.v, 0), [series]);
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
                按时间粒度查看调用量趋势 · 可切换至单个密钥维度（最多 10 个）
              </p>
            </div>
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

          {/* OVERVIEW: 仅总调用次数 */}
          <div className="mt-6 card-paper p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--ink-3)]" />
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                总调用次数
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <div className="font-display text-[40px] tracking-[-0.02em] text-[var(--ink)] leading-none">
                {fmt(total)}
              </div>
              <div className="text-[12.5px] text-[var(--ink-3)]">
                {GRAN_LABEL[gran]} · {currentKey.name}
              </div>
            </div>
          </div>

          {/* MAIN CHART CARD */}
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
                {series.length} pts · 鼠标悬停查看精确值
              </div>
            </div>

            {/* 密钥胶囊条 */}
            <div className="mt-4 -mx-1 overflow-x-auto sv-scrollbar">
              <div className="flex items-stretch gap-2 px-1 pb-2 min-w-max">
                {KEYS.map((k) => (
                  <KeyChip
                    key={k.id}
                    k={k}
                    active={keyId === k.id}
                    onClick={() => setKeyId(k.id)}
                    spark={buildSparkline(k.id)}
                    total={
                      k.id === "all"
                        ? buildSeries(gran, "all").reduce((a, b) => a + b.v, 0)
                        : buildSeries(gran, k.id).reduce((a, b) => a + b.v, 0)
                    }
                  />
                ))}
              </div>
            </div>

            <LineChart series={series} />
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

// ─── 密钥胶囊 ──────────────────────────────────────────
function KeyChip({
  k,
  active,
  onClick,
  spark,
  total,
}: {
  k: KeyOpt;
  active: boolean;
  onClick: () => void;
  spark: number[];
  total: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 group relative rounded-xl border px-3 py-2.5 text-left transition-all min-w-[160px]",
        active
          ? "border-[var(--ink)] bg-[var(--ink)] text-white shadow-[0_2px_10px_rgba(20,20,30,0.12)]"
          : "hairline bg-white text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)]",
      )}>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            active ? "bg-white" : "bg-[#5B5BF7]",
          )}
        />
        <span className="text-[12.5px] font-medium truncate max-w-[120px]">
          {k.name}
        </span>
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <span
          className={cn(
            "font-mono text-[12.5px] leading-none",
            active ? "text-white" : "text-[var(--ink)]",
          )}>
          {fmt(total)}
        </span>
        <Sparkline
          values={spark}
          stroke={active ? "rgba(255,255,255,0.95)" : "#5B5BF7"}
        />
      </div>
    </button>
  );
}

function Sparkline({ values, stroke }: { values: number[]; stroke: string }) {
  const w = 56;
  const h = 16;
  const max = Math.max(1, ...values);
  const step = w / (values.length - 1 || 1);
  const path = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── 折线图 + 面积渐变 + hover crosshair + tooltip ─────
function LineChart({ series }: { series: { x: string; v: number }[] }) {
  const width = 980;
  const height = 240;
  const padX = 36;
  const padTop = 14;
  const padBottom = 30;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const max = Math.max(1, ...series.map((p) => p.v));
  const stepX = innerW / Math.max(1, series.length - 1);

  const pts = series.map((p, i) => ({
    cx: padX + i * stepX,
    cy: padTop + innerH - (p.v / max) * innerH,
    ...p,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(" ");
  const areaPath =
    `M ${pts[0].cx.toFixed(1)} ${(padTop + innerH).toFixed(1)} ` +
    pts.map((p) => `L ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(" ") +
    ` L ${pts[pts.length - 1].cx.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`;

  const ySteps = 4;
  const gridYs = Array.from({ length: ySteps + 1 }, (_, i) => padTop + (innerH * i) / ySteps);
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round((max * (ySteps - i)) / ySteps));
  // x 轴 label 抽样
  const labelEvery = series.length >= 24 && series.length < 30 ? 4 : series.length >= 30 ? 5 : 1;

  // hover state
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const xInVB = xRatio * width;
    if (xInVB < padX || xInVB > width - padX) {
      setHover(null);
      return;
    }
    const idx = Math.round((xInVB - padX) / stepX);
    const clamped = Math.max(0, Math.min(series.length - 1, idx));
    setHover(clamped);
  };

  const hoverPt = hover !== null ? pts[hover] : null;
  // tooltip 像素位置（基于 wrap 实际宽度）
  const wrapW = wrapRef.current?.clientWidth ?? width;
  const scale = wrapW / width;
  const tipLeft = hoverPt ? hoverPt.cx * scale : 0;
  const tipTop = hoverPt ? hoverPt.cy * scale : 0;

  return (
    <div ref={wrapRef} className="mt-3 relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[240px] block"
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="sv-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B5BF7" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#5B5BF7" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* y 网格 + label */}
        {gridYs.map((y, i) => (
          <g key={i}>
            <line
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="rgba(20,20,30,0.08)"
              strokeDasharray={i === ySteps ? "0" : "2 4"}
            />
            <text
              x={padX - 8}
              y={y + 3}
              textAnchor="end"
              className="fill-[var(--ink-3)]"
              style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)" }}>
              {yLabels[i].toLocaleString("en-US")}
            </text>
          </g>
        ))}
        {/* 面积 */}
        <path d={areaPath} fill="url(#sv-area)" />
        {/* 折线 */}
        <path
          d={linePath}
          fill="none"
          stroke="#5B5BF7"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* x label */}
        {pts.map((p, i) => {
          if (i % labelEvery !== 0 && i !== pts.length - 1) return null;
          return (
            <text
              key={`xl-${i}`}
              x={p.cx}
              y={height - 10}
              textAnchor="middle"
              className="fill-[var(--ink-3)]"
              style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)" }}>
              {p.x}
            </text>
          );
        })}
        {/* hover crosshair + dot */}
        {hoverPt && (
          <g>
            <line
              x1={hoverPt.cx}
              x2={hoverPt.cx}
              y1={padTop}
              y2={padTop + innerH}
              stroke="rgba(20,20,30,0.18)"
              strokeDasharray="3 3"
            />
            <circle cx={hoverPt.cx} cy={hoverPt.cy} r="6" fill="#5B5BF7" fillOpacity="0.18" />
            <circle cx={hoverPt.cx} cy={hoverPt.cy} r="3" fill="#5B5BF7" stroke="white" strokeWidth="1.5" />
          </g>
        )}
      </svg>

      {/* HTML tooltip — 跟随 hover 点 */}
      {hoverPt && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg bg-[var(--ink)] text-white px-2.5 py-1.5 shadow-md"
          style={{ left: tipLeft, top: tipTop }}>
          <div className="font-mono text-[10px] tracking-[0.1em] uppercase opacity-70">
            {hoverPt.x}
          </div>
          <div className="font-mono text-[13px] leading-tight">
            {fmt(hoverPt.v)}
          </div>
          <div
            className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{ background: "var(--ink)" }}
          />
        </div>
      )}
    </div>
  );
}
