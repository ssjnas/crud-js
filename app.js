const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- config from ENV (works with local MySQL, Docker, or RDS) ----
const port = process.env.PORT || 3000;
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'testdb_1'
};

// ---- MySQL connection with retry (handles container start ordering) ----
let db = mysql.createConnection(dbConfig);
function connectWithRetry(retries = 10, delayMs = 2000) {
  db.connect((err) => {
    if (err) {
      console.error('MySQL connection error:', err.message);
      if (retries > 0) {
        console.log(`Retrying in ${delayMs / 1000}s... (${retries} left)`);
        setTimeout(() => {
          db = mysql.createConnection(dbConfig);
          connectWithRetry(retries - 1, delayMs);
        }, delayMs);
      } else {
        console.error('MySQL connection failed after retries. Exiting.');
        process.exit(1);
      }
    } else {
      console.log('MySQL Connected...');
    }
  });
}
connectWithRetry();

// ---- routes ----
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/createTable', (req, res) => {
  const sql = 'CREATE TABLE IF NOT EXISTS items(id INT AUTO_INCREMENT, name VARCHAR(255), PRIMARY KEY(id))';
  db.query(sql, (err) => {
    if (err) return res.status(500).send(err.message);
    res.send('Items table created...');
  });
});

app.post('/addItem', (req, res) => {
  const item = { name: req.body.name };
  const sql = 'INSERT INTO items SET ?';
  db.query(sql, item, (err) => {
    if (err) return res.status(500).send(err.message);
    res.send('Item added...');
  });
});

app.get('/getItems', (req, res) => {
  const sql = 'SELECT * FROM items';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err.message);
    res.json(results);
  });
});

app.get('/getItem/:id', (req, res) => {
  const sql = 'SELECT * FROM items WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err.message);
    res.json(result);
  });
});

app.put('/updateItem/:id', (req, res) => {
  const sql = 'UPDATE items SET name = ? WHERE id = ?';
  db.query(sql, [req.body.name, req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.send('Item updated...');
  });
});

app.delete('/deleteItem/:id', (req, res) => {
  const sql = 'DELETE FROM items WHERE id = ?';
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.send('Item deleted...');
  });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
