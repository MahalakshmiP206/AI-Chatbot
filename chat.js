const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let typingIndicator;

// API Config
const API_KEY = "AIzaSyDJc5AYRnf2-vimpmZgPNC20DwrKCET32Y";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const loadLocalstorageData = () => {
  const savedChats = localStorage.getItem("savedChats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";

  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
  chatList.innerHTML = savedChats || "";
  document.body.classList.toggle("hide-header", !!savedChats);
  chatList.scrollTo(0, chatList.scrollHeight);
};

loadLocalstorageData();

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;
  clearTypingIndicator();

  const interval = setInterval(() => {
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    if (currentWordIndex === words.length) {
      clearInterval(interval);
      localStorage.setItem("savedChats", chatList.innerHTML);
    }
    chatList.scrollTo(0, chatList.scrollHeight);
  }, 60);
};

const clearTypingIndicator = () => {
  if (typingIndicator) typingIndicator.remove();
  typingIndicator = null;
};

const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");
  showGeminiTyping();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });

    const data = await response.json();
    const apiResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.replace(
        /\*\*(.*?)\*\*/g,
        "$1"
      ) || "No response";

    clearTypingIndicator();
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    clearTypingIndicator();
    console.error("API Error:", error);
    textElement.innerText = "⚠️ Failed to get response.";
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

const showGeminiTyping = () => {
  typingIndicator = document.createElement("p");
  typingIndicator.className = "typing-indicator";
  typingIndicator.innerText = "Gemini is typing...";
  chatList.appendChild(typingIndicator);
  chatList.scrollTo(0, chatList.scrollHeight);
};

const showLoadingAnimation = () => {
  const html = `
    <div class="message-content">
      <img src="images/gemini.svg" alt="Gemini" class="avatar">
      <p class="text"></p>
    </div>
    <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>
  `;
  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);
  addTimestamp(incomingMessageDiv);
  chatList.scrollTo(0, chatList.scrollHeight);
  generateAPIResponse(incomingMessageDiv);
};

const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done";
  setTimeout(() => (copyIcon.innerText = "content_copy"), 1000);
};

const addTimestamp = (element) => {
  const timestamp = document.createElement("div");
  const now = new Date();
  timestamp.className = "timestamp";
  timestamp.innerText = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  element.appendChild(timestamp);
};

const handleOutgoingChat = () => {
  userMessage =
    typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage) return;

  const html = `
    <div class="message-content">
      <img src="images/user.jpg" alt="User" class="avatar">
      <p class="text">${userMessage}</p>
    </div>
  `;
  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  chatList.appendChild(outgoingMessageDiv);
  addTimestamp(outgoingMessageDiv);

  typingForm.reset();
  document.body.classList.add("hide-header");
  chatList.scrollTo(0, chatList.scrollHeight);
  setTimeout(showLoadingAnimation, 500);
};

suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all messages?")) {
    localStorage.removeItem("savedChats");
    loadLocalstorageData();
  }
});

typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});
