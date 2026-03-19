import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

type AnyItem = {
  id: string;
  title: string;
  title_zh?: string;
  url: string;
  source: string;
  createdAt: string;
  description?: string;
  summary_zh?: string;
  tags?: string[];
  valueScore?: number;
  image?: string;
  commentary?: string;
};

type AnyDaily = {
  date: string;
  fetchedAt: string;
  enrichedAt?: string;
  items: AnyItem[];
};

const MAX_EXPORT = 20;

/** 人味俏皮动作，用于随机生成引言 */
const INTRO_ACTIONS = [
  "削苹果",
  "剪指甲",
  "喝咖啡",
  "刷手机",
  "晒太阳",
  "伸懒腰",
  "泡脚",
  "修键盘",
  "撸猫",
  "发呆",
  "泡枸杞",
  "写bug",
  "挖耳朵",
  "泡茶",
  "数羊",
  "打哈欠",
  "吹口哨",
  "抠键盘",
  "磨刀",
  "浇花",
  "啃薯片",
  "擦眼镜",
  "遛狗",
  "收快递",
  "嗑瓜子",
  "挠头",
  "揉眼睛",
  "剥橘子",
  "热牛奶",
  "调闹钟",
  "吃饭",
  "冲咖啡",
  "煎鸡蛋",
  "划水",
  "搓澡",
  "找眼镜",
  "系鞋带",
  "搓手",
  "转笔",
  "叠被子",
  "修灯泡",
  "刮胡子",
  "戴耳机",
  "开冰箱",
  "喝奶茶",
  "擦屏幕",
  "拍大腿",
  "挠后背",
  "叠衣服",
  "换床单",
  "擦键盘",
  "等电梯",
  "啃玉米",
  "撕快递",
  "托腮",
  "打喷嚏",
  "擤鼻涕",
  "掏耳朵",
  "挠痒痒",
  "拧瓶盖",
  "卷袖子",
  "转椅子",
  "擦桌子",
  "扫地",
  "拖地",
  "盖被子",
  "掖被角",
  "听歌",
  "哼小曲",
  "剥蒜",
  "切葱",
  "按圆珠笔",
  "倒热水",
  "关灯",
  "拉窗帘",
  "拍枕头",
  "闻花香",
  "刷锅",
  "摆碗筷",
  "倒酱油",
  "跷二郎腿",
  "抢红包",
  "开小差",
  "打盹",
  "数硬币",
  "踩体重秤",
  "扇扇子",
  "看时间",
  "定闹钟",
  "关闹钟",
  "冲奶粉",
  "夹花生米",
  "挑香菜",
  "找车位",
  "擦眼镜片"
];

function randomIntro(): string {
  const action = INTRO_ACTIONS[Math.floor(Math.random() * INTRO_ACTIONS.length)];
  return `大家好，我是正在${action}的啾伯特，一起来看看昨天都发生了哪些变化吧。`;
}

function usage() {
  console.log("用法：npm run wechat [日期]");
  console.log("      不传日期时默认导出昨天，如：npm run wechat -- 2026-03-09");
  console.log("说明：读取 data/enriched 或 data/raw，导出 Markdown 到 exports/{date}.md，图片引用 data/assets/");
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function pickDateArg(): string | null {
  const arg = process.argv[2];
  if (!arg) return yesterday();
  return /^\d{4}-\d{2}-\d{2}$/.test(arg) ? arg : null;
}

function readDaily(date: string): AnyDaily {
  const enriched = resolve(process.cwd(), "data", "enriched", `${date}.json`);
  const raw = resolve(process.cwd(), "data", "raw", `${date}.json`);
  const path = existsSync(enriched) ? enriched : raw;
  const json = JSON.parse(readFileSync(path, "utf-8"));
  return json as AnyDaily;
}

function safeMd(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

/** 标题中的 ] 需转义，否则会破坏 Markdown 链接 */
function escapeLinkText(text: string): string {
  return text.replace(/\]/g, "\\]");
}

function toPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 是否为 webp 格式（微信不支持，导出时不配图）
 */
function isWebp(image: string): boolean {
  const lower = image.toLowerCase();
  return lower.endsWith(".webp") || lower.includes(".webp?");
}

/**
 * 将 item.image 转为 Markdown 可引用的路径。
 * - 本地路径 assets/xxx.webp -> ../data/assets/xxx.webp（相对 exports/）
 * - 外部 URL -> 原样
 */
function imagePathForMd(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return `../data/${image}`;
}

function main() {
  const date = pickDateArg();
  if (!date) {
    usage();
    process.exit(1);
  }
  console.log(`导出日期：${date}`);

  const daily = readDaily(date);
  const items = [...(daily.items || [])]
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))
    .slice(0, MAX_EXPORT);

  const outDir = resolve(process.cwd(), "exports");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `${date}.md`);

  const firstWithImage = items.find((it) => it.image && !isWebp(it.image));
  const frontMatterTitle = firstWithImage
    ? (firstWithImage.title_zh || firstWithImage.title)
    : items[0]
      ? (items[0].title_zh || items[0].title)
      : `昨日旧闻（${date}）`;
  const frontMatterCover = firstWithImage
    ? imagePathForMd(firstWithImage.image!)
    : "";

  function yamlEscape(s: string): string {
    return s.replace(/"/g, '\\"');
  }
  let md = "";
  md += "---\n";
  md += `title: "${yamlEscape(safeMd(frontMatterTitle))}"\n`;
  md += frontMatterCover ? `cover: ${frontMatterCover}\n` : "";
  md += "author: 啾伯特\n";
  md += "source_url: https://eyes.phaeris.xyz\n";
  md += "---\n\n";
  md += `# 昨日旧闻（${date}）\n\n`;
  md += `> ${randomIntro()}\n\n`;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.title_zh || item.title;
    md += `## [${escapeLinkText(safeMd(title))}](${item.url})\n\n`;

    if (item.image && !isWebp(item.image)) {
      md += `![配图](${imagePathForMd(item.image)})\n\n`;
    }

    const summary = item.summary_zh
      ? item.summary_zh
      : item.description
        ? toPlainText(item.description)
        : "（暂无简介）";
    md += `${safeMd(summary)}\n\n`;

    if (item.commentary) {
      md += `**啾伯特：** ${safeMd(item.commentary)}\n\n`;
    }

    md += `---\n\n`;
  }

  writeFileSync(outPath, md, "utf-8");
  console.log(`✓ 已导出：${outPath}`);
}

try {
  main();
} catch (err) {
  console.error("导出失败：", err);
  process.exit(1);
}
