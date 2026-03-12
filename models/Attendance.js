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
      lat: Number,
      lng: Number
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

    date: {
      type: Date,
      default: Date.now
    },

    checkIn: checkInOutSchema,

    checkOut: checkInOutSchema,

    location: {
      lat: Number,
      lng: Number
    },

    faceVerified: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["present", "absent"],
      default: "present"
    }

  },

  {
    timestamps: true
  }

);

/* ───────────── Prevent Duplicate Attendance ───────────── */

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

/* ───────────── Export Model ───────────── */

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;