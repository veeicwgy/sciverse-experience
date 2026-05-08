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
