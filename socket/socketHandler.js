import Message from "../models/Message.js";
import Notification from "../models/Notification.js";

const onlineUsers = new Map();

export const initSocket = (io) => {

  io.on("connection", (socket) => {

    // User comes online
    socket.on("user:online", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });

    // Join chat room
    socket.on("chat:join", (roomId) => {
      socket.join(roomId);
    });

    // Send chat message
    socket.on("chat:message", async ({ senderId, receiverId, content }) => {

      try {

        const roomId = [senderId, receiverId].sort().join("_");

        const msg = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content,
          roomId
        });

        const populated = await msg.populate("sender", "name avatar role");

        // Emit message to both users in room
        io.to(roomId).emit("chat:message", populated);

        // 🔔 Save notification in DB
        await Notification.create({
          user: receiverId,
          title: "New Message",
          message: content.substring(0, 50),
          type: "chat"
        });

        // Send realtime notification if receiver online
        const receiverSocket = onlineUsers.get(receiverId);

        if (receiverSocket) {
          io.to(receiverSocket).emit("notification:message", {
            from: senderId,
            message: content.substring(0, 50)
          });
        }

      } catch (err) {
        socket.emit("chat:error", { message: "Message failed" });
      }

    });

    // Typing indicator
    socket.on("chat:typing", ({ roomId, userId, isTyping }) => {
      socket.to(roomId).emit("chat:typing", { userId, isTyping });
    });

    // Disconnect
    socket.on("disconnect", () => {

      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(uid);
          break;
        }
      }

      io.emit("users:online", Array.from(onlineUsers.keys()));

    });

  });

};