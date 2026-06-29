const messageTracker = new Map();

const MAX_MESSAGES = 10;
const TIME_WINDOW = 5000; // 5 seconds

function canSendMessage(socketId) {

    const currentTime = Date.now();

    if (!messageTracker.has(socketId)) {
        messageTracker.set(socketId, []);
    }

    let timestamps = messageTracker.get(socketId);

    // Keep only timestamps within the last 5 seconds
    timestamps = timestamps.filter(
        time => currentTime - time < TIME_WINDOW
    );

    if (timestamps.length >= MAX_MESSAGES) {
        messageTracker.set(socketId, timestamps);
        return false;
    }

    timestamps.push(currentTime);
    messageTracker.set(socketId, timestamps);

    return true;
}

function removeUser(socketId) {
    messageTracker.delete(socketId);
}

module.exports = {
    canSendMessage,
    removeUser
};