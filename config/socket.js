const { Server } = require('socket.io');
const db = require('./firebase'); // Firebase configuration
const formatTimestamp = require('../utils/dayFormatter');

const userSocketMap = new Map(); // Map userId -> socket.id
function setupSocket(server) {
    const io = new Server(server);

    // Middleware to extract userId from query params on connection
    io.use((socket, next) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            socket.userId = userId; // Attach userId to the socket object
            next(); // Allow connection
        } else {
            next(new Error('userId is required')); // Reject connection if no userId
        }
    });

    io.on('connection', (socket) => {
        const { userId } = socket;
        console.log(`User connected: ${userId} (socket.id: ${socket.id})`);

        // Save mapping of userId to socketId
        userSocketMap.set(userId, socket.id);

        socket.on('joinRoom', async (roomId) => {
            socket.join(roomId);
            console.log(`${userId} listening on ${roomId}`);
            listenToRoomMessages(roomId, io);
            listenToRoomMembers(roomId, io);
        });

        socket.on('sendMessage', async ({ roomId, message }) => {
            if (!message || message.trim() === '') {
                return socket.emit('error', 'Message cannot be empty');
            }

            try {
                const timestamp = Date.now();
                await db.ref(`rooms/${roomId}/messages`).push({
                    userId,
                    message,
                    timestamp,
                });
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', 'Failed to send message');
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${userId}`);
            userSocketMap.delete(userId);
            removeListeners(socket);
        });

        // Firebase listeners for messages
        function listenToRoomMessages(roomId, io) {
            const messagesRef = db.ref(`rooms/${roomId}/messages`);

            messagesRef.on('child_added', async (snapshot) => {
                try {
                    const message = snapshot.val();

                    const userSnapshot = await db
                        .ref(`users/${message.userId}/username`)
                        .once('value');

                    const formattedMessage = {
                        userName: userSnapshot.val() || 'Anonymous',
                        message: message.message,
                        timestamp: formatTimestamp(message.timestamp),
                    };

                    io.to(roomId).emit('receiveMessage', formattedMessage);
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            });

            socket.on('disconnect', () => {
                messagesRef.off(); // Clean up Firebase listener
            });
        }

        // Firebase listeners for room members
        function listenToRoomMembers(roomId, io) {
            const membersRef = db.ref(`rooms/${roomId}/members`);

            membersRef.on('child_added', async (snapshot) => {
                try {
                    const member = snapshot.val();

                    const userSnapshot = await db
                        .ref(`users/${member.userId}/name`)
                        .once('value');

                    const formattedMember = {
                        name: userSnapshot.val() || 'Unknown',
                        timestamp: formatTimestamp(member.timestamp),
                    };

                    io.to(roomId).emit('memberChanged', formattedMember);
                } catch (error) {
                    console.error('Error processing member:', error);
                }
            });
        }

        // Utility function to clean up listeners on disconnect
        function removeListeners(socket) {
            console.log(`Removing listeners for ${userId}`);
            socket.rooms.forEach((room) => {
                db.ref(`rooms/${room}/messages`).off();
                db.ref(`rooms/${room}/members`).off();
            });
        }
    });

    return io;
}

module.exports = { userSocketMap, setupSocket };
