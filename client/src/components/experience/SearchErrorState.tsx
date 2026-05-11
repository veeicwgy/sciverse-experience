/*
 * Sciverse · SearchErrorState (v18)
 * 检索失败兜底页 — 替换裸 `TypeError: Failed to fetch` 提示
 * 设计准则：友好、克制、暖红 4% 底；与米白 + ink 主色系一致。
 */
import { AlertCircle, RefreshCw, Pencil, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchErrorKind = "network" | "server" | "maintenance" | "unknown";

export const ERROR_DICT: Record<
  SearchErrorKind,
  { title: string; hint: string; advice: string }
> = {
  network: {
    title: "网络似乎不太通畅",
    hint: "本地网络连接异常或被代理拦截",
    advice: "请检查网络或切换稳定网络后重试；公司内网常见拦截可联系管理员开放 sciverse.space 域名。",
  },
  server: {
    title: "服务暂时繁忙",
    hint: "Sciverse 后端正在处理大量请求",
    advice: "请稍候几秒再试；若高峰持续，建议先简化关键词或缩小检索范围。",
  },
  maintenance: {
    title: "检索能力升级中",
    hint: "我们正在发布新版本检索服务",
    advice: "通常 1-3 分钟内恢复，期间不会丢失你的检索历史；可点击下方查看运行状态。",
  },
  unknown: {
    title: "检索暂时不可用",
    hint: "暂未识别的异常",
    advice: "请稍后再试；多次失败可联系我们或查看运行状态页排查。",
  },
};

interface Props {
  kind?: SearchErrorKind;
  query?: string;
  retrying?: boolean;
  /** 主重试 */
  onRetry: () => void;
  /** 返回编辑 */
  onEdit: () => void;
  /** 状态页（可选） */
  statusHref?: string;
}

export default function SearchErrorState({
  kind = "unknown",
  query,
  retrying = false,
  onRetry,
  onEdit,
  statusHref = "https://status.sciverse.space",
}: Props) {
  const d = ERROR_DICT[kind];
  return (
    <section className="mt-6 ed-in">
      <div
        className={cn(
          "card-paper relative overflow-hidden px-6 py-7",
          "border-l-[3px] border-l-[#C7563B]/70",
        )}>
        {/* 极淡暖红底纹 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(420px 220px at 0% 0%, rgba(199,86,59,0.06), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 shrink-0 rounded-xl grid place-items-center bg-[#FBF1ED] text-[#9F4A33]">
              <AlertCircle className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h3 className="font-display text-[19px] text-[var(--ink)]">
                  {d.title}
                </h3>
                <span className="text-[12px] text-[var(--ink-3)]">{d.hint}</span>
              </div>
              {query && (
                <div className="mt-1 text-[12.5px] text-[var(--ink-3)]">
                  关键词「<span className="text-[var(--ink-2)]">{query}</span>」
                  · 我们已保留在搜索框，编辑后可重新发起
                </div>
              )}
              <p className="mt-2 text-[13.5px] leading-[1.78] text-[var(--ink-2)]">
                {d.advice}
              </p>
            </div>
          </div>

          {/* 操作区 */}
          <div className="flex flex-wrap items-center gap-2 pl-[54px]">
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
            <a
              href={statusHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] text-[var(--ink-3)] hover:text-[var(--brand)] transition-colors">
              <Activity className="h-[13px] w-[13px]" strokeWidth={1.8} />
              查看运行状态
            </a>
          </div>

          {/* 微小说明 */}
          <div className="pl-[54px] flex items-center gap-1.5 text-[11.5px] text-[var(--ink-3)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C7563B]/60" />
            首次失败将于 3 秒后自动重试一次
            <span className="text-[var(--hairline-strong)] mx-1">·</span>
            <span>
              如多次失败，可
              <a
                href="mailto:contact@sciverse.space"
                className="link-edit ml-1">
                联系我们
              </a>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
