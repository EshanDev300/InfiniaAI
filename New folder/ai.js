// ═══════════════════════════════════════════════════════════════
//  INFINIA AI — Complete Workspace JavaScript
//  Features: 3D BG, Session Gate, Gemini API, Chat History,
//            Library, Projects, Prompt Suggestions, Mobile Sidebar
// ═══════════════════════════════════════════════════════════════

(function () {
    'use strict';

    // ── API Base ────────────────────────────────────────────────
    const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

    // ── Global User State ───────────────────────────────────────
    let currentUser = null;
    let currentMessages = []; // messages in current chat session
    let hasGeminiKey = false; // whether the backend has a valid Gemini key
    let chatMode = true; // whether user is in an active chat (can type)

    // ════════════════════════════════════════════════════════════
    //  3D BACKGROUND (DNA Helix + Particles)
    // ════════════════════════════════════════════════════════════
    (function init3D() {
        const container = document.getElementById('canvas-container');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020610);
        scene.fog = new THREE.FogExp2(0x020610, 0.0015);
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1.5, 14);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0x111122);
        scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0x88aaff, 1);
        dirLight.position.set(2, 5, 3);
        scene.add(dirLight);
        const backLight = new THREE.PointLight(0xff44aa, 0.5);
        backLight.position.set(-2, 1, -5);
        scene.add(backLight);

        // DNA Helix
        const dnaGroup = new THREE.Group();
        const sphereMat  = new THREE.MeshStandardMaterial({ color: 0x33ccff, emissive: 0x0066aa, metalness: 0.7 });
        const sphereMat2 = new THREE.MeshStandardMaterial({ color: 0xff44cc, emissive: 0x550033 });
        const helixRadius = 1.2, turns = 2.5, segments = 60;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 2 * turns;
            const y = (t - 0.5) * 5;
            const x1 = Math.cos(angle) * helixRadius, z1 = Math.sin(angle) * helixRadius;
            const x2 = Math.cos(angle + Math.PI) * helixRadius, z2 = Math.sin(angle + Math.PI) * helixRadius;
            const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), sphereMat);
            s1.position.set(x1, y, z1);
            const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), sphereMat2);
            s2.position.set(x2, y, z2);
            dnaGroup.add(s1, s2);
            if (i < segments) {
                const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1,y,z1), new THREE.Vector3(x2,y,z2)]);
                dnaGroup.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x33aaff })));
            }
        }
        dnaGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5.2, 8), new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0088aa })));
        scene.add(dnaGroup);

        // Floating shapes
        const shapes = [];
        for (let i = 0; i < 50; i++) {
            const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshStandardMaterial({ color: 0xaa55ff, emissive: 0x331166 }));
            mesh.position.set((Math.random()-0.5)*12, (Math.random()-0.5)*7, (Math.random()-0.5)*10-5);
            mesh.userData = { sx: (Math.random()-0.5)*0.005, sy: (Math.random()-0.5)*0.005, r: 0.01 };
            scene.add(mesh); shapes.push(mesh);
        }

        // Particles
        const pCount = 1800;
        const pos = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount; i++) { pos[i*3]=(Math.random()-0.5)*28; pos[i*3+1]=(Math.random()-0.5)*16; pos[i*3+2]=(Math.random()-0.5)*20-6; }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x44aaff, size: 0.045, transparent: true, blending: THREE.AdditiveBlending }));
        scene.add(particles);

        // Rings
        const ringGeo = new THREE.TorusGeometry(2.2, 0.06, 32, 200);
        const ring1 = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: 0xff44aa, emissive: 0x552233 }));
        ring1.rotation.x = Math.PI / 2; scene.add(ring1);
        const ring2 = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: 0x00ccff, emissive: 0x004466 }));
        ring2.rotation.z = Math.PI / 3; ring2.rotation.x = 0.8; scene.add(ring2);

        let time = 0;
        function animate() {
            requestAnimationFrame(animate);
            time += 0.008;
            dnaGroup.rotation.y = time * 0.2;
            dnaGroup.rotation.x = Math.sin(time * 0.3) * 0.1;
            ring1.rotation.z += 0.005;
            ring2.rotation.y += 0.003;
            ring2.rotation.x += 0.002;
            particles.rotation.y += 0.0003;
            shapes.forEach(obj => {
                obj.position.x += obj.userData.sx;
                obj.position.y += obj.userData.sy;
                if (Math.abs(obj.position.x) > 9) obj.userData.sx *= -1;
                if (Math.abs(obj.position.y) > 6) obj.userData.sy *= -1;
                obj.rotation.x += obj.userData.r;
                obj.rotation.y += obj.userData.r;
            });
            camera.lookAt(0, 0.2, 0);
            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    })();

    // ════════════════════════════════════════════════════════════
    //  UTILITIES
    // ════════════════════════════════════════════════════════════
    function showToast(msg, isError = false) {
        const old = document.querySelector('.toast-msg');
        if (old) old.remove();
        const t = document.createElement('div');
        t.className = 'toast-msg' + (isError ? ' error' : '');
        const icon = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
        t.innerHTML = `<i class="${icon}" style="margin-right:8px;"></i>${msg}`;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; t.style.transition = '0.4s'; setTimeout(() => t.remove(), 400); }, 3200);
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // ════════════════════════════════════════════════════════════
    //  SESSION GATE — strict MySQL session check
    // ════════════════════════════════════════════════════════════
    async function initSession() {
        try {
            // Check server config for Gemini key
            try {
                const configRes = await fetch(`${API_BASE}/api/config`, { credentials: 'include' });
                const configData = await configRes.json();
                hasGeminiKey = !!configData.hasGeminiKey;
            } catch (err) {
                console.warn('[CONFIG CHECK] Could not check config.', err);
                hasGeminiKey = false;
            }

            const res  = await fetch(`${API_BASE}/api/me`, { credentials: 'include' });
            const data = await res.json();
            if (!data.ok) {
                window.location.href = 'index.html?toast=please_login';
                return;
            }
            currentUser = data.user;
            // Update UI with user info
            const navUsername = document.getElementById('navUsername');
            if (navUsername) navUsername.textContent = currentUser.full_name || 'User';
            const profilePic = document.getElementById('profilePicBtn');
            if (profilePic) profilePic.title = `${currentUser.full_name} — ${currentUser.email}`;
            const tierBadge = document.getElementById('tierBadge');
            if (tierBadge) tierBadge.textContent = currentUser.tier || 'FREE';

            // Load all workspace data
            loadChatHistory();
            loadLibrary();
            loadProjects();
        } catch (e) {
            console.error('[SESSION ERROR]', e);
            window.location.href = 'index.html?toast=please_login';
        }
    }
    initSession();

    // ════════════════════════════════════════════════════════════
    //  SIGN OUT
    // ════════════════════════════════════════════════════════════
    async function performSignOut(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        showToast('Signing out...');
        try {
            await fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: 'include' });
        } catch (err) {
            console.warn('[LOGOUT] Server unreachable.', err);
        }
        window.location.href = 'index.html?toast=logout_success';
    }
    document.getElementById('navSignOutBtn').addEventListener('click', performSignOut);
    document.getElementById('sidebarSignOut').addEventListener('click', performSignOut);

    // ════════════════════════════════════════════════════════════
    //  MOBILE SIDEBAR TOGGLE
    // ════════════════════════════════════════════════════════════
    const mainSidebar   = document.getElementById('mainSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const hamburgerBtn   = document.getElementById('hamburgerBtn');

    function openSidebar() {
        mainSidebar.classList.add('mobile-open');
        sidebarOverlay.classList.add('show');
    }
    function closeSidebar() {
        mainSidebar.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('show');
    }
    hamburgerBtn.addEventListener('click', openSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // ════════════════════════════════════════════════════════════
    //  THEME TOGGLE
    // ════════════════════════════════════════════════════════════
    let isLight = localStorage.getItem('infinia_theme') === 'light';
    function applyTheme(light) {
        const icon = document.querySelector('#themeToggle i');
        if (light) {
            document.body.style.backgroundColor = '#eef5ff';
            document.body.style.color = '#111';
            if (icon) icon.className = 'fas fa-sun';
        } else {
            document.body.style.backgroundColor = '';
            document.body.style.color = '';
            if (icon) icon.className = 'fas fa-moon';
        }
    }
    applyTheme(isLight);
    document.getElementById('themeToggle').addEventListener('click', () => {
        isLight = !isLight;
        localStorage.setItem('infinia_theme', isLight ? 'light' : 'dark');
        applyTheme(isLight);
    });

    // ════════════════════════════════════════════════════════════
    //  DROPDOWN (profile menu)
    // ════════════════════════════════════════════════════════════
    const dropdown = document.getElementById('accessDropdown');
    document.getElementById('dropdownTrigger').addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) dropdown.classList.remove('active');
    });

    document.getElementById('navProfileBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) showToast(`👤 ${currentUser.full_name} | ${currentUser.email} | Tier: ${currentUser.tier}`);
        dropdown.classList.remove('active');
    });
    document.getElementById('subscriptionBadge').addEventListener('click', () => {
        showToast('💎 Subscription: ' + (currentUser ? currentUser.tier : 'FREE') + ' tier active.');
    });
    document.getElementById('profilePicBtn').addEventListener('click', () => {
        if (currentUser) showToast(`👤 ${currentUser.full_name} — ${currentUser.email}`);
    });

    // ════════════════════════════════════════════════════════════
    //  SETTINGS MODAL
    // ════════════════════════════════════════════════════════════
    const settingsModal      = document.getElementById('settingsModal');
    const settingSystemPrompt = document.getElementById('settingSystemPrompt');
    const settingTemperature  = document.getElementById('settingTemperature');
    const settingMaxTokens    = document.getElementById('settingMaxTokens');
    const settingPollinationsKey = document.getElementById('settingPollinationsKey');
    const tempValue           = document.getElementById('tempValue');
    const tokenValue          = document.getElementById('tokenValue');

    settingSystemPrompt.value = localStorage.getItem('infinia_system_prompt') || '';
    settingTemperature.value  = localStorage.getItem('infinia_temperature')   || '0.7';
    settingMaxTokens.value    = localStorage.getItem('infinia_max_tokens')    || '2048';
    settingPollinationsKey.value = localStorage.getItem('infinia_pollinations_key') || '';
    tempValue.textContent     = settingTemperature.value;
    tokenValue.textContent    = settingMaxTokens.value;

    settingTemperature.addEventListener('input', (e) => { tempValue.textContent = e.target.value; });
    settingMaxTokens.addEventListener('input',   (e) => { tokenValue.textContent = e.target.value; });

    document.getElementById('settingsIcon').addEventListener('click', () => {
        // Load the key again from localStorage in case it was modified
        settingPollinationsKey.value = localStorage.getItem('infinia_pollinations_key') || '';
        settingsModal.classList.add('show');
    });
    document.getElementById('closeSettingsBtn').addEventListener('click', () => settingsModal.classList.remove('show'));
    settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.classList.remove('show'); });
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        localStorage.setItem('infinia_system_prompt', settingSystemPrompt.value.trim());
        localStorage.setItem('infinia_temperature',   settingTemperature.value);
        localStorage.setItem('infinia_max_tokens',    settingMaxTokens.value);
        localStorage.setItem('infinia_pollinations_key', settingPollinationsKey.value.trim());
        showToast('Settings saved!');
        settingsModal.classList.remove('show');
    });

    // ════════════════════════════════════════════════════════════
    //  MODEL SELECTOR
    // ════════════════════════════════════════════════════════════
    const modelSelect    = document.getElementById('modelSelect');
    const modelCapability = document.getElementById('modelCapability');

    modelSelect.addEventListener('change', () => {
        const v = modelSelect.value;
        const caps = {
            'AI Simple': 'Context: 32K · Speed: Lightning',
            'AI Plus':   'Context: 64K · Speed: Fast',
            'AI Pro':    'Context: 128K · Speed: High',
            'AI Ultra':  'Context: 256K · Speed: Ultimate',
            'Flux Image': 'Context: Image · Speed: High',
            'Flux Realism': 'Context: Image · Speed: High',
            'Flux Anime': 'Context: Image · Speed: High',
            'Luma Video': 'Context: Video · Speed: Variable',
            'Nova Reel': 'Context: Video · Speed: Variable'
        };
        modelCapability.textContent = caps[v] || '';
        showToast(`Model switched to ${v}`);
    });

    // ════════════════════════════════════════════════════════════
    //  AI TOOLS DROPDOWN
    // ════════════════════════════════════════════════════════════
    const toolsList = [
        'Create an Image','Write & Edit','Look Something Up','Computational Thinking',
        'Logical Thinking','Coding Assistant','Debug Code','Data Analysis',
        'Research Assistant','Summarize Documents','Translate Languages',
        'Generate Presentations','Create Websites','Create Apps','Generate Reports',
        'Brainstorm Ideas','Learning Assistant','Mathematical Solver',
        'Business Planner','Marketing Generator','AI Agent Builder'
    ];
    const toolsPanel = document.getElementById('toolsPanel');
    toolsList.forEach(tool => {
        const div = document.createElement('div');
        div.className = 'tool-item';
        div.innerHTML = `<i class="fas fa-magic"></i> ${tool}`;
        div.addEventListener('click', () => {
            chatInput.value = `🔧 Use tool: ${tool} — `;
            chatInput.focus(); chatInput.dispatchEvent(new Event('input'));
            toolsPanel.classList.remove('show');
            hideSuggestions();
        });
        toolsPanel.appendChild(div);
    });
    document.getElementById('toolsDropdownBtn').addEventListener('click', (e) => {
        e.stopPropagation(); toolsPanel.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
        if (!toolsPanel.contains(e.target) && e.target !== document.getElementById('toolsDropdownBtn')) {
            toolsPanel.classList.remove('show');
        }
    });

    // ════════════════════════════════════════════════════════════
    //  PROMPT SUGGESTIONS
    // ════════════════════════════════════════════════════════════
    const suggestionsArea = document.getElementById('suggestionsArea');
    const chatInput       = document.getElementById('chatInput');

    function hideSuggestions() {
        suggestionsArea.style.opacity = '0';
        suggestionsArea.style.pointerEvents = 'none';
        suggestionsArea.style.maxHeight = '0';
        suggestionsArea.style.padding = '0';
        suggestionsArea.style.overflow = 'hidden';
        suggestionsArea.style.transition = 'all 0.3s ease';
    }
    function showSuggestions() {
        suggestionsArea.style.opacity = '1';
        suggestionsArea.style.pointerEvents = '';
        suggestionsArea.style.maxHeight = '120px';
        suggestionsArea.style.padding = '';
        suggestionsArea.style.overflow = '';
    }

    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.dataset.prompt;
            chatInput.value = prompt;
            chatInput.dispatchEvent(new Event('input'));
            chatInput.focus();
            hideSuggestions();
        });
    });

    // ════════════════════════════════════════════════════════════
    //  SEARCH TOP NAV
    // ════════════════════════════════════════════════════════════
    document.getElementById('navSearchBtn').addEventListener('click', () => {
        const query = prompt('🔍 Search Conversations:\nEnter keywords to find in current chat:');
        if (query !== null) {
            const terms = query.toLowerCase().trim();
            const messages = document.querySelectorAll('#messagesArea .message');
            let count = 0;
            messages.forEach(msg => {
                if (!terms || msg.innerText.toLowerCase().includes(terms)) {
                    msg.style.display = ''; if (terms) count++;
                } else { msg.style.display = 'none'; }
            });
            if (terms) showToast(`Found ${count} message(s) matching "${query}"`);
            else showToast('Filter cleared.');
        }
    });

    // Notification bell
    document.getElementById('navBellBtn').addEventListener('click', () => {
        showToast('🔔 No new notifications. System fully operational!');
    });

    // ════════════════════════════════════════════════════════════
    //  VOICE INPUT
    // ════════════════════════════════════════════════════════════
    const voiceBtn = document.getElementById('voiceBtn');
    let recognition = null, isListening = false;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onstart = () => { isListening = true; voiceBtn.style.color = '#ff44aa'; voiceBtn.style.boxShadow = '0 0 10px #ff44aa'; showToast('Listening... speak now.'); };
        recognition.onresult = (e) => { const t = e.results[0][0].transcript; chatInput.value = (chatInput.value + ' ' + t).trim(); chatInput.dispatchEvent(new Event('input')); };
        recognition.onerror  = () => { showToast('Voice error or no speech detected.', true); stopListening(); };
        recognition.onend    = () => stopListening();
    }
    function stopListening() { isListening = false; voiceBtn.style.color = ''; voiceBtn.style.boxShadow = ''; }
    voiceBtn.addEventListener('click', () => {
        if (!recognition) { showToast('Voice input not supported in this browser.', true); return; }
        isListening ? recognition.stop() : recognition.start();
    });

    // ════════════════════════════════════════════════════════════
    //  FILE / IMAGE UPLOAD
    // ════════════════════════════════════════════════════════════
    const fileInput  = document.getElementById('fileInput');
    const imageInput = document.getElementById('imageInput');
    document.getElementById('fileUploadBtn').addEventListener('click', () => fileInput.click());
    document.getElementById('imageUploadBtn').addEventListener('click', () => imageInput.click());

    // ════════════════════════════════════════════════════════════
    //  UI CHAT FUNCTIONS (addMessage, showTyping, etc.)
    // ════════════════════════════════════════════════════════════
    function addMessage(role, text, isMarkdown = false) {
        const div = document.createElement('div');
        div.className = `message ${role}`;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        if (isMarkdown) {
            bubble.innerHTML = marked.parse(text);
            bubble.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
        } else {
            bubble.textContent = text;
        }

        div.appendChild(bubble);
        document.getElementById('messagesArea').appendChild(div);
        document.getElementById('messagesArea').scrollTop = document.getElementById('messagesArea').scrollHeight;

        if (text) {
            currentMessages.push({ role, content: text });
        }

        return div;
    }

    function showTyping() {
        removeTyping(); // ensure no duplicates
        const div = document.createElement('div');
        div.className = 'message bot typing-msg';
        div.id = 'typingIndicator';
        div.innerHTML = `<img src="https://ui-avatars.com/api/?name=AI&background=0d84ff&color=fff&rounded=true" alt="AI">
            <div class="message-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
        document.getElementById('messagesArea').appendChild(div);
        document.getElementById('messagesArea').scrollTop = document.getElementById('messagesArea').scrollHeight;
    }

    function removeTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    // ════════════════════════════════════════════════════════════
    //  CORE CHAT LOGIC
    // ════════════════════════════════════════════════════════════
    async function callGemini(userMsg) {
        showTyping();
        let model       = modelSelect.value;
        const systemPrompt = localStorage.getItem('infinia_system_prompt') || '';
        let answer = '';
        const pollinationsApiKey = localStorage.getItem('infinia_pollinations_key') || '';

        // Media intent detection on the frontend
        const clean = userMsg.trim().toLowerCase();
        let wantsImage = false;
        let wantsVideo = false;

        // Check commands/prefixes
        if (clean.startsWith('/image') || clean.startsWith('/draw') || clean.startsWith('/paint') || clean.startsWith('/generate-image')) {
            wantsImage = true;
            userMsg = userMsg.replace(/^\/[a-zA-Z0-9_-]+\s*/i, '').trim();
        } else if (clean.startsWith('/video') || clean.startsWith('/animate') || clean.startsWith('/generate-video')) {
            wantsVideo = true;
            userMsg = userMsg.replace(/^\/[a-zA-Z0-9_-]+\s*/i, '').trim();
        } else {
            // Natural language check
            const videoPatterns = [
                /\b(generate|create|make|render|animate|show)\s+(a\s+)?(video|movie|animation|clip|film)\b/i,
                /\b(video\s+of|movie\s+of|animation\s+of|clip\s+of)\b/i
            ];
            const imagePatterns = [
                /\b(generate|create|make|draw|paint|render|show)\s+(a\s+)?(image|photo|picture|drawing|painting|illustration|portrait|sketch|graphic)\b/i,
                /\b(photo\s+of|picture\s+of|drawing\s+of|painting\s+of|illustration\s+of|sketch\s+of|portrait\s+of)\b/i,
                /^(draw|paint|depict|illustrate)\b/i
            ];

            for (const pattern of videoPatterns) {
                if (pattern.test(clean)) {
                    wantsVideo = true;
                    break;
                }
            }
            if (!wantsVideo) {
                for (const pattern of imagePatterns) {
                    if (pattern.test(clean)) {
                        wantsImage = true;
                        break;
                    }
                }
            }
        }

        if (wantsImage && !['Flux Image', 'Flux Realism', 'Flux Anime'].includes(model)) {
            model = 'Flux Image';
        } else if (wantsVideo && !['Luma Video', 'Nova Reel'].includes(model)) {
            model = 'Luma Video';
        }

        const isImageModel = ['Flux Image', 'Flux Realism', 'Flux Anime'].includes(model);

        if (isImageModel) {
            // Always use backend for image generation (no Puter.js — it requires payment)
            try {
                const res = await fetch(`${API_BASE}/api/chat`, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: userMsg, model, systemPrompt, pollinationsApiKey })
                });
                const data = await res.json();
                removeTyping();
                if (res.ok && data.ok) {
                    answer = data.text;
                } else {
                    answer = `⚠️ **Image generation failed:** ${data.message || 'Unknown error. Please try again.'}`;
                }
            } catch (err) {
                removeTyping();
                answer = `⚠️ **Connection Error:** Cannot reach the backend server. Make sure it is running on port 3000.`;
            }
        } else {
            try {
                const res = await fetch(`${API_BASE}/api/chat`, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: userMsg, model, systemPrompt, pollinationsApiKey })
                });
                const data = await res.json();
                removeTyping();

                if (res.ok && data.ok) {
                    answer = data.text;
                } else {
                    if (window.puter) {
                        console.log("[Puter fallback] Server-side AI failed. Using client-side Puter.js fallback...");
                        let puterModel = 'gpt-4o-mini';
                        if (model === 'AI Simple') puterModel = 'gpt-4o-mini';
                        else if (model === 'AI Plus') puterModel = 'gpt-4o-mini';
                        else if (model === 'AI Pro') puterModel = 'gpt-4o';
                        else if (model === 'AI Ultra') puterModel = 'gpt-4o';

                        try {
                            let fullPrompt = userMsg;
                            if (systemPrompt && systemPrompt.trim() !== '') {
                                fullPrompt = `${systemPrompt.trim()}\n\nUser Prompt:\n${userMsg}`;
                            }
                            const response = await puter.ai.chat(fullPrompt, { model: puterModel });
                            answer = typeof response === 'string' ? response : (response.message?.content || response.toString() || '');
                        } catch (puterErr) {
                            console.error('[Puter fallback failed]', puterErr);
                            answer = `⚠️ **Error:** Backend API returned error (${data.message || 'Unknown error'}) and Puter fallback failed (${puterErr.message}).`;
                        }
                    } else {
                        answer = `⚠️ **Error:** ${data.message || 'Unknown error.'}`;
                    }
                }
            } catch (err) {
                removeTyping();
                console.error('[CHAT ERROR]', err);
                if (window.puter) {
                    console.log("[Puter fallback] Backend unreachable. Using client-side Puter.js fallback...");
                    let puterModel = 'gpt-4o-mini';
                    if (model === 'AI Simple') puterModel = 'gpt-4o-mini';
                    else if (model === 'AI Plus') puterModel = 'gpt-4o-mini';
                    else if (model === 'AI Pro') puterModel = 'gpt-4o';
                    else if (model === 'AI Ultra') puterModel = 'gpt-4o';

                    try {
                        let fullPrompt = userMsg;
                        if (systemPrompt && systemPrompt.trim() !== '') {
                            fullPrompt = `${systemPrompt.trim()}\n\nUser Prompt:\n${userMsg}`;
                        }
                        const response = await puter.ai.chat(fullPrompt, { model: puterModel });
                        answer = typeof response === 'string' ? response : (response.message?.content || response.toString() || '');
                    } catch (puterErr) {
                        console.error('[Puter fallback failed]', puterErr);
                        answer = `⚠️ **Connection Error:** Backend unreachable and Puter fallback failed (${puterErr.message}).`;
                    }
                } else {
                    answer = '⚠️ **Connection Error:** Cannot reach the backend. Make sure the server is running.';
                }
            }
        }

        const botDiv    = addMessage('bot', '', true);
        const bubbleEl  = botDiv.querySelector('.message-bubble');
        const rdBtns    = bubbleEl.querySelector('.reaction-btns');
        if (rdBtns) rdBtns.remove();


        const isMediaOrError = answer.startsWith('![Generated Image]') || 
                              answer.startsWith('<video') || 
                              answer.startsWith('<iframe') || 
                              answer.startsWith('<div') || 
                              answer.includes('<iframe') || 
                              answer.includes('/generated/') ||
                              answer.startsWith('⚠️') || 
                              answer.startsWith('Please add') ||
                              answer.startsWith('Free text-to-video');

        if (isMediaOrError) {
            bubbleEl.innerHTML = marked.parse(answer);
            bubbleEl.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));

            // Make generated images look nice and add download button
            bubbleEl.querySelectorAll('img').forEach(img => {
                img.style.cssText = 'max-width:100%;border-radius:12px;display:block;margin:8px 0;box-shadow:0 4px 20px rgba(0,0,0,0.4);cursor:pointer;';
                img.title = 'Click to view full size';
                img.onclick = () => window.open(img.src, '_blank');

                const dlBtn = document.createElement('a');
                dlBtn.href = img.src;
                dlBtn.download = 'generated-image-' + Date.now() + '.jpg';
                dlBtn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-top:6px;padding:7px 16px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .2s;';
                dlBtn.innerHTML = '<i class="fas fa-download"></i> Download Image';
                dlBtn.onmouseover = () => dlBtn.style.opacity = '0.8';
                dlBtn.onmouseout = () => dlBtn.style.opacity = '1';
                img.parentNode.insertBefore(dlBtn, img.nextSibling);
            });

            // Add download button for video elements
            bubbleEl.querySelectorAll('video').forEach(video => {
                const src = video.src || video.querySelector('source')?.src;
                if (src) {
                    const dlBtn = document.createElement('a');
                    dlBtn.href = src;
                    dlBtn.download = 'generated-video-' + Date.now() + '.mp4';
                    dlBtn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-top:6px;padding:7px 16px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .2s;';
                    dlBtn.innerHTML = '<i class="fas fa-download"></i> Download Video';
                    dlBtn.onmouseover = () => dlBtn.style.opacity = '0.8';
                    dlBtn.onmouseout = () => dlBtn.style.opacity = '1';
                    video.parentNode.insertBefore(dlBtn, video.nextSibling);
                }
            });

            messagesArea.scrollTop = messagesArea.scrollHeight;
            
            const rd = document.createElement('div');
            rd.className = 'reaction-btns';
            rd.innerHTML = `
                <button class="reaction" title="Like"><i class="far fa-thumbs-up"></i></button>
                <button class="reaction" title="Dislike"><i class="far fa-thumbs-down"></i></button>
                <button class="reaction copy-btn" title="Copy"><i class="far fa-copy"></i></button>`;
            bubbleEl.appendChild(rd);
            
            if (currentMessages.length > 0) {
                currentMessages[currentMessages.length - 1].content = answer;
            }

        } else {
            let i = 0, streamed = '';
            const interval = setInterval(() => {
                if (i < answer.length) {
                    streamed += answer[i++];
                    bubbleEl.innerHTML = marked.parse(streamed);
                    bubbleEl.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
                    messagesArea.scrollTop = messagesArea.scrollHeight;
                } else {
                    clearInterval(interval);
                    const rd = document.createElement('div');
                    rd.className = 'reaction-btns';
                    rd.innerHTML = `
                        <button class="reaction" title="Like"><i class="far fa-thumbs-up"></i></button>
                        <button class="reaction" title="Dislike"><i class="far fa-thumbs-down"></i></button>
                        <button class="reaction copy-btn" title="Copy"><i class="far fa-copy"></i></button>`;
                    bubbleEl.appendChild(rd);
                    if (currentMessages.length > 0) {
                        currentMessages[currentMessages.length - 1].content = answer;
                    }
                }
            }, 10);
        }
    }

    // ════════════════════════════════════════════════════════════
    //  CHAT INPUT ENABLE / DISABLE
    // ════════════════════════════════════════════════════════════
    const inputAreaEl = document.querySelector('.input-area');
    const inputHintEl = document.querySelector('.input-hint');

    function enableChatInput() {
        chatMode = true;
        chatInput.disabled = false;
        chatInput.placeholder = 'Ask Infinia AI anything... (Shift+Enter for new line)';
        if (inputAreaEl) inputAreaEl.style.opacity = '1';
        if (inputAreaEl) inputAreaEl.style.pointerEvents = '';
        if (inputHintEl) inputHintEl.style.display = '';
        document.querySelectorAll('.input-actions .action-btn').forEach(b => b.disabled = false);
    }
    function disableChatInput() {
        chatMode = false;
        chatInput.disabled = true;
        chatInput.value = '';
        chatInput.style.height = 'auto';
        chatInput.placeholder = 'Switch to New Chat to start a conversation';
        if (inputAreaEl) inputAreaEl.style.opacity = '0.4';
        if (inputAreaEl) inputAreaEl.style.pointerEvents = 'none';
        if (inputHintEl) inputHintEl.style.display = 'none';
        hideSuggestions();
    }

    // ════════════════════════════════════════════════════════════
    //  SEND MESSAGE
    // ════════════════════════════════════════════════════════════
    async function sendMessage() {
        if (!chatMode) return;
        const text = chatInput.value.trim();
        if (!text) return;
        hideSuggestions();
        addMessage('user', text, false);
        chatInput.value = '';
        chatInput.style.height = 'auto';
        await callGemini(text);
    }

    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 130) + 'px';
        if (this.value.trim()) hideSuggestions();
        else showSuggestions();
    });

    // ════════════════════════════════════════════════════════════
    //  NEW CHAT
    // ════════════════════════════════════════════════════════════
    document.getElementById('newChatBtn').addEventListener('click', () => {
        messagesArea.innerHTML = '';
        currentMessages = [];
        addMessage('bot', '✨ New conversation started. What can I help you with today?', true);
        enableChatInput();
        showSuggestions();
        closeSidebar();
    });

    // ════════════════════════════════════════════════════════════
    //  SIDE PANELS (open/close)
    // ════════════════════════════════════════════════════════════
    const panelBackdrop = document.getElementById('panelBackdrop');

    function openPanel(panelId) {
        // Close all first
        document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
        const panel = document.getElementById(panelId);
        if (panel) { panel.classList.add('open'); panelBackdrop.classList.add('show'); }
        closeSidebar();
    }
    function closeAllPanels() {
        document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
        panelBackdrop.classList.remove('show');
    }
    panelBackdrop.addEventListener('click', closeAllPanels);
    document.querySelectorAll('.panel-close-btn').forEach(btn => {
        btn.addEventListener('click', closeAllPanels);
    });

    // ════════════════════════════════════════════════════════════
    //  SIDEBAR NAVIGATION
    // ════════════════════════════════════════════════════════════
    const navMap = {
        navLibrary:    () => openPanel('libraryPanel'),
        navProjects:   () => openPanel('projectsPanel'),
        navHistory:    () => openPanel('historyPanel'),
        navWorkspace:  () => { clearAndAdd('🚀 Welcome to **Infinia AI** workspace. Start a new chat or load one from history.'); disableChatInput(); closeSidebar(); },
        navApps:       () => { clearAndAdd('📱 **Infinia Apps**\n\nLaunch a tool:\n- **Text Summarizer** — Condense documents\n- **SQL Optimizer** — Format and speed up queries\n- **JSON Validator** — Check JSON syntax\n\n*Click a tool in the AI Tools menu above.*'); disableChatInput(); closeSidebar(); },
        navCodex:      () => { clearAndAdd('💻 **Infinia Codex Sandbox**\n\nPaste your code and I will analyze, optimize, or debug it!\n\n```javascript\n// Paste code here\nconsole.log("Hello Infinia!");\n```'); disableChatInput(); closeSidebar(); },
        navKnowledge:  () => { clearAndAdd('🗄️ **Knowledge Base**\n\nUpload documents and I will index them for smart retrieval.\n\n*Feature: Semantic search across your documents.*'); disableChatInput(); closeSidebar(); },
        navAgents:     () => { clearAndAdd('🤖 **AI Agents**\n\nAutonomous background workers:\n\n1. **dev-link** — Analyzing commits `[Active 🟢]`\n2. **seo-bot** — Scanning search indices `[Idle 🟡]`'); disableChatInput(); closeSidebar(); },
        navTemplates:  () => { clearAndAdd('📋 **Templates**\n\n- Bug Report Template\n- Marketing Pitch Outline\n- API Documentation\n- Product Requirements Doc'); disableChatInput(); closeSidebar(); },
        navCommunity:  () => { clearAndAdd('👥 **Infinia Community**\n\nConnect with other users and share prompts, projects, and workflows.'); disableChatInput(); closeSidebar(); },
        navFavorites:  () => { clearAndAdd('⭐ **Favorites**\n\nStar messages to pin them here for quick reference.'); disableChatInput(); closeSidebar(); },
        navArchived:   () => { clearAndAdd('📦 **Archived Chats**\n\nNo chats archived yet.'); disableChatInput(); closeSidebar(); },
        navSearchChats:() => { document.getElementById('navSearchBtn').click(); },
    };

    function clearAndAdd(msg) {
        messagesArea.innerHTML = '';
        currentMessages = [];
        addMessage('bot', msg, true);
    }

    Object.entries(navMap).forEach(([id, fn]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => { setActiveNav(el); fn(); });
    });

    function setActiveNav(el) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }

    // ════════════════════════════════════════════════════════════
    //  SAVE CHAT MODAL
    // ════════════════════════════════════════════════════════════
    const saveChatModal    = document.getElementById('saveChatModal');
    const saveChatTitle    = document.getElementById('saveChatTitle');

    function openSaveChatModal() {
        if (!currentMessages || currentMessages.length < 2) {
            showToast('Nothing to save yet — start a conversation first!', true); return;
        }
        // Auto-suggest title from first user message
        const firstUser = currentMessages.find(m => m.role === 'user');
        saveChatTitle.value = firstUser ? firstUser.content.substring(0, 60) : 'My Chat';
        saveChatModal.classList.add('show');
    }
    document.getElementById('saveChatBtn').addEventListener('click', openSaveChatModal);
    document.getElementById('navSaveChatBtn').addEventListener('click', (e) => { e.preventDefault(); openSaveChatModal(); dropdown.classList.remove('active'); });
    document.getElementById('closeSaveChatBtn').addEventListener('click', () => saveChatModal.classList.remove('show'));
    saveChatModal.addEventListener('click', (e) => { if (e.target === saveChatModal) saveChatModal.classList.remove('show'); });

    document.getElementById('confirmSaveChatBtn').addEventListener('click', async () => {
        const title = saveChatTitle.value.trim();
        if (!title) { showToast('Please enter a title.', true); return; }
        try {
            const res  = await fetch(`${API_BASE}/api/workspace/chats`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, messages: currentMessages })
            });
            const data = await res.json();
            if (data.ok) {
                showToast('✅ Chat saved to history!');
                saveChatModal.classList.remove('show');
                loadChatHistory();
            } else { showToast(data.message || 'Could not save chat.', true); }
        } catch (err) { showToast('Server error. Could not save chat.', true); console.error(err); }
    });

    // ════════════════════════════════════════════════════════════
    //  CHAT HISTORY (load / render / delete)
    // ════════════════════════════════════════════════════════════
    async function loadChatHistory() {
        try {
            const res  = await fetch(`${API_BASE}/api/workspace/chats`, { credentials: 'include' });
            const data = await res.json();
            renderChatHistory(data.ok ? data.chats : []);
        } catch (err) { console.error('[HISTORY LOAD]', err); }
    }

    function renderChatHistory(chats) {
        const list = document.getElementById('historyList');
        if (!chats || chats.length === 0) {
            list.innerHTML = `<div class="panel-empty"><i class="fas fa-comment-slash"></i><br>No saved chats yet.<br><small>Save a chat using the bookmark icon.</small></div>`;
            return;
        }
        list.innerHTML = '';
        chats.forEach(chat => {
            const messages = typeof chat.messages === 'string' ? JSON.parse(chat.messages) : chat.messages;
            const preview  = messages && messages[1] ? messages[1].content.substring(0, 80) : 'No preview';
            const card = document.createElement('div');
            card.className = 'panel-card';
            card.innerHTML = `
                <div class="panel-card-title"><i class="fas fa-comment-dots"></i> ${escapeHtml(chat.title)}</div>
                <div class="panel-card-meta">${formatDate(chat.created_at)} · ${messages ? messages.length : 0} messages</div>
                <div class="panel-card-preview">${escapeHtml(preview)}...</div>
                <div class="panel-card-actions">
                    <button class="panel-card-btn load-btn" data-id="${chat.id}"><i class="fas fa-play"></i> Load</button>
                    <button class="panel-card-btn del-btn" data-id="${chat.id}"><i class="fas fa-trash"></i> Delete</button>
                </div>`;
            card.querySelector('.load-btn').addEventListener('click', () => loadChat(chat, messages));
            card.querySelector('.del-btn').addEventListener('click',  () => deleteChat(chat.id, card));
            list.appendChild(card);
        });
    }

    function loadChat(chat, messages) {
        messagesArea.innerHTML = '';
        currentMessages = [];
        if (messages && messages.length) {
            messages.forEach(m => addMessage(m.role, m.content, m.role === 'bot'));
        }
        showToast(`📂 Loaded: "${chat.title}"`);
        closeAllPanels();
    }

    async function deleteChat(id, cardEl) {
        if (!confirm('Delete this chat? This cannot be undone.')) return;
        try {
            const res  = await fetch(`${API_BASE}/api/workspace/chats/${id}`, { method: 'DELETE', credentials: 'include' });
            const data = await res.json();
            if (data.ok) { cardEl.remove(); showToast('Chat deleted.'); }
            else showToast(data.message || 'Could not delete.', true);
        } catch (err) { showToast('Server error.', true); console.error(err); }
    }

    // ════════════════════════════════════════════════════════════
    //  LIBRARY (load / add / delete)
    // ════════════════════════════════════════════════════════════
    const addLibraryModal = document.getElementById('addLibraryModal');

    document.getElementById('addLibraryBtn').addEventListener('click', () => {
        const currentInput = chatInput.value.trim();
        document.getElementById('libraryTitle').value   = '';
        document.getElementById('libraryContent').value = currentInput;
        addLibraryModal.classList.add('show');
    });
    document.getElementById('closeLibraryModalBtn').addEventListener('click', () => addLibraryModal.classList.remove('show'));
    addLibraryModal.addEventListener('click', (e) => { if (e.target === addLibraryModal) addLibraryModal.classList.remove('show'); });

    document.getElementById('confirmAddLibraryBtn').addEventListener('click', async () => {
        const title   = document.getElementById('libraryTitle').value.trim();
        const content = document.getElementById('libraryContent').value.trim();
        if (!title || !content) { showToast('Title and content are required.', true); return; }
        try {
            const res  = await fetch(`${API_BASE}/api/workspace/library`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });
            const data = await res.json();
            if (data.ok) { showToast('📚 Saved to library!'); addLibraryModal.classList.remove('show'); loadLibrary(); }
            else showToast(data.message || 'Could not save.', true);
        } catch (err) { showToast('Server error.', true); console.error(err); }
    });

    async function loadLibrary() {
        try {
            const res  = await fetch(`${API_BASE}/api/workspace/library`, { credentials: 'include' });
            const data = await res.json();
            renderLibrary(data.ok ? data.items : []);
        } catch (err) { console.error('[LIBRARY LOAD]', err); }
    }

    function renderLibrary(items) {
        const list = document.getElementById('libraryList');
        if (!items || items.length === 0) {
            list.innerHTML = `<div class="panel-empty"><i class="fas fa-book-open"></i><br>No saved prompts yet.<br><small>Save a prompt using the button above.</small></div>`;
            return;
        }
        list.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'panel-card';
            card.innerHTML = `
                <div class="panel-card-title"><i class="fas fa-file-alt"></i> ${escapeHtml(item.title)}</div>
                <div class="panel-card-meta">${formatDate(item.created_at)}</div>
                <div class="panel-card-preview">${escapeHtml(item.content)}</div>
                <div class="panel-card-actions">
                    <button class="panel-card-btn load-btn" data-id="${item.id}"><i class="fas fa-arrow-right"></i> Use</button>
                    <button class="panel-card-btn del-btn" data-id="${item.id}"><i class="fas fa-trash"></i> Delete</button>
                </div>`;
            card.querySelector('.load-btn').addEventListener('click', () => {
                chatInput.value = item.content;
                chatInput.dispatchEvent(new Event('input'));
                chatInput.focus();
                showToast(`📋 Loaded: "${item.title}"`);
                closeAllPanels();
            });
            card.querySelector('.del-btn').addEventListener('click', () => deleteLibraryItem(item.id, card));
            list.appendChild(card);
        });
    }

    async function deleteLibraryItem(id, cardEl) {
        if (!confirm('Delete this library item?')) return;
        try {
            const res  = await fetch(`${API_BASE}/api/workspace/library/${id}`, { method: 'DELETE', credentials: 'include' });
            const data = await res.json();
            if (data.ok) { cardEl.remove(); showToast('Library item deleted.'); }
            else showToast(data.message || 'Could not delete.', true);
        } catch (err) { showToast('Server error.', true); console.error(err); }
    }

    // ════════════════════════════════════════════════════════════
    //  PROJECTS (load / add / delete)
    // ════════════════════════════════════════════════════════════
    const addProjectModal = document.getElementById('addProjectModal');

    document.getElementById('addProjectBtn').addEventListener('click', () => {
        document.getElementById('projectName').value        = '';
        document.getElementById('projectDescription').value = '';
        addProjectModal.classList.add('show');
    });
    document.getElementById('closeProjectModalBtn').addEventListener('click', () => addProjectModal.classList.remove('show'));
    addProjectModal.addEventListener('click', (e) => { if (e.target === addProjectModal) addProjectModal.classList.remove('show'); });

    document.getElementById('confirmAddProjectBtn').addEventListener('click', async () => {
        const name        = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDescription').value.trim();
        if (!name) { showToast('Project name is required.', true); return; }
        try {
            const res  = await fetch(`${API_BASE}/api/workspace/projects`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });
            const data = await res.json();
            if (data.ok) { showToast('📁 Project created!'); addProjectModal.classList.remove('show'); loadProjects(); }
            else showToast(data.message || 'Could not create project.', true);
        } catch (err) { showToast('Server error.', true); console.error(err); }
    });

    async function loadProjects() {
        try {
            const res  = await fetch(`${API_BASE}/api/workspace/projects`, { credentials: 'include' });
            const data = await res.json();
            renderProjects(data.ok ? data.projects : []);
        } catch (err) { console.error('[PROJECTS LOAD]', err); }
    }

    function renderProjects(projects) {
        const list = document.getElementById('projectsList');
        if (!projects || projects.length === 0) {
            list.innerHTML = `<div class="panel-empty"><i class="fas fa-folder-open"></i><br>No projects yet.<br><small>Create a project to organize your work.</small></div>`;
            return;
        }
        list.innerHTML = '';
        projects.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'panel-card';
            card.innerHTML = `
                <div class="panel-card-title"><i class="fas fa-folder"></i> ${escapeHtml(proj.name)}</div>
                <div class="panel-card-meta">Created ${formatDate(proj.created_at)}</div>
                ${proj.description ? `<div class="panel-card-preview">${escapeHtml(proj.description)}</div>` : ''}
                <div class="panel-card-actions">
                    <button class="panel-card-btn load-btn"><i class="fas fa-external-link-alt"></i> Open</button>
                    <button class="panel-card-btn del-btn"><i class="fas fa-trash"></i> Delete</button>
                </div>`;
            card.querySelector('.load-btn').addEventListener('click', () => {
                clearAndAdd(`📁 **Project: ${proj.name}**\n\n${proj.description || 'No description.'}\n\nAsk me anything about this project!`);
                showToast(`Opened project: "${proj.name}"`);
                closeAllPanels();
            });
            card.querySelector('.del-btn').addEventListener('click', () => deleteProject(proj.id, card));
            list.appendChild(card);
        });
    }

    async function deleteProject(id, cardEl) {
        if (!confirm('Delete this project?')) return;
        try {
            const res  = await fetch(`${API_BASE}/api/workspace/projects/${id}`, { method: 'DELETE', credentials: 'include' });
            const data = await res.json();
            if (data.ok) { cardEl.remove(); showToast('Project deleted.'); }
            else showToast(data.message || 'Could not delete.', true);
        } catch (err) { showToast('Server error.', true); console.error(err); }
    }

    // ════════════════════════════════════════════════════════════
    //  HELPER: escape HTML for safe rendering
    // ════════════════════════════════════════════════════════════
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ════════════════════════════════════════════════════════════
    //  WELCOME MESSAGE (process URL params)
    // ════════════════════════════════════════════════════════════
    const params = new URLSearchParams(window.location.search);
    if (params.get('toast') === 'logout_success') showToast('You have been signed out successfully.');

    // Show initial bot message rendered as markdown
    setTimeout(() => {
        const firstBubble = messagesArea.querySelector('.message.bot .message-bubble');
        if (firstBubble) {
            const raw = firstBubble.textContent;
            firstBubble.innerHTML = marked.parse(raw);
        }
    }, 100);

})();