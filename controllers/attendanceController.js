import Attendance, { COLLEGE_LOCATION } from "../models/attendance.js";
import { getDistance } from "geolib";

/* ───────────── CHECK IN ───────────── */

export const checkIn = async (req, res) => {
    try {

        const { lat, lng } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({
                message: "Location required"
            });
        }

        /* ───── Verify campus location ───── */

        const distance = getDistance(
            { latitude: lat, longitude: lng },
            { latitude: COLLEGE_LOCATION.lat, longitude: COLLEGE_LOCATION.lng }
        );

        if (distance > COLLEGE_LOCATION.radius) {
            return res.status(400).json({
                message: "You are outside college campus"
            });
        }

        /* ───── Check duplicate attendance ───── */

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existing = await Attendance.findOne({
            user: req.user._id,
            date: { $gte: todayStart, $lte: todayEnd }
        });

        if (existing) {
            return res.status(400).json({
                message: "Attendance already marked today"
            });
        }

        /* ───── Create attendance ───── */

        const attendance = await Attendance.create({

            user: req.user._id,

            date: new Date(),

            checkIn: {
                time: new Date(),
                location: { lat, lng },
                method: "checkin"
            },

            location: { lat, lng },

            faceVerified: true,

            status: "present"

        });

        res.json({
            success: true,
            message: "Check-in successful",
            attendance
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ───────────── CHECK OUT ───────────── */

export const checkOut = async (req, res) => {
    try {

        const attendance = await Attendance.findOne({
            user: req.user._id
        }).sort({ createdAt: -1 });

        if (!attendance) {
            return res.status(404).json({
                message: "No attendance found"
            });
        }

        if (attendance.checkOut?.time) {
            return res.status(400).json({
                message: "Already checked out"
            });
        }

        attendance.checkOut = {
            time: new Date(),
            method: "checkin"
        };

        await attendance.save();

        res.json({
            success: true,
            message: "Check-out successful",
            attendance
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ───────────── GET TODAY ATTENDANCE ───────────── */

export const getTodayAttendance = async (req, res) => {

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOne({
        user: req.user._id,
        date: { $gte: todayStart, $lte: todayEnd }
    });

    res.json(attendance);
};

/* ───────────── ADMIN / FACULTY VIEW ALL ───────────── */

export const getAllAttendance = async (req, res) => {

    const attendance = await Attendance
        .find()
        .populate("user", "name email role")
        .sort({ createdAt: -1 });

    res.json(attendance);

};