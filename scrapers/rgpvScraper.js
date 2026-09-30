import axios from "axios";
import * as cheerio from "cheerio";
import RGPVNotice from "../models/RGPVNotice.js";

export const fetchRGPVNotices = async () => {
    try {
        console.log("🔍 Fetching RGPV notices...");

        // User-Agent add karo — kuch sites bot block karti hain
        const { data } = await axios.get("https://www.rgpvdiploma.in/", {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            timeout: 15000,
        });

        const $ = cheerio.load(data);
        const notices = [];

        // Marquee links
        $("marquee a").each((i, el) => {
            const text = $(el).text().trim();
            const href = $(el).attr("href");
            if (text) {
                notices.push({
                    message: text,
                    link: href
                        ? href.startsWith("http")
                            ? href
                            : `https://www.rgpvdiploma.in/${href.replace(/^\//, "")}`
                        : "https://www.rgpvdiploma.in/",
                });
            }
        });

        // Fallback — kuch sites marquee use nahi karti
        if (notices.length === 0) {
            $("a").each((i, el) => {
                const text = $(el).text().trim();
                const href = $(el).attr("href");
                if (
                    text &&
                    text.length > 20 &&
                    text.length < 500 &&
                    (text.toLowerCase().includes("notice") ||
                        text.toLowerCase().includes("exam") ||
                        text.toLowerCase().includes("result"))
                ) {
                    notices.push({
                        message: text,
                        link: href || "",
                    });
                }
            });
        }

        let added = 0;

        for (const notice of notices) {
            const exists = await RGPVNotice.findOne({ message: notice.message });

            if (!exists) {
                await RGPVNotice.create({
                    title: "RGPV Update",
                    message: notice.message,
                    link: notice.link,
                    source: "rgpvdiploma",
                });
                added++;
            }
        }

        console.log(`✅ RGPV notices: ${added} new, ${notices.length} total`);
        return { added, total: notices.length };
    } catch (err) {
        console.error("❌ Scraper error:", err.message);
        return { added: 0, total: 0, error: err.message };
    }
};