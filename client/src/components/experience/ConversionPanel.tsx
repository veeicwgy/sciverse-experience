/*
 * Sciverse · ConversionPanel
 * 吸附在右侧的固定转化区。未登录态：登录获取 Key + Python 示例 + 文档入口
 * 颜色：白卡片 hairline #ECECE7 + 黑色药丸 CTA + 紫蓝品牌点
 */
import { useState } from "react";
import { Copy, Check, ArrowRight, KeyRound, BookOpen } from "lucide-react";
import { toast } from "sonner";

const PY = `import requests

res = requests.post(
    "https://api.sciverse.space/agentic-search",
    headers={"Authorization": "Bearer YOUR_KEY"},
    json={"query": "CRISPR 基因编辑", "top_k": 10},
)
print(res.json())`;

export default function ConversionPanel({ query }: { query: string }) {
  const [copied, setCopied] = useState(false);
  const code = query
    ? PY.replace("CRISPR 基因编辑", query)
    : PY;

  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Python 示例已复制");
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <aside className="hidden xl:block sticky top-6 self-start w-[340px] shrink-0">
      <div className="card-paper p-5 ed-in">
        <div className="section-marker mb-3">§ 04 / Integrate</div>
        <h3 className="font-display text-[20px] leading-[1.25] text-[var(--ink)]">
          把这次搜索 <br />
          <span className="italic">接入</span> 你的 Agent。
        </h3>
        <p className="mt-2 text-[12.5px] text-[var(--ink-2)] leading-relaxed">
          每个开发者免费 5 个 API Key · 90 天有效期 · 单 Key 1k QPM
        </p>
        <div className="mt-4 flex items-center gap-2">
          <button className="btn-ink !py-2 !px-4 text-[13px]">
            <KeyRound className="h-3.5 w-3.5" />
            登录 · 获取 API Key
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink-3)]">
                Python · 本次查询
              </span>
            </div>
            <button
              onClick={onCopy}
              className="text-[11.5px] inline-flex items-center gap-1 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "已复制" : "复制"}
            </button>
          </div>
          <pre className="code-block text-[11.5px] leading-[1.7]">
{`import requests

res = requests.post(
  "https://api.sciverse.space/agentic-search",
  headers={"Authorization": "Bearer YOUR_KEY"},
  json={"query": "${query || "CRISPR 基因编辑"}", "top_k": 10},
)
print(res.json())`}
          </pre>
        </div>

        <a
          href="/docs"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] link-edit">
          <BookOpen className="h-3.5 w-3.5" />
          查看完整开发者文档
        </a>
      </div>

      <div className="mt-4 card-paper p-5">
        <div className="section-marker mb-3">§ 05 / Quotas</div>
        <ul className="text-[12.5px] text-[var(--ink-2)] space-y-1.5">
          <li className="flex items-baseline gap-2">
            <span className="dot on" />
            免费额度：每日 1,000 次 agentic-search
          </li>
          <li className="flex items-baseline gap-2">
            <span className="dot on" />
            企业版：可申请 100 万级元数据导出
          </li>
          <li className="flex items-baseline gap-2">
            <span className="dot" />
            付费层：私有部署 / 私域语料检索（敬请期待）
          </li>
        </ul>
      </div>
    </aside>
  );
}
