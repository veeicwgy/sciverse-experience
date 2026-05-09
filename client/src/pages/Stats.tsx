/*
 * Sciverse · Usage Stats (/stats) — v16
 * 重构后仅保留单一核心模块：分应用堆叠柱状调用量趋势
 *   - 顶部时间粒度：日 / 周 / 月
 *   - 密钥胶囊条：全部密钥 + 各密钥（最多 10）调用量与 sparkline，点击切换图表
 *   - 主图：每根柱子按子应用 Sciverse / 点石 / SeqStudio 堆叠分段，柱顶显示该时间点总量
 *   - 图例 + hover tooltip：精确显示该时间点的总量 与 各应用分量
 *   - 已删除：总调用次数大数字卡 / 分接口调用明细列表
 */
import { useMemo, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

// ─── 子应用配置 ────────────────────────────────────────
type AppKey = "sciverse" | "dianshi" | "seqstudio";
const APPS: { key: AppKey; name: string; color: string; weight: number }[] = [
  { key: "sciverse",  name: "Sciverse",       color: "#5B5BF7", weight: 0.66 },
  { key: "dianshi",   name: "点石 DianShi",   color: "#7C5CFC", weight: 0.20 },
  { key: "seqstudio", name: "SeqStudio",      color: "#10B981", weight: 0.14 },
];

// ─── 时间粒度 ───────────────────────────────────────────
const GRANS = ["日", "周", "月"] as const;
type Gran = (typeof GRANS)[number];
const GRAN_LABEL: Record<Gran, string> = {
  日: "今日 · 按小时",
  周: "近 7 天 · 按日",
  月: "本月 · 按日",
};

// ─── 密钥列表（最多 10 个） ─────────────────────────────
type KeyOpt = { id: string; name: string; weight: number };
const KEYS: KeyOpt[] = [
  { id: "all", name: "全部密钥",       weight: 1 },
  { id: "k1",  name: "my-key",         weight: 0.46 },
  { id: "k2",  name: "mcp test",       weight: 0.22 },
  { id: "k3",  name: "research-bot",   weight: 0.14 },
  { id: "k4",  name: "lab-prod",       weight: 0.10 },
  { id: "k5",  name: "weekly-digest",  weight: 0.05 },
  { id: "k6",  name: "ad-hoc",         weight: 0.03 },
];

// ─── 数据生成（确定性） ────────────────────────────────
function seedRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
type Stack = { x: string; total: number; parts: Record<AppKey, number> };
function buildStack(gran: Gran, keyId: string): Stack[] {
  const w = KEYS.find((k) => k.id === keyId)?.weight ?? 1;
  const seed = (gran.charCodeAt(0) * 31 + keyId.length * 13 + (keyId === "all" ? 11 : 1)) | 0;
  const rng = seedRandom(seed);
  const lengths: Record<Gran, { n: number; label: (i: number) => string; base: number; amp: number }> = {
    日: { n: 24, label: (i) => `${String(i).padStart(2, "0")}:00`, base: 240, amp: 180 },
    周: { n: 7,  label: (i) => ["周一","周二","周三","周四","周五","周六","周日"][i], base: 9000, amp: 4200 },
    月: { n: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(), label: (i) => String(i + 1), base: 9500, amp: 5000 },
  };
  const cfg = lengths[gran];
  return Array.from({ length: cfg.n }, (_, i) => {
    let total: number;
    if (gran === "日") {
      const wave = Math.sin(((i - 6) / 24) * Math.PI * 2);
      total = Math.max(0, Math.round((cfg.base + wave * cfg.amp + (rng() - 0.5) * 80) * w));
    } else {
      total = Math.max(0, Math.round((cfg.base + (rng() - 0.4) * cfg.amp) * w));
    }
    // 子应用份额：在固定权重附近做 ±15% 抖动后归一化
    const raw: Record<AppKey, number> = { sciverse: 0, dianshi: 0, seqstudio: 0 };
    let sumRaw = 0;
    APPS.forEach((a) => {
      const jitter = 1 + (rng() - 0.5) * 0.3;
      const v = Math.max(0.001, a.weight * jitter);
      raw[a.key] = v;
      sumRaw += v;
    });
    const parts: Record<AppKey, number> = { sciverse: 0, dianshi: 0, seqstudio: 0 };
    let used = 0;
    APPS.forEach((a, idx) => {
      if (idx === APPS.length - 1) parts[a.key] = Math.max(0, total - used);
      else {
        const share = raw[a.key] / sumRaw;
        const v = Math.round(total * share);
        parts[a.key] = v;
        used += v;
      }
    });
    return { x: cfg.label(i), total, parts };
  });
}
// 胶囊里 mini sparkline 固定使用近 7 天总量
function buildSparkline(keyId: string): number[] {
  return buildStack("周", keyId).map((p) => p.total);
}

const fmt = (n: number) => n.toLocaleString("en-US");

// ─── 主组件 ────────────────────────────────────────────
export default function Stats() {
  const [gran, setGran] = useState<Gran>("周");
  const [keyId, setKeyId] = useState<string>("all");

  const stack = useMemo(() => buildStack(gran, keyId), [gran, keyId]);
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
                按时间粒度查看分应用调用量趋势 · 可切换至单个密钥维度（最多 10 个）
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

          {/* MAIN CHART CARD */}
          <div className="mt-8 card-paper p-5">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <div className="font-display text-[20px] text-[var(--ink)]">
                  调用量趋势 · {GRAN_LABEL[gran]}
                </div>
                <div className="mt-1 text-[12.5px] text-[var(--ink-3)]">
                  当前密钥：<span className="text-[var(--ink-2)]">{currentKey.name}</span>
                </div>
              </div>
              {/* 图例 */}
              <div className="flex items-center gap-3">
                {APPS.map((a) => (
                  <div key={a.key} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: a.color }} />
                    <span className="text-[12px] text-[var(--ink-2)]">{a.name}</span>
                  </div>
                ))}
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
                    total={buildStack(gran, k.id).reduce((a, b) => a + b.total, 0)}
                  />
                ))}
              </div>
            </div>

            <StackedBar stack={stack} />
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

// ─── 堆叠柱状图 ────────────────────────────────────────
function StackedBar({ stack }: { stack: Stack[] }) {
  const width = 980;
  const height = 280;
  const padX = 38;
  const padTop = 26; // 给柱顶总量数字留空间
  const padBottom = 32;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const max = Math.max(1, ...stack.map((s) => s.total));
  // 柱宽：等分 + gap
  const slot = innerW / stack.length;
  const barW = Math.max(6, Math.min(slot * 0.62, 28));

  const ySteps = 4;
  const gridYs = Array.from({ length: ySteps + 1 }, (_, i) => padTop + (innerH * i) / ySteps);
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round((max * (ySteps - i)) / ySteps));
  const labelEvery = stack.length >= 24 && stack.length < 30 ? 4 : stack.length >= 30 ? 5 : 1;

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
    const idx = Math.floor((xInVB - padX) / slot);
    const clamped = Math.max(0, Math.min(stack.length - 1, idx));
    setHover(clamped);
  };

  const wrapW = wrapRef.current?.clientWidth ?? width;
  const scale = wrapW / width;
  const hoverItem = hover !== null ? stack[hover] : null;
  const hoverCx = hover !== null ? padX + slot * (hover + 0.5) : 0;
  const hoverTop = hover !== null && hoverItem ? padTop + innerH - (hoverItem.total / max) * innerH : 0;

  return (
    <div ref={wrapRef} className="mt-3 relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[280px] block"
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}>
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

        {/* 堆叠柱 + 柱顶总量 */}
        {stack.map((s, i) => {
          const cx = padX + slot * (i + 0.5);
          const x = cx - barW / 2;
          let yCursor = padTop + innerH;
          const barTopY = padTop + innerH - (s.total / max) * innerH;
          const isHover = hover === i;
          return (
            <g key={i}>
              {APPS.map((a) => {
                const part = s.parts[a.key];
                const segH = (part / max) * innerH;
                yCursor -= segH;
                return (
                  <rect
                    key={a.key}
                    x={x}
                    y={yCursor}
                    width={barW}
                    height={Math.max(0, segH)}
                    fill={a.color}
                    fillOpacity={hover === null || isHover ? 1 : 0.45}
                    rx={0.5}
                  />
                );
              })}
              {/* 柱顶总量数字 */}
              <text
                x={cx}
                y={barTopY - 6}
                textAnchor="middle"
                className="fill-[var(--ink-2)]"
                style={{ fontSize: 9.5, fontFamily: "var(--font-mono, monospace)", fontWeight: 600, opacity: isHover || hover === null ? 1 : 0.4 }}>
                {fmt(s.total)}
              </text>
            </g>
          );
        })}

        {/* x label */}
        {stack.map((s, i) => {
          if (i % labelEvery !== 0 && i !== stack.length - 1) return null;
          const cx = padX + slot * (i + 0.5);
          return (
            <text
              key={`xl-${i}`}
              x={cx}
              y={height - 10}
              textAnchor="middle"
              className="fill-[var(--ink-3)]"
              style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)" }}>
              {s.x}
            </text>
          );
        })}

        {/* hover crosshair */}
        {hoverItem && (
          <line
            x1={hoverCx}
            x2={hoverCx}
            y1={padTop}
            y2={padTop + innerH}
            stroke="rgba(20,20,30,0.18)"
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {/* HTML tooltip — 跟随 hover 柱 */}
      {hoverItem && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg bg-[var(--ink)] text-white px-3 py-2 shadow-md min-w-[160px]"
          style={{ left: hoverCx * scale, top: hoverTop * scale }}>
          <div className="font-mono text-[10px] tracking-[0.1em] opacity-70">
            {hoverItem.x}
          </div>
          <div className="mt-0.5 font-mono text-[14px] leading-tight">
            合计 {fmt(hoverItem.total)}
          </div>
          <div className="mt-1.5 space-y-0.5">
            {APPS.map((a) => (
              <div key={a.key} className="flex items-center gap-1.5 text-[11.5px]">
                <span className="h-1.5 w-1.5 rounded-sm" style={{ background: a.color }} />
                <span className="opacity-80 flex-1">{a.name}</span>
                <span className="font-mono opacity-95">{fmt(hoverItem.parts[a.key])}</span>
              </div>
            ))}
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
