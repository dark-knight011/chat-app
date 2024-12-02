const express = require("express");
const app = express();
const http = require("http").createServer(app);
const mongoose = require("mongoose");
const Message = require("./models/Message");
require('dotenv').config();

const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.set('strictQuery', false);
const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error("MongoDB connection URI is not defined. Please set the MONGODB_URI environment variable.");
}
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

http.listen(port, () => {
    console.log(`Listening to port ${port}`);
});

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// Add route to get previous messages
app.get("/messages", async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Error fetching messages" });
    }
});

// Socket
const io = require("socket.io")(http);

let activeUsers = 0;

io.on("connection", async (socket) => {
    console.log("connected");
    
    // Increment user count
    activeUsers++;
    io.emit('userCount', activeUsers);

    socket.on("disconnect", () => {
        // Decrement user count
        activeUsers--;
        io.emit('userCount', activeUsers);
    });

    socket.on("message", async (msg) => {
        try {
            // Save message to database
            const message = new Message({
                content: msg.message,
                sender: msg.user
            });
            await message.save();
            
            // Broadcast to other clients
            socket.broadcast.emit("message", msg);
        } catch (err) {
            console.error("Error saving message:", err);
        }
    });
});