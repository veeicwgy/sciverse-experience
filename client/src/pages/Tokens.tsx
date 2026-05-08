/*
 * Sciverse · API Key Management (/tokens)
 * 字段：名称 / Token(脱敏) / 状态(剩余天数) / 创建时间 / 过期时间 / 操作
 */
import { useMemo, useState } from "react";
import { Copy, Check, Trash2, Plus, KeyRound, X } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

type Token = {
  id: string;
  name: string;
  token: string;
  created: string;
  expires: string;
};

const INITIAL: Token[] = [
  {
    id: "t1",
    name: "my-key",
    token: "sk-sci-7af9e2c1f3a48a59b1e02-pub",
    created: "2026-04-03 16:53",
    expires: "2026-07-02 16:53",
  },
  {
    id: "t2",
    name: "mcp test",
    token: "sk-sci-9b0c3e8a4d77c6e5b1f02-mcp",
    created: "2026-04-02 16:29",
    expires: "2026-07-01 16:29",
  },
];

function maskToken(t: string) {
  return t.slice(0, 7) + "•".repeat(18) + t.slice(-4);
}

function daysLeft(expires: string) {
  const ms = new Date(expires.replace(" ", "T")).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 86400000));
}

export default function Tokens() {
  const [list, setList] = useState<Token[]>(INITIAL);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const total = 5;
  const used = list.length;

  const create = () => {
    if (!name.trim()) {
      toast.error("请填写名称");
      return;
    }
    if (list.length >= total) {
      toast.error("已达上限 5 个");
      return;
    }
    const now = new Date();
    const exp = new Date(now);
    exp.setDate(exp.getDate() + 90);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const newToken: Token = {
      id: "t" + Date.now(),
      name: name.trim(),
      token:
        "sk-sci-" +
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 14) +
        "-" +
        name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 8),
      created: fmt(now),
      expires: fmt(exp),
    };
    setList((l) => [newToken, ...l]);
    setOpen(false);
    setName("");
    toast.success("Token 已创建");
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar active="tokens" />
      <main className="flex-1 min-w-0">
        <div className="max-w-[980px] mx-auto px-8 lg:px-12 py-10">
          <div className="section-marker mb-4">§ Tokens / Manage</div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-[34px] tracking-[-0.02em] text-[var(--ink)]">
                API Token 管理
              </h1>
              <p className="mt-1.5 text-[13.5px] text-[var(--ink-2)] max-w-[640px]">
                Token 用于验证调用 Sciverse API 时的账户身份。
                <span className="text-[var(--ink-3)]">
                  {" "}有效期 90 天，到期后需重新创建，不支持续期。
                </span>
              </p>
            </div>
            <button onClick={() => setOpen(true)} className="btn-ink">
              <Plus className="h-4 w-4" />
              创建 Token
            </button>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 text-[12px] font-mono text-[var(--ink-3)]">
            <KeyRound className="h-3 w-3" />
            <span>API Tokens · {used}/{total}</span>
            <span>·</span>
            <span>本月调用 12,450</span>
          </div>

          <div className="mt-6 card-paper overflow-hidden">
            <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1fr_120px] text-[11.5px] tracking-[0.12em] uppercase font-mono text-[var(--ink-3)] px-5 py-3 bg-[var(--paper-2)] border-b hairline">
              <span>名称</span>
              <span>Token</span>
              <span>状态</span>
              <span>创建时间</span>
              <span>过期时间</span>
              <span className="text-right">操作</span>
            </div>
            {list.length === 0 && (
              <div className="px-5 py-12 text-center text-[13px] text-[var(--ink-3)]">
                暂无 Token · 点击右上角创建
              </div>
            )}
            {list.map((t) => (
              <TokenRow
                key={t.id}
                t={t}
                onDelete={() => {
                  setList((l) => l.filter((x) => x.id !== t.id));
                  toast.success("已删除");
                }}
              />
            ))}
          </div>
        </div>
      </main>

      {/* CREATE DIALOG */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm ed-in">
          <div className="card-paper w-[420px] p-5">
            <div className="flex items-center justify-between">
              <div className="section-marker">§ New Token</div>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-md hover:bg-[#f1f0eb] grid place-items-center text-[var(--ink-2)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-3 font-display text-[22px] text-[var(--ink)]">
              创建 API Token
            </h2>
            <p className="mt-1 text-[12.5px] text-[var(--ink-2)]">
              名称仅用于本地识别，不会发送至外部。
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="例如：my-research-key"
              className="mt-4 w-full rounded-lg border hairline px-3 py-2.5 text-[14px] outline-none focus:border-[var(--ink)] transition-colors"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn-ghost">
                取消
              </button>
              <button onClick={create} className="btn-ink">
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TokenRow({
  t,
  onDelete,
}: {
  t: Token;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const left = useMemo(() => daysLeft(t.expires), [t.expires]);
  const status =
    left > 30 ? "有效" : left > 0 ? "即将过期" : "已过期";
  const statusColor =
    left > 30
      ? "text-[var(--forest)] bg-[var(--forest-soft)]"
      : left > 0
        ? "text-[var(--amber)] bg-[var(--amber-soft)]"
        : "text-[#b91c1c] bg-[#fdecec]";
  return (
    <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1fr_120px] px-5 py-4 items-center border-b hairline last:border-0 hover:bg-[var(--paper-2)]/60 transition-colors">
      <div className="font-display text-[15px] text-[var(--ink)]">{t.name}</div>
      <button
        onClick={() => setRevealed((v) => !v)}
        className="text-left font-mono text-[12.5px] text-[var(--ink-2)] truncate hover:text-[var(--ink)]"
        title={revealed ? "点击隐藏" : "点击查看"}>
        {revealed ? t.token : maskToken(t.token)}
      </button>
      <div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full font-mono text-[11px]",
            statusColor,
          )}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status}
        </span>
        <div className="mt-1 text-[11px] text-[var(--ink-3)]">
          剩余 {left} 天
        </div>
      </div>
      <div className="font-mono text-[12.5px] text-[var(--ink-2)]">{t.created}</div>
      <div className="font-mono text-[12.5px] text-[var(--ink-2)]">{t.expires}</div>
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(t.token);
            setCopied(true);
            toast.success("已复制完整 Token");
            setTimeout(() => setCopied(false), 1500);
          }}
          className="h-8 w-8 rounded-md border hairline bg-white flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={onDelete}
          className="h-8 w-8 rounded-md border hairline bg-white flex items-center justify-center text-[var(--ink-2)] hover:text-[#b91c1c] hover:border-[#b91c1c] transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
