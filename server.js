const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;
const dbPath = path.join(__dirname, 'foodloop.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from the root directory

// Database Initialization
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

function createTables() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            type TEXT NOT NULL,
            phone TEXT,
            organization TEXT,
            registeredAt TEXT
        )`);

        // Listings Table
        db.run(`CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            quantity TEXT,
            description TEXT,
            bestBefore TEXT,
            condition TEXT,
            location TEXT,
            lat REAL,
            lng REAL,
            donor TEXT,
            donorName TEXT,
            donorId INTEGER,
            organization TEXT,
            contactNumber TEXT,
            price TEXT,
            distance REAL,
            image TEXT,
            listedAt TEXT,
            reserved INTEGER DEFAULT 0,
            reservedBy INTEGER,
            reservedByName TEXT
        )`);

        // Reservations Table
        db.run(`CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            foodId INTEGER,
            foodName TEXT,
            recipientId INTEGER,
            recipientName TEXT,
            recipientEmail TEXT,
            recipientPhone TEXT,
            donorName TEXT,
            donorContact TEXT,
            location TEXT,
            bestBefore TEXT,
            price TEXT,
            reservedAt TEXT
        )`);
    });
}

// Auth Endpoints

// Signup
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, type, phone, organization } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const registeredAt = new Date().toISOString();

        const sql = `INSERT INTO users (name, email, password, type, phone, organization, registeredAt) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [name, email, hashedPassword, type, phone, organization, registeredAt];

        db.run(sql, params, function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                id: this.lastID,
                name,
                email,
                type,
                phone,
                organization
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { password: _, ...userData } = user;
        res.json(userData);
    });
});

// API Endpoints

// GET all food listings
app.get('/api/listings', (req, res) => {
    db.all('SELECT * FROM listings ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Convert reserved from 0/1 to boolean
        const formattedRows = rows.map(row => ({
            ...row,
            reserved: !!row.reserved
        }));
        res.json(formattedRows);
    });
});

// POST a new food listing
app.post('/api/listings', (req, res) => {
    const {
        name, type, quantity, description, bestBefore, condition,
        location, lat, lng, donor, donorName, donorId,
        organization, contactNumber, price, distance, image, listedAt
    } = req.body;

    const sql = `INSERT INTO listings (
        name, type, quantity, description, bestBefore, condition,
        location, lat, lng, donor, donorName, donorId,
        organization, contactNumber, price, distance, image, listedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        name, type, quantity, description, bestBefore, condition,
        location, lat, lng, donor, donorName, donorId,
        organization, contactNumber, price, distance, image, listedAt
    ];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID });
    });
});

// GET all reservations
app.get('/api/reservations', (req, res) => {
    db.all('SELECT * FROM reservations ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST a new reservation
app.post('/api/reservations', (req, res) => {
    const {
        foodId, foodName, recipientId, recipientName, recipientEmail,
        recipientPhone, donorName, donorContact, location,
        bestBefore, price, reservedAt
    } = req.body;

    db.serialize(() => {
        // Start a transaction manually by using serial mode
        db.run('BEGIN TRANSACTION');

        const insertResSql = `INSERT INTO reservations (
            foodId, foodName, recipientId, recipientName, recipientEmail,
            recipientPhone, donorName, donorContact, location,
            bestBefore, price, reservedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertResParams = [
            foodId, foodName, recipientId, recipientName, recipientEmail,
            recipientPhone, donorName, donorContact, location,
            bestBefore, price, reservedAt
        ];

        db.run(insertResSql, insertResParams, function (err) {
            if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
            }

            const updateListingSql = `UPDATE listings SET 
                reserved = 1, 
                reservedBy = ?, 
                reservedByName = ? 
                WHERE id = ?`;

            db.run(updateListingSql, [recipientId, recipientName, foodId], function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                }
                db.run('COMMIT');
                res.status(201).json({ id: this.lastID });
            });
        });
    });
});

// DELETE a listing
app.delete('/api/listings/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM listings WHERE id = ?', id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Deleted', changes: this.changes });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
