/*
 * Sciverse · Usage Stats (/stats) — v3
 * 总览仅 2 数字（调用量 / 成功率），分 App 明细：Sciverse / 点石 / SeqStudio
 */
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { TrendingUp, CheckCircle2 } from "lucide-react";

const LOGO_MAP: Record<string, string> = {
  sciverse: "/manus-storage/sciverse-logo_532e83dd.svg",
  dianshi: "/manus-storage/dianshi_8cef3dfd.svg",
  seqstudio: "/manus-storage/seqstudio_3990637c.svg",
};

// SVG 兜底：当外链 logo 加载失败时用品牌色首字母圆形头像
const BRAND_COLOR: Record<string, string> = {
  sciverse: "#5B5BF7",
  dianshi: "#7C5CFC",
  seqstudio: "#10B981",
};
const RANGES = ["今天", "本周", "本月"] as const;
type Range = (typeof RANGES)[number];

const SUMMARY: Record<Range, { calls: string; success: string }> = {
  今天: { calls: "12,450", success: "99.2%" },
  本周: { calls: "78,902", success: "99.5%" },
  本月: { calls: "302,778", success: "99.4%" },
};

type AppRow = {
  key: "sciverse" | "dianshi" | "seqstudio";
  name: string;
  desc: string;
  calls: string;
  success: string;
  share: number; // 0-100
};

const APPS: Record<Range, AppRow[]> = {
  今天: [
    { key: "sciverse", name: "Sciverse", desc: "agentic-search · meta-search · content-search", calls: "8,210", success: "99.4%", share: 66 },
    { key: "dianshi", name: "点石 DianShi", desc: "化学反应 / 物质 / 专利", calls: "2,540", success: "99.0%", share: 20 },
    { key: "seqstudio", name: "SeqStudio", desc: "蛋白注释 · BLAST · Foldseek", calls: "1,700", success: "98.8%", share: 14 },
  ],
  本周: [
    { key: "sciverse", name: "Sciverse", desc: "agentic-search · meta-search · content-search", calls: "52,400", success: "99.6%", share: 66 },
    { key: "dianshi", name: "点石 DianShi", desc: "化学反应 / 物质 / 专利", calls: "16,002", success: "99.3%", share: 20 },
    { key: "seqstudio", name: "SeqStudio", desc: "蛋白注释 · BLAST · Foldseek", calls: "10,500", success: "99.1%", share: 14 },
  ],
  本月: [
    { key: "sciverse", name: "Sciverse", desc: "agentic-search · meta-search · content-search", calls: "201,830", success: "99.5%", share: 66 },
    { key: "dianshi", name: "点石 DianShi", desc: "化学反应 / 物质 / 专利", calls: "60,448", success: "99.2%", share: 20 },
    { key: "seqstudio", name: "SeqStudio", desc: "蛋白注释 · BLAST · Foldseek", calls: "40,500", success: "99.0%", share: 14 },
  ],
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card-paper p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[var(--ink-3)]" />
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
          {label}
        </span>
      </div>
      <div className="mt-3 font-display text-[36px] tracking-[-0.02em] text-[var(--ink)]">
        {value}
      </div>
      <div className="mt-1 text-[12px] text-[var(--ink-3)]">{hint}</div>
    </div>
  );
}

export default function Stats() {
  const [range, setRange] = useState<Range>("今天");
  const s = SUMMARY[range];
  const apps = APPS[range];

  return (
    <div className="min-h-screen flex">
      <Sidebar active="stats" />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1080px] mx-auto px-8 lg:px-12 py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-[34px] tracking-[-0.02em] text-[var(--ink)]">
                调用统计
              </h1>
              <p className="mt-1.5 text-[13.5px] text-[var(--ink-2)]">
                按接口维度查看调用量与成功率，分时间范围聚合
              </p>
            </div>
            <div className="inline-flex p-0.5 rounded-full border hairline bg-white">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3.5 py-1.5 text-[12.5px] rounded-full transition-colors",
                    range === r
                      ? "bg-[var(--ink)] text-white"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                  )}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 总览：仅保留 调用量 + 成功率 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <StatCard icon={TrendingUp} label="总调用次数" value={s.calls} hint={`时间范围：${range}`} />
            <StatCard icon={CheckCircle2} label="成功率" value={s.success} hint="HTTP 2xx 占比" />
          </div>

          {/* 分接口调用明细：Sciverse / 点石 / SeqStudio */}
          <div className="mt-10">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-display text-[22px] text-[var(--ink)]">
                分接口调用明细
              </h2>
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                3 endpoints
              </span>
            </div>

            <div className="mt-3 card-paper overflow-hidden">
              <div className="grid grid-cols-[1.6fr_1fr_1fr_1.2fr] text-[11.5px] tracking-[0.12em] uppercase font-mono text-[var(--ink-3)] px-5 py-3 bg-[var(--paper-2)] border-b hairline">
                <span>接口 / 站点</span>
                <span>调用量</span>
                <span>成功率</span>
                <span>占比</span>
              </div>
              {apps.map((row, i) => (
                <div
                  key={row.key}
                  className={cn(
                    "grid grid-cols-[1.6fr_1fr_1fr_1.2fr] px-5 py-4 items-center",
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
                            "h-5 w-5 rounded-md grid place-items-center text-white text-[11px] font-semibold leading-none";
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
                    {row.calls}
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[11px] text-[var(--forest)] bg-[var(--forest-soft)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {row.success}
                    </span>
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
