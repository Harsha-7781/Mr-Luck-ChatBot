const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const typing = document.getElementById("typing");
const chatList = document.getElementById("chat-list");
const newChatBtn = document.getElementById("new-chat");

let chats = JSON.parse(localStorage.getItem("chats")) || [];
let currentChatId = localStorage.getItem("currentChatId");

// Create new chat
function createChat() {
    const chat = {
        id: Date.now(),
        title: "New Chat",
        messages: []
    };
    chats.unshift(chat);
    currentChatId = chat.id;
    save();
    renderChats();
    renderMessages();
}

function save() {
    localStorage.setItem("chats", JSON.stringify(chats));
    localStorage.setItem("currentChatId", currentChatId);
}

function renderChats() {
    chatList.innerHTML = "";
    chats.forEach(c => {
        const div = document.createElement("div");
        div.className = "chat-item" + (c.id == currentChatId ? " active" : "");
        div.innerText = c.title;
        div.onclick = () => {
            currentChatId = c.id;
            save();
            renderChats();
            renderMessages();
        };
        chatList.appendChild(div);
    });
}

function renderMessages() {
    chatBox.innerHTML = "";
    const chat = chats.find(c => c.id == currentChatId);
    if (!chat) return;

    chat.messages.forEach(m => {
        const div = document.createElement("div");
        div.className = "message " + m.sender;
        
        // Parse markdown
        const parsedHTML = marked.parse(m.text);
        
        // Create a container for the content
        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";
        contentDiv.innerHTML = parsedHTML;
        
        // Append to the message div
        div.appendChild(contentDiv);
        
        chatBox.appendChild(div);
    });
    
    chatBox.scrollTop = chatBox.scrollHeight;
    enhanceCodeBlocks();
}

function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    const chat = chats.find(c => c.id == currentChatId);

    chat.messages.push({ sender: "user", text: msg });
    if (chat.title === "New Chat") chat.title = msg.slice(0, 20);

    input.value = "";
    typing.style.display = "block";
    save();
    renderChats();
    renderMessages();

    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
    })
    .then(res => res.json())
    .then(data => {
        typing.style.display = "none";
        chat.messages.push({ sender: "bot", text: data.response });
        save();
        renderMessages();
    });
}

sendBtn.onclick = sendMessage;

input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

newChatBtn.onclick = createChat;

// INIT
if (!chats.length) createChat();
renderChats();
renderMessages();

const shareBtn = document.getElementById("share-btn");

shareBtn.onclick = () => {
    const chat = chats.find(c => c.id == currentChatId);
    if (!chat || !chat.messages.length) {
        alert("Nothing to share yet!");
        return;
    }

    const text = chat.messages
        .map(m => `${m.sender === "user" ? "You" : "Mr.Luck"}: ${m.text}`)
        .join("\n\n");

    navigator.clipboard.writeText(text)
        .then(() => alert("Chat copied to clipboard!"))
        .catch(() => alert("Failed to copy"));
};
const searchInput = document.getElementById("search-chat");

searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    chatList.innerHTML = "";

    chats
      .filter(c => c.title.toLowerCase().includes(q))
      .forEach(c => {
        const div = document.createElement("div");
        div.className = "chat-item" + (c.id == currentChatId ? " active" : "");
        div.innerText = c.title;
        div.onclick = () => {
            currentChatId = c.id;
            save();
            renderChats();
            renderMessages();
        };
        chatList.appendChild(div);
      });
});

document.getElementById("delete-chat").onclick = () => {
    if (!confirm("Delete this chat?")) return;

    chats = chats.filter(c => c.id != currentChatId);
    currentChatId = chats.length ? chats[0].id : null;

    save();
    renderChats();
    renderMessages();
};

shareBtn.onclick = () => {
    const chat = chats.find(c => c.id == currentChatId);
    if (!chat) return;

    const encoded = btoa(JSON.stringify(chat));
    const link = `${location.origin}?share=${encoded}`;

    navigator.clipboard.writeText(link)
        .then(() => alert("Public link copied!"))
        .catch(() => alert("Copy failed"));
};

function enhanceCodeBlocks() {
    document.querySelectorAll(".message pre").forEach(pre => {
        if (pre.parentElement.classList.contains("code-wrapper")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "code-wrapper";

        const btn = document.createElement("button");
        btn.className = "copy-btn";
        btn.innerText = "Copy";

        btn.onclick = () => {
            navigator.clipboard.writeText(pre.innerText);
            btn.innerText = "Copied!";
            setTimeout(() => btn.innerText = "Copy", 1500);
        };

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(btn);
        wrapper.appendChild(pre);
    });
}
