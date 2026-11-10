
const $ = (id) => document.getElementById(id);

let conversations = JSON.parse(localStorage.getItem("kabChats") || "[]");
let currentChat = null;

$("settingsBtn").onclick = () => {
  $("settings").classList.remove("hidden");
};

$("closeSettings").onclick = () => {
  $("settings").classList.add("hidden");
};

$("saveSettings").onclick = () => {
  sessionStorage.setItem("kabKey", $("apiKey").value.trim());
  localStorage.setItem("kabModel", $("model").value.trim());
  localStorage.setItem("kabUrl", $("baseUrl").value.trim());

  alert("تنظیمات ذخیره شد");
  $("settings").classList.add("hidden");
};

$("model").value = localStorage.getItem("kabModel") || "llama-3.3-70b-versatile";
$("baseUrl").value = localStorage.getItem("kabUrl") || "https://api.groq.com/openai/v1";

function saveChats() {
  localStorage.setItem("kabChats", JSON.stringify(conversations));
}

function renderHistory() {
  $("history").innerHTML = "";

  conversations.forEach(chat => {
    const item = document.createElement("div");
    item.style.padding = "10px";
    item.style.cursor = "pointer";
    item.textContent = "💬 " + chat.title;

    item.onclick = () => {
      currentChat = chat;
      renderMessages();
    };

    $("history").appendChild(item);
  });
}

function renderMessages() {
  $("messages").innerHTML = "";

  if (!currentChat) return;

  currentChat.messages.forEach(msg => {
    const bubble = document.createElement("div");
    bubble.style.padding = "12px";
    bubble.style.margin = "10px 0";
    bubble.style.borderRadius = "12px";
    bubble.style.background = msg.role === "user" ? "#123d75" : "#17243a";
    bubble.style.whiteSpace = "pre-wrap";
    bubble.textContent = (msg.role === "user" ? "شما: " : "کب کات: ") + msg.content;
    $("messages").appendChild(bubble);
  });

  $("messages").scrollTop = $("messages").scrollHeight;
}

$("newChat").onclick = () => {
  currentChat = {
    title: "گفتگوی جدید",
    messages: []
  };

  conversations.unshift(currentChat);
  saveChats();
  renderHistory();
  renderMessages();
};

$("deleteAll").onclick = () => {
  if (!confirm("همه گفتگوها حذف شوند؟")) return;

  conversations = [];
  currentChat = null;
  saveChats();
  renderHistory();
  $("messages").innerHTML = "<h2>به کب کات خوش آمدی 💙</h2>";
};

async function sendMessage() {
  const text = $("prompt").value.trim();

  if (!text) return;

  const apiKey = sessionStorage.getItem("kabKey");

  if (!apiKey) {
    alert("ابتدا در تنظیمات، کلید API خود را وارد کن.");
    $("settings").classList.remove("hidden");
    return;
  }

  if (!currentChat) {
    currentChat = { title: text.slice(0, 30), messages: [] };
    conversations.unshift(currentChat);
  }

  currentChat.messages.push({ role: "user", content: text });
  $("prompt").value = "";
  renderMessages();
  renderHistory();
  saveChats();

  $("send").disabled = true;
  $("send").textContent = "در حال پاسخ...";

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        model: $("model").value.trim(),
        baseUrl: $("baseUrl").value.trim(),
        messages: currentChat.messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "خطا در ارتباط با هوش مصنوعی");
    }

    const answer = data.reply || data.choices?.[0]?.message?.content;

    if (!answer) throw new Error("پاسخی دریافت نشد.");

    currentChat.messages.push({
      role: "assistant",
      content: answer
    });

  } catch (error) {
    currentChat.messages.push({
      role: "assistant",
      content: "خطا: " + error.message
    });
  }

  saveChats();
  renderMessages();
  renderHistory();

  $("send").disabled = false;
  $("send").textContent = "ارسال";
}

$("send").onclick = sendMessage;

$("prompt").addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

renderHistory();
