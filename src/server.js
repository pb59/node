const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');
const path = require('path');

// Add dotenv to load environment variables
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Use environment variable for API key
const GROQ_API_KEY = process.env.GROQ_API_KEY; // <-- Secure: not in code!

app.post('/groq', async (req, res) => {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve static files from the root and src directories
app.use(express.static(path.join(__dirname, '..')));
app.use('/src', express.static(path.join(__dirname)));

// Serve Index.html for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Index.html'));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));