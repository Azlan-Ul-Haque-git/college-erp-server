import mongoose from "mongoose";
const attendanceSchema = new mongoose.Schema({
  student: { type:mongoose.Schema.Types.ObjectId, ref:"Student", required:true },
  subject: { type:String, required:true },
  faculty: { type:mongoose.Schema.Types.ObjectId, ref:"Faculty" },
  date:    { type:Date, required:true },
  status:  { type:String, enum:["Present","Absent","Late"], required:true },
  markedBy:{ type:String, enum:["manual","face"], default:"manual" },
}, { timestamps:true });
export const Attendance = mongoose.model("Attendance", attendanceSchema);
