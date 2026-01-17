const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const fileInput = document.getElementById("file-input");

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("You", message);
  userInput.value = "";

  const response = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await response.json();
  appendMessage("AI", data.reply);
}

async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) return alert("Select a file or image.");

  const formData = new FormData();
  formData.append("file", file);

  appendMessage("You", `Uploaded: ${file.name}`);

  const response = await fetch("/upload", {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  appendMessage("AI", data.reply);
}
