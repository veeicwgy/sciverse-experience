/*
 * Sciverse · ContentSnippet (v18)
 * 原文片段可折叠区 — 对应 GET https://api.sciverse.space/content
 *
 * 设计准则：
 * - 默认折叠为一行胶囊提示，呈现 doc_id 与 "含原文切片 · 支持分段读取"
 * - 展开后顶部为深墨 chip 显示 doc_id 简化形式 + 偏移量进度
 * - 正文为等宽风格，逐段 setText，more=true 时显示 "加载下一段" 按钮（使用 next_offset）
 * - 加载状态用 3 行 skeleton；错误用暖红 chip + 重试
 *
 * 注：示例使用模拟数据而非真实接口，避免依赖外部环境；研发对接时只需替换 fetchSlice
 */
import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  RefreshCw,
  AlertCircle,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** 文档 ID（必填） */
  docId: string;
  /** 单次读取长度，默认 700（接口默认值） */
  limit?: number;
  /** 总字数估算（来自 meta-search），仅展示提示 */
  approxLength?: number;
  /** 默认是否展开 */
  defaultOpen?: boolean;
}

type Slice = {
  text: string;
  next_offset: number;
  more: boolean;
};

/** 模拟原文片段：实际研发请替换为 GET /content?doc_id&offset&limit */
async function mockFetchSlice(
  docId: string,
  offset: number | undefined,
  limit: number,
): Promise<Slice> {
  // 模拟网络延迟
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 320));
  // 极小概率失败用于演示重试
  if (Math.random() < 0.05) throw new Error("STREAM_INTERRUPTED");
  const total = 4200;
  const start = offset ?? 0;
  const end = Math.min(start + limit, total);
  // 生成可读的中英混排片段
  const seed = (docId.charCodeAt(0) || 65) % 3;
  const paragraphs = [
    `本研究纳入 1,184 例 COVID-19 出院随访个体，并将健康对照按 1:1 匹配。在 12 个月时 DLCO ≤ LLN 的发生率为 23.4%（95% CI 20.9–26.0），高于对照的 7.1%（5.5–8.7）；该差异在 24 个月仍存在（19.8% vs 7.0），提示恢复轨迹存在显著异质性。`,
    `Cohen 等（2024）观察到的弥散功能下降与急性期 SpO2 最低值（OR 0.74 每升高 1%）以及住院期间是否使用 HFNC（OR 1.62）相关，提示初期低氧暴露可能是慢性肺损伤的预测因子之一，但仍需控制吸烟史与既往肺部疾病的混杂。`,
    `亚组分析显示，女性、年龄 ≥ 60 岁与 BMI ≥ 28 三个变量在调整后仍与 24 个月 DLCO < 80% 显著相关；HRCT 上呈现马赛克通气与微小蜂窝改变的比例在持续组中明显偏高（28% vs 9%）。`,
    `讨论部分指出，该队列中持续性 DLCO 下降与外周血 CCL18、KL-6 水平正相关，提示 II 型肺泡上皮细胞与肺泡巨噬细胞参与的纤维化-修复轴可能尚未完全平息；与 IPF 的差别在于影像分布与进展速度。`,
  ];
  const para = paragraphs[seed % paragraphs.length];
  // 让每段切片显得不同
  const text = (para + "\n\n").repeat(3).slice(0, end - start);
  return {
    text,
    next_offset: end,
    more: end < total,
  };
}

export default function ContentSnippet({
  docId,
  limit = 700,
  approxLength,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [chunks, setChunks] = useState<string[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [more, setMore] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const isFirst = chunks.length === 0;
      const r = await mockFetchSlice(docId, isFirst ? undefined : offset, limit);
      setChunks((arr) => [...arr, r.text]);
      setOffset(r.next_offset);
      setMore(r.more);
    } catch (e) {
      setError(e instanceof Error ? e.message : "FETCH_FAILED");
    } finally {
      setLoading(false);
    }
  }, [chunks.length, docId, limit, offset]);

  // 首次展开时自动拉一段
  useEffect(() => {
    if (open && chunks.length === 0 && !loading && !error) {
      loadMore();
    }
  }, [open, chunks.length, loading, error, loadMore]);

  const shortDoc =
    docId.length > 16 ? `${docId.slice(0, 8)}…${docId.slice(-6)}` : docId;

  return (
    <div className="mt-4 border-t hairline pt-3">
      {/* 折叠态按钮 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2",
          "text-left transition-colors",
          open
            ? "bg-[var(--ink)] text-white"
            : "bg-[#f3f2ec] hover:bg-[#ECEBE5] text-[var(--ink-2)]",
        )}>
        <span className="inline-flex items-center gap-2 text-[12.5px]">
          <FileText
            className={cn("h-3.5 w-3.5", open ? "opacity-90" : "opacity-70")}
            strokeWidth={1.8}
          />
          {open ? "原文片段（来自 content 接口）" : "展开原文片段"}
          <span
            className={cn(
              "font-mono text-[10.5px] tracking-[0.12em] uppercase",
              open ? "text-white/60" : "text-[var(--ink-3)]",
            )}>
            {open ? "已加载" : "含切片 · 支持分段读取"}
          </span>
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px]",
            open ? "text-white/70" : "text-[var(--ink-3)]",
          )}>
          {approxLength && (
            <span className="font-mono">
              ≈ {approxLength.toLocaleString()} 字
            </span>
          )}
          {open ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      {open && (
        <div className="mt-3 rounded-lg border hairline bg-white overflow-hidden">
          {/* 顶栏 doc_id + 偏移量 */}
          <div className="flex items-center justify-between px-3 py-2 border-b hairline bg-[#FAFAF7]">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--ink-3)] font-mono">
              <Hash className="h-3 w-3" strokeWidth={2} />
              doc_id · <span className="text-[var(--ink-2)]">{shortDoc}</span>
            </span>
            <span className="text-[10.5px] font-mono tracking-[0.06em] text-[var(--ink-3)]">
              已读 {offset.toLocaleString()} 字节
              {more ? " · 还有更多" : " · 已读完"}
            </span>
          </div>

          {/* 正文 */}
          <div className="px-4 py-3 max-h-[360px] overflow-y-auto result-scroll">
            {chunks.length === 0 && loading && (
              <div className="space-y-2 py-1">
                <div className="h-3 w-[94%] rounded bg-[#EFEEE8] animate-pulse" />
                <div className="h-3 w-[88%] rounded bg-[#EFEEE8] animate-pulse" />
                <div className="h-3 w-[72%] rounded bg-[#EFEEE8] animate-pulse" />
              </div>
            )}
            {chunks.length === 0 && !loading && error && (
              <div className="flex items-start gap-2 text-[12.5px] text-[#9F4A33]">
                <AlertCircle className="h-4 w-4 mt-0.5" strokeWidth={1.8} />
                <div>
                  <div>原文拉取失败 · {error}</div>
                  <button
                    onClick={loadMore}
                    className="mt-1 inline-flex items-center gap-1 text-[12px] text-[var(--brand)] hover:underline">
                    <RefreshCw className="h-3 w-3" /> 重试
                  </button>
                </div>
              </div>
            )}
            {chunks.length > 0 && (
              <div className="text-[13.5px] leading-[1.85] text-[var(--ink)] whitespace-pre-wrap font-[var(--font-sans)]">
                {chunks.map((c, i) => (
                  <p key={i} className="mb-3 last:mb-0">
                    {c}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* 底栏 */}
          <div className="flex items-center justify-between px-3 py-2 border-t hairline bg-[#FAFAF7]">
            <span className="text-[11px] text-[var(--ink-3)]">
              片段来自 GET <span className="font-mono">/content</span>
              <span className="mx-1.5 text-[var(--hairline-strong)]">·</span>
              单次 limit={limit}
            </span>
            <div className="inline-flex items-center gap-2">
              {error && chunks.length > 0 && (
                <span className="text-[11px] text-[#9F4A33]">
                  本段失败 · 可重试
                </span>
              )}
              {more && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className={cn(
                    "inline-flex items-center gap-1 h-7 px-3 rounded-full text-[12px]",
                    "bg-[var(--ink)] text-white hover:bg-black transition-colors",
                    loading && "opacity-60 cursor-not-allowed",
                  )}>
                  <RefreshCw
                    className={cn(
                      "h-[12px] w-[12px]",
                      loading && "animate-spin",
                    )}
                    strokeWidth={1.8}
                  />
                  {loading
                    ? "加载中…"
                    : `加载下一段 (next_offset=${offset.toLocaleString()})`}
                </button>
              )}
              {!more && chunks.length > 0 && (
                <span className="font-mono text-[11px] text-[var(--ink-3)]">
                  · END
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
