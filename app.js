// app.js
"use strict";

/**
 * Configuration object for integration readiness.
 * Modify settings in the Settings modal.
 */
const CONFIG = {
  BASE_API_URL: "http://127.0.0.1:8000",
  ENDPOINT_CHAT: "/api/chat",
  ENDPOINT_HEALTH: "/api/health",
  ENDPOINT_HISTORY: "/api/history", // kalau belum ada, bisa abaikan
  STREAMING: false,
  USE_WEBSOCKET: false,
  WEBSOCKET_URL: "ws://127.0.0.1:8000/ws",
  MAX_CONTEXT_DOCS: 3,
};

// DOM Elements
const chatArea = document.getElementById("chat-area");
const formComposer = document.getElementById("form-composer");
const inputMessage = document.getElementById("input-message");
const btnSend = document.getElementById("btn-send");
const typingIndicator = document.getElementById("typing-indicator");
const toastContainer = document.getElementById("toast-container");
const btnScrollBottom = document.getElementById("btn-scroll-bottom");
const emptyState = document.getElementById("empty-state");
const statusChip = document.getElementById("status-chip");
const btnSettings = document.getElementById("btn-settings");
const modalSettings = document.getElementById("modal-settings");
const formSettings = document.getElementById("form-settings");
const inputBaseApi = document.getElementById("input-base-api");
const inputStreaming = document.getElementById("input-streaming");
const inputUseWebSocket = document.getElementById("input-use-websocket");
const btnCancelSettings = document.getElementById("btn-cancel-settings");

// State
let chatHistory = [];
let isTyping = false;
let networkStatus = "connecting"; // connecting, online, offline

/**
 * Utility: debounce function
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Utility: Escape HTML to prevent XSS
 * @param {string} unsafe
 * @returns {string}
 */
function escapeHTML(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Utility: Format timestamp to HH:mm
 * @param {Date} date
 * @returns {string}
 */
function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Show toast notification
 * @param {string} message
 * @param {"success"|"error"|"info"} type
 * @param {number} duration ms
 */
function showToast(message, type = "info", duration = 4000) {
  const toast = document.createElement("div");
  toast.className = `max-w-full rounded-xl px-4 py-2 shadow-lg text-sm font-mono select-none pointer-events-auto ${
    type === "success"
      ? "bg-cyan-600 text-white"
      : type === "error"
      ? "bg-red-600 text-white"
      : "bg-slate-700 text-slate-200"
  }`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "transition-opacity");
    toast.addEventListener("transitionend", () => toast.remove());
  }, duration);
}

/**
 * Scroll chat area to bottom smoothly or instantly based on prefers-reduced-motion
 */
function scrollToBottom() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  chatArea.scrollTo({
    top: chatArea.scrollHeight,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

/**
 * Update scroll-to-bottom button visibility
 */
function updateScrollButtonVisibility() {
  const threshold = 100;
  const atBottom =
    chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight < threshold;
  btnScrollBottom.classList.toggle("hidden", atBottom);
}

/**
 * Create a message bubble element
 * @param {Object} params
 * @param {"user"|"bot"} params.sender
 * @param {string} params.text
 * @param {Date} params.timestamp
 * @param {Array<{title:string,url:string,snippet:string}>} [params.sources]
 * @returns {HTMLElement}
 */
function createMessageBubble({ sender, text, timestamp, sources = [] }) {
  const bubble = document.createElement("article");
  bubble.className = `message-bubble max-w-[75%] rounded-2xl p-4 relative break-words whitespace-pre-wrap font-sans text-sm leading-relaxed select-text ${
    sender === "user"
      ? "self-end bg-[rgba(37,99,235,0.15)] text-cyan-300 message-bubble user shadow-[0_0_8px_rgba(37,99,235,0.6)]"
      : "self-start bg-[rgba(15,23,42,0.6)] text-slate-300 shadow-md border border-white/10"
  }`;

  // Container for text and copy button
  const contentWrapper = document.createElement("div");
  contentWrapper.className = "relative";

  // Sanitize and insert text with code blocks styled
  // We'll replace ```code``` blocks with <pre><code> for styling
  // Simple regex-based markdown code block detection
  const htmlText = escapeHTML(text)
    .replace(
      /```([\s\S]*?)```/g,
      (_, code) =>
        `<pre tabindex="0" class="rounded-md"><code>${escapeHTML(code.trim())}</code></pre>`
    )
    .replace(/\n/g, "<br />");

  contentWrapper.innerHTML = htmlText;

  // Copy to clipboard button
  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className =
    "copy-btn absolute top-1 right-1 text-cyan-400 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded p-1";
  copyBtn.setAttribute("aria-label", "Salin pesan ke clipboard");
  copyBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 16h8M8 12h8m-6 8h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6a2 2 0 002 2zM8 8V6a2 2 0 012-2h6a2 2 0 012 2v2" />
    </svg>
  `;
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Pesan disalin ke clipboard", "success", 2000);
      copyBtn.focus();
    });
  });

  contentWrapper.appendChild(copyBtn);
  bubble.appendChild(contentWrapper);

  // Sources section (for bot only)
  if (sender === "bot" && Array.isArray(sources) && sources.length > 0) {
    const sourcesEl = renderSources(sources);
    bubble.appendChild(sourcesEl);
  }

  // Timestamp
  const timeEl = document.createElement("time");
  timeEl.className =
    "absolute bottom-1 right-3 text-[10px] font-mono text-slate-400 select-none";
  timeEl.dateTime = timestamp.toISOString();
  timeEl.textContent = formatTimestamp(timestamp);
  bubble.appendChild(timeEl);

  return bubble;
}

/**
 * Render sources list element
 * @param {Array<{title:string,url:string,snippet:string}>} sources
 * @returns {HTMLElement}
 */
function renderSources(sources) {
  const container = document.createElement("section");
  container.className =
    "mt-3 pt-3 border-t border-white/10 text-xs text-slate-400 space-y-2";

  const title = document.createElement("h3");
  title.textContent = "Sumber:";
  title.className = "font-semibold text-cyan-400 mb-1";
  container.appendChild(title);

  const list = document.createElement("ul");
  list.className = "list-disc list-inside space-y-1";

  sources.slice(0, CONFIG.MAX_CONTEXT_DOCS).forEach(({ title, url, snippet }) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = title || url;
    a.className =
      "underline hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded";

    li.appendChild(a);

    if (snippet) {
      const snippetEl = document.createElement("p");
      snippetEl.className = "mt-0.5 text-xs text-slate-500 italic";
      snippetEl.textContent = snippet;
      li.appendChild(snippetEl);
    }

    list.appendChild(li);
  });

  container.appendChild(list);
  return container;
}

/**
 * Render entire chat history to UI
 */
function renderChatHistory() {
  chatArea.innerHTML = "";
  if (chatHistory.length === 0) {
    emptyState.style.display = "flex";
  } else {
    emptyState.style.display = "none";
    chatHistory.forEach((msg) => {
      const bubble = createMessageBubble(msg);
      chatArea.appendChild(bubble);
    });
  }
  scrollToBottom();
  updateScrollButtonVisibility();
}

/**
 * Save chat history to localStorage
 */
function saveChatToLocal() {
  try {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  } catch {
    // ignore quota errors
  }
}

/**
 * Load chat history from localStorage
 */
function loadChatFromLocal() {
  try {
    const data = localStorage.getItem("chatHistory");
    if (data) {
      chatHistory = JSON.parse(data);
    }
  } catch {
    chatHistory = [];
  }
}

/**
 * Save config to localStorage
 */
function saveConfigToLocal() {
  try {
    localStorage.setItem("chatConfig", JSON.stringify(CONFIG));
  } catch {
    // ignore
  }
}

/**
 * Load config from localStorage
 */
function loadConfigFromLocal() {
  try {
    const data = localStorage.getItem("chatConfig");
    if (data) {
      const parsed = JSON.parse(data);
      Object.assign(CONFIG, parsed);
    }
  } catch {
    // ignore
  }
}

/**
 * Update status chip text and color
 * @param {"connecting"|"online"|"offline"} status
 */
function updateStatusChip(status) {
  networkStatus = status;
  switch (status) {
    case "online":
      statusChip.textContent = "Online";
      statusChip.className =
        "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-mono bg-cyan-700 text-cyan-300 shadow-[0_0_8px_rgba(37,99,235,0.7)] select-none pointer-events-none";
      break;
    case "offline":
      statusChip.textContent = "Offline";
      statusChip.className =
        "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-mono bg-red-700 text-red-300 shadow-[0_0_8px_rgba(220,38,38,0.7)] select-none pointer-events-none";
      break;
    default:
      statusChip.textContent = "Connecting...";
      statusChip.className =
        "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-mono bg-black/50 text-cyan-400 shadow-[0_0_8px_rgba(37,99,235,0.7)] select-none pointer-events-none";
  }
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
  isTyping = true;
  typingIndicator.style.opacity = "1";
  typingIndicator.style.pointerEvents = "auto";
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
  isTyping = false;
  typingIndicator.style.opacity = "0";
  typingIndicator.style.pointerEvents = "none";
}

/**
 * Send user message and handle bot response
 * @param {string} text
 */
async function sendMessage(text) {
  if (!text.trim()) return;

  // Add user message immediately
  const userMsg = {
    sender: "user",
    text: text.trim(),
    timestamp: new Date(),
  };
  chatHistory.push(userMsg);
  renderChatHistory();
  saveChatToLocal();

  // Clear input and disable send button
  inputMessage.value = "";
  btnSend.disabled = true;

  // Show typing indicator
  showTypingIndicator();

  // Prepare request payload
  const payload = { query: text.trim() };

  try {
    const response = await fetch(CONFIG.BASE_API_URL + CONFIG.ENDPOINT_CHAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    // Validate response shape
    if (
      typeof data.answer !== "string" ||
      !Array.isArray(data.sources) ||
      typeof data.usage !== "object"
    ) {
      throw new Error("Invalid response format");
    }

    // Add bot message
    const botMsg = {
      sender: "bot",
      text: data.answer,
      timestamp: new Date(),
      sources: data.sources,
    };
    chatHistory.push(botMsg);
    renderChatHistory();
    saveChatToLocal();

    showToast(`Response received in ${data.usage.latency_ms} ms`, "success", 2500);
    updateStatusChip("online");
  } catch (err) {
    // On error, mock a delayed bot response for demo
    console.warn("Fetch failed, using mock response:", err);
    updateStatusChip("offline");
    showToast("Gagal menghubungi server, menggunakan demo offline.", "error", 4000);

    setTimeout(() => {
      const mockAnswer =
        "Maaf, saat ini server tidak tersedia. Ini adalah jawaban demo.\n\nSilakan coba lagi nanti.";
      const botMsg = {
        sender: "bot",
        text: mockAnswer,
        timestamp: new Date(),
        sources: [],
      };
      chatHistory.push(botMsg);
      renderChatHistory();
      saveChatToLocal();
      hideTypingIndicator();
    }, 1500);
    return;
  } finally {
    hideTypingIndicator();
  }
}

/**
 * Connect WebSocket (stub)
 */
function connectWebSocket() {
  // TODO: Implement WebSocket connection if CONFIG.USE_WEBSOCKET === true
  // This is a stub for future feature
}

/**
 * Health check ping backend on load and update status chip
 */
async function healthCheck() {
  try {
    const res = await fetch(CONFIG.BASE_API_URL + CONFIG.ENDPOINT_HEALTH, {
      method: "GET",
      cache: "no-store",
    });
    if (res.ok) {
      updateStatusChip("online");
    } else {
      updateStatusChip("offline");
    }
  } catch {
    updateStatusChip("offline");
  }
}

/**
 * Open settings modal and populate inputs
 */
function openSettingsModal() {
  inputBaseApi.value = CONFIG.BASE_API_URL;
  inputStreaming.checked = CONFIG.STREAMING;
  inputUseWebSocket.checked = CONFIG.USE_WEBSOCKET;
  modalSettings.classList.remove("opacity-0", "pointer-events-none");
  // Focus first input for accessibility
  inputBaseApi.focus();
}

/**
 * Close settings modal
 */
function closeSettingsModal() {
  modalSettings.classList.add("opacity-0", "pointer-events-none");
  btnSettings.focus();
}

/**
 * Handle settings form submission
 * @param {Event} e
 */
function onSettingsSave(e) {
  e.preventDefault();
  const baseApiUrl = inputBaseApi.value.trim();
  if (!baseApiUrl) {
    inputBaseApi.focus();
    showToast("Base API URL tidak boleh kosong", "error", 3000);
    return;
  }
  CONFIG.BASE_API_URL = baseApiUrl;
  CONFIG.STREAMING = inputStreaming.checked;
  CONFIG.USE_WEBSOCKET = inputUseWebSocket.checked;

  saveConfigToLocal();
  showToast("Pengaturan disimpan", "success", 2500);
  closeSettingsModal();
  healthCheck();
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
  // Enable/disable send button based on input
  inputMessage.addEventListener("input", () => {
    btnSend.disabled = !inputMessage.value.trim();
    autoResizeTextarea(inputMessage);
  });

  // Auto resize textarea on input
  function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }
  autoResizeTextarea(inputMessage);

  // Submit form on button or Ctrl/Cmd+Enter
  formComposer.addEventListener("submit", (e) => {
    e.preventDefault();
    if (btnSend.disabled) return;
    sendMessage(inputMessage.value);
  });

  inputMessage.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!btnSend.disabled) {
        sendMessage(inputMessage.value);
      }
    }
  });

  // Scroll event to toggle scroll-to-bottom button
  chatArea.addEventListener("scroll", debounce(updateScrollButtonVisibility, 100));

  // Scroll to bottom button click
  btnScrollBottom.addEventListener("click", () => {
    scrollToBottom();
    btnScrollBottom.classList.add("hidden");
  });

  // Settings button open modal
  btnSettings.addEventListener("click", openSettingsModal);

  // Cancel settings modal
  btnCancelSettings.addEventListener("click", closeSettingsModal);

  // Close modal on outside click or Escape key
  modalSettings.addEventListener("click", (e) => {
    if (e.target === modalSettings) closeSettingsModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalSettings.classList.contains("opacity-0")) {
      closeSettingsModal();
    }
  });
}
  // Settings (soon)