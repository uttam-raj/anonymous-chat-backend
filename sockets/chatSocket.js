const createSession = require("../utils/session");
const db = require("../database/db");

const {
    waitingQueue,
    activeChats,
    removeFromQueue
} = require("../utils/matchmaking");

const {
    canSendMessage,
    removeUser
} = require("../middleware/rateLimiter");

module.exports = (io) => {

    io.on("connection", (socket) => {

        console.log("🟢 User Connected:", socket.id);

        // Create anonymous session
        const sessionId = createSession();
        socket.sessionId = sessionId;

        socket.emit("session_created", {

            sessionId

        });

        // Save user in database
        db.query(
            "INSERT INTO users(session_id, socket_id, status) VALUES (?, ?, ?)",
            [sessionId, socket.id, "waiting"],
            (err) => {
                if (err) {
                    console.log(err);
                }
            }
        );

        // ===============================
        // FIND PARTNER
        // ===============================

        socket.on("find_partner", () => {

            console.log(socket.id + " searching...");

            if (activeChats.has(socket.id)) {
                return;
            }

            removeFromQueue(socket.id);

            if (waitingQueue.length > 0) {

                const partner = waitingQueue.shift();

                const roomId = `room-${Date.now()}`;

                socket.join(roomId);
                partner.join(roomId);

                activeChats.set(socket.id, {
                    partnerId: partner.id,
                    roomId: roomId
                });

                activeChats.set(partner.id, {
                    partnerId: socket.id,
                    roomId: roomId
                });

                db.query(
                    "INSERT INTO chats(room_id,user1,user2) VALUES(?,?,?)",
                    [
                        roomId,
                        socket.sessionId,
                        partner.sessionId
                    ]
                );

                db.query(
                    "UPDATE users SET status='matched' WHERE session_id=?",
                    [socket.sessionId]
                );

                db.query(
                    "UPDATE users SET status='matched' WHERE session_id=?",
                    [partner.sessionId]
                );

                socket.emit("matched", {
                    roomId,
                    partner: partner.sessionId
                });

                partner.emit("matched", {
                    roomId,
                    partner: socket.sessionId
                });

                console.log("✅ Match Created");
                console.log(socket.id + " <--> " + partner.id);

            } else {

                waitingQueue.push(socket);

                db.query(
                    "UPDATE users SET status='waiting' WHERE session_id=?",
                    [socket.sessionId]
                );

                socket.emit("searching");

                console.log("Waiting Queue:", waitingQueue.length);
            }

        });

        // ===============================
        // SEND MESSAGE
        // ===============================
socket.on("send_message", (data) => {

    const chat = activeChats.get(socket.id);

    if (!canSendMessage(socket.id)) {

        socket.emit(
            "message_error",
            "Too many messages. Please wait a few seconds."
        );

        return;
    }

    // User is not in any active chat
    if (!chat) {
        socket.emit("message_error", "You are not connected to any partner.");
        return;
    }

    // Validate message
    if (!data || typeof data.message !== "string") {

    socket.emit(
        "message_error",
        "Invalid message."
    );

    return;
}

const message = data.message.trim();

// Empty
if (message.length === 0) {

    socket.emit(
        "message_error",
        "Message cannot be empty."
    );

    return;
}

// Too long
if (message.length > 300) {

    socket.emit(
        "message_error",
        "Maximum 300 characters allowed."
    );

    return;
}


    // Save message in database
    db.query(
        "INSERT INTO messages(room_id, sender, message) VALUES (?, ?, ?)",
        [
            chat.roomId,
            socket.sessionId,
            message
        ],
        (err) => {

            if (err) {
                console.log(err);

                socket.emit(
                    "message_error",
                    "Failed to send message."
                );

                return;
            }

            // Send message to everyone in the room
            io.to(chat.roomId).emit("receive_message", {

                sender: socket.sessionId,

                message: message,

                roomId: chat.roomId,

                time: new Date()

            });

        }
    );

});

        // ===============================
        // SKIP CHAT
        // ===============================

        socket.on("skip_chat", () => {

            const chat = activeChats.get(socket.id);

            if (!chat) {
                socket.emit("message_error", "No active chat found.");
                return;
            }

            const partnerId = chat.partnerId;
            const roomId = chat.roomId;

            const partnerSocket = io.sockets.sockets.get(partnerId);

            // Remove active chat
            activeChats.delete(socket.id);
            activeChats.delete(partnerId);

            // Leave room
            socket.leave(roomId);

            if (partnerSocket) {

                partnerSocket.leave(roomId);

                partnerSocket.emit("partner_skipped");

                removeFromQueue(partnerSocket.id);

                waitingQueue.push(partnerSocket);

                db.query(
                    "UPDATE users SET status='waiting' WHERE session_id=?",
                    [partnerSocket.sessionId]
                );

                // partnerSocket.emit("searching");
            }

            removeFromQueue(socket.id);

            waitingQueue.push(socket);

            db.query(
                "UPDATE users SET status='waiting' WHERE session_id=?",
                [socket.sessionId]
            );

            // NOW tell both clients to search again
            if (partnerSocket) {
                partnerSocket.emit("searching");
            }

            socket.emit("searching");

            console.log("⏭ Chat Skipped");
        });

        // ===============================
        // END CHAT
        // ===============================

        socket.on("end_chat", () => {

            const chat = activeChats.get(socket.id);

            if (!chat) return;

            const partnerId = chat.partnerId;

            const partnerSocket = io.sockets.sockets.get(partnerId);

            activeChats.delete(socket.id);
            activeChats.delete(partnerId);

            db.query(
                "UPDATE chats SET ended_at = NOW() WHERE room_id = ?",
                [chat.roomId]
            );

            if (partnerSocket) {

                partnerSocket.leave(chat.roomId);

                partnerSocket.emit("chat_ended");

                removeFromQueue(partnerSocket.id);

                waitingQueue.push(partnerSocket);

                db.query(
                    "UPDATE users SET status='waiting' WHERE session_id=?",
                    [partnerSocket.sessionId]
                );

                partnerSocket.emit("searching");
            }

            socket.leave(chat.roomId);

            removeFromQueue(socket.id);

            waitingQueue.push(socket);

            db.query(
                "UPDATE users SET status='waiting' WHERE session_id=?",
                [socket.sessionId]
            );

            socket.emit("searching");

            console.log("❌ Chat Ended");

        });

        // ===============================
        // DISCONNECT
        // ===============================

        socket.on("disconnect", () => {

            console.log("🔴 User Disconnected:", socket.id);

            removeUser(socket.id);

            removeFromQueue(socket.id);

            const chat = activeChats.get(socket.id);

            if (chat) {

                const partnerId = chat.partnerId;

                const partnerSocket = io.sockets.sockets.get(partnerId);

                activeChats.delete(socket.id);
                activeChats.delete(partnerId);

                db.query(
                    "UPDATE chats SET ended_at = NOW() WHERE room_id = ?",
                    [chat.roomId]
                );

                if (partnerSocket) {

                    partnerSocket.leave(chat.roomId);

                    partnerSocket.emit("partner_disconnected");

                    removeFromQueue(partnerSocket.id);

                    waitingQueue.push(partnerSocket);

                    db.query(
                        "UPDATE users SET status='waiting' WHERE session_id=?",
                        [partnerSocket.sessionId]
                    );

                    partnerSocket.emit("searching");
                }
            }

            db.query(
                "UPDATE users SET status='offline' WHERE session_id=?",
                [socket.sessionId]
            );

        });

    });

};