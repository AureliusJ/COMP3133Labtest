const Message = require('./models/Message'); // Import Message model

const activeUsers = {}; // ✅ Track active users in rooms

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('✅ A user connected:', socket.id);

     // ✅ Join Room & Send Previous Messages
     socket.on('joinRoom', async ({ room, user }) => {
        if (!user) return; // ✅ Ensure a username is provided

        socket.join(room);
        console.log(`📢 ${user} joined room: ${room}`);

            // ✅ Add user to active room members
            if (!activeUsers[room]) {
                activeUsers[room] = new Set();
            }
            activeUsers[room].add(user);

            // ✅ Send updated members list to all clients in the room
            io.to(room).emit('updateMembers', Array.from(activeUsers[room]));
     

            // ✅ Fetch previous messages from MongoDB and send to client
            const messages = await Message.find({ room }).sort({ date_sent: 1 });
            socket.emit('loadMessages', messages);
        });

       // ✅ Leave Room
       socket.on('leaveRoom', ({ room, user }) => {
        if (!user) return;
        
        socket.leave(room);
        console.log(`📤 ${user} left room: ${room}`);

         // ✅ Remove user from active members
         if (activeUsers[room]) {
            activeUsers[room].delete(user);
            io.to(room).emit('updateMembers', Array.from(activeUsers[room])); // Update client UI
        }
    });

    
        // ✅ Send Message & Save to DB
        socket.on('sendMessage', async ({ room, message, user }) => {
            const newMessage = new Message({ room, message, from_user: user });
            await newMessage.save();

            io.to(room).emit('receiveMessage', { user, message });
        });

        // ✅ Typing Indicator
        socket.on('typing', ({ room, user }) => {
            socket.to(room).emit('userTyping', user);
        });

        // ✅ Stop Typing Indicator
        socket.on('stopTyping', ({ room }) => {
            socket.to(room).emit('stopTyping');
        });

        // ✅ Handle Disconnect
        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.id);
        });
    });
};
