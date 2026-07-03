// server.js — Infinia AI Express Server
// Serves frontend static files AND provides REST API on port 3000
// ---------------------------------------------------------------
// HOW TO RUN:
//   1. cd server
//   2. npm install
//   3. Make sure MySQL is running (see db.js for credentials)
//   4. node server.js
//   5. Open http://localhost:3000 in your browser
// ---------------------------------------------------------------

// Load environment variables from .env file (zero-dependency custom loader)
const fs = require('fs');
const path = require('path');
try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const delimiterIdx = trimmed.indexOf('=');
                if (delimiterIdx > 0) {
                    const key = trimmed.substring(0, delimiterIdx).trim();
                    let val = trimmed.substring(delimiterIdx + 1).trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length - 1);
                    }
                    process.env[key] = val;
                }
            }
        });
    }
} catch (err) {
    console.error('Error loading .env file:', err);
}

const express        = require('express');
const session        = require('express-session');
const cors           = require('cors');
const { testConnection } = require('./db');
const authRoutes      = require('./routes/auth');
const workspaceRoutes = require('./routes/workspace');

const app  = express();
const PORT = process.env.PORT || 3000;

const https = require('https');

function downloadFile(url, destPath, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
            return reject(new Error('Too many redirects'));
        }
        const requestOptions = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'image/jpeg,image/png,image/webp,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://image.pollinations.ai/'
            }
        };
        const file = fs.createWriteStream(destPath);
        https.get(url, requestOptions, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
                file.close();
                fs.unlink(destPath, () => {});
                const redirectUrl = response.headers.location;
                if (!redirectUrl) return reject(new Error('Redirect with no location header'));
                downloadFile(redirectUrl, destPath, redirectCount + 1).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(destPath, () => {});
                reject(new Error(`Failed to download: Status Code ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
            file.on('error', (err) => {
                file.close();
                fs.unlink(destPath, () => {});
                reject(err);
            });
        }).on('error', (err) => {
            file.close();
            fs.unlink(destPath, () => {});
            reject(err);
        });
    });
}

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Session ───────────────────────────────────────────────────────────────
app.use(session({
    name:   'infinia.sid',
    secret: process.env.SESSION_SECRET || 'infinia_super_secret_key_2026_xR9!qZ',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure:   false,           // set true if using HTTPS in production
        maxAge:   7 * 24 * 60 * 60 * 1000   // 7 days
    }
}));

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api/workspace', workspaceRoutes);

// GET /api/config — Check server config
app.get('/api/config', (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const hasKey = apiKey && 
                   apiKey !== 'your_gemini_api_key_here' && 
                   apiKey.trim() !== '' && 
                   !apiKey.startsWith('your_actual') && 
                   apiKey.trim().startsWith('AIzaSy');
    return res.json({ ok: true, hasGeminiKey: !!hasKey });
});

// Helper for keyless fallback calling DuckDuckGo AI Chat
async function callFreeDDG(prompt, modelName, systemPrompt) {
    let ddgModel = 'gpt-4o-mini';
    if (modelName === 'AI Simple') {
        ddgModel = 'gpt-4o-mini';
    } else if (modelName === 'AI Plus') {
        ddgModel = 'meta-llama/Llama-3-70b-Instruct';
    } else if (modelName === 'AI Pro') {
        ddgModel = 'claude-3-haiku';
    } else if (modelName === 'AI Ultra') {
        ddgModel = 'gpt-4o-mini';
    }

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

    // 1. Fetch VQD Token
    const statusRes = await fetch('https://duckduckgo.com/duckchat/v1/status', {
        headers: {
            'x-vqd-accept': '1',
            'user-agent': userAgent
        }
    });

    if (!statusRes.ok) {
        throw new Error(`Failed to initialize session with free provider: ${statusRes.statusText}`);
    }

    const vqdToken = statusRes.headers.get('x-vqd-4');
    if (!vqdToken) {
        throw new Error('Failed to retrieve free AI session token.');
    }

    // 2. Prepare payload
    let fullPrompt = prompt;
    if (systemPrompt && systemPrompt.trim() !== '') {
        fullPrompt = `[System Instruction: ${systemPrompt.trim()}]\n\n${prompt}`;
    }

    const chatPayload = {
        model: ddgModel,
        messages: [{ role: 'user', content: fullPrompt }]
    };

    // 3. Call Chat API
    const chatRes = await fetch('https://duckduckgo.com/duckchat/v1/chat', {
        method: 'POST',
        headers: {
            'x-vqd-4': vqdToken,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'user-agent': userAgent
        },
        body: JSON.stringify(chatPayload)
    });

    if (!chatRes.ok) {
        throw new Error(`Free AI provider returned error: ${chatRes.statusText}`);
    }

    const rawBody = await chatRes.text();
    
    // 4. Parse stream chunks
    let answer = '';
    const lines = rawBody.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
                const data = JSON.parse(trimmed.substring(6));
                if (data.message) {
                    answer += data.message;
                }
            } catch (e) {
                // Ignore parsing errors for individual stream lines
            }
        }
    }

    if (!answer) {
        throw new Error('Empty response received from free AI provider.');
    }

    return answer;
}

// POST /api/upload-media — Upload base64 media and save it locally on the server
app.post('/api/upload-media', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, message: 'Not authenticated.' });
    }
    const { base64, type } = req.body;
    if (!base64) {
        return res.status(400).json({ ok: false, message: 'Base64 data is required.' });
    }
    try {
        const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ ok: false, message: 'Invalid base64 format.' });
        }
        const buffer = Buffer.from(matches[2], 'base64');
        const generatedDir = path.join(__dirname, '..', 'generated');
        if (!fs.existsSync(generatedDir)) {
            fs.mkdirSync(generatedDir, { recursive: true });
        }
        const ext = type === 'video' ? 'mp4' : 'jpg';
        const filename = `media-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
        const destPath = path.join(generatedDir, filename);
        await fs.promises.writeFile(destPath, buffer);
        return res.json({ ok: true, url: `/generated/${filename}` });
    } catch (e) {
        console.error('[UPLOAD MEDIA ERROR]', e);
        return res.status(500).json({ ok: false, message: e.message });
    }
});

// POST /api/chat — Chat endpoint calling Google Gemini API, falling back to free DDG AI,
// or generating free Images and Videos via Pollinations AI.
app.post('/api/chat', async (req, res) => {
    // 1. Session verification: strictly require authentication
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, message: 'Not authenticated.' });
    }

    let { prompt, model, systemPrompt, pollinationsApiKey } = req.body;
    if (!prompt) {
        return res.status(400).json({ ok: false, message: 'Prompt is required.' });
    }

    // Media intent detection on the backend
    const cleanPrompt = prompt.trim().toLowerCase();
    let wantsImage = false;
    let wantsVideo = false;

    // Check commands/prefixes
    if (cleanPrompt.startsWith('/image') || cleanPrompt.startsWith('/draw') || cleanPrompt.startsWith('/paint') || cleanPrompt.startsWith('/generate-image')) {
        wantsImage = true;
        prompt = prompt.replace(/^\/[a-zA-Z0-9_-]+\s*/i, '').trim();
    } else if (cleanPrompt.startsWith('/video') || cleanPrompt.startsWith('/animate') || cleanPrompt.startsWith('/generate-video')) {
        wantsVideo = true;
        prompt = prompt.replace(/^\/[a-zA-Z0-9_-]+\s*/i, '').trim();
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
            if (pattern.test(cleanPrompt)) {
                wantsVideo = true;
                break;
            }
        }
        if (!wantsVideo) {
            for (const pattern of imagePatterns) {
                if (pattern.test(cleanPrompt)) {
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

    // ─── MEDIA MODELS HANDLERS ───────────────────────────────────────
    const isImageModel = ['Flux Image', 'Flux Realism', 'Flux Anime'].includes(model);
    const isVideoModel = ['Luma Video', 'Nova Reel'].includes(model);

    if (isImageModel) {
        try {
            let pollinationsModel = 'flux';
            if (model === 'Flux Realism') pollinationsModel = 'flux-realism';
            else if (model === 'Flux Anime') pollinationsModel = 'flux-anime';

            const key = (pollinationsApiKey || process.env.POLLINATIONS_API_KEY || '').trim();
            const seed = Math.floor(Math.random() * 10000000);
            let imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${pollinationsModel}&seed=${seed}&nologo=true&private=true&feed=false`;
            if (key) {
                imageUrl += `&key=${key}`;
            }

            const generatedDir = path.join(__dirname, '..', 'generated');
            if (!fs.existsSync(generatedDir)) {
                fs.mkdirSync(generatedDir, { recursive: true });
            }

            const filename = `img-${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`;
            const destPath = path.join(generatedDir, filename);

            try {
                await downloadFile(imageUrl, destPath);
            } catch (err) {
                throw new Error("Backend download failed (402/IP Rate Limit or Invalid Key). Triggering client-side fallback...");
            }

            const markdownResponse = `![Generated Image](/generated/${filename})`;
            return res.json({ ok: true, text: markdownResponse, source: 'pollinations-image' });
        } catch (imageErr) {
            console.error('[IMAGE GEN ERROR]', imageErr);
            return res.status(502).json({ ok: false, message: `Failed to generate image: ${imageErr.message}` });
        }
    }

    if (isVideoModel) {
        const key = (pollinationsApiKey || process.env.POLLINATIONS_API_KEY || '').trim();

        const generatedDir = path.join(__dirname, '..', 'generated');
        if (!fs.existsSync(generatedDir)) {
            fs.mkdirSync(generatedDir, { recursive: true });
        }

        if (!key) {
            // Provide a direct embedded free AI video generator instead of throwing an error,
            // satisfying the user's request for a free viewable video AI directly on the page.
            const iframeEmbed = `<div style="margin-top: 15px; width: 100%;">
    <p style="margin-bottom: 10px; font-weight: 500; color: #a5b4fc;"><i class="fas fa-video" style="margin-right: 8px;"></i>Free AI Video Generator (Embedded Space):</p>
    <iframe src="https://wan-ai-wan2-1.hf.space" 
            style="width: 100%; height: 580px; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; background: #070b19; box-shadow: 0 8px 32px rgba(0,0,0,0.6);" 
            allow="accelerometer; gyroscope; microphone; camera; clipboard-write"></iframe>
</div>`;
            return res.json({ ok: true, text: iframeEmbed, source: 'pollinations-video-no-key' });
        }

        try {
            console.log(`[Video Gen] Calling Pollinations with model "${model === 'Nova Reel' ? 'nova-reel' : 'p-video-720p'}"...`);
            const videoModel = model === 'Nova Reel' ? 'nova-reel' : 'p-video-720p';

            const payload = {
                model: videoModel,
                prompt: prompt,
                n: 1
            };

            const response = await fetch('https://gen.pollinations.ai/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('[POLLINATIONS VIDEO ERROR]', errData);
                throw new Error(errData.error?.message || response.statusText);
            }

            const data = await response.json();
            const videoUrl = data.data?.[0]?.url;

            if (!videoUrl) {
                throw new Error('No video URL returned from the generation server.');
            }

            const vidFilename = `vid-${Date.now()}-${Math.floor(Math.random() * 10000)}.mp4`;
            const vidDestPath = path.join(generatedDir, vidFilename);

            console.log(`[Video Gen] Downloading video from ${videoUrl} to ${vidDestPath}...`);
            let downloadSuccess = false;
            try {
                await downloadFile(videoUrl, vidDestPath);
                downloadSuccess = true;
            } catch (err) {
                console.warn(`[Video Gen] Backend download failed. Falling back to direct URL embedding...`);
            }

            if (downloadSuccess) {
                const successMsg = `<video controls src="/generated/${vidFilename}" style="max-width:100%; border-radius:12px; border: 1px solid rgba(255,255,255,0.15); box-shadow:0 8px 32px rgba(0,0,0,0.5); margin-top:10px;"></video>`;
                return res.json({ ok: true, text: successMsg, source: 'pollinations-video' });
            } else {
                const successMsg = `<video controls src="${videoUrl}" style="max-width:100%; border-radius:12px; border: 1px solid rgba(255,255,255,0.15); box-shadow:0 8px 32px rgba(0,0,0,0.5); margin-top:10px;"></video>`;
                return res.json({ ok: true, text: successMsg, source: 'pollinations-video-direct' });
            }
        } catch (videoErr) {
            console.error('[VIDEO GEN ERROR]', videoErr);
            return res.status(502).json({ 
                ok: false, 
                message: `Failed to generate video: ${videoErr.message}. Make sure your Pollinations API Key is valid and active.` 
            });
        }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isKeyless = !apiKey || 
                      apiKey === 'your_gemini_api_key_here' || 
                      apiKey.trim() === '' || 
                      apiKey.startsWith('your_actual') ||
                      !apiKey.trim().startsWith('AIzaSy');

    if (isKeyless) {
        // Fallback to 100% free keyless AI Chat
        try {
            console.log(`[AI fallback] Calling keyless AI provider for model "${model}"...`);
            const responseText = await callFreeDDG(prompt, model, systemPrompt);
            return res.json({ ok: true, text: responseText, source: 'free-keyless-fallback' });
        } catch (fallbackErr) {
            console.error('[AI FALLBACK ERROR]', fallbackErr);
            return res.status(502).json({ 
                ok: false, 
                message: `Failed to get response from free AI fallback: ${fallbackErr.message}` 
            });
        }
    }

    // Otherwise, call Gemini API with user's key
    let geminiModel = 'gemini-1.5-flash';
    if (model === 'AI Simple') {
        geminiModel = 'gemini-1.5-flash';
    } else if (model === 'AI Plus') {
        geminiModel = 'gemini-2.0-flash';
    } else if (model === 'AI Pro') {
        geminiModel = 'gemini-1.5-pro';
    } else if (model === 'AI Ultra') {
        geminiModel = 'gemini-2.0-flash-thinking-exp';
    }

    try {
        const payload = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ]
        };

        if (systemPrompt && systemPrompt.trim() !== '') {
            payload.systemInstruction = {
                parts: [{ text: systemPrompt.trim() }]
            };
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('[GEMINI API ERROR]', errData);
            return res.status(502).json({ 
                ok: false, 
                message: `Gemini API returned error: ${errData.error?.message || response.statusText}` 
            });
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        
        return res.json({ ok: true, text: responseText, source: 'gemini-api' });
    } catch (err) {
        console.error('[CHAT ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Server error occurred while calling the Gemini API.' });
    }
});

// ── Serve Static Frontend Files ───────────────────────────────────────────
// The frontend files are in the parent directory of /server
const staticDir = path.join(__dirname, '..');
app.use(express.static(staticDir));

// Catch-all: serve index.html for unmatched routes (SPA-style fallback)
app.get('*', (req, res) => {
    // Only for non-API routes
    if (!req.path.startsWith('/api')) {
        const filePath = path.join(staticDir, req.path);
        res.sendFile(filePath, (err) => {
            if (err) {
                res.sendFile(path.join(staticDir, 'index.html'));
            }
        });
    }
});

// ── Start Server ──────────────────────────────────────────────────────────
async function start() {
    try {
        // Verify database and tables exist
        await testConnection();

        app.listen(PORT, () => {
            console.log('');
            console.log('╔══════════════════════════════════════════════════╗');
            console.log('║         🚀  INFINIA AI SERVER STARTED            ║');
            console.log(`║   → http://localhost:${PORT}                        ║`);
            console.log('║   → Login:  http://localhost:3000/index.html     ║');
            console.log('║   → Signup: http://localhost:3000/signup.html    ║');
            console.log('║   → AI:     http://localhost:3000/ai.html        ║');
            console.log('╚══════════════════════════════════════════════════╝');
            console.log('');
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        console.error('');
        console.error('Make sure MySQL is running and credentials in db.js are correct.');
        process.exit(1);
    }
}

start();
