import axios from "axios";
import * as cheerio from "cheerio";

export const config = {
  schedule: "0 * * * *",
};

export default async function handler(req: any, res: any) {
  try {
    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
    if (!WEBHOOK_URL) throw new Error("웹훅 URL이 설정되지 않았습니다.");

    const CATEGORIES: Record<string, string> = {
      notices: "📢 공지사항",
      news: "📰 소식",
      events: "🎉 이벤트",
    };

    for (const [type, emojiTitle] of Object.entries(CATEGORIES)) {
      const url = `https://www.hoyolab.com/circles/6/39/official?page_type=39&page_sort=${type}`;
      const { data: html } = await axios.get(url);
      const $ = cheerio.load(html);

      const firstNotice = $(".article-list .article-item").first();
      const title = firstNotice.find(".title").text().trim();
      const relativeLink = firstNotice.find("a").attr("href");

      if (!relativeLink) {
        console.warn(`${type} 카테고리에 게시물이 없습니다.`);
        continue;
      }

      const fullLink = "https://www.hoyolab.com" + relativeLink;

      const payload = {
        embeds: [
          {
            title: `${emojiTitle} 새 게시물!`,
            description: `[${title}](${fullLink})`,
            color: 0x7289da,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await axios.post(WEBHOOK_URL, payload);
    }

    res.status(200).json({ message: "3개 카테고리 공지 전송 완료!" });
  } catch (err: any) {
    console.error("공지 전송 중 오류:", err.message);
    res.status(500).json({ message: "공지 전송 실패", error: err.message });
  }
}
