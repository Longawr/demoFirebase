const express = require('express');
const router = express.Router();

const db = require('./config/firebase'); // Your Firebase config
const {
    successResponse,
    userErrorResponse,
    systemErrorResponse,
} = require('./config/models/response');
const findUserIdBySocketId = require('./utils/findUserIdBySocketId');

// API route to register new user
router.post('/api/users/register', async (req, res) => {
    let { userId } = req.body;

    if (userId) {
        db.ref(`users/${userId}/username`).once(
            'value',
            (snapshot) => {
                return successResponse(
                    res,
                    { userId, userName: snapshot.val() },
                    'Get data successfully',
                    201
                );
            },
            (errorObject) => {
                return systemErrorResponse(
                    res,
                    'The read failed: ' + errorObject.name,
                    500,
                    errorObject
                );
            }
        );
    } else {
        userId = `User-${Date.now()}${Math.floor(Math.random() * 1000)}`;

        try {
            // Save the user information to Firebase or in-memory map
            await db.ref(`users/${userId}`).set({ username: userId });

            console.log(`User registered: ${userId}`);
            return successResponse(
                res,
                { userId: userId, userName: userId },
                'User registered successfully',
                201
            );
        } catch (error) {
            console.error('Error registering user:', error);
            return systemErrorResponse(
                res,
                'Failed to register user',
                500,
                error
            );
        }
    }
});

// API to update the username
router.put('/api/users/changeName', async (req, res) => {
    const { newUsername, socketId } = req.body;
    const userId = findUserIdBySocketId(socketId);

    if (!newUsername || newUsername.trim() === '') {
        return userErrorResponse(
            res,
            'Username cannot be empty',
            400,
            'Username cannot be empty'
        );
    }

    try {
        // Update the username in Firebase
        await db.ref(`users/${userId}`).update({ username: newUsername });

        console.log(`Username updated: ${newUsername}`);
        return successResponse(
            res,
            { userId, newUsername },
            'Username updated successfully'
        );
    } catch (error) {
        console.error('Error updating username:', error);
        return systemErrorResponse(
            res,
            'Failed to update username',
            500,
            error
        );
    }
});

module.exports = router;
