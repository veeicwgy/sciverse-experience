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
