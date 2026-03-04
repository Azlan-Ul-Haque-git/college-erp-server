import { Message } from "../models/Message.js";
const onlineUsers = new Map();

export const initSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("user:online", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
    socket.on("chat:join", (roomId) => socket.join(roomId));
    socket.on("chat:message", async ({ senderId, receiverId, content }) => {
      try {
        const roomId = [senderId, receiverId].sort().join("_");
        const msg = await Message.create({ sender:senderId, receiver:receiverId, content, roomId });
        const populated = await msg.populate("sender", "name avatar role");
        io.to(roomId).emit("chat:message", populated);
        const receiverSocket = onlineUsers.get(receiverId);
        if (receiverSocket) io.to(receiverSocket).emit("notification:message", { from:senderId, message:content.substring(0,50) });
      } catch { socket.emit("chat:error", { message:"Message failed" }); }
    });
    socket.on("chat:typing", ({ roomId, userId, isTyping }) => socket.to(roomId).emit("chat:typing", { userId, isTyping }));
    socket.on("disconnect", () => {
      for (const [uid, sid] of onlineUsers.entries()) { if (sid===socket.id) { onlineUsers.delete(uid); break; } }
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
  });
};
