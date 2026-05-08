# Sciverse Experience · 设计方案 Brainstorm

> 任务定位：浅色大气 / 高级感 / 学术科技 / 左侧边栏 + 右侧主内容（无顶部导航）/ Agent 开发者向

---

## <response>
<text>

### 方案 A：Editorial Lab —— 学术期刊与现代科研工具的混搭

**Design Movement**：Swiss Editorial × Modern SaaS Console（受 Linear / Vercel Docs / Nature.com 启发）

**Core Principles**
1. **Editorial Calm**：以正文为主角，UI 退到画面之外，靠间距与字重而非彩色构建层级。
2. **Quiet Confidence**：极少使用品牌色，仅在「证据卡片」「数据规模数字」「CTA」处出现 Sciverse 的紫蓝（#5B5BF7）。
3. **Data-Forward**：数字/数据带衬线大字号，正文使用无衬线，将"科学"感与"工程"感合二为一。
4. **Tactile Surfaces**：层次依靠 1px hairline border + 微妙的 inner shadow + 5% 噪点纹理，不靠彩色阴影。

**Color Philosophy**
- 背景：`#FAFAF7`（极浅米白，比纯白更耐看，带学术感）
- 卡面：`#FFFFFF` + `border: 1px solid #ECECE7`
- 文本：`#1A1A1A` 主文 / `#5C5C5C` 次文 / `#9A9A93` 三级
- 品牌主色：`#5B5BF7`（Sciverse 紫蓝，仅 CTA / 强调点 / 命中高亮）
- 强调辅色：`#0D5C3F`（深森林绿，用于「相关性」「验证」类标识）
- 永不使用紫粉渐变。

**Layout Paradigm**
- 12 栅格中：左侧固定 260px sidebar（可收 56px），右侧主区域采用 8+4 不对称分栏，主内容 8 列、转化区 4 列吸顶。
- 每个 section 之间用「`§ 02 / Results`」的章节角标做编辑式导航。
- 数据规模区横向铺满，使用 4 段大数字 + 极细分隔线（不是卡片）。

**Signature Elements**
1. **Hairline Section Marker**：每个区块顶部一条 24px 的细线 + 「§ 编号 / 标题」小字，营造期刊章节感。
2. **Serif Numerals**：所有大数字（25,000,000 / 600ms）使用 Fraunces 衬线体，让数据具备权威感。
3. **Hover Underline Reveal**：链接 hover 时下划线从左滑入（而非淡入）。
4. **Inline Code Chip**：所有 API 路径以 `inline pill` 形式呈现，等宽字体 + 极浅灰底。

**Interaction Philosophy**：
- 每次交互都是"翻一页书"：无弹跳动画，全部使用 `cubic-bezier(0.2, 0.8, 0.2, 1)` + 200-280ms。
- 搜索按钮按下：输入框边框颜色加深 + 1px 内描边，无 scale。
- 卡片 hover：仅 border 由 #ECECE7 → #1A1A1A 变化，无 transform。

**Animation**：极克制
- 入场：sections 依次 fade + 4px translateY，间隔 60ms。
- 数字滚动：进入视口时 1.2s ease-out 计数到位。
- 搜索结果：列表逐行 staggered fade，每行 40ms。

**Typography System**
- Display / Numbers：**Fraunces**（可变衬线，wght 400-700，opsz 144 用于大数字）
- UI / Body：**Inter**（wght 400/500/600）
- Mono：**JetBrains Mono**（用于 API、curl、JSON）
- 标题层级：H1 48/56 Fraunces 500，H2 28/36 Fraunces 500，H3 18/26 Inter 600

</text>
<probability>0.06</probability>
</response>

## <response>
<text>

### 方案 B：Aurora Lab —— 浅色玻璃 + 科学渐变光

**Design Movement**：Apple Vision-style frosted glass × OpenAI light mode（borderless cards，柔和 mesh gradient 背景）

**Core Principles**
1. 玻璃层叠：所有面板都是「frosted glass on a soft aurora background」。
2. 强烈的中心化光晕，背景使用淡紫蓝-青-米色的 mesh gradient。
3. 圆角统一 16-20px，组件之间靠投影分层。

**Color Philosophy**：背景 mesh（#EEF1FF, #F0FBFF, #FFF7EE 三色柔光）；玻璃面 `rgba(255,255,255,0.65)` + backdrop-blur(24px)；品牌色仍是 Sciverse 紫蓝。

**Layout Paradigm**：左侧 sidebar 也是玻璃，悬浮在 mesh 背景上，主区采用 floating cards。

**Signature Elements**：mesh gradient 背景、frosted card、glow 按钮、彩色高亮关键词。

**Interaction**：所有元素带 spring 动画 + 鼠标光标位移视差。

**Animation**：mesh 背景缓慢漂移，hover 时玻璃面板浮起 + 光晕加强。

**Typography**：SF Pro Display + SF Mono 风格（用 Geist + Geist Mono 替代）。

</text>
<probability>0.04</probability>
</response>

## <response>
<text>

### 方案 C：Console Mono —— 终端美学 + 暗黑主品牌色块

**Design Movement**：Vercel / Linear 的暗主题 + Stripe 文档的代码优先布局，但反向用浅色背景 + 黑色 CTA。

**Core Principles**：等宽字优先、对比强烈、卡片有清晰黑色 1px 边框、CTA 全部为黑底白字药丸按钮（这与截图的 `查询元数据` / `Query metadata` 按钮一致）。

**Color**：背景纯白；主体黑 #0A0A0A；强调色 lime/绿 #16A34A 和 amber #D97706 用于 method badge（POST/GET）。

**Layout**：与截图最贴近——左侧菜单 + 右上 method tabs + 主区两栏（参数 / 代码示例）。

**Signature**：method 彩色 pill、CURL 黑底代码块、内联 `<code>` 浅灰药丸、按钮始终黑底圆胶囊。

**Animation**：极少，仅 hover 时 1px 边框颜色变化与代码块复制成功的对勾动画。

**Typography**：Inter + JetBrains Mono，标题不大，靠 mono 字体撑专业感。

</text>
<probability>0.05</probability>
</response>

---

## ✅ 选定方案：A · Editorial Lab

理由：
1. **浅色大气**与你提供的截图（米白底、黑色药丸 CTA、`POST/agent-search` 浅绿小标签）调性一致。
2. **高级感**来自衬线大数字 + 极细 hairline 分隔，远离 AI 常见的紫色渐变陷阱。
3. **Agent 开发者** 受众适配：编辑式章节角标、inline code chip、JetBrains Mono 代码块都直接服务 dev 体验。
4. 与 Sciverse 品牌色（紫蓝）兼容，且只在 CTA 与命中高亮处出现，画面更"克制而高级"。

接下来所有 CSS / 组件文件顶部都会以注释方式标注本方案的核心要点：
- 背景 `#FAFAF7`、卡面纯白、hairline `#ECECE7`、品牌 `#5B5BF7`
- Fraunces (display/numbers) + Inter (UI) + JetBrains Mono (code)
- 章节角标 `§ 编号 / 标题`、CTA 黑色药丸、相关性深森林绿
- 动画 200-280ms cubic-bezier(0.2, 0.8, 0.2, 1)，无 scale 跳跃
