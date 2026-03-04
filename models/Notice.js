import mongoose from "mongoose";
const noticeSchema = new mongoose.Schema({
  title:      { type:String, required:true },
  content:    { type:String, required:true },
  category:   { type:String, enum:["exam","holiday","event","general","urgent"], default:"general" },
  postedBy:   { type:mongoose.Schema.Types.ObjectId, ref:"User" },
  targetRole: { type:String, enum:["all","student","faculty"], default:"all" },
  isActive:   { type:Boolean, default:true },
}, { timestamps:true });
export const Notice = mongoose.model("Notice", noticeSchema);
