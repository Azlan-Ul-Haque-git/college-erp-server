import mongoose from "mongoose";

/* ───────────── College Location (Campus) ───────────── */

export const COLLEGE_LOCATION = {
  name: "Govt Kalaniketan Polytechnic College Jabalpur",
  lat: 23.1815,
  lng: 79.9864,
  radius: 200 // meters
};

/* ───────────── Checkin Checkout Schema ───────────── */

const checkInOutSchema = new mongoose.Schema(
  {
    time: { type: Date },

    location: {
      lat: { type: Number },
      lng: { type: Number }
    },

    image: {
      type: String // 🔥 selfie (base64 or URL)
    },

    method: {
      type: String,
      enum: ["manual", "qr", "face", "checkin"],
      default: "checkin"
    }
  },
  { _id: false }
);

/* ───────────── Main Attendance Schema ───────────── */

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    userType: {
      type: String,
      enum: ["student", "faculty"],
      required: true   // 🔥 important
    },

    date: {
      type: Date,
      default: Date.now
    },

    checkIn: checkInOutSchema,

    checkOut: checkInOutSchema,

    location: {
      lat: { type: Number },
      lng: { type: Number }
    },

    selfie: {
      type: String // 🔥 backup image
    },

    faceVerified: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["present", "absent"],
      default: "present"
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    approvedAt: Date,

    rejectionReason: String,

    workingHours: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

/* ───────────── Index (OPTIMIZED) ───────────── */

// 🔥 fast query for daily attendance
attendanceSchema.index({ user: 1, date: 1 });

// 🔥 prevent duplicate attendance per day (VERY IMPORTANT)
attendanceSchema.index(
  { user: 1, date: 1 },
  { unique: false } // keep false if controller already handling duplicate
);

/* ───────────── Export Model ───────────── */

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;