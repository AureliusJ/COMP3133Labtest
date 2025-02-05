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

/** ✅ Function to Format Date **/
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString(); // ✅ Display date in local format
}

/** ✅ Function to Send Messages **/
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

/** ✅ Function to Send Private Messages **/
function sendPrivateMessage() {
    const toUser = document.getElementById("privateUserInput").value.trim();
    const privateMessage = document.getElementById("messageInput").value.trim();

    if (toUser !== "" && privateMessage !== "") {
        const privateRoom = [username, toUser].sort().join("_"); // ✅ Create private room ID

        socket.emit('privateMessage', {
            from_user: username,
            to_user: toUser,
            message: privateMessage,
            room: privateRoom // ✅ Private chat acts as a room
        });

        // ✅ Clear input after sending message
        document.getElementById("messageInput").value = "";
    }
}

/** ✅ Function to Add Messages to the Chat Box **/
function addMessageToChat(user, message, date_sent, isPrivate = false) {
    const chatBox = document.getElementById('chat-box');

    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${isPrivate ? "[Private] " : ""}${user}:</strong> ${message} <span class="timestamp">(${formatDate(date_sent)})</span>`;

    if (isPrivate) {
        messageElement.style.color = "red"; // ✅ Different color for private messages
    }

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // ✅ Auto-scroll
}

/** ✅ Function to Clear Chat Box **/
function clearChatBox() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = "";
}

/** ✅ Listen for Received Messages **/
socket.on('receiveMessage', (data) => {
    addMessageToChat(data.user, data.message, data.date_sent);
});

/** ✅ Listen for Received Private Messages **/
socket.on('receivePrivateMessage', (data) => {
    addMessageToChat(data.from_user, data.message, data.date_sent, true);
});

/** ✅ Update Members List **/
socket.on('updateMembers', (members) => {
    const membersList = document.getElementById("members-list");
    membersList.innerHTML = ""; // ✅ Clear current list

    members.forEach(member => {
        const listItem = document.createElement("li");
        listItem.textContent = member;
        membersList.appendChild(listItem);
    });
});

/** ✅ Load Previous Messages When Joining a Room **/
socket.on('loadMessages', (messages) => {
    clearChatBox(); // ✅ Clear chat before loading new room messages
    messages.forEach(msg => {
        addMessageToChat(msg.from_user, msg.message, msg.date_sent);
    });
});

/** ✅ Join Private Chat **/
document.getElementById("joinPrivateChatButton").addEventListener("click", () => {
    const toUser = document.getElementById("privateUserInput").value.trim();
    
    if (toUser !== "" && toUser !== username) {
        const privateRoom = [username, toUser].sort().join("_"); // ✅ Create a unique private room ID
        
        socket.emit('leaveRoom', { room: currentRoom, user: username });
        socket.emit('joinRoom', { room: privateRoom, user: username });

        currentRoom = privateRoom;
        document.getElementById("room-name").textContent = `Private Chat with ${toUser}`;
    }
});

/** ✅ Join New Room **/
document.getElementById("joinRoomButton").addEventListener("click", () => {
    const newRoom = document.getElementById("roomInput").value.trim();
    if (newRoom && newRoom !== currentRoom) {
        socket.emit('leaveRoom', { room: currentRoom, user: username });
        socket.emit('joinRoom', { room: newRoom, user: username });
        currentRoom = newRoom;
        document.getElementById("room-name").textContent = newRoom;
    }
});

/** ✅ Leave Room (Go back to general) **/
document.getElementById("leaveRoomButton").addEventListener("click", () => {
    socket.emit('leaveRoom', { room: currentRoom, user: username });
    currentRoom = "general";
    document.getElementById("room-name").textContent = "General";
    socket.emit('joinRoom', { room: "general", user: username });
});

/** ✅ Logout **/
document.getElementById("logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem("username");
    window.location.href = "login.html"; // ✅ Redirect to login
});

/** ✅ Send Message on Button Click **/
document.getElementById("sendButton").addEventListener("click", sendMessage);

/** ✅ Send Private Message on Button Click **/
document.getElementById("sendPrivateMessageButton").addEventListener("click", sendPrivateMessage);

/** ✅ Typing Indicator **/
document.getElementById("messageInput").addEventListener("keypress", () => {
    socket.emit('typing', { room: currentRoom, user: username });

    // ✅ Prevent multiple typing indicators
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stopTyping', { room: currentRoom });
    }, 3000);
});

/** ✅ Remove Typing Indicator When User Stops Typing **/
socket.on('stopTyping', () => {
    const typingMsg = document.getElementById('typing-message');
    if (typingMsg) {
        typingMsg.remove();
    }
});

/** ✅ Show Typing Indicator **/
socket.on('userTyping', (user) => {
    addMessageToChat("System", `${user} is typing...`, true);
});
