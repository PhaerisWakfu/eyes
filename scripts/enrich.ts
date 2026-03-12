/**
 * 按 AGENT_PLAYBOOK.md 增强 raw 数据
 * 阶段 A: 打 valueScore + 去重
 * 阶段 B: Top20 生成 summary_zh、title_zh、tags 等
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

// 阶段 B 的增强数据：id -> { valueScore, summary_zh, title_zh, tags, image?, insight?, commentary? }
const ENRICHMENT: Record<string, Record<string, unknown>> = {
  "hn-47334694": {
    valueScore: 8,
    title_zh: "BitNet：微软开源百亿参数 1-bit 量化模型，可在 CPU 本地运行",
    summary_zh:
      "微软开源 BitNet 项目，将 100B 参数的大模型压缩为 1-bit 量化版本，可在普通 CPU 上本地运行，大幅降低推理门槛与硬件成本。\n\n传统大模型依赖 GPU 集群，BitNet 通过极致的权重量化（1-bit）实现模型体积与计算量的大幅缩减，使百亿级模型有望在个人电脑甚至边缘设备上部署。这对本地 AI、隐私敏感场景和成本受限的开发者具有重要意义。\n\n对关注模型压缩、边缘 AI 与低成本推理的从业者属于必读级技术动向——可能改写本地部署的算力边界。",
    tags: ["AI/ML", "开源", "基础设施"],
    insight: "百亿参数本地 CPU 推理——模型压缩与边缘部署的里程碑",
    commentary:
      "1-bit 量化能把 100B 塞进 CPU，这要是真能打，云厂商的推理生意要重新算账了。微软开源得及时。",
  },
  "hn-47333627": {
    valueScore: 8,
    title_zh: "我们如何黑入麦肯锡的 AI 平台",
    summary_zh:
      "安全研究团队 Codewall 披露了对麦肯锡 AI 平台的安全渗透测试过程，揭示企业级 AI 产品在访问控制、输入验证与 API 设计上的典型漏洞。\n\n文章从攻击者视角拆解渗透路径，包括权限绕过、提示词注入等技术细节，并给出加固建议。麦肯锡作为咨询巨头，其 AI 产品的安全态势具有行业代表性。\n\n对安全从业者、AI 产品经理与关注企业 AI 落地的技术决策者有重要参考——大厂 AI 平台的真实安全水位一览。",
    tags: ["AI/ML", "安全", "行业动态"],
    insight: "企业 AI 平台安全审计的实战案例——对安全与 AI 交叉领域必读",
    commentary:
      "麦肯锡的 AI 平台被黑，说明咨询公司搞技术还是差点意思。做 AI 产品的都得看看自己有没有同款洞。",
  },
  "hn-47336171": {
    valueScore: 7,
    title_zh: "Show HN：开源的 AI Agent 专用浏览器",
    summary_zh:
      "theredsix 开源 agent-browser-protocol，为 AI Agent 设计的专用浏览器协议与实现，让 Agent 能结构化地操控网页而非依赖脆弱的 UI 自动化。\n\n项目提供标准化的浏览器交互协议，Agent 可获取 DOM 语义、执行点击与输入，比传统 Playwright/Selenium 更稳定且面向 AI 场景优化。开源实现便于集成到各类 Agent 框架。\n\n对 AI Agent 开发者、浏览器自动化与 MCP 生态关注者有直接价值——Agent 与 Web 的接口层正在标准化。",
    tags: ["AI/ML", "开源", "Web"],
    insight: "AI Agent 与 Web 交互的协议化方案——比 UI 自动化更可靠",
    commentary:
      "Agent 操网页终于有正经协议了，比一堆 click(x,y) 稳多了。这类项目会越来越重要。",
  },
  "lb-tiktds": {
    valueScore: 7,
    title_zh: "AI 应该帮助我们产出更好的代码",
    summary_zh:
      "Simon Willison 在其 Agentic 工程指南中主张：AI 的使命不应止于「写更多代码」，而应帮助人类写出更易维护、更可测试、更符合最佳实践的代码。\n\n文章从工程哲学角度反思「AI 辅助编程」的目标——减少技术债、提升可读性、强化测试覆盖，而非单纯追求产出速度。Willison 以 Datasette 等项目的实践为依托，给出可操作的 Agentic 工作流建议。\n\n对依赖 Copilot/Cursor 的开发者与工程管理者有启发性——重新定义「好代码」在 AI 时代的涵义。",
    tags: ["AI/ML", "思考", "开发工具"],
    insight: "AI 编程的目标应是质量而非数量——Willison 的工程哲学值得细读",
  },
  "lb-zzjjyo": {
    valueScore: 7,
    title_zh: "LLM 神经解剖学：不改任何权重如何登顶 AI 排行榜",
    summary_zh:
      "作者通过「神经解剖」式分析——深入理解 LLM 内部表示与注意力结构——在不改动任何模型权重的情况下，仅凭 prompt 与推理策略优化即登顶某 AI 排行榜。\n\n文章揭示：对模型内部工作机制的深度理解，比盲目调参或堆数据更有效。通过分析层间表示、注意力模式等，找到与任务匹配的激活路径，实现零成本性能提升。\n\n对 LLM 研究者、提示工程与模型可解释性从业者有直接价值——「理解」比「堆算力」更经济。",
    tags: ["AI/ML", "思考", "开发工具"],
    insight: "零权重修改登顶——神经解剖视角下的 LLM 优化范式",
  },
  "hn-47342139": {
    valueScore: 7,
    title_zh: "AI 对开发者生产力的纵向研究初步数据",
    summary_zh:
      "DX 团队发布 AI 对软件工程师生产力影响的纵向研究初步数据，挑战「AI 带来 10 倍提升」等夸大宣传，呈现更 nuanced 的结论。\n\n研究通过控制实验与长期追踪，区分不同任务类型、经验水平下的 AI 辅助效果。初步数据显示：部分场景收益显著，部分场景几乎无提升甚至为负。\n\n对技术管理者、AI 产品决策与开发者工效研究者有参考——用数据替代「体感」讨论 AI 生产力。",
    tags: ["AI/ML", "数据", "职业"],
    insight: "用纵向数据回答「AI 到底提效多少」——对技术管理决策有直接价值",
  },
  "hn-47337607": {
    valueScore: 6,
    title_zh: "Show HN：监控网页变化并输出为 RSS 的工具",
    summary_zh:
      "SiteSpy 是一款监控任意网页变化并将其转换为 RSS 订阅的工具。用户添加 URL 后，站点会定期抓取并比对内容，有新变化时通过 RSS 推送给用户。\n\n解决了「想关注某个页面但没 RSS」的痛点，适合跟踪文档更新、竞品动态、招聘页等。支持自定义抓取间隔与通知方式。\n\n对需要跟踪多方信息源的从业者有实用价值——把任意网页变成可订阅的信息流。",
    tags: ["Web", "开发工具", "独立开发"],
    commentary: "RSS 没死，只是换了个姿势回来。这类工具越多，信息主权越在自己手里。",
  },
  "hn-47334982": {
    valueScore: 6,
    title_zh: "瑞士电子投票试点因解密失败无法统计 2048 张选票",
    summary_zh:
      "瑞士某电子投票试点在解密环节出现故障，导致 2048 张选票无法被正确统计。The Register 报道指出问题与 USB 密钥管理及解密流程有关。\n\n电子投票的安全性与可审计性一直是敏感议题，此次故障再次引发对 e-voting 系统可靠性的讨论。技术细节尚未完全披露，但已暴露密钥管理与故障恢复的设计薄弱点。\n\n对安全研究者、电子政务与密码学从业者有参考——e-voting 的工程化难点一览。",
    tags: ["安全", "基础设施", "行业动态"],
  },
  "hn-47339164": {
    valueScore: 6,
    title_zh: "我曾被 AI 机器人面试过工作",
    summary_zh:
      "The Verge 记者分享其参加 AI 面试机器人进行求职面试的亲身经历，从候选人视角记录流程、体验与荒诞感。\n\nAI 面试已在不少公司投入使用，用于初筛或标准化评估。文章探讨：机器人能否真正理解候选人、是否会误伤优秀但「不会表演」的 applicant、以及人类面试官的价值所在。\n\n对 HR 科技、招聘流程设计与关注 AI 伦理的从业者有参考——AI 面试的一线体验报告。",
    tags: ["AI/ML", "职业", "产品设计"],
  },
  "lb-ufczx8": {
    valueScore: 6,
    title_zh: "写自己的文本编辑器，并日常使用它",
    summary_zh:
      "作者分享从零编写文本编辑器并作为日常主力工具使用的经历。不仅实现基本编辑功能，还针对个人工作流做了定制化扩展，最终真正做到「自己的工具自己造」。\n\n文章探讨：为何要造轮子、如何平衡功能与复杂度、以及在编辑器这种「每天摸 8 小时」的工具上投入的回报。对编辑器架构与实现细节有技术拆解。\n\n对工具链爱好者、系统编程与「工匠精神」式开发有启发——造轮子的边界在哪里。",
    tags: ["开发工具", "开源", "思考"],
  },
  "hn-47328071": {
    valueScore: 6,
    title_zh: "反对「感觉派」：何时生成式模型才有用",
    summary_zh:
      "William Bowman 从形式语言与程序推理角度分析：生成式模型在什么任务上「有用」、什么任务上只是「看起来有用」。反对盲目依赖「vibes」即直觉判断。\n\n文章区分：可形式化验证的任务（如代码、数学）与纯开放性任务，指出模型在后者上的局限。对 AI 辅助编程、形式化方法与 LLM 能力边界有理论化讨论。\n\n对关注 LLM 能力边界与形式化方法的研究者有参考——理性评估生成式模型适用场景。",
    tags: ["AI/ML", "思考", "开发工具"],
  },
  "hn-47344999": {
    valueScore: 6,
    title_zh: "HN 上有多少内容是 AI 生成的？",
    summary_zh:
      "lcamtuf（Michał Zalewski）在其 Substack 中尝试用统计与启发式方法估算 Hacker News 上 AI 生成内容的比例。结合第一条「禁止 AI 评论」指南的热度，此文应景且技术味足。\n\n方法可能涉及：语言风格分析、发布模式、与人工标注样本的对比等。结论未必精确，但提供了可复现的检测思路。\n\n对关注 AI 与人类内容混生、社区治理与内容检测的技术从业者有参考价值。",
    tags: ["AI/ML", "数据", "思考"],
  },
  "hn-47343927": {
    valueScore: 6,
    title_zh: "Show HN：Claude Code 的上下文感知权限守卫",
    summary_zh:
      "nah 是一款针对 Claude Code 的上下文感知权限守卫，在 AI 执行命令前根据上下文判断是否放行，降低误操作与越权风险。\n\nAI 编码助手具备执行 shell 命令能力后，权限管理成为关键。nah 通过分析命令语义与当前工作目录等，在「合理操作」与「危险操作」之间做细粒度控制。\n\n对使用 Claude Code / Cursor 等工具的开发者有直接实用价值——给 AI 一把有护套的刀。",
    tags: ["AI/ML", "安全", "开发工具"],
  },
  "lb-mqpba7": {
    valueScore: 6,
    title_zh: "SQLite WAL 重置导致的数据库损坏 Bug",
    summary_zh:
      "SQLite 官方文档披露 WAL（Write-Ahead Logging）模式下，特定 reset 操作可能导致数据库损坏的 bug。Lobsters 讨论该问题的触发条件与规避方式。\n\nWAL 是 SQLite 的默认日志模式，影响面广。官方已文档化该缺陷，建议用户注意相关操作序列。对嵌入式数据库与 SQLite 依赖方需关注升级与配置。\n\n对使用 SQLite 的开发者与基础设施从业者有直接参考——生产环境需评估影响。",
    tags: ["基础设施", "数据", "安全"],
  },
  "dt-3340573": {
    valueScore: 6,
    title_zh: "我用 MCP 和 Keycard 构建了一个安全规划 Agent",
    summary_zh:
      "作者的工作日分散在 Calendar、Linear、Gmail、Docs 等多种工具中，于是用 MCP（Model Context Protocol）与 Keycard 构建了一个安全规划的 AI Agent，实现跨工具的任务编排与提醒。\n\n文章分享架构设计：如何用 MCP 连接各数据源、Keycard 如何保障敏感操作的安全确认，以及实际使用中的取舍。\n\n对 AI Agent 开发者、MCP 生态与个人生产力工具有参考——多工具联动的实战案例。",
    tags: ["AI/ML", "开发工具", "独立开发"],
  },
  "lb-dhk0do": {
    valueScore: 6,
    title_zh: "代码评审确实能发现 Bug",
    summary_zh:
      "文章用数据与案例论证：代码评审（Code Review）在发现 Bug 上的实际效果，回应「评审是否值得花时间」的质疑。\n\n覆盖：评审能发现哪类问题、与自动化测试的互补关系、以及如何提升评审效率。对建立或优化 Code Review 文化的团队有实操建议。\n\n对工程管理者与注重质量的开发团队有参考——用证据为 Code Review 正名。",
    tags: ["开发工具", "思考", "职业"],
  },
  "lb-bunmdv": {
    valueScore: 6,
    title_zh: "更快的 asin() 一直藏在显眼处",
    summary_zh:
      "作者发现标准库中 asin()（反正弦）存在更快的实现方式，且该方法「一直就在眼前」——通过不同的数学恒等变换或查表策略可显著提速。\n\n对数值计算密集的应用（游戏、仿真、科学计算）有实际收益。文章可能涉及 CPU 指令、精度权衡与各平台实现的差异。\n\n对底层优化与数值计算感兴趣的开发者有参考——小函数里也有大文章。",
    tags: ["基础设施", "开发工具", "思考"],
  },
  "lb-tyeo20": {
    valueScore: 6,
    title_zh: "Moonforge：Igalia 推出的基于 Yocto 的 Linux OS",
    summary_zh:
      "Igalia 发布 Moonforge，基于 Yocto 构建的定制 Linux 发行版，面向嵌入式与特定硬件场景。Yocto 提供高度可配置的构建系统，Moonforge 在其上做了整合与优化。\n\nIgalia 以浏览器引擎与图形栈贡献闻名，此次进军嵌入式 Linux 反映其技术栈的拓展。对嵌入式开发、IoT 与定制化 Linux 构建有参考价值。\n\n对嵌入式开发者与 Linux 发行版构建从业者有实用参考——Yocto 生态的新成员。",
    tags: ["基础设施", "开源", "硬件"],
  },
  "lb-6lqnhh": {
    valueScore: 6,
    title_zh: "Lobsters 专访 ngoldbaum：Python GIL、NumPy、自由线程与开源人生",
    summary_zh:
      "长篇专访 NumPy 核心贡献者 ngoldbaum，涵盖其参与 Python 自由线程（free-threading）项目、消灭 GIL 的工程细节、NumPy/PyO3 的适配工作，以及从天体物理博士到开源维护者的职业路径。\n\n谈及 Cinder、PEP 703、多线程测试策略、Rust 与 Python 生态的关系等。ngoldbaum 还分享了 burnout 经历与时间管理哲学。\n\n对 Python 核心开发者、科学计算生态与开源职业化有深度参考——一线参与者的第一手视角。",
    tags: ["开源", "基础设施", "职业"],
    commentary:
      "从天体物理到 NumPy，从 burnout 到 free-threading，ngoldbaum 的人生轨迹就是一部开源编年史。",
  },
  "ch-changelog.com/16/2825": {
    valueScore: 6,
    title_zh: "大变局带来大变局",
    summary_zh:
      "Changelog 本周精选：伊朗轰炸 AWS 数据中心意图瘫痪 Claude、OpenAI 发布 GPT-5.4（ coding 能力显著提升）、活体脑细胞在玩 DOOM。另有关于「AI 时代 10x 工程师」感受的走心讨论，以及一些新工具与动向。\n\n信息密度高，涵盖基础设施、模型发布、生物计算与职业心态等多维度。适合快速扫读了解本周科技圈热点。\n\n对关注 AI 行业动态与综合科技新闻的从业者有浏览价值。",
    tags: ["AI/ML", "行业动态", "思考"],
  },
  "hn-47340079": {
    valueScore: 5,
    title_zh: "不要发布 AI 生成/编辑的评论，HN 是人与人之间的对话",
    summary_zh:
      "此为 Hacker News 社区指南中关于「禁止 AI 生成评论」条款的链接。HN 强调其讨论区是真人之间的对话，不接受由 AI 生成或大量 AI 编辑的评论。\n\n该条款因近期 AI 评论泛滥而受到广泛关注与讨论，在社区内引发对「何为真人对话」「AI 辅助与 AI 代笔的边界」的反思。指南本身是元讨论的对象，对理解 HN 社区规范与 AI 时代内容治理有参考。\n\n作为社区规范链接，虽非常规技术内容，但反映当下技术社区面临的共同挑战。",
    tags: ["AI/ML", "行业动态", "思考"],
    commentary:
      "第一条就禁 AI 评论，结果这帖子火了——多少有点讽刺。但也说明社区在认真对待这事。",
  },
};

// 阶段 A：为所有条目打分的映射（仅 valueScore，用于未在 ENRICHMENT 中的条目）
const VALUE_SCORES: Record<string, number> = {
  "hn-47340079": 5,
  "hn-47333627": 8,
  "hn-47334694": 8,
  "hn-47337607": 6,
  "hn-47334982": 6,
  "hn-47339164": 6,
  "hn-47336171": 7,
  "hn-47343156": 5,
  "hn-47319520": 3,
  "lb-ufczx8": 6,
  "dt-3305097": 5,
  "lb-tiktds": 7,
  "lb-zzjjyo": 7,
  "hn-47328071": 6,
  "hn-47344999": 6,
  "lb-vb7ipx": 5,
  "hn-47343927": 6,
  "dt-3332311": 5,
  "lb-mqpba7": 6,
  "hn-47342139": 7,
  "dt-3340573": 6,
  "dt-3339961": 5,
  "hn-47296461": 5,
  "lb-dhk0do": 6,
  "dt-3339186": 5,
  "lb-bunmdv": 6,
  "lb-tyeo20": 6,
  "dt-3322940": 5,
  "lb-6lqnhh": 6,
  "dt-3331239": 4,
  "lb-t43mh5": 4,
  "dt-3326188": 5,
  "lb-ndtuji": 3,
  "dt-3336862": 5,
  "lb-g3qpeu": 4,
  "dt-3339615": 4,
  "dt-3339243": 5,
  "dt-3338946": 5,
  "dt-3340110": 4,
  "dt-3340069": 4,
  "dt-3337173": 5,
  "dt-3336917": 5,
  "dt-3340183": 5,
  "ch-changelog.com/16/2825": 6,
  "ch-changelog.com/16/2818": 5,
  "ch-changelog.com/16/2816": 5,
  "ch-changelog.com/16/2813": 5,
  "ch-changelog.com/16/2811": 5,
  "ch-changelog.com/16/2808": 5,
  "ch-changelog.com/16/2804": 5,
  "ch-changelog.com/16/2802": 5,
  "ch-changelog.com/16/2800": 5,
  "ch-changelog.com/16/2798": 5,
  "ch-changelog.com/16/2796": 5,
  "ch-changelog.com/16/2791": 5,
  "ch-changelog.com/16/2787": 5,
  "ch-changelog.com/16/2784": 5,
  "ch-changelog.com/16/2781": 5,
  "ch-changelog.com/16/2779": 5,
  "ch-changelog.com/16/2776": 5,
  "ch-changelog.com/16/2773": 5,
  "ch-changelog.com/16/2770": 5,
  "ch-changelog.com/16/2766": 5,
};

function main() {
  const date = process.argv[2] || "2026-03-11";
  const rawPath = resolve(PROJECT_ROOT, "data", "raw", `${date}.json`);
  const enrichedPath = resolve(PROJECT_ROOT, "data", "enriched", `${date}.json`);

  const raw = JSON.parse(readFileSync(rawPath, "utf-8"));
  const items = raw.items as Record<string, unknown>[];

  // 阶段 A：打 valueScore，去重（同 URL 保留 score 更高的来源）
  const byUrl = new Map<string, { item: Record<string, unknown>; score: number }>();
  for (const item of items) {
    const url = item.url as string;
    const platformScore = (item.score as number) ?? 0;
    const valueScore = VALUE_SCORES[item.id as string] ?? 5;
    const existing = byUrl.get(url);
    if (!existing || platformScore > existing.score) {
      byUrl.set(url, { item: { ...item, valueScore }, score: platformScore });
    }
  }
  const deduped = [...byUrl.values()].map((v) => v.item);

  // 按 valueScore 降序，同分时按 platform score 降序
  deduped.sort((a, b) => {
    const va = a.valueScore as number;
    const vb = b.valueScore as number;
    if (vb !== va) return vb - va;
    return ((b.score as number) ?? 0) - ((a.score as number) ?? 0);
  });

  const top20 = deduped.slice(0, 20);

  // 阶段 B：合并完整增强数据
  const enrichedItems = top20.map((item) => {
    const id = item.id as string;
    const enrich = ENRICHMENT[id];
    if (enrich) {
      return { ...item, ...enrich };
    }
    return item;
  });

  const enriched = {
    date: raw.date,
    fetchedAt: raw.fetchedAt,
    enrichedAt: new Date().toISOString(),
    items: enrichedItems,
  };

  const enrichedDir = resolve(PROJECT_ROOT, "data", "enriched");
  if (!existsSync(enrichedDir)) {
    mkdirSync(enrichedDir, { recursive: true });
  }

  writeFileSync(enrichedPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`✓ Enriched ${top20.length} items → ${enrichedPath}`);
}

main();
