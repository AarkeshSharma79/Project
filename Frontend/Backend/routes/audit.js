import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const router = express.Router();

router.post("/", async (req, res) => {

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            error: "URL is required"
        });
    }

    try {
        new URL(url);
    } catch {
        return res.status(400).json({
            error: "Invalid URL"
        });
    }

    try {

        const start = Date.now();

        const response = await axios.get(url, {
            timeout: 8000,
            validateStatus: () => true
        });

        const responseTime = Date.now() - start;

        const contentType = response.headers["content-type"] || "";

        if (!contentType.includes("text/html")) {
            return res.status(400).json({
                error: "Response is not HTML"
            });
        }

        const $ = cheerio.load(response.data);

        const title = $("title").text().trim();

        const metaDescription =
            $('meta[name="description"]').attr("content") || "";

        const h1Count = $("h1").length;

        let missingAlt = 0;

        $("img").each((i, img) => {
            if (!$(img).attr("alt")) {
                missingAlt++;
            }
        });

        const wordCount = $("body")
            .text()
            .replace(/\s+/g, " ")
            .trim()
            .split(" ")
            .filter(Boolean).length;

        res.json({
            status: response.status,
            responseTime,
            title,
            metaDescription,
            h1Count,
            missingAlt,
            wordCount
        });

    } catch (error) {

        if (error.code === "ECONNABORTED") {
            return res.status(408).json({
                error: "Request timed out"
            });
        }

        res.status(500).json({
            error: "Unable to fetch website"
        });
    }

});

export default router;