import axios from "axios";
import cheerio from "cheerio";
import Notification from "../models/Notification.js";

export const fetchRGPVNotices = async () => {

    try {

        const { data } = await axios.get("https://www.rgpvdiploma.in/");

        const $ = cheerio.load(data);

        const notices = [];

        $("marquee a").each((i, el) => {

            const text = $(el).text().trim();

            if (text) {
                notices.push(text);
            }

        });

        for (const notice of notices) {

            const exists = await Notification.findOne({ message: notice });

            if (!exists) {

                await Notification.create({
                    title: "RGPV Update",
                    message: notice,
                    type: "notice"
                });

            }

        }

        console.log("RGPV notices updated");

    } catch (err) {

        console.log("Scraper error", err.message);

    }

};