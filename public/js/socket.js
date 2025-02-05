const socket = io(); // ✅ Connect to Socket.io server
let currentRoom = "general";
let typingTimeout;


// ✅ Ensure user is logged in before connecting
const username = sessionStorage.getItem("username");
if (!username) {
    window.location.href = "login.html"; // ✅ Redirect to login if no username
}

// ✅ Join Default Room
socket.emit('joinRoom', { room: currentRoom, user: username });

// ✅ Function to Send Messages
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message !== "") {
        socket.emit('sendMessage', { room: currentRoom, message, user: username });

        // ✅ Remove typing notification when message is sent
        socket.emit('stopTyping', { room: currentRoom });

        messageInput.value = "";
    }
}

// ✅ Function to Add Messages to the Chat Box
function addMessageToChat(user, message, isSystem = false) {
    const chatBox = document.getElementById('chat-box');

    // ✅ Remove old typing messages before adding a new one
    if (isSystem) {
        const oldTypingMsg = document.getElementById('typing-message');
        if (oldTypingMsg) {
            chatBox.removeChild(oldTypingMsg);
        }
    }

    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${user}:</strong> ${message}`;

    // ✅ Add an ID to the typing message to prevent duplicates
    if (isSystem) {
        messageElement.id = 'typing-message';
    }

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // ✅ Auto-scroll
}

// ✅ Function to Clear Chat Box
function clearChatBox() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = "";
}

// ✅ Listen for Received Messages
socket.on('receiveMessage', (data) => {
    addMessageToChat(data.user, data.message);
});

// ✅ Function to Update Members List
socket.on('updateMembers', (members) => {
    const membersList = document.getElementById("members-list");
    membersList.innerHTML = ""; // ✅ Clear current list

    members.forEach(member => {
        const listItem = document.createElement("li");
        listItem.textContent = member;
        membersList.appendChild(listItem);
    });
});

// ✅ Load Previous Messages When Joining a Room
socket.on('loadMessages', (messages) => {
    clearChatBox(); // ✅ Clear chat before loading new room messages
    messages.forEach(msg => {
        addMessageToChat(msg.from_user, msg.message);
    });
});

// ✅ Room Join Functionality
document.getElementById("joinRoomButton").addEventListener("click", () => {
    const newRoom = document.getElementById("roomInput").value.trim();
    if (newRoom && newRoom !== currentRoom) {
        socket.emit('leaveRoom', { room: currentRoom, user: username });
        socket.emit('joinRoom', { room: newRoom, user: username });
        currentRoom = newRoom;
        document.getElementById("room-name").textContent = newRoom;
    }
});

// ✅ Leave Room Functionality (Return to "general" Room)
document.getElementById("leaveRoomButton").addEventListener("click", () => {
    socket.emit('leaveRoom', { room: currentRoom, user: username });
    currentRoom = "general";
    document.getElementById("room-name").textContent = "General";
    socket.emit('joinRoom', { room: "general", user: username });
});

// ✅ Send Message on Button Click
document.getElementById("sendButton").addEventListener("click", sendMessage);

// ✅ Typing Indicator Event
document.getElementById("messageInput").addEventListener("keypress", () => {
    socket.emit('typing', { room: currentRoom, user: "Anonymous" });

    // ✅ Prevent multiple typing indicators
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stopTyping', { room: currentRoom });
    }, 3000);
});

// ✅ Remove Typing Indicator When User Stops Typing
socket.on('stopTyping', () => {
    const typingMsg = document.getElementById('typing-message');
    if (typingMsg) {
        typingMsg.remove();
    }
});

// ✅ Typing Indicator (Show Only Once)
socket.on('userTyping', (user) => {
    addMessageToChat("System", `${user} is typing...`, true);
});
