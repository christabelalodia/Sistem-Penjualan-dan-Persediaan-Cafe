const state = { materials: [], products: [], orders: [] };
const rupiah = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const $ = selector => document.querySelector(selector);
const localMode = window.location.protocol === 'file:';
const localKey = 'ruang-rasa-data';
const localSeed = {
  materials: [
    { id: 'm1', name: 'Kopi Arabika', unit: 'kg', stock_quantity: 12, minimum_stock: 5, expiry_date: '2027-01-15', supplier: 'PT Biji Nusantara' },
    { id: 'm2', name: 'Susu Fresh Milk', unit: 'liter', stock_quantity: 18, minimum_stock: 8, expiry_date: '2026-10-04', supplier: 'Segar Jaya' },
    { id: 'm3', name: 'Tepung Terigu', unit: 'kg', stock_quantity: 25, minimum_stock: 10, expiry_date: '2027-03-20', supplier: 'Pangan Makmur' },
    { id: 'm4', name: 'Gula Aren', unit: 'kg', stock_quantity: 9, minimum_stock: 3, expiry_date: '2027-02-12', supplier: 'Manis Alami' }
  ],
  products: [
    { id: 'p1', name: 'Kopi Susu Ruang', category: 'Minuman', price: 18000, stock_quantity: 24, recipe: [{ material_id: 'm1', quantity: .018 }, { material_id: 'm2', quantity: .2 }, { material_id: 'm4', quantity: .02 }] },
    { id: 'p2', name: 'Nasi Ayam Rempah', category: 'Makanan', price: 32000, stock_quantity: 12, recipe: [{ material_id: 'm3', quantity: .12 }, { material_id: 'm4', quantity: .015 }] },
    { id: 'p3', name: 'Es Kopi Aren', category: 'Minuman', price: 22000, stock_quantity: 18, recipe: [{ material_id: 'm1', quantity: .018 }, { material_id: 'm2', quantity: .2 }, { material_id: 'm4', quantity: .025 }] },
    { id: 'p4', name: 'Toast Kaya', category: 'Makanan', price: 16000, stock_quantity: 20, recipe: [{ material_id: 'm3', quantity: .08 }, { material_id: 'm4', quantity: .01 }] }
  ],
  orders: []
};
function localData() { const saved = localStorage.getItem(localKey); if (!saved) localStorage.setItem(localKey, JSON.stringify(localSeed)); return JSON.parse(localStorage.getItem(localKey)); }
function saveLocal(data) { localStorage.setItem(localKey, JSON.stringify(data)); return data; }
function addLocalMovement(material, quantity, type, reason) { if (!Array.isArray(material.stock_history)) material.stock_history = []; material.stock_history.unshift({ id: `mv-${Date.now()}-${Math.random()}`, quantity: Number(quantity), type, reason, created_at: new Date().toISOString() }); }
async function localApi(path, options = {}) {
  const data = localData();
  const body = options.body ? JSON.parse(options.body) : {};
  if (path === '/api/dashboard') return data;
  if (path === '/api/materials' && (!options.method || options.method === 'GET')) return data.materials;
  if (path === '/api/products' && (!options.method || options.method === 'GET')) return data.products;
  if (path === '/api/orders' && (!options.method || options.method === 'GET')) return data.orders;
  if (path === '/api/materials' && options.method === 'POST') {
    if (!body.name || !body.unit) throw new Error('Nama dan satuan bahan wajib diisi.');
    const material = { id: `m-${Date.now()}`, name: body.name, unit: body.unit, stock_quantity: Number(body.stock_quantity) || 0, minimum_stock: Number(body.minimum_stock) || 0, expiry_date: body.expiry_date || null, supplier: body.supplier || '' };
    data.materials.push(material); saveLocal(data); return material;
  }
  if (path.match(/^\/api\/materials\/[^/]+$/) && ['PATCH', 'PUT'].includes(options.method)) {
    const material = data.materials.find(item => item.id === path.split('/').pop());
    if (!material) throw new Error('Bahan baku tidak ditemukan.');
    const previousStock = Number(material.stock_quantity); const nextStock = Number(body.stock_quantity) || 0; Object.assign(material, { name: body.name, unit: body.unit, stock_quantity: nextStock, minimum_stock: Number(body.minimum_stock) || 0, expiry_date: body.expiry_date || null, supplier: body.supplier || '' }); if (nextStock !== previousStock) addLocalMovement(material, nextStock - previousStock, 'adjust', 'Penyesuaian stok manual'); saveLocal(data); return material;
  }
  if (path.match(/^\/api\/materials\/[^/]+$/) && options.method === 'DELETE') {
    const index = data.materials.findIndex(item => item.id === path.split('/').pop());
    if (index < 0) throw new Error('Bahan baku tidak ditemukan.');
    if (data.products.some(product => (product.recipe || []).some(recipe => recipe.material_id === data.materials[index].id))) throw new Error('Bahan masih dipakai dalam resep produk.');
    const removed = data.materials.splice(index, 1)[0]; saveLocal(data); return removed;
  }
  if (path === '/api/products' && options.method === 'POST') {
    if (!body.name || !body.category) throw new Error('Nama dan kategori produk wajib diisi.');
    const product = { id: `p-${Date.now()}`, name: body.name, category: body.category, price: Number(body.price) || 0, stock_quantity: Number(body.stock_quantity) || 0, recipe: [] };
    data.products.push(product); saveLocal(data); return product;
  }
  if (path.match(/^\/api\/products\/[^/]+$/) && ['PATCH', 'PUT'].includes(options.method)) {
    const product = data.products.find(item => item.id === path.split('/').pop());
    if (!product) throw new Error('Produk tidak ditemukan.');
    Object.assign(product, { name: body.name, category: body.category, price: Number(body.price) || 0, stock_quantity: Number(body.stock_quantity) || 0 }); saveLocal(data); return product;
  }
  if (path.match(/^\/api\/products\/[^/]+$/) && options.method === 'DELETE') {
    const index = data.products.findIndex(item => item.id === path.split('/').pop());
    if (index < 0) throw new Error('Produk tidak ditemukan.');
    const removed = data.products.splice(index, 1)[0]; saveLocal(data); return removed;
  }
  if (path.match(/^\/api\/orders\/[^/]+$/) && ['PATCH', 'PUT'].includes(options.method)) {
    const order = data.orders.find(item => item.id === path.split('/').pop());
    if (!order) throw new Error('Pesanan tidak ditemukan.');
    if (body.status && ['Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'].includes(body.status)) order.status = body.status;
    if (body.cafe_name) order.cafe_name = body.cafe_name;
    saveLocal(data); return order;
  }
  if (path.match(/^\/api\/orders\/[^/]+$/) && options.method === 'DELETE') {
    const index = data.orders.findIndex(item => item.id === path.split('/').pop());
    if (index < 0) throw new Error('Pesanan tidak ditemukan.');
    const removed = data.orders.splice(index, 1)[0];
    for (const item of removed.items || []) { const product = data.products.find(entry => entry.id === item.product_id); if (product) product.stock_quantity += Number(item.quantity); }
    saveLocal(data); return removed;
  }
  if (path === '/api/materials/purchase') {
    const material = data.materials.find(item => item.id === body.material_id);
    if (!material || Number(body.quantity) <= 0) throw new Error('Bahan dan jumlah pembelian wajib diisi.');
    material.stock_quantity = Number(material.stock_quantity) + Number(body.quantity); addLocalMovement(material, Number(body.quantity), 'receive', 'Penerimaan pembelian'); saveLocal(data); return material;
  }
  if (path === '/api/production') {
    const product = data.products.find(item => item.id === body.product_id); const quantity = Number(body.quantity);
    if (!product || !Number.isInteger(quantity) || quantity <= 0) throw new Error('Produk dan jumlah produksi tidak valid.');
    const materialMap = new Map(data.materials.map(item => [item.id, item]));
    for (const recipe of product.recipe || []) { const material = materialMap.get(recipe.material_id); if (!material || Number(material.stock_quantity) < Number(recipe.quantity) * quantity) throw new Error(`Stok ${material?.name || 'bahan'} tidak cukup.`); }
    for (const recipe of product.recipe || []) { const used = Number(recipe.quantity) * quantity; const material = materialMap.get(recipe.material_id); material.stock_quantity -= used; addLocalMovement(material, -used, 'consume', `Produksi ${product.name} (${quantity} batch)`); }
    product.stock_quantity += quantity; saveLocal(data); return product;
  }
  if (path === '/api/orders') {
    const source = body.items || []; const items = source.map(item => { const product = data.products.find(entry => entry.id === item.product_id); const quantity = Number(item.quantity); if (!product || !Number.isInteger(quantity) || quantity <= 0) throw new Error('Produk dan jumlah pesanan tidak valid.'); if (product.stock_quantity < quantity) throw new Error(`Stok ${product.name} tidak cukup.`); product.stock_quantity -= quantity; return { product_id: product.id, name: product.name, price: product.price, quantity }; });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0); const order = { id: `o-${Date.now()}`, cafe_name: body.cafe_name, items, subtotal, tax: Math.round(subtotal * .11), total: subtotal + Math.round(subtotal * .11), status: 'Menunggu', created_at: new Date().toISOString() }; data.orders.unshift(order); saveLocal(data); return order;
  }
  throw new Error('Endpoint lokal tidak ditemukan.');
}

async function api(path, options = {}) {
  if (localMode) return localApi(path, options);
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan.');
  return data;
}
function notify(message, error = false) { const el = $('#notice'); el.textContent = message; el.className = `notice${error ? ' error' : ''}`; el.hidden = false; setTimeout(() => { el.hidden = true; }, 4200); }
function showView(name) { document.querySelectorAll('.view').forEach(view => view.classList.toggle('active-view', view.id === `${name}-view`)); document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === name)); $('#page-title').textContent = 'Ruang Rasa'; }
function fillSelect(selector, items, label) { $(selector).innerHTML = items.map(item => `<option value="${item.id}">${item.name} · ${label(item)}</option>`).join(''); }
function renderDashboard() {
  const low = state.materials.filter(item => Number(item.stock_quantity) <= Number(item.minimum_stock));
  const totalSales = state.orders.reduce((sum, order) => sum + Number(order.total), 0);
  $('#metric-sales').textContent = rupiah(totalSales); $('#metric-orders').textContent = state.orders.filter(o => o.status !== 'Selesai').length; $('#metric-stock').textContent = low.length; $('#metric-products').textContent = state.products.length; $('#stock-count').textContent = low.length;
  $('#low-stock-note').textContent = low.length ? `${low.length} bahan perlu diperiksa` : 'Semua stok dalam batas aman';
  $('#low-stock-list').innerHTML = low.length ? low.map(item => `<div class="stock-row"><div><strong>${item.name}</strong><small>${item.stock_quantity} ${item.unit} tersisa</small></div><small class="stock-alert">Min. ${item.minimum_stock} ${item.unit}</small></div>`).join('') : '<p class="order-meta">Belum ada stok yang perlu direstock.</p>';
  $('#recent-orders').innerHTML = state.orders.length ? state.orders.slice(0, 5).map(order => `<div class="order-row"><div><span class="order-name">${order.cafe_name}</span><span class="order-meta">${new Date(order.created_at).toLocaleDateString('id-ID')} · ${Array.isArray(order.items) ? order.items.length : 0} menu</span></div><div><span class="order-value">${rupiah(order.total)}</span><span class="pill">${order.status}</span></div></div>`).join('') : '<p class="order-meta">Belum ada pesanan masuk.</p>';
}
function renderOrders() { const search = ($('#order-search')?.value || '').toLowerCase(); const orders = state.orders.filter(order => order.cafe_name.toLowerCase().includes(search)); $('#orders-table').innerHTML = `<table class="data-table"><thead><tr><th>Cafe pelanggan</th><th>Tanggal</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${orders.length ? orders.map(order => `<tr><td><strong>${order.cafe_name}</strong></td><td>${new Date(order.created_at).toLocaleDateString('id-ID')}</td><td>${rupiah(order.total)}</td><td><select class="status-select" data-order-status="${order.id}"><option ${order.status === 'Menunggu' ? 'selected' : ''}>Menunggu</option><option ${order.status === 'Diproses' ? 'selected' : ''}>Diproses</option><option ${order.status === 'Selesai' ? 'selected' : ''}>Selesai</option><option ${order.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option></select></td><td><button class="icon-button danger" data-delete-order="${order.id}" title="Hapus pesanan">Hapus</button></td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">Belum ada pesanan.</td></tr>'}</tbody></table>`; }
function renderInventory() { const search = ($('#material-search')?.value || '').toLowerCase(); const materials = state.materials.filter(item => `${item.name} ${item.supplier || ''}`.toLowerCase().includes(search)); $('#inventory-table').innerHTML = `<table class="data-table"><thead><tr><th>Bahan baku</th><th>Stok</th><th>Minimum</th><th>Kedaluwarsa</th><th>Supplier</th><th>Aksi</th></tr></thead><tbody>${materials.length ? materials.map(item => { const low = Number(item.stock_quantity) <= Number(item.minimum_stock); return `<tr><td><strong>${item.name}</strong></td><td class="${low ? 'stock-alert' : ''}">${Number(item.stock_quantity).toFixed(2)} ${item.unit}</td><td>${Number(item.minimum_stock).toFixed(2)} ${item.unit}</td><td>${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('id-ID') : '-'}</td><td>${item.supplier || '-'}</td><td><div class="action-group"><button class="icon-button" data-edit-material="${item.id}">Edit</button><button class="icon-button danger" data-delete-material="${item.id}">Hapus</button></div></td></tr>`; }).join('') : '<tr><td colspan="6" class="empty-state">Belum ada bahan baku.</td></tr>'}</tbody></table>`; }
function renderProducts() { const search = ($('#product-search')?.value || '').toLowerCase(); const products = state.products.filter(item => item.name.toLowerCase().includes(search)); $('#product-list').innerHTML = products.length ? products.map(item => `<div class="product-item"><strong>${item.name}</strong><small>${item.category}</small><b>${item.stock_quantity} porsi · ${rupiah(item.price)}</b><div class="action-group"><button class="icon-button" data-edit-product="${item.id}">Edit</button><button class="icon-button danger" data-delete-product="${item.id}">Hapus</button></div></div>`).join('') : '<p class="empty-state">Belum ada produk.</p>'; }
function allMovements() { return state.materials.flatMap(material => (material.stock_history || []).map(movement => ({ ...movement, material_name: material.name, unit: material.unit }))).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); }
function renderStockMonitor() { const movements = allMovements(); const cards = state.materials.map(material => { const history = material.stock_history || []; const received = history.filter(item => item.type === 'receive').reduce((sum, item) => sum + Number(item.quantity), 0); const consumed = Math.abs(history.filter(item => item.type === 'consume').reduce((sum, item) => sum + Number(item.quantity), 0)); const low = Number(material.stock_quantity) <= Number(material.minimum_stock); return `<article class="monitor-card ${low ? 'alert' : ''}"><strong>${material.name}</strong><div class="monitor-value ${consumed ? 'trend-down' : ''}">${consumed ? `-${consumed.toFixed(2)}` : '0'} ${material.unit}</div><small>Terpakai · masuk ${received.toFixed(2)} ${material.unit} · sisa ${Number(material.stock_quantity).toFixed(2)} ${material.unit}</small></article>`; }).join(''); $('#stock-monitor').innerHTML = cards || '<p class="empty-state">Belum ada bahan untuk dipantau.</p>'; $('#movement-filter').innerHTML = `<option value="all">Semua bahan</option>${state.materials.map(material => `<option value="${material.id}">${material.name}</option>`).join('')}`; renderMovements(); }
function renderMovements() { const filter = $('#movement-filter')?.value || 'all'; const materialByName = new Map(state.materials.map(material => [material.name, material])); const selected = filter === 'all' ? allMovements() : allMovements().filter(movement => materialByName.get(movement.material_name)?.id === filter); $('#movement-table').innerHTML = selected.length ? `<table class="data-table"><thead><tr><th>Waktu</th><th>Bahan</th><th>Perubahan</th><th>Jenis</th><th>Keterangan</th></tr></thead><tbody>${selected.map(movement => { const positive = Number(movement.quantity) >= 0; const label = movement.type === 'consume' ? 'Terpakai' : movement.type === 'receive' ? 'Masuk' : 'Penyesuaian'; return `<tr><td>${new Date(movement.created_at).toLocaleString('id-ID')}</td><td><strong>${movement.material_name}</strong></td><td class="${positive ? 'trend-up' : 'trend-down'}">${positive ? '+' : ''}${Number(movement.quantity).toFixed(2)} ${movement.unit}</td><td><span class="movement-type ${movement.type}">${label}</span></td><td>${movement.reason}</td></tr>`; }).join('')}</tbody></table>` : '<p class="empty-state">Belum ada pergerakan stok tercatat.</p>'; }
function bindSelects() { fillSelect('#order-product', state.products, item => rupiah(item.price)); fillSelect('#production-product', state.products, item => `${item.stock_quantity} stok`); fillSelect('#purchase-material', state.materials, item => `${item.stock_quantity} ${item.unit}`); updatePrice(); }
function updatePrice() { const product = state.products.find(item => item.id === $('#order-product').value); $('#order-preview').textContent = product ? rupiah(product.price * Number($('#order-quantity').value || 1)) : rupiah(0); }
async function loadData() { try { Object.assign(state, await api('/api/dashboard')); renderDashboard(); renderOrders(); renderInventory(); renderProducts(); renderStockMonitor(); bindSelects(); } catch (error) { notify(error.message, true); } }
function openMaterialEditor(id = '') { const material = state.materials.find(item => item.id === id); $('#material-form').reset(); $('#material-id').value = material?.id || ''; $('#material-dialog-title').textContent = material ? 'Edit bahan baku' : 'Tambah bahan baku'; $('#material-name').value = material?.name || ''; $('#material-unit').value = material?.unit || ''; $('#material-stock').value = material?.stock_quantity || 0; $('#material-minimum').value = material?.minimum_stock || 0; $('#material-expiry').value = material?.expiry_date || ''; $('#material-supplier').value = material?.supplier || ''; $('#material-dialog').showModal(); }
function openProductEditor(id = '') { const product = state.products.find(item => item.id === id); $('#product-form').reset(); $('#product-id').value = product?.id || ''; $('#product-dialog-title').textContent = product ? 'Edit produk menu' : 'Tambah produk menu'; $('#product-name').value = product?.name || ''; $('#product-category').value = product?.category || 'Makanan'; $('#product-price').value = product?.price || 0; $('#product-stock').value = product?.stock_quantity || 0; $('#product-dialog').showModal(); }
async function submitMaterial(event) { event.preventDefault(); const id = $('#material-id').value; const payload = { name: $('#material-name').value.trim(), unit: $('#material-unit').value.trim(), stock_quantity: Number($('#material-stock').value), minimum_stock: Number($('#material-minimum').value), expiry_date: $('#material-expiry').value || null, supplier: $('#material-supplier').value.trim() }; try { await api(id ? `/api/materials/${id}` : '/api/materials', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) }); $('#material-dialog').close(); notify(id ? 'Bahan baku berhasil diperbarui.' : 'Bahan baku berhasil ditambahkan.'); await loadData(); } catch (error) { notify(error.message, true); } }
async function submitProduct(event) { event.preventDefault(); const id = $('#product-id').value; const payload = { name: $('#product-name').value.trim(), category: $('#product-category').value, price: Number($('#product-price').value), stock_quantity: Number($('#product-stock').value) }; try { await api(id ? `/api/products/${id}` : '/api/products', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) }); $('#product-dialog').close(); notify(id ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.'); await loadData(); } catch (error) { notify(error.message, true); } }
async function deleteRecord(path, message) { if (!confirm(message)) return; try { await api(path, { method: 'DELETE' }); notify('Data berhasil dihapus.'); await loadData(); } catch (error) { notify(error.message, true); } }
async function updateOrderStatus(id, status) { try { await api(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); notify('Status pesanan diperbarui.'); await loadData(); } catch (error) { notify(error.message, true); } }

async function submitOrder(event) { event.preventDefault(); const product = state.products.find(item => item.id === $('#order-product').value); try { await api('/api/orders', { method: 'POST', body: JSON.stringify({ cafe_name: $('#cafe-name').value, items: [{ product_id: product.id, name: product.name, price: product.price, quantity: Number($('#order-quantity').value) }] }) }); $('#order-dialog').close(); event.target.reset(); notify('Pesanan cafe berhasil dicatat.'); await loadData(); } catch (error) { notify(error.message, true); } }
async function submitPurchase(event) { event.preventDefault(); try { await api('/api/materials/purchase', { method: 'POST', body: JSON.stringify({ material_id: $('#purchase-material').value, quantity: Number($('#purchase-quantity').value) }) }); $('#purchase-dialog').close(); event.target.reset(); notify('Penerimaan bahan berhasil ditambahkan.'); await loadData(); } catch (error) { notify(error.message, true); } }
async function submitProduction(event) { event.preventDefault(); try { await api('/api/production', { method: 'POST', body: JSON.stringify({ product_id: $('#production-product').value, quantity: Number($('#production-quantity').value) }) }); event.target.reset(); notify('Produksi berhasil dicatat dan stok diperbarui.'); await loadData(); } catch (error) { notify(error.message, true); } }

document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
document.querySelectorAll('[data-view-link]').forEach(button => button.addEventListener('click', () => showView(button.dataset.viewLink)));
$('#open-order').addEventListener('click', () => $('#order-dialog').showModal()); $('#open-purchase').addEventListener('click', () => $('#purchase-dialog').showModal()); $('#open-material').addEventListener('click', () => openMaterialEditor()); $('#open-product').addEventListener('click', () => openProductEditor()); $('#order-form').addEventListener('submit', submitOrder); $('#purchase-form').addEventListener('submit', submitPurchase); $('#material-form').addEventListener('submit', submitMaterial); $('#product-form').addEventListener('submit', submitProduct); $('#production-form').addEventListener('submit', submitProduction); $('#order-product').addEventListener('change', updatePrice); $('#order-quantity').addEventListener('input', updatePrice); $('#order-search').addEventListener('input', renderOrders); $('#material-search').addEventListener('input', renderInventory); $('#product-search').addEventListener('input', renderProducts); $('#movement-filter').addEventListener('change', renderMovements);
document.addEventListener('click', event => { const target = event.target; if (target.dataset.editMaterial) openMaterialEditor(target.dataset.editMaterial); if (target.dataset.deleteMaterial) deleteRecord(`/api/materials/${target.dataset.deleteMaterial}`, 'Hapus bahan baku ini? Bahan yang dipakai resep tidak dapat dihapus.'); if (target.dataset.editProduct) openProductEditor(target.dataset.editProduct); if (target.dataset.deleteProduct) deleteRecord(`/api/products/${target.dataset.deleteProduct}`, 'Hapus produk ini?'); if (target.dataset.deleteOrder) deleteRecord(`/api/orders/${target.dataset.deleteOrder}`, 'Hapus pesanan ini? Stok produk akan dikembalikan.'); });
document.addEventListener('change', event => { if (event.target.dataset.orderStatus) updateOrderStatus(event.target.dataset.orderStatus, event.target.value); });
if (!localMode) { $('#connection-status').textContent = 'Supabase terhubung'; $('#connection-mode').textContent = 'Data tersimpan di cloud'; }
loadData();
