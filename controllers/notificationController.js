import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {

    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20);

    res.json({ notifications });

};

export const markAsRead = async (req, res) => {

    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });

    res.json({ success: true });

};