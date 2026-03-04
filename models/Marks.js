import mongoose from "mongoose";
const marksSchema = new mongoose.Schema({
  student:  { type:mongoose.Schema.Types.ObjectId, ref:"Student", required:true },
  subject:  { type:String, required:true },
  semester: { type:Number, required:true },
  internal: { type:Number, default:0 },
  external: { type:Number, default:0 },
  total:    { type:Number, default:0 },
  grade:    { type:String, default:"" },
  examYear: { type:String },
}, { timestamps:true });

marksSchema.pre("save", function(next) {
  this.total = this.internal + this.external;
  if      (this.total>=90) this.grade="O";
  else if (this.total>=80) this.grade="A+";
  else if (this.total>=70) this.grade="A";
  else if (this.total>=60) this.grade="B+";
  else if (this.total>=50) this.grade="B";
  else if (this.total>=40) this.grade="C";
  else                     this.grade="F";
  next();
});
export const Marks = mongoose.model("Marks", marksSchema);
