// --- 3D Background Setup ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020610);
scene.fog = new THREE.FogExp2(0x020610, 0.003);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 12);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
if (container) {
    container.appendChild(renderer.domElement);
}

// Lights
const ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0x2266ff, 1, 30);
pointLight.position.set(2, 3, 4);
scene.add(pointLight);
const purpleLight = new THREE.PointLight(0xaa44ff, 0.7);
purpleLight.position.set(-2, 1, 5);
scene.add(purpleLight);

// Central Torus Knot with glowing effect
const knotGeo = new THREE.TorusKnotGeometry(2, 0.6, 150, 16);
const knotMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    roughness: 0.1,
    metalness: 0.8,
    wireframe: true
});
const torusKnot = new THREE.Mesh(knotGeo, knotMat);
scene.add(torusKnot);

// Particle Field
const partCount = 1200;
const partGeo = new THREE.BufferGeometry();
const posArray = new Float32Array(partCount * 3);
for (let i = 0; i < partCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 35;
}
partGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const partMat = new THREE.PointsMaterial({
    size: 0.04,
    color: 0xffffff,
    transparent: true,
    opacity: 0.4
});
const particlesMesh = new THREE.Points(partGeo, partMat);
scene.add(particlesMesh);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    torusKnot.rotation.x = elapsedTime * 0.2;
    torusKnot.rotation.y = elapsedTime * 0.15;
    particlesMesh.rotation.y = elapsedTime * -0.02;
    renderer.render(scene, camera);
}
animate();

// --- Auth Cards Switch UI logic ---
(function() {
    'use strict';
    const loginCard = document.getElementById('login-card');
    const signupCard = document.getElementById('signup-card');
    const toSignup = document.getElementById('to-signup');
    const toLogin = document.getElementById('to-login');

    if (toSignup && toLogin) {
        toSignup.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToCard(signupCard);
        });
        toLogin.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToCard(loginCard);
        });
    }

    function scrollToCard(target) {
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function showToast(message, isError = false) {
        const old = document.querySelector('.toast-alert');
        if (old) old.remove();
        const toast = document.createElement('div');
        toast.className = `toast-alert ${isError ? 'error' : 'success'}`;
        toast.style.cssText = `
            position: fixed; bottom: 24px; right: 24px; padding: 14px 24px;
            background: ${isError ? 'rgba(255,50,50,0.95)' : 'rgba(10,200,100,0.95)'};
            color: #fff; font-family: sans-serif; border-radius: 8px; font-weight: 500;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 99999;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3500);
    }

    const API_BASE = '';

    // --- Submit Sign Up Form ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const full_name = document.getElementById('signup-name').value.trim();
            const username = document.getElementById('signup-username')?.value.trim() || full_name.split(' ')[0] + Math.floor(Math.random() * 100);
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value.trim();

            if (!full_name || !email || !password) {
                showToast("Please fill in all required fields.", true);
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ full_name, username, email, password })
                });
                const data = await res.json();
                if (res.ok || data.ok) {
                    showToast("Account registered successfully! Redirecting to login...", false);
                    signupForm.reset();
                    setTimeout(() => scrollToCard(loginCard), 1500);
                } else {
                    showToast(data.message || "Registration failed.", true);
                }
            } catch (err) {
                showToast("Cannot connect to server mapping paths.", true);
            }
        });
    }

    // --- Submit Login Form ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();

            if (!email || !password) {
                showToast("Please fill in all fields.", true);
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok || data.ok) {
                    showToast("Login successful! Entering Workspace...", false);
                    setTimeout(() => { window.location.href = 'ai.html'; }, 1000);
                } else {
                    showToast(data.message || "Invalid credentials.", true);
                }
            } catch (err) {
                showToast("Cannot connect to server assets.", true);
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const toastParam = urlParams.get('toast');
    if (toastParam === 'please_login') {
        showToast("Please sign in to access the AI workspace.", true);
    } else if (toastParam === 'logout_success') {
        showToast("Logged out successfully.", false);
    }
})();
