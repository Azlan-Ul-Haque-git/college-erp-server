import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name:    { type:String, required:true, trim:true },
  email:   { type:String, required:true, unique:true, lowercase:true },
  password:{ type:String, required:true },
  role:    { type:String, enum:["admin","faculty","student"], required:true },
  avatar:  { type:String, default:"" },
  phone:   { type:String, default:"" },
  isActive:{ type:Boolean, default:true },
  resetOTP:{ type:String },
  resetOTPExpire:{ type:Date },
}, { timestamps:true });

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = async function(entered) { return await bcrypt.compare(entered, this.password); };

export default mongoose.model("User", userSchema);
