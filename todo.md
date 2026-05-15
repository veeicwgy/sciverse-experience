# Sciverse v5 · 6 项细节优化清单

## 1. Hero 与搜索框（Experience.tsx）
- [ ] 主标题去句号（"让 Agent 真正读懂 科学世界"）
- [ ] placeholder 渐显动画（800ms fade-in）
- [ ] 仅保留右下圆形箭头发送按钮，删 ENTER/SHIFT+ENTER 提示文案
- [ ] 输入有内容后箭头按钮变深色

## 2. 全局导航
- [ ] 点击 Sidebar 顶部 Logo → 跳回 /
- [ ] 修 bug：仅当路由 = / 时历史对话默认展开

## 3. 调用统计（Stats.tsx）
- [ ] "分 App 明细" → "分接口调用明细"
- [ ] 三行 icon 改用 sciverse / dianshi / seqstudio 官方 logo

## 4. 结果卡（Experience.tsx）
- [ ] 删"复制引用 / 复制 API 查询"按钮
- [ ] 展开全文区 max-height: 320px + overflow-y: auto
- [ ] 分页：每页 8 条 + 上/下页 + 当前页/总页


---

# Sciverse v6 · 5 项细节优化

- [ ] 1. 搜索框 placeholder 打字机效果（~50ms/字符，循环若干示例）
- [ ] 2. 帮助中心 icon：悬停 Tooltip「加入开发者群」+ 二维码预渲染瞬开
- [ ] 3. 侧边栏菜单名缩短：「API Key 管理」→「密钥」，「调用统计」→「用量」，「文档中心」→「文档」
- [ ] 4. 侧边栏顺序：文档放最后
- [ ] 5. Stats 分接口明细 logo 修复（内联 SVG 兜底）+ Experience 生态卡检查
- [ ] 6. 保存 v6 检查点并交付


---

# Sciverse v7 · 2 项升级

- [ ] 1. 修 bug：搜索框 focus 后立即暂停打字机（state-driven enabled，避免 useRef/composing 闭包问题）；改写引导式 placeholder（动词开头、覆盖检索/对比/分析 3 类意图）
- [ ] 2. 新对话页叠加科学学术蒙层：极淡 SVG 纹理（苯环/双螺旋/化学结构 + 公式 + 蛋白带状） + 微噪点 + 紫蓝放射渐晕；不影响主色与现有布局
- [ ] 3. 保存 v7 检查点并交付


---

# Sciverse v12 · 用量页 3 项优化

- [ ] 1. 调用量趋势改折线+面积渐变图，hover crosshair + tooltip 显示精确数据
- [ ] 2. 删除单点峰值 / 单点均值 两张卡，总览仅保留总调用次数
- [ ] 3. 密钥维度筛选从右上下拉改为主图上方横向胶囊条（含 sparkline + 调用量）
- [ ] 4. 保存 v12 检查点并交付


---

# Sciverse v13 · 文档页改为「接入指南」

- [ ] 1. Sidebar 菜单「文档」改名「接入指南」（路由不变）
- [ ] 2. Docs 页：Hero（标题+副标题+一句话）
- [ ] 3. Docs 页：锚点 Tab 导航（API / CLI · SDK / Skills，sticky）
- [ ] 4. Docs 页：三快速开始卡片（点击锚定到对应模块）
- [ ] 5. Docs 页：API 模块（适用场景 + 优势 + 调用示例 + 主要能力）
- [ ] 6. Docs 页：CLI · SDK 模块（同结构，含 npm/pip 安装）
- [ ] 7. Docs 页：Skills 模块（同结构，含 3 行配置片段）
- [ ] 8. Docs 页：底部 CTA「获取 API Key」跳转 /tokens
- [ ] 9. 保存 v13 检查点并交付


---

# Sciverse v14 · 接入指南结构重构 + 搜索后引流卡转型

- [ ] 1. Docs 页重构：左侧二级菜单（概览 / API 接口 / CLI · SDK / Skills）
- [ ] 2. 概览子页（默认）：三方式简介卡 + 对比表 + 底部 CTA
- [ ] 3. API 子页：保留适用场景/优势/能力/cURL 示例 + 「查看完整 API 参考」新窗口外链
- [ ] 4. CLI · SDK 子页：保留 pip+npm 安装与 Python 示例 + 新窗口外链
- [ ] 5. Skills 子页：保留 yaml MCP 配置 + 「安装到我的 Agent」新窗口外链
- [ ] 6. SkillsBubble → IntegrationBubble：搜索后引流改为「接入指南」整体引流
- [ ] 7. 保存 v14 检查点并交付


---

# Sciverse v15 · 4 项细节优化

- [ ] 1. /docs 全页移除英文 UPPERCASE 副标
- [ ] 2. 全站去除「计费 / 收费 / 按调用次数计费 / 未用不扣」措辞，统一为「免费调用」
- [ ] 3. /docs 内 API Key 入口仅保留 1 处（概览页底部 CTA）
- [ ] 4. IntegrationBubble 重做：去英文标题 + 文案精简 + 按钮换风格 + mini-card 改为单行避免截断


---

# Sciverse v16 · 大重构

- [ ] 1. 用量页：只保留分应用堆叠柱状趋势（日/周/月），删掉总调用次数与分接口明细
- [ ] 2. 接入指南：扩为三产品（Sciverse / 点石 / SeqStudio）× 接入方式二级菜单
- [ ] 3. Sidebar 接入指南改为新开浏览器页（target=_blank）
- [ ] 4. 代码清理：SkillsBubble 文件 → IntegrationBubble 实体改名 / 删除废弃字段 / 补 README
- [ ] 5. 保存 v16 检查点并交付


---

# Sciverse v17 · 会话+版本历史模型（方案 B）

- [ ] 状态模型：sessions[{id, title, versions:[{id, query, ts}], createdAt, lastActivityAt}]，localStorage 持久化
- [ ] 默认行为：新对话页提交→新建会话；结果页改词重搜→在当前会话追加版本（默认）
- [ ] 结果页搜索框旁加「追加到本会话 / 另起新会话」微切换
- [ ] 每个版本都是独立检索（无上下文），点击任一版本可复现其结果
- [ ] Sidebar 历史区按 lastActivityAt 倒序；会话项右侧版本计数 chip（·v3）
- [ ] 会话项可展开显示版本时间线（v1/v2/v3 + 时间 + 关键词），点击跳到该版本
- [ ] URL 同步：?s={sessionId}&v={versionId} 便于分享与刷新复现


---

# Sciverse v17.1 · 修复

- [ ] 同窗口下 Sidebar 与 Experience 共享 useSessionHistory 状态：localStorage `storage` 事件不会在同源同窗口触发，需要自定义事件或在 hook 内手动广播
- [ ] 「新对话」菜单点击应清空 ?s&v 并重置 Experience 状态（不仅 push /experience）
- [ ] 「追加到本会话」提交后 Sidebar 高亮当前会话项 + 自动展开版本时间线
- [ ] 验证 ?s&v URL 共享/刷新可复现历史版本


---

# Sciverse v18 · 失败兜底 + 原文折叠

- [ ] 检索失败页：替换裸 Error 卡为友好空状态（图标 + 三种典型场景 + 重试/返回/状态页 + 3s 自动退避一次）
- [ ] 结果卡底部加「原文片段」可折叠区
- [ ] 折叠时显示提示胶囊 + 字数预估
- [ ] 展开时按 content 接口规范展示 text；more=true 时显示「加载下一段」按钮使用 next_offset
- [ ] 加载中：3 行 skeleton；错误：暖红微提示 + 重试


---

# Sciverse v19 · 原文片段高亮 + 折叠区结构 + 失败演示入口

- [ ] ContentSnippet 接受 query 并在正文中高亮关键词（与摘要同款紫蓝下划底纹）
- [ ] ResultCard 重组：取消独立「展开全文」按钮；摘要默认 3 行 clamp，末尾 ⋯ 就地展开摘要本身
- [ ] 「展开原文片段」收起为底部更紧凑的微胶囊，展开高度上限 220px
- [ ] sample chips 末尾追加「失败示例」chip，点击直接强制触发一次失败渲染
- [ ] 支持 URL 参数 ?demo=fail&kind=server|network|maintenance 一键复现指定场景
- [ ] 保存 v19 检查点


---

# Sciverse v20 · 文案精简 + 可访问 + 状态联动

- [ ] SearchErrorState 改为通用单一文案，去除 kind 分支
- [ ] 失败示例 chip 简化为单击主控件
- [ ] 摘要 ⋯ 改为可访问按钮 + 可见焦点环 + grid-rows 过渡
- [ ] 搜索后（有 meta/results）隐藏底部 "试试" sample chips 与 "失败示例"
- [ ] 保存 v20 检查点


---

# Sciverse v21 · Hero 亮点改写

- [ ] 替换「最快 <600ms · Agentic Search 平均响应」为「Agent 一等公民 · 原生支持 Manus/Claude/Cursor」
- [ ] 保存 v21 检查点


---

# v24 · 两区块克制微调（不改结构）

- [ ] 1. 生态卡片：加 hover 轻微阴影（shadow 由 0 → 0 6px 24px -8px rgba(91,91,247,0.18)）+ -translate-y-0.5 + 边框由 hairline → brand/35 + ArrowUpRight 微位移；整卡 transition-all duration-500 ease-out
- [ ] 2. 数据能力全景：进度条由 #ink 改为 brand/65；底部三宫格 hover 圆环边框由 hairline → brand/45，标题颜色由 ink 改为 brand（仅 hover）；保留所有结构与文案
- [ ] 3. 保存 v24 checkpoint 并验证 GitHub 同步


---

# v25 · 三处克制微动效

- [ ] 1. 数据能力 4 列大数字加 CountUp（IntersectionObserver 首次入视口、1.2s ease-out、单位/+ 后缀保留）
- [ ] 2. 生态卡 hover 时大写 tag (REACTIONS / PROTEINS / DATASETS) 颜色由 ink-3 渐变为 brand
- [ ] 3. 底部 3 宫格小圆环 hover 旋转 6° + 描边 1.6 → 2.0，整体 350ms ease-out
- [ ] 4. 保存 v25 checkpoint 并验证 GitHub 同步


---

# v26 · 三宫格 metric 数字 hover 动效

- [ ] 1. 定位三宫格 metric 元素（一等公民 / T+1 / 2,000）
- [ ] 2. 加 group-hover：translateY(-1px) + text 主色 + 300ms ease-out
- [ ] 3. 保存 v26 checkpoint


---

# v27 · 借鉴参考图（不要英文/编号小标）

- [ ] 1. 生态卡副文升级为一句话定位（一站式化学反应检索 / 蛋白功能 AI 推理 / 面向 Agent 的开源科学语料）
- [ ] 2. 生态卡 3 条要点改成「mono 数字 · 维度词」结构
- [ ] 3. 数据能力 4 列：移除 01/02/03/04 编号、在数字上方加 14px line icon（FileText/Layers/Atom/Boxes）
- [ ] 4. 移除生态卡右上 REACTIONS/PROTEINS/DATASETS 英文 tag
- [ ] 5. UPDATED · MAY 2026 → 中文「更新于 2026 年 5 月」、移除短分隔线英文味
- [ ] 6. 保存 v27 checkpoint


---

# v28 · 数据复核结论落地（仅文案，不动样式）

- [ ] 1. 数据能力 4 列：341M+/105M+/70M+/102M+ + 副文换行
- [ ] 2. 三宫格"最全"行换为 516M+ 知识记录 · 814 种语言 · 1.3M+ 期刊
- [ ] 3. 三宫格"最新"行换为 T+1 · 每日新增百万级文献入库
- [ ] 4. 生态 SciBase 卡：25M+ → 125M+，"蛋白" → 570K+
- [ ] 5. CountUp 扩展支持 100M+ / 1.3M+ / 814 等量级
- [ ] 6. 保存 v28 checkpoint


---

# v29 · 数据深度二级页面

- [ ] 1. 新建 client/src/pages/Depth.tsx
- [ ] 2. App.tsx 增加 /depth 路由
- [ ] 3. 侧边栏「接入指南」下方新增「数据深度」入口
- [ ] 4. Depth 页内容：Hero · 总览数字 / 四大学科域 / Top 20 学科 / 顶刊 159 / AI 子领域 / AI 顶会顶刊 / 语言 Top 5 / 时间跨度
- [ ] 5. 保持 Editorial Lab 设计语言，复用 hairline / brand / 衬线
- [ ] 6. 保存 v29 checkpoint


---

# v29 入口指引

- [ ] 给出开发预览 URL
- [ ] 给出已发布站需要重发布的提示
- [ ] 标注侧边栏「数据深度」菜单位置


---

# v30 · 接入气泡卡再设计

- [ ] 移除"查看接入指南"主紫色按钮（与下方三方式重复）
- [ ] 标题排版重写，避免被按钮挤压换行
- [ ] 三种方式卡视觉权重提升（icon · 标题 · 一句话定位 · 右箭头）
- [ ] 关闭按钮移到右上角且更克制
- [ ] 整张卡视觉调和，左侧 brand 竖条保留


---

# v31 · IntegrationBubble 三处微调

- [ ] mini-card 加 kbd 标签 API/CLI/SKILL，hover 显示
- [ ] 关闭按钮加 200ms 缩放消失动画（CSS keyframes 或 state 控制）
- [ ] eyebrow INTEGRATION 改中文「接入」


---

# 运营策略 · 场景与 MinerU 协同分析

- [ ] 输出 5-7 个经典运营场景与标杆案例脚本
- [ ] 输出 Sciverse × MinerU 三层协同设计与 GTM 联合素材建议
- [ ] 保存到 docs/usecases-mineru-2026-05.md


---

# v33 · 接入指南 五点反馈落地

- [ ] 1. 侧边栏「产品」分组前置到「概览/统一鉴权/错误码/常见问题」之上
- [ ] 2. 删除 Docs 概览顶部「学术文献 / 图书 / 全球专利 / AI-Ready / 语言 / 期刊会议」六宫格数据卡（与首页重复）
- [ ] 3. 侧边栏扁平化：把 API 三级菜单（API 接口 → agentic-search / content / resource / meta-catalog / meta-search）收为同级"API 接口"单条；在该页面内列出所有接口（锚点跳转）
- [ ] 4. 侧边栏当前项高亮：去掉黑色实心，改为低饱和主色描边/底色 + ink 文本
- [ ] 5. FAQ 重写：以 Sciverse 为主体，覆盖常见用户场景（Token、调用配额、检索词、返回结构、引用、Skills 装载、API vs Skills、字段查询等）
- [ ] 6. Sciverse Skills 子页接入 ClawHub https://clawhub.ai/sciverse/academic-retrieval 与 GitHub https://github.com/opendatalab/SciVerse-agent-tools 安装指引（claude / cursor / manus）
- [ ] 7. 保持 Editorial 设计语言、不动其他模块


---

# v34 · API 文档全量补齐 + 仓库化导航

## 数据全量补齐
- [ ] Sciverse 5 端点完整字段（agentic-search / content / resource / meta-catalog / meta-search）
- [ ] 点石 3 个 REST（inverse-synthesis / rxn-diff / rxn-struct）完整字段
- [ ] 点石 14 个 MCP Skills 完整工具表
- [ ] Sciverse Skills 改为 ClawHub academic-retrieval（5 tools）+ OpenClaw CLI 装载

## 仓库化页面结构
- [ ] EndpointListPage：sticky 端点 TOC + 仓库头部（版本、changelog、repo）
- [ ] 多端点单页内导航（点击 TOC 内部锚跳）
- [ ] 错误码 / 调用限制 / 重试建议 / 响应示例 完整呈现

## 状态
- [ ] 类型扩展 ProductSpec.repo / version / changelog
- [ ] 适配 SkillsPage 接收 cli 客户端配置展示
- [ ] webdev_check_status + v34 checkpoint


---

# v35 · 接入指南 4 项优化

- [ ] 1. 点石 DianShi：删除 endpoints 与 repo（API 仓库形态），supports 移除 "api"；在概览页加入「申请-授权-开通」提示（飞书表单链接含 UID 预填）
- [ ] 2. 侧栏「点石」展开后只剩 概览 + Skills (MCP) 两个子项；parseHash 对点石 endpoint-index 兜底回 product 概览
- [ ] 3. Sciverse repo 移除 `url` (GitHub) 字段，EndpointIndexPage 仓库头不再渲染失效链接
- [ ] 4. Sciverse API 接口页：仓库头下方加入横向锚点条（5 个端点按钮 + 滚动 spy 高亮 + 一键跳转）
- [ ] 5. 编译检查 + 保存 v35
