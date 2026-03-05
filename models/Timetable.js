import mongoose from "mongoose";
const timetableSchema = new mongoose.Schema({
  branch:   { type:String, required:true },
  year:     { type:Number, required:true },
  semester: { type:Number, required:true },
  day:      { type:String, enum:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], required:true },
  slots:[{
    startTime:String, endTime:String, subject:String,
    faculty:{ type:mongoose.Schema.Types.ObjectId, ref:"Faculty" },
    room:String,
  }],
}, { timestamps:true });
export default mongoose.model("Timetable", timetableSchema);
