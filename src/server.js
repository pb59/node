const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

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

const db = new Database('users.db');

// Create users table if it doesn't exist
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        age INTEGER,
        skill TEXT,
        expertise INTEGER
    )
`).run();

// Sign Up endpoint
app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.json({ success: false, message: 'All fields are required.' });
    }
    try {
        db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, password);
        res.json({ success: true, user: { name, email } });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.json({ success: false, message: 'Email already registered.' });
        } else {
            res.json({ success: false, message: 'Database error.' });
        }
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT name, email, age, skill, expertise FROM users WHERE email = ? AND password = ?').get(email, password);
    if (!user) {
        return res.json({ success: false, message: 'Invalid credentials.' });
    }
    res.json({ success: true, user });
});

// Profile update endpoint
app.post('/api/profile', (req, res) => {
    const { email, age, skill, expertise } = req.body;
    try {
        db.prepare('UPDATE users SET age = ?, skill = ?, expertise = ? WHERE email = ?')
          .run(age, skill, expertise, email);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: 'Profile update failed.' });
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