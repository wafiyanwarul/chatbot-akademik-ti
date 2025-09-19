// app.js
"use strict";

/**
 * Configuration object for integration readiness.
 * Modify settings in the Settings modal.
 */
const CONFIG = {
  BASE_API_URL: "https://your-backend.example.com",
  ENDPOINT_CHAT: "/api/chat",
  ENDPOINT_HEALTH: "/api/health",
  ENDPOINT_HISTORY: "/api/history",
  STREAMING: false,
  USE_WEBSOCKET: false,
  WEBSOCKET_URL: "wss://your-backend.example.com/ws",
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
  bubble.className = `message-bubble max-w-[75%] rounded-2xl p-