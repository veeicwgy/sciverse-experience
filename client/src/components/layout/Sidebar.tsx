/*
 * Sciverse Sidebar — Editorial Lab
 * Layout: 260px expanded / 56px collapsed (icons-only with tooltips)
 * Pattern: Logo · 新对话 · 历史对话 · 文档中心 · API Key · 调用统计 · (spacer) · 用户中心
 * Style: paper bg #FAFAF7, active item white card with brand indigo accent bar
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronsLeft,
  ChevronsRight,
  PenSquare,
  History,
  BookOpen,
  KeyRound,
  BarChart3,
  Settings,
  LogIn,
  Sparkles,
  Globe,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NavKey = "experience" | "history" | "docs" | "tokens" | "stats";

const NAV: {
  key: NavKey;
  label: string;
  icon: any;
  href?: string;
  hint?: string;
}[] = [
  { key: "experience", label: "新对话", icon: PenSquare, href: "/experience", hint: "清空搜索 · 开始一次新查询" },
  { key: "history", label: "历史对话", icon: History, hint: "近期搜索按时间分组" },
  { key: "docs", label: "文档中心", icon: BookOpen, href: "/docs", hint: "三接口 API 文档" },
  { key: "tokens", label: "API Key 管理", icon: KeyRound, href: "/tokens" },
  { key: "stats", label: "调用统计", icon: BarChart3, href: "/stats" },
];

const HISTORY = [
  {
    bucket: "今天",
    items: [
      { id: "h1", title: "CRISPR 基因编辑" },
      { id: "h2", title: "阿尔茨海默症靶点" },
    ],
  },
  {
    bucket: "昨天",
    items: [{ id: "h3", title: "蛋白质折叠预测" }],
  },
  {
    bucket: "更早",
    items: [
      { id: "h4", title: "COVID-19 长期效应" },
      { id: "h5", title: "逆合成路径规划" },
    ],
  },
];

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div
        className="relative h-8 w-8 rounded-full flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #8a8aff 0%, #5b5bf7 60%, #3a3acc 100%)",
        }}>
        <div className="absolute inset-[6px] rounded-full border border-white/70" />
        <div className="absolute inset-[10px] rounded-full bg-white/0 border border-white/40 rotate-45" />
      </div>
      {!collapsed && (
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[18px] font-semibold text-[var(--ink)]">
            Sciverse
          </span>
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
            v0.1
          </span>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ active }: { active?: NavKey }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sciverse:sidebar:collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sciverse:sidebar:collapsed",
      collapsed ? "1" : "0"
    );
  }, [collapsed]);

  const currentKey = useMemo<NavKey | undefined>(() => {
    if (active) return active;
    if (location.startsWith("/docs")) return "docs";
    if (location.startsWith("/tokens")) return "tokens";
    if (location.startsWith("/stats")) return "stats";
    return "experience";
  }, [active, location]);

  return (
    <aside
      className={cn(
        "shrink-0 h-screen sticky top-0 flex flex-col border-r hairline",
        "transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      )}
      style={{
        width: collapsed ? 64 : 264,
        background:
          "linear-gradient(180deg, #FAFAF7 0%, #F6F5F0 100%)",
      }}>
      {/* header */}
      <div className="flex items-center justify-between px-3 pt-4 pb-3">
        <Logo collapsed={collapsed} />
        <button
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
          onClick={() => setCollapsed((v) => !v)}
          className="h-7 w-7 rounded-md flex items-center justify-center text-[var(--ink-2)] hover:bg-[#f1f0eb] transition-colors">
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* main nav */}
      <nav className={cn("px-3 mt-1 flex-1 overflow-y-auto", collapsed && "px-2")}>
        {NAV.map((n) => {
          const isHistory = n.key === "history";
          const Icon = n.icon;
          const active = currentKey === n.key;
          const item = (
            <div
              className={cn("nav-item", active && "active", collapsed && "justify-center px-0")}
              onClick={() => isHistory && !collapsed && setHistoryOpen((v) => !v)}>
              <Icon className="h-[15px] w-[15px] shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{n.label}</span>
              )}
              {!collapsed && isHistory && (
                <span className="text-[10px] font-mono text-[var(--ink-3)]">
                  {historyOpen ? "−" : "+"}
                </span>
              )}
            </div>
          );

          const wrapped = n.href ? (
            <Link key={n.key} href={n.href}>
              {item}
            </Link>
          ) : (
            <div key={n.key}>{item}</div>
          );

          if (!collapsed) {
            return (
              <div key={n.key}>
                {wrapped}
                {isHistory && historyOpen && (
                  <div className="mt-1 mb-2 ml-2 pl-3 border-l hairline space-y-3">
                    {HISTORY.map((g) => (
                      <div key={g.bucket}>
                        <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-3)] mb-1.5">
                          {g.bucket}
                        </div>
                        <ul className="space-y-0.5">
                          {g.items.map((it) => (
                            <li key={it.id}>
                              <button className="w-full text-left text-[12.5px] text-[var(--ink-2)] hover:text-[var(--ink)] truncate py-1 px-1.5 rounded hover:bg-[#f1f0eb] transition-colors">
                                {it.title}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          // collapsed: tooltip
          return (
            <Tooltip key={n.key}>
              <TooltipTrigger asChild>
                <div>{wrapped}</div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {n.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* bottom: user / login */}
      <div className={cn("p-3 border-t hairline", collapsed && "px-2")}>
        {!collapsed ? (
          <div className="space-y-3">
            <div className="rounded-xl border hairline bg-white p-3">
              <div className="flex items-center gap-2 text-[12.5px] text-[var(--ink-2)]">
                <Sparkles className="h-3.5 w-3.5 text-[var(--brand)]" />
                未登录 · 立即解锁 API Key
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button className="btn-ink !py-1.5 !px-3 text-[12.5px]">
                  <LogIn className="h-3.5 w-3.5" />
                  登录
                </button>
                <button className="btn-ghost !py-1.5 !px-3 text-[12.5px]">
                  注册
                </button>
                <button className="ml-auto h-7 w-7 rounded-md flex items-center justify-center hover:bg-[#f1f0eb] text-[var(--ink-2)]">
                  <Globe className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="rounded-xl border hairline bg-white p-3">
              <div className="text-[11px] tracking-[0.16em] uppercase font-mono text-[var(--ink-3)] mb-2">
                微信小助手
              </div>
              <div className="flex items-center gap-3">
                <div className="h-[68px] w-[68px] rounded-md bg-[var(--paper-2)] grid-paper border hairline" />
                <div className="text-[11.5px] leading-relaxed text-[var(--ink-2)]">
                  扫码加入开发者群
                  <br />
                  抢先体验新接口
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="h-9 w-9 rounded-full bg-[var(--ink)] text-white flex items-center justify-center">
                  <LogIn className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">登录</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="h-9 w-9 rounded-full border hairline bg-white flex items-center justify-center text-[var(--ink-2)]">
                  <Settings className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">设置</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </aside>
  );
}
