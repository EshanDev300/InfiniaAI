// script.js — Landing & Global Client Engine
(function() {
    'use strict';
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const full_name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value.trim();

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ full_name, username: email.split('@')[0], email, password })
                });
                const data = await res.json();
                if (data.ok) {
                    alert("Account created successfully! Please Log In.");
                    signupForm.reset();
                } else {
                    alert(data.message || "Sign up failed.");
                }
            } catch (err) {
                alert("Server interface connectivity issue.");
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
                    window.location.href = 'ai.html';
                } else {
                    alert(data.message || "Invalid credentials.");
                }
            } catch (err) {
                alert("Server asset verification failed.");
            }
        });
    }
})();
