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

const knotGeo = new THREE.TorusKnotGeometry(2, 0.6, 150, 16);
const knotMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    roughness: 0.1,
    metalness: 0.8,
    wireframe: true
});
const torusKnot = new THREE.Mesh(knotGeo, knotMat);
scene.add(torusKnot);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    torusKnot.rotation.x += 0.01;
    torusKnot.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();

// --- Auth Frontend Submissions ---
(function() {
    'use strict';
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    function showToast(message, isError = false) {
        alert((isError ? "❌ " : "✅ ") + message);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const full_name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value.trim();
            const username = email.split('@')[0];

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ full_name, username, email, password })
                });
                const data = await res.json();
                if (data.ok) {
                    showToast("Account built successfully! Please log in.");
                    signupForm.reset();
                } else {
                    showToast(data.message || "Failure registering account.", true);
                }
            } catch (err) {
                showToast("Connection failure.", true);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.ok) {
                    showToast("Welcome back! Loading environment...");
                    setTimeout(() => { window.location.href = 'ai.html'; }, 800);
                } else {
                    showToast(data.message || "Invalid email or password.", true);
                }
            } catch (err) {
                showToast("Connection failure.", true);
            }
        });
    }
})();
