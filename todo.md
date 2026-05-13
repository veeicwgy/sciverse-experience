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
