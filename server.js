const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const chatRoutes = require("./routes/chatRoutes");

require("dotenv").config();

// Database Connection
require("./database/db");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use("/api/chat", chatRoutes);

// Test Route
app.get("/", (req, res) => {
    res.send("Anonymous Chat Server Running...");
});

// Create HTTP Server
const server = http.createServer(app);

// Create Socket.IO Server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Socket Events
require("./sockets/chatSocket")(io);

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});