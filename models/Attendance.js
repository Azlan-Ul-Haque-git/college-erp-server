import mongoose from "mongoose";

const checkInOutSchema = new mongoose.Schema(
  {
    time: { type: Date },
    location: { type: String, default: "" },
    method: { type: String, enum: ["manual", "qr", "face", "checkin"], default: "checkin" },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    // ── Who ──────────────────────────────────────────────────────────────────
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userType: { type: String, enum: ["student", "faculty"], required: true },

    // ── What ─────────────────────────────────────────────────────────────────
    course: { type: String },
    subject: { type: String },
    semester: { type: String },
    section: { type: String },

    // ── When ─────────────────────────────────────────────────────────────────
    date: { type: Date, required: true, default: Date.now },

    // ── Status ───────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["present", "absent", "late", "half-day", "holiday", "pending"],
      default: "pending",
    },

    // ── Self check-in / check-out ─────────────────────────────────────────
    checkIn: { type: checkInOutSchema },
    checkOut: { type: checkInOutSchema },

    // Auto-calculated on save
    workingHours: { type: Number },

    // ── Admin approval ───────────────────────────────────────────────────────
    approvalStatus: {
      type: String,
      enum: ["not_required", "pending", "approved", "rejected"],
      default: "not_required",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String },

    // ── Meta ─────────────────────────────────────────────────────────────────
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    remarks: { type: String },
  },
  { timestamps: true }
);

// Auto-calculate working hours when both check-in & check-out are set
attendanceSchema.pre("save", function (next) {
  if (this.checkIn?.time && this.checkOut?.time) {
    const ms = new Date(this.checkOut.time) - new Date(this.checkIn.time);
    this.workingHours = parseFloat((ms / 3_600_000).toFixed(2));
  }
  next();
});

// One record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ userType: 1, date: 1 });
attendanceSchema.index({ approvalStatus: 1 });
attendanceSchema.index({ course: 1, date: 1 });

export default mongoose.model("Attendance", attendanceSchema);