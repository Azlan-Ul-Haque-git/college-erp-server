import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

router.get("/", async (req, res) => {

    const notices = await Notification.find({
        title: "RGPV Update"
    })
        .sort({ createdAt: -1 })
        .limit(20);

    res.json({ notices });

});

export default router;