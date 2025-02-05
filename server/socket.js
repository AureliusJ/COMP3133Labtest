const Message = require('./models/Message'); // Import Message model

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('✅ A user connected:', socket.id);

        // ✅ Join Room & Send Previous Messages
        socket.on('joinRoom', async ({ room }) => {
            socket.join(room);
            console.log(`📢 User joined room: ${room}`);

            // ✅ Fetch previous messages from MongoDB and send to client
            const messages = await Message.find({ room }).sort({ date_sent: 1 });
            socket.emit('loadMessages', messages);
        });

        // ✅ Leave Room
        socket.on('leaveRoom', ({ room }) => {
            socket.leave(room);
            console.log(`📤 User left room: ${room}`);
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
