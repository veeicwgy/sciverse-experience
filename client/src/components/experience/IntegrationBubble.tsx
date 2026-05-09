/*
 * Sciverse · IntegrationBubble (v15)
 * 结果页顶部的可关闭引导卡。
 * v15: 去掉英文 UPPERCASE 标题；文案精简为一句话；按钮换成品牌紫蓝小药丸；
 *      mini-card 改为单行紧凑横排（图标 + 中文标签 + 副字），避免「API ... / RES ...」截断
 * - 关闭后 localStorage 持久化（key 升级到 v15），不再出现
 */
import { useEffect, useState } from "react";
import { Cable, Terminal, Sparkles, ArrowRight, X } from "lucide-react";
import { Link } from "wouter";

const KEY = "sciverse:integrationBubble:dismissed:v15";

const PATHS = [
  { icon: Cable,     label: "API 接口",   sub: "任意语言可调",    hash: "api" },
  { icon: Terminal,  label: "CLI · SDK",  sub: "一行命令安装",    hash: "cli" },
  { icon: Sparkles,  label: "Skills",     sub: "装到主流 Agent",  hash: "skills" },
];

export default function IntegrationBubble() {
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
        backgroundImage:
          "linear-gradient(180deg, rgba(91,91,247,0.025) 0%, rgba(91,91,247,0) 60%)",
      }}>
      {/* 左侧 2px 品牌色指示条 */}
      <div
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r"
        style={{ background: "var(--brand)" }}
      />
      <div className="relative px-5 py-4 pl-6">
        {/* 顶部一行：标题 + CTA + 关闭 */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="font-display text-[15.5px] text-[var(--ink)] leading-snug">
              想把这种检索能力接入你的应用？
              <span className="ml-1.5 text-[var(--ink-2)] text-[13.5px]">
                三种方式可选 · 全部免费调用
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/docs"
              className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12.5px] text-white hover:opacity-90 transition-opacity"
              style={{ background: "var(--brand)" }}>
              查看接入指南
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              onClick={dismiss}
              aria-label="不再提示"
              title="不再提示"
              className="h-7 w-7 rounded-full grid place-items-center text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[#f1f0eb] transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 三条路径 mini-cards：紧凑横排 */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PATHS.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.hash}
                href={`/docs#${p.hash}`}
                className="group flex items-center gap-2.5 rounded-xl border hairline bg-white px-3 py-2 hover:border-[var(--brand)] hover:bg-[var(--paper-2)]/50 transition-colors">
                <span className="h-7 w-7 rounded-lg bg-[#f4f3ff] grid place-items-center text-[var(--brand)] shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-[13px] text-[var(--ink)] font-medium">
                    {p.label}
                  </span>
                  <span className="text-[11.5px] text-[var(--ink-3)] truncate">
                    · {p.sub}
                  </span>
                </span>
                <ArrowRight className="h-3 w-3 text-[var(--ink-3)] group-hover:text-[var(--brand)] transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
