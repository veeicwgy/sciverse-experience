/**
 * HowItWorksSection — Lovable 风格左右布局自动轮播
 * 左侧：每步一张真实操作截图，自动切换
 * 右侧：步骤标题 + 描述，点击切换
 */
import { useEffect, useRef, useState, useCallback } from "react";

const STEPS = [
  {
    title: "体验检索",
    desc: "在上方输入框输入问题或设置筛选条件，即时获得结果预览。",
    action: "↑ 立即试试",
    href: "",
    shot: "/manus-storage/step1_6cff51b7.png",
  },
  {
    title: "获取 API Key",
    desc: "注册后在「密钥」页一键生成 Token，每日 2000 次免费调用。",
    action: "前往密钥 →",
    href: "/tokens",
    shot: "/manus-storage/step2_58c16994.png",
  },
  {
    title: "接入工作流",
    desc: "通过 API / CLI / MCP Skills 接入 Cursor、Claude、Codex 等 Agent。",
    action: "查看接入指南 →",
    href: "/docs",
    shot: "/manus-storage/step3_77590cec.png",
  },
];

const STEP_INTERVAL = 4500; // 每个步骤停留 4.5 秒

export default function HowItWorksSection({
  inputRef,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 步骤自动切换
  useEffect(() => {
    if (isHovered) return;
    stepTimerRef.current = setInterval(() => {
      setActiveStep((s) => (s + 1) % STEPS.length);
    }, STEP_INTERVAL);
    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [isHovered]);

  const handleStepClick = useCallback((idx: number) => {
    setActiveStep(idx);
  }, []);

  const handleAction = useCallback(
    (step: (typeof STEPS)[number]) => {
      if (step.href) {
        window.location.href = step.href;
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => inputRef.current?.focus(), 400);
      }
    },
    [inputRef]
  );

  // 进度条
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isHovered || !progressRef.current) return;
    progressRef.current.style.transition = "none";
    progressRef.current.style.width = "0%";
    void progressRef.current.offsetWidth;
    progressRef.current.style.transition = `width ${STEP_INTERVAL}ms linear`;
    progressRef.current.style.width = "100%";
  }, [activeStep, isHovered]);

  return (
    <section className="mt-20">
      <div className="flex items-center gap-3 mb-8">
        <span className="inline-block h-px w-8 bg-[var(--brand)]/50" />
        <h2 className="font-display text-[22px] text-[var(--ink)]">5 分钟上手</h2>
      </div>

      <div
        className="grid md:grid-cols-[1fr_340px] gap-0 rounded-2xl border hairline bg-white overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        {/* 左侧：截图区 */}
        <div className="relative bg-[#f8f7f4] flex items-center justify-center p-8 min-h-[380px]">
          {STEPS.map((step, sIdx) => (
            <img
              key={sIdx}
              src={step.shot}
              alt={step.title}
              className={`absolute inset-8 w-[calc(100%-64px)] h-[calc(100%-64px)] object-contain object-top rounded-xl border hairline shadow-sm transition-opacity duration-500 ${
                sIdx === activeStep ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          {/* 步骤指示器 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeStep
                    ? "w-5 bg-[var(--brand)]"
                    : "w-1.5 bg-[var(--ink-3)]/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* 右侧：步骤列表 */}
        <div className="flex flex-col justify-center p-8 gap-2 border-l hairline">
          {STEPS.map((step, idx) => (
            <button
              key={idx}
              onClick={() => handleStepClick(idx)}
              className={`text-left p-4 rounded-xl transition-all duration-300 ${
                idx === activeStep
                  ? "bg-[var(--brand-soft)]"
                  : "hover:bg-[#f8f7f4]"
              }`}>
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium transition-colors duration-300 ${
                    idx === activeStep
                      ? "bg-[var(--brand)] text-white"
                      : "bg-[var(--ink-3)]/15 text-[var(--ink-3)]"
                  }`}>
                  {idx + 1}
                </span>
                <h3
                  className={`text-[15px] font-medium transition-colors duration-300 ${
                    idx === activeStep
                      ? "text-[var(--ink)]"
                      : "text-[var(--ink-3)]"
                  }`}>
                  {step.title}
                </h3>
              </div>
              <p
                className={`mt-1.5 text-[12.5px] leading-relaxed transition-all duration-300 overflow-hidden ${
                  idx === activeStep
                    ? "text-[var(--ink-2)] max-h-20 opacity-100"
                    : "text-[var(--ink-3)] max-h-0 opacity-0"
                }`}>
                {step.desc}
              </p>
              {idx === activeStep && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(step);
                  }}
                  className="mt-2 inline-flex items-center text-[12px] text-[var(--brand)] hover:underline cursor-pointer">
                  {step.action}
                </span>
              )}
              {idx === activeStep && (
                <div className="mt-3 h-[2px] w-full bg-[var(--brand)]/10 rounded-full overflow-hidden">
                  <div
                    ref={idx === activeStep ? progressRef : undefined}
                    className="h-full bg-[var(--brand)]/60 rounded-full"
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
