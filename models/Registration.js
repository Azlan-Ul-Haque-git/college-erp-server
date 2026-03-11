import mongoose from "mongoose";
const registrationSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ["student", "faculty"], required: true },
  phone:       String,
  // Student fields
  rollNo:      String,
  branch:      String,
  semester:    Number,
  year:        Number,
  section:     String,
  // Faculty fields
  department:  String,
  designation: String,
  // Status
  status:      { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  adminRemarks: String,
}, { timestamps: true });
export default mongoose.model("Registration", registrationSchema);