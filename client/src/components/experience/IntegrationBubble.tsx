/*
 * Sciverse · IntegrationBubble (v16 / v30)
 * 结果页顶部的可关闭引导卡。
 * v16 改造：
 * - 去除"查看接入指南"主紫色按钮 → 与下方三种方式重复
 * - 标题独占一行，避免被按钮挤压换行；副标"三种方式 · 全部免费"作为 eyebrow 上提
 * - 三种方式 mini-card 视觉权重对齐 Editorial 主版面：浮起 logo 容器（hover 主色描边 + 微动）、
 *   单行标题 + 一句话定位、右侧 hairline 箭头 → 主色箭头
 * - 关闭按钮收为右上角极小 X（hairline 圆，不抢戏）
 * - localStorage key 升级到 v16，旧用户重新看到一次新版
 */
import { useEffect, useState } from "react";
import { Cable, Terminal, Sparkles, ArrowRight, X } from "lucide-react";
import { Link } from "wouter";

const KEY = "sciverse:integrationBubble:dismissed:v16";

const PATHS = [
  { icon: Cable,    label: "API 接口",   sub: "RESTful · 任意语言可调",     hash: "api",    kbd: "API"   },
  { icon: Terminal, label: "CLI · SDK",  sub: "一行命令安装 · 本地集成",     hash: "cli",    kbd: "CLI"   },
  { icon: Sparkles, label: "Skills",     sub: "装到 Manus / Claude / Cursor", hash: "skills", kbd: "SKILL" },
];

export default function IntegrationBubble() {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setClosing(true);
    window.setTimeout(() => setShow(false), 200);
  };

  return (
    <div
      className={`ed-in mt-4 relative overflow-hidden rounded-2xl border hairline bg-white transition-all duration-200 ease-out ${
        closing ? "opacity-0 scale-[0.985]" : "opacity-100 scale-100"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(91,91,247,0.045) 0%, rgba(91,91,247,0) 55%)",
        transformOrigin: "top right",
        willChange: "transform, opacity",
      }}>
      {/* 左侧 brand 竖条 */}
      <div
        aria-hidden
        className="absolute left-0 top-4 bottom-4 w-[2px] rounded-r"
        style={{ background: "var(--brand)" }}
      />

      {/* 关闭按钮 · 极小、右上 */}
      <button
        onClick={dismiss}
        aria-label="不再提示"
        title="不再提示"
        className="absolute top-3 right-3 h-6 w-6 rounded-full grid place-items-center text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors z-10">
        <X className="h-3 w-3" strokeWidth={1.8} />
      </button>

      <div className="relative px-6 pt-5 pb-5 pl-7">
        {/* eyebrow 小字 · 中文化 */}
        <div className="flex items-center gap-2 text-[11.5px] tracking-[0.32em] text-[var(--ink-3)]">
          <span className="inline-block h-px w-5 bg-[var(--ink-3)]/50" />
          接入 · 三种方式 · 全部免费
        </div>

        {/* 主标题独占一行 */}
        <h3 className="mt-2.5 font-display text-[20px] md:text-[22px] leading-snug tracking-tight text-[var(--ink)] pr-10">
          把这种检索能力接入你的应用
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-2)]">
          按团队偏好选一种接入方式，所有方式共享同一份 1.02 亿 AI-Ready 全文索引。
        </p>

        {/* 三种方式 · Editorial mini-card */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {PATHS.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.hash}
                href={`/docs#${p.hash}`}
                className="group relative flex items-center gap-3 rounded-xl border hairline bg-white px-3.5 py-3 hover:border-[var(--brand)]/45 hover:bg-[var(--brand-soft)]/40 transition-all duration-300 hover:-translate-y-[1px]"
                style={{ willChange: "transform" }}>
                {/* hover 工程感 kbd 标签 */}
                <span
                  aria-hidden
                  className="absolute top-1.5 right-2 px-1.5 py-[1px] rounded-[4px] border hairline bg-white text-[9.5px] tracking-[0.18em] text-[var(--ink-3)] font-mono opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:text-[var(--brand)] group-hover:border-[var(--brand)]/40 transition-all duration-300">
                  {p.kbd}
                </span>
                <span
                  className="h-9 w-9 rounded-lg border hairline grid place-items-center text-[var(--brand)] shrink-0 group-hover:border-[var(--brand)]/55 group-hover:bg-white transition-all duration-300"
                  style={{ background: "var(--brand-soft)" }}>
                  <Icon className="h-4 w-4" strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1 flex flex-col leading-tight">
                  <span className="text-[13.5px] text-[var(--ink)] font-medium tracking-tight">
                    {p.label}
                  </span>
                  <span className="mt-0.5 text-[11.5px] text-[var(--ink-3)] truncate group-hover:text-[var(--ink-2)] transition-colors">
                    {p.sub}
                  </span>
                </span>
                <ArrowRight
                  className="h-3.5 w-3.5 text-[var(--ink-3)] group-hover:text-[var(--brand)] group-hover:translate-x-0.5 transition-all duration-300 shrink-0"
                  strokeWidth={1.8}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
