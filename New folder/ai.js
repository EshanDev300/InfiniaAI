// ai.js — Core AI Workspace Interface Client Module
(function () {
    'use strict';

    const messagesArea = document.getElementById('messages-area');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const logoutBtn = document.getElementById('logout-btn');

    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (!data.ok) {
                window.location.href = 'index.html?toast=please_login';
            }
        } catch (err) {
            window.location.href = 'index.html?toast=please_login';
        }
    }

    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = 'index.html?toast=logout_success';
        });
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendBubble('user', text);
        chatInput.value = '';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            if (response.ok) {
                appendBubble('bot', data.reply);
            } else {
                appendBubble('bot', `Error: ${data.error || 'Request processing failure.'}`);
            }
        } catch (err) {
            appendBubble('bot', 'Network interface connection timeout.');
        }
    }

    function appendBubble(sender, text) {
        if (!messagesArea) return;
        const bubble = document.createElement('div');
        bubble.className = `message ${sender}`;
        bubble.innerHTML = `<div class="message-bubble">${text}</div>`;
        messagesArea.appendChild(bubble);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    checkAuth();
})();
