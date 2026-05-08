/*
 * Sciverse · Usage Stats (/stats)
 * 总览 4 数字 + 分 Key 明细
 */
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { TrendingUp, CheckCircle2, Timer, Coins } from "lucide-react";

const RANGES = ["今天", "本周", "本月"] as const;
type Range = (typeof RANGES)[number];

const SUMMARY: Record<Range, { calls: string; success: string; ms: string; tokens: string }> = {
  今天: { calls: "12,450", success: "99.2%", ms: "420 ms", tokens: "1.24 M" },
  本周: { calls: "78,902", success: "99.5%", ms: "405 ms", tokens: "8.30 M" },
  本月: { calls: "302,778", success: "99.4%", ms: "412 ms", tokens: "32.6 M" },
};

const KEYS: Record<
  Range,
  { name: string; calls: string; success: string; ms: string }[]
> = {
  今天: [
    { name: "my-key", calls: "3,241", success: "99.8%", ms: "380 ms" },
    { name: "mcp test", calls: "9,209", success: "98.9%", ms: "440 ms" },
  ],
  本周: [
    { name: "my-key", calls: "21,402", success: "99.7%", ms: "388 ms" },
    { name: "mcp test", calls: "57,500", success: "99.4%", ms: "418 ms" },
  ],
  本月: [
    { name: "my-key", calls: "82,041", success: "99.6%", ms: "390 ms" },
    { name: "mcp test", calls: "220,737", success: "99.3%", ms: "428 ms" },
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
  const k = KEYS[range];

  return (
    <div className="min-h-screen flex">
      <Sidebar active="stats" />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1080px] mx-auto px-8 lg:px-12 py-10">
          <div className="section-marker mb-4">§ Usage / Overview</div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-[34px] tracking-[-0.02em] text-[var(--ink)]">
                调用统计
              </h1>
              <p className="mt-1.5 text-[13.5px] text-[var(--ink-2)]">
                按 API Key 维度查看调用量、成功率与平均耗时
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

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={TrendingUp} label="总调用次数" value={s.calls} hint={`时间范围：${range}`} />
            <StatCard icon={CheckCircle2} label="成功率" value={s.success} hint="HTTP 2xx 占比" />
            <StatCard icon={Timer} label="平均响应时间" value={s.ms} hint="P50 端到端" />
            <StatCard icon={Coins} label="消耗 Token" value={s.tokens} hint="LLM 整合阶段累计" />
          </div>

          <div className="mt-10">
            <div className="section-marker mb-3">§ Per-Key Breakdown</div>
            <h2 className="font-display text-[22px] text-[var(--ink)]">
              分 Key 调用明细
            </h2>
            <div className="mt-3 card-paper overflow-hidden">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] text-[11.5px] tracking-[0.12em] uppercase font-mono text-[var(--ink-3)] px-5 py-3 bg-[var(--paper-2)] border-b hairline">
                <span>Key 名称</span>
                <span>调用量</span>
                <span>成功率</span>
                <span>平均耗时</span>
              </div>
              {k.map((row, i) => (
                <div
                  key={row.name}
                  className={cn(
                    "grid grid-cols-[1.4fr_1fr_1fr_1fr] px-5 py-4 items-center",
                    i !== 0 && "border-t hairline",
                  )}>
                  <div className="font-display text-[15px] text-[var(--ink)]">
                    {row.name}
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
                  <div className="font-mono text-[13px] text-[var(--ink-2)]">
                    {row.ms}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 card-paper p-5">
            <div className="section-marker mb-2">§ Per-App Breakdown</div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-[18px] text-[var(--ink)]">
                  分 App 明细
                </h3>
                <p className="mt-1 text-[12.5px] text-[var(--ink-2)]">
                  待定 · 接入 App 维度统计后此处展示分布与峰值时间。
                </p>
              </div>
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
