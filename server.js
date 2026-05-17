import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import { initSocket } from "./socket/socketHandler.js";

// ROUTES
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

import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

import cron from "node-cron";
import { fetchRGPVNotices } from "./scrapers/rgpvScraper.js";

dotenv.config();

const startServer = async () => {
  await connectDB();

  const app = express();
  const server = http.createServer(app);

  // =========================
  // ✅ CORS
  // =========================
  app.use(cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://your-vercel-app.vercel.app"
    ],
    credentials: true
  }));

  app.options("*", cors());

  // =========================
  // BODY PARSER
  // =========================
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // =========================
  // CRON
  // =========================
  cron.schedule("*/10 * * * *", () => fetchRGPVNotices());
  fetchRGPVNotices();

  // =========================
  // ROUTES
  // =========================
  app.get("/", (req, res) => res.send("College ERP Backend Running 🚀"));

  app.get("/api/health", (req, res) =>
    res.json({ status: "OK", time: new Date() })
  );

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

  // =========================
  // ✅ SOCKET.IO
  // =========================
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-vercel-app.vercel.app"
      ],
      credentials: true
    }
  });

  initSocket(io);

  // =========================
  // ERROR HANDLING
  // =========================
  app.use(notFound);
  app.use(errorHandler);

  // =========================
  // START SERVER
  // =========================
  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();