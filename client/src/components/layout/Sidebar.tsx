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
import { useSessionHistory, type Session } from "@/hooks/useSessionHistory";
import { ChevronRight, Trash2 } from "lucide-react";

type NavKey = "experience" | "history" | "docs" | "tokens" | "stats";

// v6: 菜单名简化（更接近常见命名）；文档调到最后
const NAV: {
  key: NavKey;
  label: string;
  icon: any;
  href?: string;
  hint?: string;
}[] = [
  { key: "experience", label: "新对话", icon: PenSquare, href: "/", hint: "清空搜索 · 开始一次新查询" },
  { key: "history", label: "历史", icon: History, hint: "近期搜索按时间分组" },
  { key: "tokens", label: "密钥", icon: KeyRound, href: "/tokens" },
  { key: "stats", label: "用量", icon: BarChart3, href: "/stats" },
  { key: "docs", label: "接入指南", icon: BookOpen, href: "/docs", hint: "API · CLI/SDK · Skills 三种接入方式" },
];

// v6: 二维码图片 URL 常量化 + 通过 new Image() 预加载（提前发起请求，避免点击 popover 才开始下载）
const WECHAT_QR_URL = "/manus-storage/sciverse-wechat-qr_6f1a7ef6.png";

// v17: 历史区分桶工具 — 按 lastActivityAt 分为 今天 / 昨天 / 本周 / 更早
function bucketize(list: Session[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfWeek = startOfToday - 6 * 86400000; // 近 7 天
  const buckets: { bucket: string; items: Session[] }[] = [
    { bucket: "今天", items: [] },
    { bucket: "昨天", items: [] },
    { bucket: "本周", items: [] },
    { bucket: "更早", items: [] },
  ];
  // 已按 lastActivityAt 倒序（hook 返回顺序）
  for (const s of list) {
    const t = s.lastActivityAt;
    if (t >= startOfToday) buckets[0].items.push(s);
    else if (t >= startOfYesterday) buckets[1].items.push(s);
    else if (t >= startOfWeek) buckets[2].items.push(s);
    else buckets[3].items.push(s);
  }
  return buckets.filter((b) => b.items.length > 0);
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "刚刚";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return `${Math.floor(diff / 86400_000)} 天前`;
}

function Logo({ collapsed }: { collapsed: boolean }) {
  // v10: 点击 logo+名称始终返回新对话主页，若已在 / 则清除 ?q 并刷新为初始态
  const goHome = (e: React.MouseEvent) => {
    if (typeof window === "undefined") return;
    const onHome = window.location.pathname === "/";
    if (onHome) {
      e.preventDefault();
      // 清除 ?q 并重载主页 — 让 Experience 重新进入初始态
      window.location.href = "/";
    }
  };
  return (
    <Link
      href="/"
      onClick={goHome as unknown as () => void}
      className="flex items-center gap-2.5 px-1 group cursor-pointer rounded-md hover:bg-[#f1f0eb]/60 transition-colors py-1"
      aria-label="返回新对话主页"
      title="返回新对话主页">
      <img
        src="/manus-storage/sciverse-logo_532e83dd.svg"
        alt="Sciverse"
        className={cn(
          "select-none transition-transform group-hover:scale-[1.04]",
          collapsed ? "h-7 w-7" : "h-8 w-8",
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

  // v17: 会话历史
  const { sessions, remove } = useSessionHistory();
  const buckets = useMemo(() => bucketize(sessions), [sessions]);
  // 当前路由中的 sessionId（?s=）用于高亮选中项
  const currentSessionId = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("s");
  }, [location]);
  // 展开的会话 id 集合
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => {
    setExpandedSessions((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  useEffect(() => {
    const stored = localStorage.getItem("sciverse:sidebar:collapsed");
    if (stored === "1") setCollapsed(true);
    if (localStorage.getItem("sciverse:user") === "1") setUser(MOCK_USER);
    // 预加载二维码：组件挂载即开始下载，点击 popover 时直接命中浏览器缓存，瞬时显示
    const img = new Image();
    img.src = WECHAT_QR_URL;
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

          // v17.1: 「新对话」点击事件 — 同时清空 ?s&v 与重置 Experience 状态
          const goNewChat = (e: React.MouseEvent) => {
            e.preventDefault();
            // 总是跳 / 并干净化 query，以保证 Experience 进入初始态
            window.location.href = "/";
          };
          const wrapped = n.href ? (
            n.key === "docs" ? (
              <a
                key={n.key}
                href={n.href}
                target="_blank"
                rel="noreferrer"
                title="在新窗口打开">
                {item}
              </a>
            ) : n.key === "experience" ? (
              <a key={n.key} href={n.href} onClick={goNewChat}>
                {item}
              </a>
            ) : (
              <Link key={n.key} href={n.href}>
                {item}
              </Link>
            )
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
                    {buckets.length === 0 && (
                      <div className="text-[12px] text-[var(--ink-3)] py-1">
                        还没有历史。在上方提问，这里就会出现。
                      </div>
                    )}
                    {buckets.map((g) => (
                      <div key={g.bucket}>
                        <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-3)] mb-1.5">
                          {g.bucket}
                        </div>
                        <ul className="space-y-0.5">
                          {g.items.map((s) => {
                            const isCur = s.id === currentSessionId;
                            const isExpanded = expandedSessions.has(s.id);
                            const latest = s.versions[s.versions.length - 1];
                            return (
                              <li key={s.id}>
                                <div className={cn("group flex items-center gap-1 rounded transition-colors", isCur && "bg-[#f1f0eb]") }>
                                  <a
                                    href={`/?s=${s.id}&v=${latest.id}`}
                                    className="flex-1 min-w-0 text-left text-[12.5px] text-[var(--ink-2)] hover:text-[var(--ink)] truncate py-1 px-1.5 rounded hover:bg-[#f1f0eb] transition-colors flex items-center gap-1.5"
                                    title={`${s.title} · ${s.versions.length} 个版本 · ${relativeTime(s.lastActivityAt)}`}>
                                    <span className="truncate">{s.title || latest.query}</span>
                                    {s.versions.length > 1 && (
                                      <span className="shrink-0 font-mono text-[10px] text-[var(--brand)] tabular-nums">
                                        ·v{s.versions.length}
                                      </span>
                                    )}
                                  </a>
                                  {s.versions.length > 1 && (
                                    <button
                                      onClick={() => toggleExpand(s.id)}
                                      className="shrink-0 h-6 w-6 flex items-center justify-center rounded text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-white/60"
                                      aria-label={isExpanded ? "收起版本" : "展开版本"}>
                                      <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => { remove(s.id); toast("已删除历史会话"); }}
                                    className="shrink-0 h-6 w-6 flex items-center justify-center rounded text-[var(--ink-3)] hover:text-red-500 hover:bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="删除">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                {isExpanded && s.versions.length > 1 && (
                                  <ul className="mt-0.5 mb-1 ml-3 pl-2 border-l hairline space-y-0.5">
                                    {s.versions.map((v, vi) => (
                                      <li key={v.id}>
                                        <a
                                          href={`/?s=${s.id}&v=${v.id}`}
                                          className="flex items-center gap-2 text-[11.5px] text-[var(--ink-3)] hover:text-[var(--ink)] py-0.5 px-1.5 rounded hover:bg-[#f1f0eb] transition-colors"
                                          title={relativeTime(v.ts)}>
                                          <span className="font-mono text-[10px] text-[var(--brand)] tabular-nums shrink-0">v{vi + 1}</span>
                                          <span className="truncate flex-1">{v.query}</span>
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button aria-label="加入开发者群" className="h-9 w-9 rounded-full border hairline bg-white flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">加入开发者群</TooltipContent>
              </Tooltip>
              <PopoverContent side="top" align="end" className="w-[180px] p-2.5">
                <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-3)] mb-1.5">
                  开发者群
                </div>
                <img src={WECHAT_QR_URL} alt="微信开发者群二维码" className="w-full rounded-md border hairline bg-white" loading="eager" decoding="sync" />
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button aria-label="加入开发者群" className="h-9 w-9 rounded-full border hairline bg-white flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">加入开发者群</TooltipContent>
              </Tooltip>
              <PopoverContent side="right" align="end" className="w-[180px] p-2.5">
                <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-3)] mb-1.5">
                  开发者群
                </div>
                <img src={WECHAT_QR_URL} alt="微信开发者群二维码" className="w-full rounded-md border hairline bg-white" loading="eager" decoding="sync" />
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
