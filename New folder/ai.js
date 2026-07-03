// ═══════════════════════════════════════════════════════════════
//  INFINIA AI — Complete Workspace JavaScript
// ═══════════════════════════════════════════════════════════════

(function () {
    'use strict';

    // Fix: Localhost हटा दिया है ताकी Vercel रिलेटिव रूटिंग यूज़ करे
    const API_BASE = '';

    let currentUser = null;
    let currentMessages = []; 
    let hasGeminiKey = false; 
    let chatMode = true; 

    // --- 3D BACKGROUND (DNA Helix + Particles) ---
    (function init3D() {
        const container = document.getElementById('canvas-container');
        if(!container) return;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020610);
        scene.fog = new THREE.FogExp2(0x020610, 0.0015);
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1, 15);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        const strandGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const mat1 = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const mat2 = new THREE.MeshBasicMaterial({ color: 0xaa44ff });

        for (let i = 0; i < 60; i++) {
            const alpha = i * 0.25;
            const y = (i - 30) * 0.3;
            
            const mesh1 = new THREE.Mesh(strandGeo, mat1);
            mesh1.position.set(Math.sin(alpha) * 3, y, Math.cos(alpha) * 3);
            group.add(mesh1);

            const mesh2 = new THREE.Mesh(strandGeo, mat2);
            mesh2.position.set(Math.sin(alpha + Math.PI) * 3, y, Math.cos(alpha + Math.PI) * 3);
            group.add(mesh2);
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        function render3D() {
            requestAnimationFrame(render3D);
            group.rotation.y += 0.01;
            group.rotation.x = 0.1;
            renderer.render(scene, camera);
        }
        render3D();
    })();

    // DOM Selection Elements
    const messagesArea = document.getElementById('messages-area');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const userNameDisplay = document.getElementById('user-name-display');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Core Session Verification Gate ---
    async function checkAuth() {
        try {
            const res = await fetch(`${API_BASE}/api/auth/user`, { method: 'GET' });
            if (!res.ok) {
                window.location.href = 'index.html?toast=please_login';
                return;
            }
            currentUser = await res.json();
            if (userNameDisplay) userNameDisplay.textContent = currentUser.name;
        } catch (err) {
            window.location.href = 'index.html?toast=please_login';
        }
    }

    // --- Trigger Core Actions ---
    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
                window.location.href = 'index.html?toast=logout_success';
            } catch (err) {
                window.location.href = 'index.html?toast=logout_success';
            }
        });
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        chatInput.value = '';

        try {
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            if (response.ok) {
                appendMessage('bot', data.reply);
            } else {
                appendMessage('bot', `Error: ${data.error || 'Failed to analyze request'}`);
            }
        } catch (err) {
            appendMessage('bot', 'Network Connection Timeout. Server configuration failed.');
        }
    }

    function appendMessage(sender, text) {
        if (!messagesArea) return;
        const bubble = document.createElement('div');
        bubble.className = `message ${sender}`;
        bubble.innerHTML = `<div class="message-bubble">${escapeHtml(text)}</div>`;
        messagesArea.appendChild(bubble);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function showToast(msg, isError = false) {
        alert(msg);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // Run auth check automatically on startup
    checkAuth();
})();
