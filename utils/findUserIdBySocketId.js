const { userSocketMap } = require('../config/socket');

const getUserIdBySocketId = (userId) => {
    for (let [key, val] of userSocketMap.entries()) {
        if (val === userId) {
            return key;
        }
    }
    return undefined; // Return undefined if the value is not found
};
module.exports = getUserIdBySocketId;
