/*
 * Sciverse · IntegrationBubble (v14)
 * 结果页顶部的可关闭引导卡。
 * v14: 从「单一 Skills 引流」改为「整体接入指南引流」，提供 API / CLI·SDK / Skills 三条路径，
 *      由用户自行选择，避免对单一方式的误导引流；CTA 跳 /docs 接入指南。
 * - 关闭后 localStorage 持久化（key 升级到 v14），不再出现
 */
import { useEffect, useState } from "react";
import { Cable, Terminal, Sparkles, ArrowRight, X } from "lucide-react";
import { Link } from "wouter";

const KEY = "sciverse:integrationBubble:dismissed:v14";

const PATHS = [
  {
    icon: Cable,
    label: "API 接口",
    desc: "RESTful · 任意语言可调",
    hash: "api",
  },
  {
    icon: Terminal,
    label: "CLI · SDK",
    desc: "pip / npm 一行安装",
    hash: "cli",
  },
  {
    icon: Sparkles,
    label: "Skills",
    desc: "三行配置装到 Agent",
    hash: "skills",
  },
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
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--brand)]">
                Integration Guide
              </span>
              <span className="text-[10px] font-mono text-[var(--ink-3)]">
                · 想把这能力接入你的应用？
              </span>
            </div>
            <div className="mt-0.5 font-display text-[15.5px] text-[var(--ink)] leading-snug">
              三种接入方式，按需选择
              <span className="text-[var(--ink-3)]"> · </span>
              <span className="text-[var(--ink-2)] text-[14px]">
                一个 API Key 通用，按调用次数计费、未用不扣
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/docs"
              className="inline-flex items-center gap-1 rounded-full bg-[var(--ink)] text-white px-3 py-1.5 text-[12px] hover:opacity-90 transition-opacity">
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

        {/* 三条路径 mini-cards */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PATHS.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.hash}
                href={`/docs#${p.hash}`}
                className="group flex items-center gap-2.5 rounded-lg border hairline bg-[var(--paper-2)]/60 px-3 py-2 hover:bg-white hover:border-[var(--ink)] transition-colors">
                <span className="h-7 w-7 rounded-md bg-white border hairline grid place-items-center text-[var(--ink)] shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] text-[var(--ink)] truncate">
                    {p.label}
                  </span>
                  <span className="block text-[11px] text-[var(--ink-3)] truncate">
                    {p.desc}
                  </span>
                </span>
                <ArrowRight className="h-3 w-3 text-[var(--ink-3)] group-hover:text-[var(--ink)] transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
