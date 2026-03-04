import mongoose from "mongoose";
const feesSchema = new mongoose.Schema({
  student:     { type:mongoose.Schema.Types.ObjectId, ref:"Student", required:true },
  totalAmount: { type:Number, required:true },
  paidAmount:  { type:Number, default:0 },
  dueAmount:   { type:Number },
  dueDate:     { type:Date },
  status:      { type:String, enum:["Paid","Unpaid","Partial"], default:"Unpaid" },
  semester:    { type:Number, required:true },
  academicYear:{ type:String, required:true },
  transactions:[{
    razorpayOrderId:  String,
    razorpayPaymentId:String,
    amount:  Number,
    date:    { type:Date, default:Date.now },
    status:  { type:String, enum:["success","failed"] },
  }],
}, { timestamps:true });

feesSchema.pre("save", function(next) {
  this.dueAmount = this.totalAmount - this.paidAmount;
  if      (this.paidAmount===0)                 this.status="Unpaid";
  else if (this.paidAmount>=this.totalAmount)   this.status="Paid";
  else                                          this.status="Partial";
  next();
});
export const Fees = mongoose.model("Fees", feesSchema);
