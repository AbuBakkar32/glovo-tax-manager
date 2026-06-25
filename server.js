const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(express.static('public'));

// Helper: Ensure JSON database file exists
function initDatabase() {
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
    }
}
initDatabase();

// API: Get all invoices
app.get('/api/invoices', (req, res) => {
    try {
        initDatabase();
        const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
        const data = JSON.parse(fileData);
        res.json(data);
    } catch (error) {
        console.error("Read Error:", error);
        res.status(500).json({ error: "Failed to read data" });
    }
});

// API: Add new invoice
app.post('/api/invoices', (req, res) => {
    try {
        initDatabase();
        const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
        const data = JSON.parse(fileData);

        // Save the raw body data directly
        data.push(req.body);

        fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
        res.json({ success: true, message: "Invoice saved successfully!" });
    } catch (error) {
        console.error("Write Error:", error);
        res.status(500).json({ error: "Failed to save data" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});