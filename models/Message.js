import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });
export default mongoose.model("Message", messageSchema);