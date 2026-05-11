/*
 * Sciverse · SearchErrorState (v20)
 * 通用单一兜底页 — 不再区分场景，文案极简。
 */
import { AlertCircle, RefreshCw, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

// 保留类型导出以兼容 Experience 内既有引用
export type SearchErrorKind = "network" | "server" | "maintenance" | "unknown";

interface Props {
  query?: string;
  retrying?: boolean;
  onRetry: () => void;
  onEdit: () => void;
}

export default function SearchErrorState({
  query,
  retrying = false,
  onRetry,
  onEdit,
}: Props) {
  return (
    <section className="mt-6 ed-in">
      <div
        className={cn(
          "card-paper relative overflow-hidden px-6 py-6",
          "border-l-[3px] border-l-[#C7563B]/70",
        )}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(420px 220px at 0% 0%, rgba(199,86,59,0.06), transparent 70%)",
          }}
        />
        <div className="relative flex items-start gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-xl grid place-items-center bg-[#FBF1ED] text-[#9F4A33]">
            <AlertCircle className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[19px] text-[var(--ink)]">
              检索暂时不可用
            </h3>
            <p className="mt-1.5 text-[13.5px] leading-[1.7] text-[var(--ink-2)]">
              请稍后重试{query ? "，关键词已保留" : ""}。
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={onRetry}
                disabled={retrying}
                className={cn(
                  "inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px]",
                  "bg-[var(--ink)] text-white hover:bg-black transition-colors",
                  retrying && "opacity-70 cursor-not-allowed",
                )}>
                <RefreshCw
                  className={cn("h-[14px] w-[14px]", retrying && "animate-spin")}
                  strokeWidth={1.8}
                />
                {retrying ? "重试中…" : "再试一次"}
              </button>
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] border hairline bg-white text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors">
                <Pencil className="h-[13px] w-[13px]" strokeWidth={1.8} />
                返回编辑
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
