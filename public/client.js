const socket = io();

let name;
let textarea = document.querySelector("#textarea");
let messageArea = document.querySelector(".message_area");
let userCountElement = document.querySelector("#userCount");

do {
    name = prompt("Please enter your name: ")
} while (!name)

// Load previous messages
async function loadMessages() {
    try {
        const response = await fetch('/messages');
        const messages = await response.json();
        
        // Display messages in reverse order (oldest first)
        messages.reverse().forEach(msg => {
            const messageType = msg.sender === name ? 'outgoing' : 'incoming';
            appendMessage({
                user: msg.sender,
                message: msg.content,
                timestamp: msg.timestamp
            }, messageType);
        });
        
        scrollToBotton();
    } catch (err) {
        console.error('Error loading messages:', err);
    }
}

// Load messages when page loads
loadMessages();

textarea.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        sendMessage(e.target.value)
    }
})

function sendMessage(message) {
    let msg = {
        user: name,
        message: message.trim()
    }

    // Append

    appendMessage(msg, "outgoing");

    textarea.value = "";
    scrollToBotton();

    // Send to server
    socket.emit("message", msg);

}

function appendMessage(msg, type) {
    let mainDiv = document.createElement("div")
    let className = type
    mainDiv.classList.add(className, "message");

    let markup = `
        <h4>${msg.user}</h4>   
        <p>${msg.message}</p>
    `
    mainDiv.innerHTML = markup
    messageArea.appendChild(mainDiv)
}

// Recieve message

socket.on("message", (msg) => {
    appendMessage(msg, "incoming");
    scrollToBotton();
})

function scrollToBotton() {
    messageArea.scrollTop = messageArea.scrollHeight;
}

socket.on('userCount', (count) => {
    userCountElement.textContent = count;
});