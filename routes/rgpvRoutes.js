import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import RGPVNotice from "../models/RGPVNotice.js";
import { fetchRGPVNotices } from "../scrapers/rgpvScraper.js";

const router = express.Router();

/* ═════════ GET RGPV NOTICES ═════════ */
router.get(
    "/",
    protect,
    asyncHandler(async (req, res) => {
        const notices = await RGPVNotice.find()
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            count: notices.length,
            data: notices,
        });
    })
);

/* ═════════ MANUAL REFRESH (admin only) ═════════ */
router.post(
    "/refresh",
    protect,
    asyncHandler(async (req, res) => {
        if (req.user.role !== "admin") {
            res.status(403);
            throw new Error("Only admin can refresh");
        }

        const result = await fetchRGPVNotices();

        res.json({
            success: true,
            message: `Fetched ${result.added} new notices`,
            ...result,
        });
    })
);

export default router;