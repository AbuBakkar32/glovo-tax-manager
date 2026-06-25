const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'database.json');

app.use(express.json());

// Session Configuration
app.use(session({
    secret: 'glovo-tax-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Session expires in 1 day
}));

// Auth Middleware: Route block korar jonno
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ error: "Unauthorized. Please login." });
}

// Helper: Ensure JSON database file exists
function initDatabase() {
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
    }
}
initDatabase();

// API: Handle Login Authentication
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Set your custom login credentials here
    if (username === 'Abu Bakkar' && password === 'AbuBakkar@32') {
        req.session.user = username;
        res.json({ success: true, message: "Login successful!" });
    } else {
        res.status(401).json({ success: false, message: "Invalid username or password" });
    }
});

// API: Handle Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// API: Get login status for frontend redirect layout
app.get('/api/auth-check', (req, res) => {
    if (req.session && req.session.user) {
        // Enforcing correct username parameter mapping
        res.json({ loggedIn: true, username: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// SECURED APIs (isAuthenticated middleware added)
app.get('/api/invoices', isAuthenticated, (req, res) => {
    try {
        initDatabase();
        const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
        res.json(JSON.parse(fileData));
    } catch (error) {
        res.status(500).json({ error: "Failed to read data" });
    }
});

app.post('/api/invoices', isAuthenticated, (req, res) => {
    try {
        initDatabase();
        const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
        const data = JSON.parse(fileData);
        data.push(req.body);
        fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to save data" });
    }
});

// Static assets serving router fallback structure
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});