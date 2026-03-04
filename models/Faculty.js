import mongoose from "mongoose";
const facultySchema = new mongoose.Schema({
  user:         { type:mongoose.Schema.Types.ObjectId, ref:"User", required:true },
  employeeId:   { type:String, required:true, unique:true },
  department:   { type:String, required:true },
  designation:  { type:String, default:"Lecturer" },
  subjects:     [{ type:String }],
  qualification:{ type:String },
  experience:   { type:Number, default:0 },
}, { timestamps:true });
export const Faculty = mongoose.model("Faculty", facultySchema);
