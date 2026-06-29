const waitingQueue = [];

const activeChats = new Map();

/*

activeChats

socketId

{

partnerId,
roomId

}

*/

function removeFromQueue(socketId) {

    const index = waitingQueue.findIndex(
        user => user.id === socketId
    );

    if (index !== -1) {
        waitingQueue.splice(index, 1);
    }

}

module.exports = {

    waitingQueue,
    activeChats,
    removeFromQueue

};