/*
 * Sciverse · SkillsBubble (v10)
 * 结果页顶部的可关闭引导卡，推荐用户安装 Sciverse Skills 接入 Agent
 * v10: 卡片配色改为与全站协调的暖白纸感（无紫蓝渐变），左侧 2px 紫蓝指示条 +
 *      品牌点强调；文案重写为更具体的行动导向 — 「3 行配置 / 装到主流 Agent / 复用本次检索能力」
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
      className="ed-in mt-4 relative overflow-hidden rounded-2xl border hairline bg-white"
      style={{
        // 极淡的暖色调，避免大面积紫蓝抢色；与 card-paper 一致
        backgroundImage:
          "linear-gradient(180deg, rgba(91,91,247,0.025) 0%, rgba(91,91,247,0) 60%)",
      }}>
      {/* v10: 左侧 2px 品牌色指示条，强化"推荐"语义但不喧宾夺主 */}
      <div
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r"
        style={{ background: "var(--brand)" }}
      />
      <div className="relative flex items-start gap-4 px-5 py-4 pl-6">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[#f4f3ff] grid place-items-center text-[var(--brand)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--brand)]">
              Sciverse Skills
            </span>
            <span className="text-[10px] font-mono text-[var(--ink-3)]">
              · 装到你的 Agent
            </span>
          </div>
          <div className="mt-0.5 font-display text-[15.5px] text-[var(--ink)] leading-snug">
            把这次的科学检索能力，搬进你的 Agent
            <span className="text-[var(--ink-3)]">·</span>
            <span className="text-[var(--ink-2)] text-[14.5px]">
              {" "}3 行配置即可装载到 Manus / Claude / Cursor
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--ink-2)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[var(--brand)]" />
              一次封装 · 三路并行检索 + 去重
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[var(--brand)]" />
              引用片段 · PDF 页码自动回链
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[var(--brand)]" />
              MCP / OpenAPI 双协议
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
            className="h-7 w-7 rounded-full grid place-items-center text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[#f1f0eb] transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
