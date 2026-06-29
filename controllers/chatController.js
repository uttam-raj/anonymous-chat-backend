const db = require("../database/db");

// Test API
exports.chatHome = (req, res) => {
    res.json({
        success: true,
        message: "Anonymous Chat API is Working"
    });
};

// Get all users
exports.getUsers = (req, res) => {

    db.query(
        "SELECT * FROM users",
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                users: result
            });

        }
    );

};

// Active Users
exports.getActiveUsers = (req, res) => {

    db.query(
        "SELECT * FROM users WHERE status='matched'",
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                activeUsers: result
            });

        }
    );

};

// Waiting Users
exports.getWaitingUsers = (req, res) => {

    db.query(
        "SELECT * FROM users WHERE status='waiting'",
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                waitingUsers: result
            });

        }
    );

};

// Chat History
exports.getMessages = (req, res) => {

    const roomId = req.params.roomId;

    db.query(
        "SELECT * FROM messages WHERE room_id=? ORDER BY sent_at ASC",
        [roomId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.status(200).json({
                success: true,
                messages: result
            });

        }
    );

};