const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Format JSON tidak valid.')); }
    });
    req.on('error', reject);
  });
}

async function supabaseRequest(table, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL dan SUPABASE_ANON_KEY belum diatur.');
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${options.query || ''}`, {
    method: options.method || 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(data?.message || data?.hint || 'Supabase request gagal.');
  return data;
}

async function getCollection(table, query = '?select=*') {
  return supabaseRequest(table, { query });
}

function addMovement(material, quantity, type, reason) {
  const history = Array.isArray(material.stock_history) ? material.stock_history : [];
  history.unshift({ id: `${Date.now()}-${Math.random()}`, quantity: Number(quantity), type, reason, created_at: new Date().toISOString() });
  return history;
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/dashboard') {
    const [materials, products, orders] = await Promise.all([
      getCollection('raw_materials', '?select=*&order=name.asc'),
      getCollection('products', '?select=*&order=name.asc'),
      getCollection('orders', '?select=*&order=created_at.desc&limit=8')
    ]);
    return sendJson(res, 200, { materials, products, orders });
  }

  if (req.method === 'GET' && url.pathname === '/api/materials') {
    return sendJson(res, 200, await getCollection('raw_materials', '?select=*&order=name.asc'));
  }
  if (req.method === 'GET' && url.pathname === '/api/products') {
    return sendJson(res, 200, await getCollection('products', '?select=*&order=name.asc'));
  }
  if (req.method === 'GET' && url.pathname === '/api/orders') {
    return sendJson(res, 200, await getCollection('orders', '?select=*&order=created_at.desc'));
  }

  if (req.method === 'POST' && url.pathname === '/api/materials') {
    const body = await readBody(req);
    if (!body.name || !body.unit) return sendJson(res, 400, { error: 'Nama dan satuan bahan wajib diisi.' });
    const created = await supabaseRequest('raw_materials', { method: 'POST', body: { name: body.name, unit: body.unit, stock_quantity: Number(body.stock_quantity) || 0, minimum_stock: Number(body.minimum_stock) || 0, expiry_date: body.expiry_date || null, supplier: body.supplier || '' } });
    return sendJson(res, 201, created[0]);
  }

  if (req.method === 'PATCH' && /^\/api\/materials\/[^/]+$/.test(url.pathname)) {
    const body = await readBody(req); const id = url.pathname.split('/').pop();
    const current = await supabaseRequest('raw_materials', { query: `?select=*&id=eq.${encodeURIComponent(id)}` });
    if (!current[0]) return sendJson(res, 404, { error: 'Bahan baku tidak ditemukan.' });
    const nextStock = Number(body.stock_quantity) || 0; const previousStock = Number(current[0].stock_quantity); const patch = { name: body.name, unit: body.unit, stock_quantity: nextStock, minimum_stock: Number(body.minimum_stock) || 0, expiry_date: body.expiry_date || null, supplier: body.supplier || '' };
    if (nextStock !== previousStock) patch.stock_history = addMovement(current[0], nextStock - previousStock, 'adjust', 'Penyesuaian stok manual');
    const updated = await supabaseRequest('raw_materials', { method: 'PATCH', query: `?id=eq.${encodeURIComponent(id)}`, body: patch });
    if (!updated[0]) return sendJson(res, 404, { error: 'Bahan baku tidak ditemukan.' });
    return sendJson(res, 200, updated[0]);
  }

  if (req.method === 'DELETE' && /^\/api\/materials\/[^/]+$/.test(url.pathname)) {
    const id = url.pathname.split('/').pop(); const products = await getCollection('products');
    if (products.some(product => (product.recipe || []).some(recipe => recipe.material_id === id))) return sendJson(res, 409, { error: 'Bahan masih dipakai dalam resep produk.' });
    const removed = await supabaseRequest('raw_materials', { method: 'DELETE', query: `?id=eq.${encodeURIComponent(id)}` });
    if (!removed[0]) return sendJson(res, 404, { error: 'Bahan baku tidak ditemukan.' });
    return sendJson(res, 200, removed[0]);
  }

  if (req.method === 'POST' && url.pathname === '/api/products') {
    const body = await readBody(req);
    if (!body.name || !body.category) return sendJson(res, 400, { error: 'Nama dan kategori produk wajib diisi.' });
    const created = await supabaseRequest('products', { method: 'POST', body: { name: body.name, category: body.category, price: Number(body.price) || 0, stock_quantity: Number(body.stock_quantity) || 0, recipe: [] } });
    return sendJson(res, 201, created[0]);
  }

  if (req.method === 'PATCH' && /^\/api\/products\/[^/]+$/.test(url.pathname)) {
    const body = await readBody(req); const id = url.pathname.split('/').pop();
    const updated = await supabaseRequest('products', { method: 'PATCH', query: `?id=eq.${encodeURIComponent(id)}`, body: { name: body.name, category: body.category, price: Number(body.price) || 0, stock_quantity: Number(body.stock_quantity) || 0 } });
    if (!updated[0]) return sendJson(res, 404, { error: 'Produk tidak ditemukan.' });
    return sendJson(res, 200, updated[0]);
  }

  if (req.method === 'DELETE' && /^\/api\/products\/[^/]+$/.test(url.pathname)) {
    const id = url.pathname.split('/').pop(); const removed = await supabaseRequest('products', { method: 'DELETE', query: `?id=eq.${encodeURIComponent(id)}` });
    if (!removed[0]) return sendJson(res, 404, { error: 'Produk tidak ditemukan.' });
    return sendJson(res, 200, removed[0]);
  }

  if (req.method === 'PATCH' && /^\/api\/orders\/[^/]+$/.test(url.pathname)) {
    const body = await readBody(req); const id = url.pathname.split('/').pop();
    const patch = {}; if (body.status) patch.status = body.status; if (body.cafe_name) patch.cafe_name = body.cafe_name;
    const updated = await supabaseRequest('orders', { method: 'PATCH', query: `?id=eq.${encodeURIComponent(id)}`, body: patch });
    if (!updated[0]) return sendJson(res, 404, { error: 'Pesanan tidak ditemukan.' });
    return sendJson(res, 200, updated[0]);
  }

  if (req.method === 'DELETE' && /^\/api\/orders\/[^/]+$/.test(url.pathname)) {
    const id = url.pathname.split('/').pop(); const orders = await supabaseRequest('orders', { query: `?select=*&id=eq.${encodeURIComponent(id)}` });
    const order = orders[0]; if (!order) return sendJson(res, 404, { error: 'Pesanan tidak ditemukan.' });
    for (const item of order.items || []) {
      const products = await supabaseRequest('products', { query: `?select=stock_quantity&id=eq.${encodeURIComponent(item.product_id)}` });
      if (products[0]) await supabaseRequest('products', { method: 'PATCH', query: `?id=eq.${encodeURIComponent(item.product_id)}`, body: { stock_quantity: Number(products[0].stock_quantity) + Number(item.quantity) } });
    }
    const removed = await supabaseRequest('orders', { method: 'DELETE', query: `?id=eq.${encodeURIComponent(id)}` });
    return sendJson(res, 200, removed[0]);
  }

  if (req.method === 'POST' && url.pathname === '/api/materials/purchase') {
    const body = await readBody(req);
    const quantity = Number(body.quantity);
    if (!body.material_id || !Number.isFinite(quantity) || quantity <= 0) {
      return sendJson(res, 400, { error: 'Bahan dan jumlah pembelian wajib diisi.' });
    }
    const current = await supabaseRequest('raw_materials', { query: `?select=*&id=eq.${encodeURIComponent(body.material_id)}` });
    if (!current[0]) return sendJson(res, 404, { error: 'Bahan baku tidak ditemukan.' });
    const patch = { stock_quantity: Number(current[0].stock_quantity) + quantity, stock_history: addMovement(current[0], quantity, 'receive', 'Penerimaan pembelian') };
    const updated = await supabaseRequest('raw_materials', {
      method: 'PATCH',
      query: `?id=eq.${encodeURIComponent(body.material_id)}`,
      body: patch
    });
    return sendJson(res, 201, updated[0]);
  }

  if (req.method === 'POST' && url.pathname === '/api/production') {
    const body = await readBody(req);
    const quantity = Number(body.quantity);
    if (!body.product_id || !Number.isInteger(quantity) || quantity <= 0) {
      return sendJson(res, 400, { error: 'Produk dan jumlah produksi wajib diisi.' });
    }
    const products = await supabaseRequest('products', { query: `?select=*&id=eq.${encodeURIComponent(body.product_id)}` });
    const product = products[0];
    if (!product) return sendJson(res, 404, { error: 'Produk tidak ditemukan.' });
    const materials = await getCollection('raw_materials');
    const materialMap = new Map(materials.map(material => [material.id, material]));
    for (const recipe of product.recipe || []) {
      const material = materialMap.get(recipe.material_id);
      const needed = Number(recipe.quantity) * quantity;
      if (!material || Number(material.stock_quantity) < needed) {
        return sendJson(res, 400, { error: `Stok ${material?.name || 'bahan'} tidak cukup.` });
      }
    }
    for (const recipe of product.recipe || []) {
      const material = materialMap.get(recipe.material_id);
      const movementQuantity = -(Number(recipe.quantity) * quantity);
      await supabaseRequest('raw_materials', {
        method: 'PATCH',
        query: `?id=eq.${encodeURIComponent(material.id)}`,
        body: { stock_quantity: Number(material.stock_quantity) + movementQuantity, stock_history: addMovement(material, movementQuantity, 'consume', `Produksi ${product.name} (${quantity} batch)`) }
      });
    }
    const updated = await supabaseRequest('products', {
      method: 'PATCH',
      query: `?id=eq.${encodeURIComponent(product.id)}`,
      body: { stock_quantity: Number(product.stock_quantity) + quantity }
    });
    return sendJson(res, 201, updated[0]);
  }

  if (req.method === 'POST' && url.pathname === '/api/orders') {
    const body = await readBody(req);
    const requestedItems = Array.isArray(body.items) ? body.items : [];
    if (!body.cafe_name || !requestedItems.length) return sendJson(res, 400, { error: 'Nama cafe dan item pesanan wajib diisi.' });

    const items = [];
    const stockByProduct = new Map();
    for (const requestedItem of requestedItems) {
      const quantity = Number(requestedItem.quantity);
      if (!requestedItem.product_id || !Number.isInteger(quantity) || quantity <= 0) {
        return sendJson(res, 400, { error: 'Produk dan jumlah pesanan tidak valid.' });
      }
      const products = await supabaseRequest('products', {
        query: `?select=*&id=eq.${encodeURIComponent(requestedItem.product_id)}`
      });
      const product = products[0];
      if (!product) return sendJson(res, 404, { error: 'Produk pesanan tidak ditemukan.' });
      if (Number(product.stock_quantity) < quantity) {
        return sendJson(res, 400, { error: `Stok ${product.name} tidak cukup.` });
      }
      stockByProduct.set(product.id, Number(product.stock_quantity));
      items.push({ product_id: product.id, name: product.name, price: Number(product.price), quantity });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.11);
    const order = await supabaseRequest('orders', {
      method: 'POST',
      body: { cafe_name: body.cafe_name, items, subtotal, tax, total: subtotal + tax, status: 'Menunggu' }
    });

    for (const item of items) {
      await supabaseRequest('products', {
        method: 'PATCH',
        query: `?id=eq.${encodeURIComponent(item.product_id)}`,
        body: { stock_quantity: stockByProduct.get(item.product_id) - item.quantity }
      });
    }
    return sendJson(res, 201, order[0]);
  }

  sendJson(res, 404, { error: 'Endpoint tidak ditemukan.' });
}

function serveFrontend(req, res, url) {
  const requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const filePath = path.normalize(path.join(FRONTEND_DIR, requested));
  if (!filePath.startsWith(FRONTEND_DIR)) return sendJson(res, 403, { error: 'Akses ditolak.' });
  fs.readFile(filePath, (error, content) => {
    if (error) return sendJson(res, 404, { error: 'Halaman tidak ditemukan.' });
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
    res.writeHead(200, { 'Content-Type': `${types[path.extname(filePath)] || 'text/plain'}; charset=utf-8` });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') return sendJson(res, 204, null);
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
    else serveFrontend(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(PORT, () => console.log(`Ruang Rasa berjalan di http://localhost:${PORT}`));
