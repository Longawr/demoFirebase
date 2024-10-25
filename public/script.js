let socket = null;
let currentRoom = '';
let usernameInput = null;

const roomInputSection = document.getElementById('room-input-section');
const chatSection = document.getElementById('chat-section');
const roomNameInput = document.getElementById('room-name-input');
const joinRoomBtn = document.getElementById('join-room-btn');
const leaveRoomBtn = document.getElementById('leave-room-btn');
const roomNameDisplay = document.getElementById('room-name-display');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const usernameDisplay = document.getElementById('username-display');

// Double-click event to replace the span with an input field
usernameDisplay.addEventListener('dblclick', handlerEditableUsernameEvent);

// Handle blur and 'Enter' events on the input field
document.addEventListener('click', (e) => {
    if (usernameInput && !usernameInput.contains(e.target)) {
        handlerChangeUsernameEvent(); // Save on blur
    }
});

document.addEventListener('keydown', (e) => {
    if (usernameInput && e.key === 'Enter') {
        handlerChangeUsernameEvent(); // Save on Enter key press
    }
});

// Xử lý khi nhấn Join Room
joinRoomBtn.addEventListener('click', handlerJoinRoomEvent);
roomNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handlerJoinRoomEvent();
});

// Xử lý khi nhấn Leave Room
leaveRoomBtn.addEventListener('click', handlerLeaveRoomEvent);

// Xử lý khi send message
sendMessageBtn.addEventListener('click', handlerSendMessageEvent);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handlerSendMessageEvent();
});

function handlerEditableUsernameEvent() {
    const currentName = usernameDisplay.textContent;

    // Create an input element if it doesn't exist
    if (!usernameInput) {
        usernameInput = document.createElement('input');
        usernameInput.id = 'usernameInput';
        usernameInput.type = 'text';
        usernameInput.value = currentName;
        usernameDisplay.replaceWith(usernameInput);
        usernameInput.focus(); // Focus on the input field
        usernameInput.select();
    }
}

// Handle input blur or 'Enter' key press to save the new username
async function handlerChangeUsernameEvent() {
    const newName = usernameInput.value.trim();

    if (newName && newName !== usernameDisplay.textContent) {
        // Send the updated name to the backend
        try {
            const response = await fetch(`/api/users/changeName`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newUsername: newName,
                    socketId: socket.id,
                }),
            });

            if (!response.ok) {
                showError('Failed to register user');
                return;
            }
        } catch (error) {
            showError('Error registering user');
        }
    }

    // Replace the input field with the span and update the text
    usernameDisplay.textContent = newName || usernameDisplay.textContent;
    usernameInput.replaceWith(usernameDisplay);
    usernameInput = null; // Reset the input reference
}

function handlerJoinRoomEvent() {
    const roomName = roomNameInput.value.trim();
    if (!roomName) return alert('Please enter a room name.');
    currentRoom = roomName;

    // Emit joinRoom event
    socket.emit('joinRoom', currentRoom); // Join or create room

    roomNameDisplay.textContent = `Room: ${currentRoom}`;
    roomInputSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
}

function handlerSendMessageEvent() {
    const message = messageInput.value.trim();
    const roomId = roomNameInput.value.trim();

    if (!message) return alert('Message cannot be empty');

    // Emit the sendMessage event with roomId and message
    socket.emit('sendMessage', { roomId, message });

    messageInput.value = ''; // Clear input field
}

function handlerLeaveRoomEvent() {
    currentRoom = '';
    roomInputSection.classList.remove('hidden');
    messagesContainer.innerHTML =
        '<p class="no-messages-text">Hiện chưa có tin nhắn</p>';
    chatSection.classList.add('hidden');
    roomNameInput.value = '';
}

// Utility function to sanitize input to prevent XSS attacks
function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

function displayMessage({ userName, message, timestamp }) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    messageElement.innerHTML = `
        <span class="message-meta">[${timestamp}] <strong>${userName}</strong>:</span>
        <span class="message-text">${sanitizeHTML(message)}</span>
    `;

    messagesContainer.appendChild(messageElement);

    // Remove the "no messages" text if it exists
    const noMessagesText = document.querySelector('.no-messages-text');
    if (noMessagesText) noMessagesText.remove();

    // Scroll to the latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showError(message) {
    const errorMessageDiv = document.getElementById('error-message');
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');
    setTimeout(() => {
        errorMessageDiv.classList.add('hidden');
    }, 3000); // Hide after 3 seconds
}

// Register the new user through the API
async function registerUser(userId) {
    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            showError('Failed to register user');
            return;
        }

        const { data } = await response.json();
        console.log(`Registered as ${data.userName}`);
        return data;
    } catch (error) {
        console.error('Error registering user:', error);
    }
}

// Connect to the socket server and authenticate the user
function connectSocket(userId) {
    const socketUrl = 'http://localhost:3000'; // Your backend URL

    // Connect to Socket.IO server with userId as query parameter
    socket = io(socketUrl, { query: { userId } });

    // When socket connects
    socket.on('connect', () => {
        console.log(`${userId} connected to socket with id: ${socket.id}`);
    });

    // Listen for incoming messages
    socket.on('receiveMessage', ({ userName, message, timestamp }) => {
        displayMessage({ userName, message, timestamp });
    });

    // Listen for member
    socket.on('memberChanged', ({ name, timestamp }) => {});

    socket.on('error', ({ message }) => showError(message));
}

// Register the user and connect to socket when page loads
document.addEventListener('DOMContentLoaded', async () => {
    let userId = localStorage.getItem('user-id');
    console.log(userId);
    const data = await registerUser(userId);
    if (!userId) {
        userId = data.userId;
        localStorage.setItem('user-id', userId);
    }

    usernameDisplay.textContent = data.userName || 'Anonymous';
    connectSocket(userId);
});
