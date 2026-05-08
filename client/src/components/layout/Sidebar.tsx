/*
 * Sciverse Sidebar — Editorial Lab (v2)
 * - Collapsed state: clicking 历史对话 icon auto-expands sidebar + scrolls to history group
 * - Login: single ink-pill button (no 注册), light "立即解锁" microcopy removed
 * - 微信小助手: collapsed into a single Help icon → Popover with QR placeholder
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronsLeft,
  ChevronsRight,
  PenSquare,
  History,
  BookOpen,
  KeyRound,
  BarChart3,
  LogIn,
  LogOut,
  HelpCircle,
  Globe,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
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
    <Link
      href="/"
      className="flex items-center gap-2.5 px-1 group cursor-pointer"
      aria-label="返回新对话">
      <img
        src="/manus-storage/sciverse-logo_532e83dd.svg"
        alt="Sciverse"
        className={cn(
          "select-none transition-transform group-hover:scale-[1.04]",
          collapsed ? "h-7 w-7" : "h-8 w-8"
        )}
        draggable={false}
      />
      {!collapsed && (
        <span className="font-display text-[18px] font-semibold text-[var(--ink)] tracking-tight group-hover:text-[var(--brand)] transition-colors">
          Sciverse
        </span>
      )}
    </Link>
  );
}

type User = { name: string; handle: string; avatar: string };
const MOCK_USER: User = {
  name: "小王",
  handle: "@xiaowang",
  avatar:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%238a8aff'/><stop offset='1' stop-color='%235b5bf7'/></linearGradient></defs><rect width='64' height='64' rx='32' fill='url(%23g)'/><text x='50%25' y='56%25' font-family='Inter,Arial,sans-serif' font-size='28' font-weight='600' fill='white' text-anchor='middle' dominant-baseline='middle'>小</text></svg>`
    ),
};

export default function Sidebar({ active }: { active?: NavKey }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.pathname === "/";
  });
  const [user, setUser] = useState<User | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("sciverse:sidebar:collapsed");
    if (stored === "1") setCollapsed(true);
    if (localStorage.getItem("sciverse:user") === "1") setUser(MOCK_USER);
  }, []);

  const signIn = () => {
    setUser(MOCK_USER);
    localStorage.setItem("sciverse:user", "1");
    toast("已登录", { description: `欢迎回来，${MOCK_USER.name} · 仅演示模拟` });
  };
  const signOut = () => {
    setUser(null);
    localStorage.removeItem("sciverse:user");
    toast("已退出登录");
  };

  useEffect(() => {
    localStorage.setItem(
      "sciverse:sidebar:collapsed",
      collapsed ? "1" : "0"
    );
  }, [collapsed]);

  // 路由变化时，非首页自动收起历史对话
  useEffect(() => {
    setHistoryOpen(location === "/");
  }, [location]);

  const currentKey = useMemo<NavKey | undefined>(() => {
    if (active) return active;
    if (location.startsWith("/docs")) return "docs";
    if (location.startsWith("/tokens")) return "tokens";
    if (location.startsWith("/stats")) return "stats";
    return "experience";
  }, [active, location]);

  // 收起态点击「历史对话」 → 自动展开 + 滚到历史 + toast 反馈
  const handleHistoryClick = () => {
    if (collapsed) {
      setCollapsed(false);
      setHistoryOpen(true);
      toast("已展开历史对话", { description: "近期搜索按时间分组显示" });
      // 等展开动画完后滚动到历史区
      setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 320);
    } else {
      setHistoryOpen((v) => !v);
    }
  };

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
      <nav
        ref={navRef}
        className={cn("px-3 mt-1 flex-1 overflow-y-auto", collapsed && "px-2")}>
        {NAV.map((n) => {
          const isHistory = n.key === "history";
          const Icon = n.icon;
          const isActive = currentKey === n.key;
          const item = (
            <div
              className={cn(
                "nav-item",
                isActive && "active",
                collapsed && "justify-center px-0"
              )}
              onClick={() => isHistory && handleHistoryClick()}>
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
                  <div
                    ref={historyRef}
                    className="mt-1 mb-2 ml-2 pl-3 border-l hairline space-y-3">
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

      {/* bottom: 登录态头像 / 未登录按钮 + 开发者群二维码 + 语言 */}
      <div className={cn("p-3 border-t hairline", collapsed && "px-2")}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            {user ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex-1 flex items-center gap-2 rounded-full border hairline bg-white px-3 py-1.5 hover:border-[var(--ink)] transition-colors text-left">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
                    <span className="text-[13px] text-[var(--ink)] truncate leading-tight">{user.name}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-[180px] p-1.5">
                  <button onClick={signOut} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12.5px] text-[var(--ink-2)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] transition-colors">
                    <LogOut className="h-3.5 w-3.5" /> 退出登录
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <button onClick={signIn} className="btn-ink !py-2 !px-4 text-[13px] flex-1 justify-center">
                <LogIn className="h-3.5 w-3.5" />
                登录
              </button>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <button aria-label="开发者群" className="h-9 w-9 rounded-full border hairline bg-white flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="w-[180px] p-2.5">
                <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-3)] mb-1.5">
                  开发者群
                </div>
                <img src="/manus-storage/sciverse-wechat-qr_6f1a7ef6.png" alt="微信开发者群二维码" className="w-full rounded-md border hairline bg-white" />
                <div className="mt-1.5 text-[11px] leading-relaxed text-[var(--ink-2)]">
                  扫码加入，抢先体验新接口与公测计划。
                </div>
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => toast("已切换为 中文", { description: "EN 版本敬请期待" })} className="h-9 w-9 rounded-full border hairline bg-white flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
                  <Globe className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">中 / EN</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {user ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="h-9 w-9 rounded-full border hairline bg-white flex items-center justify-center text-[12px] font-medium text-[var(--ink)] hover:border-[var(--ink)] transition-colors" aria-label={user.name}>
                    {user.name.slice(0, 1)}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" align="end" className="w-[180px] p-1.5">
                  <div className="px-2 py-1.5 text-[12.5px] text-[var(--ink)]">{user.name}</div>
                  <button onClick={signOut} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12.5px] text-[var(--ink-2)] hover:bg-[#f1f0eb] hover:text-[var(--ink)] transition-colors">
                    <LogOut className="h-3.5 w-3.5" /> 退出登录
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={signIn} className="h-9 w-9 rounded-full bg-[var(--ink)] text-white flex items-center justify-center">
                    <LogIn className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">登录</TooltipContent>
              </Tooltip>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <button aria-label="开发者群" className="h-9 w-9 rounded-full border hairline bg-white flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="end" className="w-[180px] p-2.5">
                <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-3)] mb-1.5">
                  开发者群
                </div>
                <img src="/manus-storage/sciverse-wechat-qr_6f1a7ef6.png" alt="微信开发者群二维码" className="w-full rounded-md border hairline bg-white" />
                <div className="mt-1.5 text-[11px] leading-relaxed text-[var(--ink-2)]">
                  扫码加入，抢先体验新接口与公测计划。
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </aside>
  );
}
