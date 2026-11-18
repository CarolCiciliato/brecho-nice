const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'produto-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Erro ao conectar ao SQLite:', err.message);
    else console.log('Conectado ao banco SQLite: database.sqlite');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    db.get(`SELECT count(*) as count FROM admin`, [], (err, row) => {
        if (!err && row.count === 0) {
            const hash = bcrypt.hashSync('admin123', 10);
            db.run(`INSERT INTO admin (username, password) VALUES ('admin', ?)`, [hash]);
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        size TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT NOT NULL,
        image TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.get(`SELECT count(*) as count FROM products`, [], (err, row) => {
        if (!err && row.count === 0) {
            const seedProducts = [
                ['Jaqueta Jeans Vintage', 120.00, 'M', 'Roupas', 'Mulheres', 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500'],
                ['Camisa Linho Masculina', 85.00, 'G', 'Roupas', 'Homens', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500'],
                ['Bolsa de Couro Retro', 95.00, 'Único', 'Acessórios', 'Mulheres', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500'],
                ['Bota Macboot Trilha', 140.00, '40', 'Calçados', 'Homens', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
                ['Vestido Infantil Floral', 45.00, 'P', 'Roupas', 'Crianças', 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500']
            ];
            const stmt = db.prepare(`INSERT INTO products (title, price, size, category, subcategory, image) VALUES (?, ?, ?, ?, ?, ?)`);
            seedProducts.forEach(prod => stmt.run(prod));
            stmt.finalize();
        }
    });
});

app.get('/api/products', (req, res) => {
    db.all(`SELECT * FROM products ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM admin WHERE username = ?`, [username], (err, admin) => {
        if (err || !admin) return res.status(401).json({ error: 'Usuário ou senha incorretos' });
        const valid = bcrypt.compareSync(password, admin.password);
        if (!valid) return res.status(401).json({ error: 'Usuário ou senha incorretos' });
        res.json({ success: true, message: 'Autenticado com sucesso' });
    });
});

app.post('/api/admin/change-password', (req, res) => {
    const { currPass, newPass } = req.body;
    db.get(`SELECT * FROM admin WHERE username = 'admin'`, [], (err, admin) => {
        if (err || !admin) return res.status(400).json({ error: 'Admin não encontrado' });
        const valid = bcrypt.compareSync(currPass, admin.password);
        if (!valid) return res.status(400).json({ error: 'Senha atual incorreta' });
        const newHash = bcrypt.hashSync(newPass, 10);
        db.run(`UPDATE admin SET password = ? WHERE username = 'admin'`, [newHash], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Senha alterada com sucesso!' });
        });
    });
});

app.post('/api/products', upload.single('imageFile'), (req, res) => {
    const { title, price, size, category, subcategory, imageUrl } = req.body;
    let imagePath = imageUrl;
    if (req.file) imagePath = '/uploads/' + req.file.filename;
    if (!imagePath) imagePath = 'https://via.placeholder.com/400';

    const sql = `INSERT INTO products (title, price, size, category, subcategory, image) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [title, price, size, category, subcategory, imagePath], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID, image: imagePath });
    });
});

app.put('/api/products/:id', upload.single('imageFile'), (req, res) => {
    const { id } = req.params;
    const { title, price, size, category, subcategory, imageUrl } = req.body;

    db.get(`SELECT image FROM products WHERE id = ?`, [id], (err, prod) => {
        if (err || !prod) return res.status(404).json({ error: 'Produto não encontrado' });
        let imagePath = prod.image;
        if (req.file) imagePath = '/uploads/' + req.file.filename;
        else if (imageUrl) imagePath = imageUrl;

        const sql = `UPDATE products SET title = ?, price = ?, size = ?, category = ?, subcategory = ?, image = ? WHERE id = ?`;
        db.run(sql, [title, price, size, category, subcategory, imagePath, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM products WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`   BRECHÓ NICE - Servidor Rodando na porta ${PORT} `);
    console.log(`   Acesse no navegador: http://localhost:${PORT}`);
    console.log(`================================================`);
});
