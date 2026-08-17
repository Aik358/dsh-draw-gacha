# dsh-draw-gacha

> 在 DeepSeek Harness 的发送按钮旁装一根 3D 拉杆——拉下去，用模型思维链的文本信号开一局像素风抽卡。**纯属娱乐，Just for fun。**

> 预览：克隆仓库后直接打开 `persistent/dev-preview.html`（零依赖，双击浏览器即可观看完整三维抽卡演出，无需 DSH）。
> **2026-08-18 更新 (v0.1.6)**: `llm/stream` 监听器改为消费方防御——`for await (const chunk of await next())` 先 await 再迭代。链上任何下游监听器返回 Promise 或流都能安全透传，不再有「async 监听器包 Promise → 全局模型调用崩溃」的隐患。

---## 这是什么

DeepSeek Harness（DSH）的模型调用效果方差很大，像抽卡一样忽好忽坏。这个插件把"抽卡"变成了字面意思：

1. 在发送区原生发送按钮右侧，出现一根 **3D 拟真机械拉杆**（金属壳体 + 长行程黄色握柄）。
2. 向下拉动握柄到底、金光满溢后松手——消息照常发送，同时全屏进入一场像素风抽卡演出。
3. 插件在后台持续读取本次模型的 **reasoning 思维链**（以及正文 text 通道），实时统计 10 类文本信号：
   - **计划**：`I will / I'll / I need / we need / we should / 我会 / 我需要 / 我们得…`
   - **验证**：`verify / check / test / confirm / double-check / make sure / 验证 / 检查 / 核实…`
   - **自纠错**：`however / wait / I was wrong / let me reconsider / 但是 / 重新 / 等等…`
   - **严谨性**：`constraint / trade-off / edge case / 约束 / 边界 / 权衡…`
   - **结构**：`first / second / step / finally / 首先 / 其次 / 总结…`
   - 以及 `let me / 让我` 等弱风格信号。
4. 统计足够充分后（**最短演出 15 秒 + 观测数据足量**，或模型已答完），返回舱落地，按信号稀有度揭示卡面：**白 · 小难梁 / 蓝 · 牢梁 / 黄 · 梁子 / 橙 · 梁圣 / 红 · 梁祖**。

> 拉杆拖动的信号会跨流式分片拼接统计（DeepSeek 会把单词切成 `I wi` + `ll`，插件做了跨 chunk 尾巴缓冲，不会漏检）。

## 核心演出

- **半透明灰遮罩**（`rgba(26,30,38,.62)` + 毛玻璃模糊）：不遮挡对话，随时能看见背后内容。
- **三舱下坠**：三个 CSS 3D 多面体返回舱从母舰分离，沿固定航向下坠——监听期间持续循环下落，模型答完才播放落地动画（白闪 → 压扁 → 冲击波 → 尘土）。
- **一大两小结算**：中间大卡是**「滑动变祖器」**梁系立绘 + 档位刻度（拉 → 燃 → 稳 → 夯），左右两张武器小卡；星级按稀有度点亮。
- **趣味文案**：每个档位多组随机抽卡台词，结果由 `seed` 驱动。
- **内置 BGM**：Web Audio 生成的 8 秒工业电子循环，可一键静音，无外部素材依赖。
- **操作**：右上角 ✕ 随时关闭；**SKIP** 按当前观测立即结算（不取消模型请求）；结算卡面点击任意处或「点击继续」关闭。
- 完整支持 `prefers-reduced-motion` 与窄屏布局。

## 为什么这样设计（理念）

- **结算条件 = 数据足量，不是模型答完**。模型可能干 40 分钟，但插件观测到足够信号（约 6000 字符 或 信号总数 ≥ 20）就会在最短 15 秒后落地结算，绝不陪你下坠 40 分钟。
- **`let me` 不是罪**。它只是弱风格信号；只有当验证/自纠错/结构信号都缺失时才产生轻微负分（有上限）。
- **不保存思维链**。Host 只保留计数、长度、阶段与极短采样，完整 reasoning 永不落盘、永不进入浏览器。
- **纯娱乐声明**：所有结论仅基于生成过程中的文本信号，不代表答案质量、模型能力、版本信息、人物能力或任何官方关系。

## 安装

### 方式一：DSH Profile 插件（推荐）

```bash
dsh plugin --profile web add @a9i5k4/dsh-draw-gacha
```

然后在 Profile 的 `cordis.patch.yml`（`$DSH_HOME/profiles/web/cordis.patch.yml`）注册插件行：

```yaml
- insert:
    - id: draw-gacha
      name: '@a9i5k4/dsh-draw-gacha'
```

重启 `dsh web` 即可。

### 方式二：本地 link 开发安装

```bash
# 克隆或解压到本地目录后
dsh plugin --profile web add link:D:/path/to/dsh-draw-gacha
```

同样需要把插件行加进 Profile 的 `cordis.patch.yml`。

## 使用

1. 在任意会话输入一条消息（拉杆在空草稿/忙时会禁用）。
2. 按住拉杆握柄，沿机械导轨向下拉到底（约 82px 行程，88% 阈值），金色光辉满溢后松手。
3. 消息发送，全屏抽卡演出开始，三个返回舱持续下坠，副标题实时显示 `reasoning X · text Y` 与信号统计。
4. 数据足量（或模型答完）后：落地 → 冲击 → 卡面揭示 → 星级 → 随机文案。
5. 点击任意处或「点击继续」关闭；随时可用右上角 ✕ 或 SKIP。

> 键盘：`Enter` / `Space` 可触发完整拉杆动作；`Escape` 取消未发送的拉杆状态。

## 开发

```text
persistent/
├── lib/index.js       # Host：llm/stream 监听、10 类信号统计、/api/draw-gacha/* 路由
├── lib/client.js      # 浏览器端：拉杆 + 三维演出 + 结算（dsh.client bundle）
├── cordis.patch.yml   # 插件行声明
├── dev-preview.html   # 独立开发预览页（零依赖，双击即看，不依赖 DSH）
└── package.json
```

- Host 只读 `llm/stream` 并原样转发每个 chunk，不改写冻结的 `GenerateOptions`。
- 通过 `options.sessionId + generation` 隔离多会话；`purpose=compaction/session-title` 的辅助请求被排除。
- 信号统计支持中英双语思维链，跨 chunk 尾巴缓冲（120 字符）防止分片切词漏检。
- 想改演出：先改 `dev-preview.html` 预览，满意后再同步进 `lib/client.js`（两边代码一致）。

## 验证

```bash
node --check lib/index.js
node --check lib/client.js
```

本地离线模拟（5 字符极端分片的中英文思维链）可确认全部 10 类信号计数 > 0。

## 许可

MIT。插件代码与 CSS 原创；梁系立绘与「滑动变祖器」相关素材来自社区开源项目（[Liang-Saint-Slider](https://github.com/BruzWJ/Liang-Saint-Slider) 等），复用/再分发请遵守其原始许可。人物与主题仅为玩梗，与任何真实人物或 DeepSeek 官方无关。

## 免责声明

> 本结果仅根据生成过程中的文本信号娱乐性结算，不代表答案质量、模型能力、模型版本信息、人物能力或任何官方关系。抽卡有风险，拉杆需谨慎。
