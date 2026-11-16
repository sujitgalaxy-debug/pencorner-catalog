const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

const activeTokens = new Set();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readProducts() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeProducts(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/api/login', (req, res) => {
  const { username, pin } = req.body || {};
  if (String(username || '').toLowerCase() === ADMIN_USER && String(pin || '') === ADMIN_PIN) {
    const token = crypto.randomBytes(24).toString('hex');
    activeTokens.add(token);
    return res.json({ token, username: ADMIN_USER });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/logout', requireAdmin, (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  activeTokens.delete(token);
  res.json({ ok: true });
});

app.get('/api/products', (req, res) => {
  res.json(readProducts());
});

app.post('/api/products', requireAdmin, (req, res) => {
  const items = readProducts();
  const item = { ...req.body, id: req.body.id || ('p_' + Date.now()) };
  items.unshift(item);
  writeProducts(items);
  res.status(201).json(item);
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const items = readProducts();
  const idx = items.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { ...items[idx], ...req.body, id: req.params.id };
  writeProducts(items);
  res.json(items[idx]);
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const items = readProducts().filter(p => p.id !== req.params.id);
  writeProducts(items);
  res.json({ ok: true });
});

app.post('/api/products/bulk', requireAdmin, (req, res) => {
  const { ids, action, value } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array required' });
  }
  const idSet = new Set(ids);
  let items = readProducts();

  if (action === 'delete') {
    items = items.filter(p => !idSet.has(p.id));
  } else if (action === 'stock') {
    items.forEach(p => { if (idSet.has(p.id)) p.stock = value; });
  } else if (action === 'category') {
    items.forEach(p => { if (idSet.has(p.id)) p.category = value; });
  } else if (action === 'wholesalePct') {
    const pct = Number(value);
    items.forEach(p => {
      if (idSet.has(p.id)) p.wholesalePrice = Math.round(Number(p.retailPrice || 0) * (1 - pct / 100) * 100) / 100;
    });
  } else if (action === 'retailPct') {
    const pct = Number(value);
    items.forEach(p => {
      if (idSet.has(p.id)) p.retailPrice = Math.max(0, Math.round(Number(p.retailPrice || 0) * (1 + pct / 100) * 100) / 100);
    });
  } else {
    return res.status(400).json({ error: 'Unknown bulk action' });
  }

  writeProducts(items);
  res.json({ ok: true, count: items.length });
});

app.post('/api/products/sync', requireAdmin, (req, res) => {
  const { products } = req.body || {};
  if (!Array.isArray(products)) return res.status(400).json({ error: 'products array required' });
  writeProducts(products);
  res.json({ ok: true, count: products.length });
});

app.listen(PORT, () => {
  console.log(`Pen Corner Catalog server running at http://localhost:${PORT}`);
});
