# Sciverse · Experience

Sciverse 团队对外能力的统一体验门户：**新对话**（科学检索）+ **历史** + **密钥** + **用量** + **接入指南**。当前为前端原型仓库，便于团队长独立维护，不与具体产品后端耦合。

> 当前涵盖三个对外产品：**Sciverse**（agentic 科学检索）、**点石 DianShi**（化学反应/物质/专利）、**SeqStudio**（蛋白功能 AI 推理 + LLM 注释）。每个产品支持 API 接口、CLI · SDK、Skills 等不同接入方式，一个 API Key 全部通用，全部能力免费调用。

---

## 一、技术栈

| 层 | 选型 | 备注 |
|---|---|---|
| 框架 | React 19 + TypeScript | 客户端 only，由 Vite 驱动 |
| 路由 | wouter | 轻量路由，支持 hash 二级路由 |
| 样式 | Tailwind CSS 4 + 自定义 design tokens | tokens 在 `client/src/index.css` |
| 组件库 | shadcn/ui（Button / Card / Dialog 等） | 仅按需引入 |
| 图标 | lucide-react | |
| 通知 | sonner | toast 全局唯一方案 |
| 字体 | Fraunces（display）+ Inter（body）+ JetBrains Mono（code） | 由 `client/index.html` 通过 Google Fonts 引入 |

---

## 二、启动

```bash
# 安装依赖
pnpm install

# 启动开发服务（默认 3000）
pnpm dev

# 生产构建
pnpm build

# 本地预览生产产物
pnpm preview
```

> 本仓库为静态前端项目，`server/` 与 `shared/` 仅作占位以兼容外部模板，**未实现任何后端逻辑**。所有数据均为前端 mock。

---

## 三、目录结构

```
sciverse-experience/
├─ client/
│  ├─ index.html              # Google Fonts / 全局 meta
│  └─ src/
│     ├─ App.tsx              # 路由
│     ├─ main.tsx             # 入口
│     ├─ index.css            # 设计 tokens / 全局 utility / 动画 keyframes
│     ├─ pages/
│     │  ├─ Experience.tsx    # 新对话主页（含科学蒙层、打字机 placeholder、生态卡）
│     │  ├─ Tokens.tsx        # 密钥管理（最多 10 个，无过期）
│     │  ├─ Stats.tsx         # 用量：分应用堆叠柱状趋势（日/周/月 × 密钥维度）
│     │  └─ Docs.tsx          # 接入指南：三产品 × 接入方式（二级菜单）
│     ├─ components/
│     │  ├─ layout/
│     │  │  └─ Sidebar.tsx    # 全站侧边栏（接入指南项以新窗口打开）
│     │  └─ experience/
│     │     ├─ IntegrationBubble.tsx  # 搜索后的接入指南引流卡
│     │     └─ ConversionPanel.tsx
│     ├─ contexts/  hooks/  lib/
│     └─ public/              # 仅 favicon / robots
├─ server/  shared/           # 占位，无实际逻辑
├─ package.json
└─ README.md
```

---

## 四、关键页面与交互约定

### 1. 新对话（`/`）
- 输入框 placeholder 为打字机循环示例（focus 时立即暂停）。
- 背景为低透明度 SVG 科学蒙层（苯环、双螺旋、ball-and-stick 分子等），仅作装饰。
- 提交瞬间发送按钮触发粒子扩散反馈（8 颗 + 1 圈脉冲环）。
- 搜索结果上方为 `IntegrationBubble`，引流到 `/docs` 接入指南；首次关闭后写入 localStorage `sciverse:skillsBubble:dismissed:v10` 永久不再展示，研发可改为 7 天过期策略。

### 2. 密钥（`/tokens`）
- **最多 10 个**，达上限创建按钮 toast 拦截。
- **无 90 天有效期，无失效状态**。字段：名称 / Token / 创建时间 / 操作。

### 3. 用量（`/stats`）
- 顶部时间粒度：**日 / 周 / 月**。
- 主图：**分应用堆叠柱状图**（Sciverse / 点石 / SeqStudio），柱顶显示该时间点总量，hover 显示精确总量与各应用分量。
- 密钥胶囊条：全部密钥 + 各密钥（最多 10）调用量与 sparkline，点击切换图表。
- **已删除**：总调用次数大数字卡、分接口调用明细列表（避免重复维度）。

### 4. 接入指南（`/docs`，新窗口打开）
- 左侧两层菜单：**概览 / Sciverse · 点石 · SeqStudio**（一级产品）→ **API · CLI · SDK · Skills**（二级方式）。
- URL hash 同步：`#sciverse/api`、`#dianshi/cli` 等。
- 每个方式子页含：**适用场景 / 优势 / 主要能力 / 外链文档 / 代码示例（占位）**。
- 代码示例当前为占位符，由各产品研发对接对应 API 文档后填入 `Docs.tsx → PRODUCTS → methods → codePlaceholder`。

### 5. Sidebar
- 顺序：新对话 / 历史 / 密钥 / 用量 / 接入指南。
- **接入指南菜单项以 `target=_blank` 新窗口打开 `/docs`**，便于团队长独立维护文档站，不写死在 Sciverse 产品壳里。

---

## 五、设计 Tokens

| Token | 用途 | 取值 |
|---|---|---|
| `--paper` / `--paper-2` | 主纸面 / 次级纸面 | `#FAFAF7` / `#F6F5F0` |
| `--ink` / `--ink-2` / `--ink-3` | 主文 / 次文 / 弱文 | `#14141E` / `#3F3F4D` / `#7E7E8E` |
| `--brand` | 品牌紫蓝 | `#5B5BF7` |
| `--hairline` / `--hairline-strong` | 发丝线 | rgba 系 |

> 设计语言：编辑学院风（Editorial Lab） — 米白纸面 + 极淡发丝线 + 紫蓝点缀，避免大面积渐变与饱和色块。

---

## 六、待研发对接的事项

| 模块 | 当前状态 | 建议 |
|---|---|---|
| API / CLI / Skills 代码示例 | 占位文本 | 对接各产品文档后填入 `Docs.tsx` |
| 各产品外链 `externalHref` | 形如 `docs.xxx.example` | 替换为真实文档站地址 |
| 用量数据 | 前端确定性 mock（`buildStack`） | 接入真实统计 API |
| 密钥列表 | 前端 mock | 接入密钥管理 API；保留「最多 10 个」限制 |
| 历史会话 | 前端 mock | 接入会话列表 API |
| 引流卡 dismissed 策略 | localStorage 永久 | 建议改为 7 天过期 |

---

## 七、已知约束

- 所有页面**仅做电脑端体验保证**，移动端为兜底布局。
- 业务数据全部为前端确定性 mock，**刷新后可复现，但不持久化任何用户输入**。
- 接入指南页代码块为占位文本，**未做语法高亮**；如需高亮可接入 Shiki / Prism。

