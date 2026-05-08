# Sciverse 体验站点 · v2 优化清单

## Hero 区
- [ ] 主标题改为「让 Agent 真正读懂 科学世界」（Fraunces 大字 + 「科学世界」品牌色高亮）
- [ ] 删除 hero 副标题段（"Sciverse 同时调用 …"那一段）
- [ ] 搜索框改为可输入一段话的 textarea（自动增高，min 88px，max 200px），保留 Enter 提交、Shift+Enter 换行；右下角药丸"搜索"按钮固定

## 全局
- [ ] 删除所有页面一级标题之上的 "§ 0X / XXX" 英文小标题（Experience / Ecosystem / Data Capability / Docs / Tokens / Stats / Integrate / Quotas）
- [ ] 数据全景大屏数字遮挡：4 列网格在 ≥1280px 加 column-gap，数字字号自适应（clamp），单位"册/条"等单独包裹；数字与单位之间加固定间距，避免横向重叠

## Sidebar
- [ ] 收起态下点击"历史对话"图标 → 自动展开 sidebar 并滚动到历史区（带 toast/反馈）
- [ ] 登录区精简：只保留一颗"登录 / 注册"黑色药丸按钮（点击展示 toast"功能即将开放"），去掉"未登录 · 立即解锁"长文案
- [ ] 微信小助手卡片改为底部一颗"帮助 / 微信"icon 按钮，点击 popover 弹出二维码占位（不再常驻展示）
