import mongoose from "mongoose";
const leaveSchema = new mongoose.Schema({
  appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: String,
  leaveType: { type: String, enum: ["Sick", "Casual", "Emergency", "Other"], default: "Casual" },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
}, { timestamps: true });
export default mongoose.model("Leave", leaveSchema);