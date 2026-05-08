# Sciverse v3 · 8 项细节优化清单

## 1. ConversionPanel 接入卡删除
- [ ] 移除 ConversionPanel 整个"把这次搜索接入你的 Agent"模块（与搜索 API 无关）
- [ ] 主区结果上方插入 Skills 引导小卡

## 2. Skills 引导小卡（结果页气泡）
- [ ] 在搜索结果区上方插入气泡式小卡，引导使用 Sciverse Skills
- [ ] 「不再提示」按钮，localStorage 持久化关闭

## 3. 登录态模拟（Sidebar 底部）
- [ ] 点击「登录」→ 模拟登录成功
- [ ] 登录后展示头像 + 用户名 + 退出登录
- [ ] localStorage 持久化

## 4. 搜索框精简
- [ ] placeholder 简化为一行
- [ ] 删除右侧灰色竖条与 ⌘ ⏎ 灰色 icon
- [ ] 保留 textarea 多行能力

## 5. 数据全景视觉升级（去 AI 感）
- [ ] 数据卡：编辑式数字 + 极细 hairline + 微动效
- [ ] 三大特性：去 emoji，换线性 icon + 编辑式比较

## 6. Stats 指标调整
- [ ] 去掉 平均响应时间 / 消耗 Token
- [ ] 分 App 明细 → Sciverse / 点石 (DianShi) / SeqStudio

## 7. Stats 删除一级标题英文小标题（核验）
- [ ] 重新确认 § 已移除

## 8. 微信群二维码 + 卡片瘦身
- [ ] 用真实二维码图片替换 placeholder
- [ ] Popover 卡片宽度从 220px 缩小到 ~180px
