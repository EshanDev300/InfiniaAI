
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
        container.appendChild(renderer.domElement);
        
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
        const knotGeo = new THREE.TorusKnotGeometry(1.2, 0.3, 180, 24, 3, 4);
        const knotMat = new THREE.MeshStandardMaterial({ color: 0x00ccff, emissive: 0x004466, roughness: 0.3, metalness: 0.8 });
        const knot = new THREE.Mesh(knotGeo, knotMat);
        scene.add(knot);
        
        // Floating geometric shapes (icosahedrons)
        const shapesGroup = [];
        const colors = [0xff44cc, 0x44ffcc, 0xffaa44];
        for (let i = 0; i < 35; i++) {
            const geo = new THREE.IcosahedronGeometry(0.18, 0);
            const mat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], emissive: 0x331133, roughness: 0.2 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 8 - 4);
            mesh.userData = { speedX: (Math.random() - 0.5) * 0.008, speedY: (Math.random() - 0.5) * 0.008, rotSpeed: 0.01 };
            scene.add(mesh);
            shapesGroup.push(mesh);
        }
        
        // Particle system (neural network style)
        const particleCount = 1800;
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i*3] = (Math.random() - 0.5) * 30;
            positions[i*3+1] = (Math.random() - 0.5) * 18;
            positions[i*3+2] = (Math.random() - 0.5) * 20 - 8;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({ color: 0x33aaff, size: 0.05, transparent: true, blending: THREE.AdditiveBlending });
        const particleSystem = new THREE.Points(particlesGeometry, particleMat);
        scene.add(particleSystem);
        
        // Additional glowing particles / data streams (smaller)
        const starCount = 800;
        const starGeo = new THREE.BufferGeometry();
        const starPos = [];
        for (let i = 0; i < starCount; i++) {
            starPos.push((Math.random() - 0.5) * 50);
            starPos.push((Math.random() - 0.5) * 25);
            starPos.push((Math.random() - 0.5) * 30 - 15);
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starPos), 3));
        const starMat = new THREE.PointsMaterial({ color: 0xff88dd, size: 0.03, transparent: true, blending: THREE.AdditiveBlending });
        const starField = new THREE.Points(starGeo, starMat);
        scene.add(starField);
        
        // Digital circuit lines: create a wireframe grid 
        const gridHelper = new THREE.GridHelper(22, 40, 0x00ccff, 0x3366aa);
        gridHelper.position.y = -2.5;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;
        scene.add(gridHelper);
        
        // rotating rings
        const ringGeo = new THREE.TorusGeometry(1.8, 0.05, 64, 300);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0066aa });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        scene.add(ring);
        
        // ----- CREATE TWO AI ROBOTS TALKING TO EACH OTHER -----
        function createRobot(x, z, colorPrimary, colorSecondary) {
            const group = new THREE.Group();
            
            // Body
            const bodyGeo = new THREE.BoxGeometry(0.9, 1.2, 0.7);
            const bodyMat = new THREE.MeshStandardMaterial({ color: colorPrimary, metalness: 0.7, roughness: 0.3, emissive: 0x111122 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0;
            group.add(body);
            
            // Head
            const headGeo = new THREE.SphereGeometry(0.55, 32, 32);
            const headMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, metalness: 0.6, roughness: 0.2 });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 0.95;
            group.add(head);
            
            // Eyes (glowing)
            const eyeMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00aaff, emissiveIntensity: 0.8 });
            const leftEyeGeo = new THREE.SphereGeometry(0.12, 24, 24);
            const rightEyeGeo = new THREE.SphereGeometry(0.12, 24, 24);
            const leftEye = new THREE.Mesh(leftEyeGeo, eyeMat);
            const rightEye = new THREE.Mesh(rightEyeGeo, eyeMat);
            leftEye.position.set(-0.2, 1.1, 0.55);
            rightEye.position.set(0.2, 1.1, 0.55);
            group.add(leftEye);
            group.add(rightEye);
            
            // Mouth (jaw piece that will animate for talking)
            const jawGeo = new THREE.BoxGeometry(0.4, 0.15, 0.2);
            const jawMat = new THREE.MeshStandardMaterial({ color: colorSecondary, metalness: 0.5 });
            const jaw = new THREE.Mesh(jawGeo, jawMat);
            jaw.position.set(0, 0.85, 0.55);
            group.add(jaw);
            
            // Antenna / head crest
            const antennaGeo = new THREE.CylinderGeometry(0.07, 0.1, 0.35, 8);
            const antennaMat = new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xff4400, emissiveIntensity: 0.5 });
            const antenna = new THREE.Mesh(antennaGeo, antennaMat);
            antenna.position.set(0, 1.45, 0);
            group.add(antenna);
            
            // Shoulder pads
            const padGeo = new THREE.BoxGeometry(0.3, 0.2, 0.5);
            const padMat = new THREE.MeshStandardMaterial({ color: colorSecondary });
            const leftPad = new THREE.Mesh(padGeo, padMat);
            leftPad.position.set(-0.6, 0.55, 0);
            const rightPad = new THREE.Mesh(padGeo, padMat);
            rightPad.position.set(0.6, 0.55, 0);
            group.add(leftPad);
            group.add(rightPad);
            
            // Store jaw for animation
            group.userData = { jaw: jaw, talkSpeed: 0.8 + Math.random() * 0.5, timeOffset: Math.random() * Math.PI * 2 };
            
            group.position.set(x, -0.8, z);
            return group;
        }
        
        // Create two robots facing each other (one left, one right)
        const robotLeft = createRobot(-3.2, -1.8, 0x3a86ff, 0x9c27b0);
        const robotRight = createRobot(3.2, -1.8, 0xff006e, 0x00b4d8);
        // Rotate right robot to face left, left robot to face right
        robotLeft.rotation.y = 0.5;
        robotRight.rotation.y = -0.5;
        scene.add(robotLeft);
        scene.add(robotRight);
        
        // Add floating dialogue / thought particles between them (speech data streams)
        const dialogueParticleCount = 400;
        const dialogueGeo = new THREE.BufferGeometry();
        const dialoguePositions = [];
        for (let i = 0; i < dialogueParticleCount; i++) {
            // Particles floating between robots (-2 to 2 x, 0 to 1.5 y, -2 to -1 z)
            dialoguePositions.push((Math.random() - 0.5) * 5);
            dialoguePositions.push(Math.random() * 2.5);
            dialoguePositions.push((Math.random() - 0.5) * 3 - 2);
        }
        dialogueGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dialoguePositions), 3));
        const dialogueMat = new THREE.PointsMaterial({ color: 0x44ffaa, size: 0.04, transparent: true, blending: THREE.AdditiveBlending });
        const dialogueParticles = new THREE.Points(dialogueGeo, dialogueMat);
        scene.add(dialogueParticles);
        
        // Add glowing sound wave rings between robots (communication waves)
        const waveRingGeo = new THREE.TorusGeometry(0.6, 0.03, 32, 100);
        const waveMat = new THREE.MeshStandardMaterial({ color: 0x0ff, emissive: 0x0aa, transparent: true, opacity: 0.7 });
        const waveRing1 = new THREE.Mesh(waveRingGeo, waveMat);
        const waveRing2 = new THREE.Mesh(waveRingGeo, waveMat);
        waveRing1.position.set(0, 0.4, -1.2);
        waveRing2.position.set(0, 0.2, -1.5);
        scene.add(waveRing1);
        scene.add(waveRing2);
        
        // Add small floating "binary" text particles (tiny cubes) orbiting the robots
        const binaryCubes = [];
        for (let i = 0; i < 120; i++) {
            const cubeGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
            const cubeMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, emissive: 0x2266aa });
            const cube = new THREE.Mesh(cubeGeo, cubeMat);
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.2 + Math.random() * 1.5;
            cube.userData = {
                orbitCenter: { x: (Math.random() > 0.5 ? -2 : 2), z: -1.5 },
                radius: radius,
                speed: 0.005 + Math.random() * 0.01,
                angle: angle,
                yOffset: (Math.random() - 0.5) * 1.5
            };
            cube.position.x = cube.userData.orbitCenter.x + Math.cos(angle) * radius;
            cube.position.z = cube.userData.orbitCenter.z + Math.sin(angle) * radius;
            cube.position.y = cube.userData.yOffset;
            scene.add(cube);
            binaryCubes.push(cube);
        }
        
        // Animation loop
        let time = 0;
        function animate() {
            requestAnimationFrame(animate);
            time += 0.016; // approx per frame increment
            
            // Robot talking animation: jaw moves up/down in a sine wave (talking motion)
            const talkAmplitude = 0.06;
            const leftJaw = robotLeft.userData.jaw;
            const rightJaw = robotRight.userData.jaw;
            // Different frequencies for natural conversation feel
            const leftTalk = Math.sin(time * 5.2) * talkAmplitude;
            const rightTalk = Math.sin(time * 4.8 + 1.2) * talkAmplitude;
            if (leftJaw) leftJaw.position.y = 0.85 + leftTalk;
            if (rightJaw) rightJaw.position.y = 0.85 + rightTalk;
            
            // Slight head nodding / tilting for more realism
            robotLeft.children.forEach(child => {
                if (child.geometry && child.position.y > 0.9 && child.material && child.material.color.getHex() === 0xccccdd) {
                    // head slight rotation
                    child.rotation.z = Math.sin(time * 2.0) * 0.05;
                    child.rotation.x = Math.sin(time * 1.7) * 0.03;
                }
            });
            robotRight.children.forEach(child => {
                if (child.geometry && child.position.y > 0.9 && child.material && child.material.color.getHex() === 0xccccdd) {
                    child.rotation.z = Math.sin(time * 2.2 + 0.8) * 0.05;
                    child.rotation.x = Math.sin(time * 1.9 + 0.5) * 0.03;
                }
            });
            
            // Animate eye glow intensity pulse with talking rhythm
            const leftEyeIntensity = 0.6 + Math.sin(time * 8) * 0.3;
            const rightEyeIntensity = 0.6 + Math.sin(time * 7.5 + 1) * 0.3;
            robotLeft.children.forEach(child => {
                if (child.material && child.material.emissiveIntensity !== undefined && child.position.y > 1.0) {
                    child.material.emissiveIntensity = leftEyeIntensity;
                }
            });
            robotRight.children.forEach(child => {
                if (child.material && child.material.emissiveIntensity !== undefined && child.position.y > 1.0) {
                    child.material.emissiveIntensity = rightEyeIntensity;
                }
            });
            
            // Animate the wave rings (expand and contract)
            const scale = 1 + Math.sin(time * 6) * 0.2;
            waveRing1.scale.set(scale, scale, scale);
            waveRing2.scale.set(1.2 + Math.sin(time * 5.3) * 0.25, 1.2 + Math.sin(time * 5.3) * 0.25, 1);
            waveRing1.material.emissiveIntensity = 0.5 + Math.sin(time * 10) * 0.3;
            waveRing2.material.emissiveIntensity = 0.5 + Math.cos(time * 9) * 0.3;
            
            // Animate floating binary cubes around robots
            binaryCubes.forEach(cube => {
                const data = cube.userData;
                data.angle += data.speed;
                cube.position.x = data.orbitCenter.x + Math.cos(data.angle) * data.radius;
                cube.position.z = data.orbitCenter.z + Math.sin(data.angle) * data.radius;
                cube.position.y = data.yOffset + Math.sin(time * 2 + data.angle) * 0.08;
                cube.rotation.x += 0.03;
                cube.rotation.y += 0.04;
            });
            
            // Rotate dialogue particles slowly
            dialogueParticles.rotation.y += 0.003;
            dialogueParticles.rotation.x = Math.sin(time * 0.2) * 0.1;
            
            // Central knot and ring animation
            knot.rotation.x += 0.008;
            knot.rotation.y += 0.012;
            knot.rotation.z += 0.007;
            ring.rotation.z += 0.005;
            ring.rotation.y += 0.003;
            
            // Floating shapes movement
            shapesGroup.forEach((obj, idx) => {
                obj.position.x += obj.userData.speedX;
                obj.position.y += obj.userData.speedY;
                if (Math.abs(obj.position.x) > 9) obj.userData.speedX *= -1;
                if (Math.abs(obj.position.y) > 6) obj.userData.speedY *= -1;
                obj.rotation.x += obj.userData.rotSpeed;
                obj.rotation.y += obj.userData.rotSpeed;
            });
            particleSystem.rotation.y += 0.0005;
            starField.rotation.x += 0.0003;
            
            // Small camera drift for immersion
            camera.position.x += (0 - camera.position.x) * 0.02;
            camera.lookAt(0, 0.2, 0);
            renderer.render(scene, camera);
        }
        
        animate();
        
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
  

  
        // UI Interaction, Forms, Dropdown, Theme, Toast
        // UI Interaction, Forms, Dropdown, Theme, Toast
        (function() {
            // --- Toast Function ---
            function showToast(message, isError = false) {
                const existingToast = document.querySelector('.toast-msg');
                if(existingToast) existingToast.remove();
                const toast = document.createElement('div');
                toast.className = 'toast-msg';
                toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}" style="margin-right:10px;"></i> ${message}`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3500);
            }

            // --- Theme Sync ---
            const themeToggle = document.getElementById('themeToggle');
            const icon = themeToggle.querySelector('i');
            let isLight = localStorage.getItem('theme') === 'light';
            
            function applyTheme(light) {
                if (light) {
                    document.body.classList.add('light');
                    icon.className = "fas fa-sun";
                } else {
                    document.body.classList.remove('light');
                    icon.className = "fas fa-moon";
                }
            }
            
            // Apply theme on load
            applyTheme(isLight);
            
            themeToggle.addEventListener('click', () => {
                isLight = !isLight;
                localStorage.setItem('theme', isLight ? 'light' : 'dark');
                applyTheme(isLight);
                showToast(isLight ? "Light mode activated — futuristic still" : "Dark mode restored — cyberpunk aesthetic", false);
            });

            // --- Dropdown logic ---
            const dropdown = document.getElementById('accessDropdown');
            const trigger = document.getElementById('dropdownTrigger');
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) dropdown.classList.remove('active');
            });

            // smooth scroll helper
            function scrollToCard(card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.style.transform = "scale(1.02)";
                setTimeout(() => { card.style.transform = ""; }, 400);
            }

            const loginCard = document.getElementById('login-card');
            const signupCard = document.getElementById('signup-card');

            document.getElementById('gotoLogin').addEventListener('click', (e) => {
                e.preventDefault();
                scrollToCard(loginCard);
                dropdown.classList.remove('active');
            });
            document.getElementById('gotoSignup').addEventListener('click', (e) => {
                e.preventDefault();
                scrollToCard(signupCard);
                dropdown.classList.remove('active');
            });
            document.getElementById('switchToSignup')?.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToCard(signupCard);
            });
            document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToCard(loginCard);
            });

            // --- Authentication Database / Handlers ---
            const loginForm = document.getElementById('loginForm');
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value.trim();
                const pwd = document.getElementById('loginPassword').value.trim();
                if(!email || !pwd) {
                    showToast("Please fill in both email and password.", true);
                    return;
                }
                if(!email.includes('@')) {
                    showToast("Enter a valid email address", true);
                    return;
                }

                // Check in localStorage for registered users
                const storedUserKey = 'user_' + email.toLowerCase();
                const storedUserData = localStorage.getItem(storedUserKey);
                
                let loginSuccess = false;
                let userName = email.split('@')[0];

                if (storedUserData) {
                    const parsedUser = JSON.parse(storedUserData);
                    if (parsedUser.password === pwd) {
                        loginSuccess = true;
                        userName = parsedUser.fullName || parsedUser.username || userName;
                    } else {
                        showToast("Incorrect password. Please try again.", true);
                        return;
                    }
                } else if (email.toLowerCase() === 'hello@infinia.ai') {
                    // Fallback default demo user (accepts any password)
                    loginSuccess = true;
                    userName = "AI Pioneer";
                } else {
                    showToast("Email not registered. Please create an account first.", true);
                    return;
                }

                if (loginSuccess) {
                    showToast(`✨ Welcome back, ${userName}! Redirecting to workspace...`, false);
                    localStorage.setItem('infinia_user', JSON.stringify({ email: email, name: userName }));
                    setTimeout(() => {
                        window.location.href = 'ai.html';
                    }, 1200);
                }
            });

            const signupForm = document.getElementById('signupForm');
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fullName = document.getElementById('fullName').value.trim();
                const username = document.getElementById('username').value.trim();
                const email = document.getElementById('signupEmail').value.trim();
                const pass = document.getElementById('signupPassword').value.trim();
                const confirm = document.getElementById('confirmPassword').value.trim();
                const terms = document.getElementById('termsCheck').checked;

                if(!fullName || !username || !email || !pass || !confirm) {
                    showToast("All fields are required for registration.", true);
                    return;
                }
                if(!email.includes('@')) {
                    showToast("Please enter a valid email address.", true);
                    return;
                }
                if(pass !== confirm) {
                    showToast("Passwords do not match.", true);
                    return;
                }
                if(pass.length < 6) {
                    showToast("Password must be at least 6 characters.", true);
                    return;
                }
                if(!terms) {
                    showToast("You must agree to the Terms & Conditions.", true);
                    return;
                }

                // Save user credentials in localStorage
                const userKey = 'user_' + email.toLowerCase();
                const userData = { fullName, username, email, password: pass };
                localStorage.setItem(userKey, JSON.stringify(userData));

                showToast("🎉 Account created! Welcome to Infinia AI. You can now login.", false);
                signupForm.reset();
                setTimeout(() => {
                    scrollToCard(loginCard);
                    document.getElementById('loginEmail').value = email;
                }, 1200);
            });

            // Forgot password
            document.getElementById('forgotPwd').addEventListener('click', (e) => {
                e.preventDefault();
                const emailInput = document.getElementById('loginEmail').value.trim();
                if (emailInput && emailInput.includes('@')) {
                    showToast(`📧 Password reset link sent to ${emailInput}`, false);
                } else {
                    showToast("📧 Password reset link sent to your registered email", false);
                }
            });

            // AI Page Click (checks session)
            document.getElementById('aiPageBtn').addEventListener('click', () => {
                if (localStorage.getItem('infinia_user')) {
                    showToast("🚀 Entering workspace...", false);
                    setTimeout(() => {
                        window.location.href = 'ai.html';
                    }, 800);
                } else {
                    showToast("Please log in to access the Infinia AI workspace.", true);
                    scrollToCard(loginCard);
                }
            });

            // Social Login - login automatically
            const socials = document.querySelectorAll('.social-icon');
            socials.forEach(icon => {
                icon.addEventListener('click', (e) => {
                    const platform = icon.querySelector('i')?.classList[1] || "social";
                    const email = `social_user@${platform.split('-')[1] || platform}.com`;
                    const name = platform.split('-')[1] || "Social User";
                    showToast(`🔐 Logging in via ${platform.toUpperCase()}...`, false);
                    localStorage.setItem('infinia_user', JSON.stringify({ email: email, name: name }));
                    setTimeout(() => {
                        window.location.href = 'ai.html';
                    }, 1200);
                });
            });

            // --- Query parameters parsing on load ---
            const urlParams = new URLSearchParams(window.location.search);
            const toastParam = urlParams.get('toast');
            const actionParam = urlParams.get('action');

            if (toastParam === 'please_login') {
                showToast("Please sign in to access the AI workspace.", true);
                setTimeout(() => scrollToCard(loginCard), 500);
            } else if (toastParam === 'logout_success') {
                showToast("Logged out successfully. See you soon!", false);
                setTimeout(() => scrollToCard(loginCard), 500);
            }

            if (actionParam === 'signup') {
                setTimeout(() => scrollToCard(signupCard), 500);
            } else if (actionParam === 'login') {
                setTimeout(() => scrollToCard(loginCard), 500);
            }
        })();
