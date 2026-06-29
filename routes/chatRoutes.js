const express = require("express");

const router = express.Router();

const {

    chatHome,

    getUsers,

    getActiveUsers,

    getWaitingUsers,

    getMessages

} = require("../controllers/chatController");

// Test API
router.get("/", chatHome);

// All Users
router.get("/users", getUsers);

// Active Users
router.get("/active-users", getActiveUsers);

// Waiting Users
router.get("/waiting-users", getWaitingUsers);

// Chat History
router.get("/messages/:roomId", getMessages);

module.exports = router;