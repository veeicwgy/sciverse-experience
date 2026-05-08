/*
 * Sciverse · SkillsBubble
 * 结果页顶部的可关闭引导卡，推荐用户安装 Sciverse Skills 接入 Agent
 * - 关闭后 localStorage 持久化，不再出现
 */
import { useEffect, useState } from "react";
import { Sparkles, ArrowUpRight, X } from "lucide-react";

const KEY = "sciverse:skillsBubble:dismissed";

export default function SkillsBubble() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
  };

  return (
    <div
      className="ed-in mt-4 relative overflow-hidden rounded-2xl border hairline"
      style={{
        background:
          "linear-gradient(120deg, #f4f3ff 0%, #fafaf7 55%, #f4f3ff 100%)",
      }}>
      {/* decorative dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(91,91,247,0.18) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
          maskImage:
            "linear-gradient(to right, rgba(0,0,0,0.6), transparent 70%)",
          WebkitMaskImage:
            "linear-gradient(to right, rgba(0,0,0,0.6), transparent 70%)",
        }}
      />
      <div className="relative flex items-start gap-4 px-5 py-4">
        <div className="h-9 w-9 shrink-0 rounded-full bg-white border hairline grid place-items-center text-[var(--brand)] shadow-[0_4px_14px_-6px_rgba(91,91,247,0.5)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--brand)]">
              Sciverse Skills
            </span>
            <span className="text-[10px] font-mono text-[var(--ink-3)]">
              · 推荐
            </span>
          </div>
          <div className="mt-0.5 font-display text-[15.5px] text-[var(--ink)] leading-snug">
            想让 Agent 直接调起这次搜索？{" "}
            <span className="text-[var(--ink-2)]">
              用 Sciverse Skills，三行配置即可装载到 Manus、Claude、Cursor。
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--ink-2)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[var(--brand)]" />
              内置三接口调用 · 自动清洗与去重
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[var(--brand)]" />
              支持引用片段与 PDF 页码回链
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 self-start shrink-0">
          <a
            href="https://clawhub.ai/gary-shen/sciverse-agent-tools"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-[var(--ink)] text-white px-3 py-1.5 text-[12px] hover:opacity-90 transition-opacity">
            获取 Skill
            <ArrowUpRight className="h-3 w-3" />
          </a>
          <button
            onClick={dismiss}
            aria-label="不再提示"
            title="不再提示"
            className="h-7 w-7 rounded-full grid place-items-center text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-white/70 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
