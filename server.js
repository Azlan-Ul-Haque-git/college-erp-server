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
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: [
      process.env.CLIENT_URL,
      "https://college-erp-client-dykqj9349-azlanulhaque9-4466s-projects.vercel.app",
      "http://localhost:3000"
    ], 
    methods: ["GET","POST"] 
  },
});
app.use(cors({ 
  origin: [
    process.env.CLIENT_URL,
    "https://college-erp-client-dykqj9349-azlanulhaque9-4466s-projects.vercel.app",
    "http://localhost:3000"
  ], 
  credentials: true 
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => res.json({ status:"OK", time: new Date() }));
app.use("/api/auth",       authRoutes);
app.use("/api/students",   studentRoutes);
app.use("/api/faculty",    facultyRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marks",      marksRoutes);
app.use("/api/fees",       feesRoutes);
app.use("/api/notices",    noticeRoutes);
app.use("/api/timetable",  timetableRoutes);
app.use("/api/chat",       chatRoutes);
app.use("/api/payment",    paymentRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
