const { v4: uuidv4 } = require("uuid");

function createSession() {
    return uuidv4();
}

module.exports = createSession;