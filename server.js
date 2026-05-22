import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import { initSocket } from "./socket/socketHandler.js";

import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import marksRoutes from "./routes/marksRoutes.js";
import feesRoutes from "./routes/feesRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import grievanceRoutes from "./routes/grievanceRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import rgpvRoutes from "./routes/rgpvRoutes.js";

import cron from "node-cron";
import { fetchRGPVNotices } from "./utils/fetchRGPVNotices.js";

import {
  errorHandler,
  notFound,
} from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://college-erp-client-eight.vercel.app"
    ],
    credentials: true,
  },
});

initSocket(io);

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://college-erp-client-eight.vercel.app"
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("College ERP Backend Running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/fees", feesRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/rgpv", rgpvRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {

    await connectDB();


    await fetchRGPVNotices();

    cron.schedule("*/30 * * * *", async () => {
      console.log("Checking RGPV notices...");
      await fetchRGPVNotices();
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {

    console.log("MongoDB Error:", error);

  }
};

startServer();