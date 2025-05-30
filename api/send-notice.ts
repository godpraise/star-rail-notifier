// /api/send-notice.ts

import axios from "axios";
import * as cheerio from "cheerio";

export const config = {
  schedule: "0 * * * *", // 매 정시마다 실행
};

export default async function handler(req: any, res: any) {
  try {
    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

    if (!WEBHOOK_URL) {
      throw new Error("웹훅 URL이 설정되지 않았습니다.");
    }

    const { data: html } = await axios.get("https://www.hoyolab.com/notice");
    const $ = cheerio.load(html);

    const firstNotice = $(".article-list .article-item").first();
    const title = firstNotice.find(".title").text().trim();
    const relativeUrl = firstNotice.find("a").attr("href");
    const fullUrl = "https://www.hoyolab.com" + relativeUrl;

    const payload = {
      embeds: [
        {
          title: "📢 스타레일 새 공지!",
          description: `[${title}](${fullUrl})`,
          color: 0x7289da,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await axios.post(WEBHOOK_URL, payload);

    res.status(200).json({ message: "공지 전송 완료!" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "공지 전송 실패", error: err.message });
  }
}
