const state = {
  materials: [],
  products: [],
  orders: [],
  production_records: []
};

const rupiah = value =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

const $ = selector => document.querySelector(selector);

const localMode =
  window.location.protocol === 'file:' ||
  window.location.hostname.endsWith('.github.io');

const localKey =
  'ruang-rasa-data';

const supabaseConfigKey =
  'ruang-rasa-supabase-config';

function getSupabaseConfig() {
  if (!localMode) return null;

  try {
    const config = JSON.parse(
      localStorage.getItem(supabaseConfigKey) || 'null'
    );
    if (!config?.url || !config?.key) return null;
    return config;
  } catch (error) {
    console.error('Konfigurasi Supabase tidak valid:', error);
    return null;
  }
}

function isDirectSupabaseMode() {
  return Boolean(getSupabaseConfig());
}


/* =========================================================
   DATA AWAL
========================================================= */

const koreanGarlicBreadIngredients = [
  { id: 'm-gb-bun', name: 'Roti Bun', unit: 'pcs', minimum_stock: 1, quantity: 1 },
  { id: 'm-gb-cream-cheese', name: 'Cream Cheese', unit: 'kg', minimum_stock: 0.25, quantity: 0.05 },
  { id: 'm-gb-butter', name: 'Mentega', unit: 'kg', minimum_stock: 0.1, quantity: 0.03 },
  { id: 'm-gb-garlic', name: 'Bawang Putih', unit: 'kg', minimum_stock: 0.05, quantity: 0.006 },
  { id: 'm-gb-condensed-milk', name: 'Susu Kental Manis', unit: 'liter', minimum_stock: 0.2, quantity: 0.02 },
  { id: 'm-gb-parsley', name: 'Parsley', unit: 'kg', minimum_stock: 0.01, quantity: 0.002 }
];

const koreanGarlicBreadOpeningStock = {
  'Roti Bun': 24,
  'Cream Cheese': 2,
  'Mentega': 1,
  'Bawang Putih': 0.5,
  'Susu Kental Manis': 2,
  'Parsley': 0.1
};

const koreanGarlicBreadMaterialDetails = {
  'Roti Bun': { unit_cost: 4000, supplier: 'Bakery Lokal', expiry_date: '2026-10-06' },
  'Cream Cheese': { unit_cost: 120000, supplier: 'DairyFresh', expiry_date: '2026-10-20' },
  'Mentega': { unit_cost: 130000, supplier: 'DairyFresh', expiry_date: '2027-01-03' },
  'Bawang Putih': { unit_cost: 35000, supplier: 'Pasar Segar', expiry_date: '2026-11-03' },
  'Susu Kental Manis': { unit_cost: 45000, supplier: 'Toko Bahan Kue', expiry_date: '2027-04-03' },
  'Parsley': { unit_cost: 80000, supplier: 'Sayur Segar', expiry_date: '2026-10-10' }
};

const localSeed = {
  materials: [
    {
      id: 'm1',
      name: 'Kopi Arabika',
      unit: 'kg',
      stock_quantity: 12,
      minimum_stock: 5,
      expiry_date: '2027-01-15',
      supplier: 'PT Biji Nusantara',
      unit_cost: 120000
    },
    {
      id: 'm2',
      name: 'Susu Fresh Milk',
      unit: 'liter',
      stock_quantity: 18,
      minimum_stock: 8,
      expiry_date: '2026-10-04',
      supplier: 'Segar Jaya',
      unit_cost: 22000
    },
    {
      id: 'm3',
      name: 'Tepung Terigu',
      unit: 'kg',
      stock_quantity: 25,
      minimum_stock: 10,
      expiry_date: '2027-03-20',
      supplier: 'Pangan Makmur',
      unit_cost: 14000
    },
    {
      id: 'm4',
      name: 'Gula Aren',
      unit: 'kg',
      stock_quantity: 2,
      minimum_stock: 3,
      expiry_date: '2027-02-12',
      supplier: 'Manis Alami',
      unit_cost: 35000
    },
    ...koreanGarlicBreadIngredients.map(({ id, name, unit, minimum_stock }) => ({
      id,
      name,
      unit,
      stock_quantity: 0,
      minimum_stock,
      expiry_date: null,
      supplier: '',
      unit_cost: 0,
      stock_history: []
    }))
  ],

  products: [
    {
      id: 'p1',
      name: 'Kopi Susu Ruang',
      category: 'Minuman',
      price: 18000,
      stock_quantity: 24,
      recipe: [
        {
          material_id: 'm1',
          quantity: 0.018
        },
        {
          material_id: 'm2',
          quantity: 0.2
        },
        {
          material_id: 'm4',
          quantity: 0.02
        }
      ]
    },

    {
      id: 'p2',
      name: 'Korean Cream Cheese Garlic Bread',
      category: 'Makanan',
      price: 32000,
      stock_quantity: 12,
      recipe: koreanGarlicBreadIngredients.map(ingredient => ({
        material_id: ingredient.id,
        quantity: ingredient.quantity
      }))
    },

    {
      id: 'p3',
      name: 'Es Kopi Aren',
      category: 'Minuman',
      price: 22000,
      stock_quantity: 18,
      recipe: [
        {
          material_id: 'm1',
          quantity: 0.018
        },
        {
          material_id: 'm2',
          quantity: 0.2
        },
        {
          material_id: 'm4',
          quantity: 0.025
        }
      ]
    },

    {
      id: 'p4',
      name: 'Toast Kaya',
      category: 'Makanan',
      price: 16000,
      stock_quantity: 20,
      recipe: [
        {
          material_id: 'm3',
          quantity: 0.08
        },
        {
          material_id: 'm4',
          quantity: 0.01
        }
      ]
    }
  ],

  orders: [],
  production_records: []
};


/* =========================================================
   LOCAL STORAGE
========================================================= */

function localData() {
  let saved =
    localStorage.getItem(localKey);

  if (!saved) {
    localStorage.setItem(
      localKey,
      JSON.stringify(localSeed)
    );
    saved =
      localStorage.getItem(localKey);
  }

  const data =
    saved
      ? JSON.parse(saved)
      : localSeed;

  data.materials =
    Array.isArray(data.materials)
      ? data.materials
      : [];

  data.products =
    Array.isArray(data.products)
      ? data.products
      : [];

  data.orders =
    Array.isArray(data.orders)
      ? data.orders
      : [];

  data.production_records =
    Array.isArray(data.production_records)
      ? data.production_records
      : [];

  const legacyBread = data.products.find(
    product => product.name === 'Nasi Ayam Rempah'
  );

  if (legacyBread) {
    const recipe = koreanGarlicBreadIngredients.map(ingredient => {
      let material = data.materials.find(
        item => item.name === ingredient.name
      );

      if (!material) {
        material = {
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          stock_quantity: 0,
          minimum_stock: ingredient.minimum_stock,
          expiry_date: null,
          supplier: '',
          unit_cost: 0,
          stock_history: []
        };
        data.materials.push(material);
      }

      return {
        material_id: material.id,
        quantity: ingredient.quantity
      };
    });

    legacyBread.name = 'Korean Cream Cheese Garlic Bread';
    legacyBread.recipe = recipe;
  }

  data.materials.forEach(material => {
    const openingStock = koreanGarlicBreadOpeningStock[material.name];
    const sampleDetails = koreanGarlicBreadMaterialDetails[material.name];
    const hasHistory = Array.isArray(material.stock_history) && material.stock_history.length > 0;

    if (openingStock && Number(material.stock_quantity || 0) === 0 && !hasHistory) {
      material.stock_quantity = openingStock;
      addLocalMovement(material, openingStock, 'receive', 'Stok awal contoh');
    }

    if (sampleDetails) {
      if (!Number(material.unit_cost)) material.unit_cost = sampleDetails.unit_cost;
      if (!String(material.supplier || '').trim()) material.supplier = sampleDetails.supplier;
      if (!material.expiry_date) material.expiry_date = sampleDetails.expiry_date;
    }
  });

  const hasLowStockMaterial =
    data.materials.some(
      material =>
        Number(material.stock_quantity || 0) <=
        Number(material.minimum_stock || 0)
    );

  if (!hasLowStockMaterial && data.materials.length) {
    const targetMaterial =
      data.materials.find(
        material =>
          material.name === 'Gula Aren'
      ) || data.materials[0];

    if (targetMaterial) {
      targetMaterial.stock_quantity =
        Math.max(
          0,
          Number(targetMaterial.minimum_stock || 1) - 1
        );
    }
  }

  /*
   * Migrasi data lama.
   * Kalau sebelumnya belum ada unit_cost,
   * gunakan harga awal berdasarkan ID bahan.
   */

  const defaultCost = {
    m1: 120000,
    m2: 22000,
    m3: 14000,
    m4: 35000
  };

  data.materials.forEach(material => {
    if (
      material.unit_cost === undefined ||
      material.unit_cost === null
    ) {
      material.unit_cost =
        defaultCost[material.id] || 0;
    }
  });

  saveLocal(data);

  return data;
}


function saveLocal(data) {
  localStorage.setItem(
    localKey,
    JSON.stringify(data)
  );

  return data;
}


function addLocalMovement(
  material,
  quantity,
  type,
  reason
) {
  if (
    !Array.isArray(
      material.stock_history
    )
  ) {
    material.stock_history = [];
  }

  material.stock_history.unshift({
    id:
      `mv-${Date.now()}-${Math.random()}`,
    quantity:
      Number(quantity),
    type,
    reason,
    created_at:
      new Date().toISOString()
  });
}


/* =========================================================
   PERHITUNGAN HPP
========================================================= */

/*
 * HPP produk =
 * jumlah bahan dalam resep × harga beli bahan
 */

function calculateProductHpp(
  product,
  materials
) {
  if (!product) {
    return 0;
  }

  const materialMap =
    new Map(
      materials.map(material => [
        material.id,
        material
      ])
    );

  return (
    product.recipe || []
  ).reduce(
    (total, recipe) => {
      const material =
        materialMap.get(
          recipe.material_id
        );

      if (!material) {
        return total;
      }

      return (
        total +
        Number(recipe.quantity || 0) *
        Number(material.unit_cost || 0)
      );
    },
    0
  );
}


/*
 * HPP transaksi
 */

function calculateOrderHpp(
  order,
  products = state.products
) {
  const productMap =
    new Map(
      products.map(product => [
        product.id,
        product
      ])
    );

  return (
    order.items || []
  ).reduce(
    (total, item) => {
      const product =
        productMap.get(
          item.product_id
        );

      const hppPerUnit =
        Number(
          item.hpp_per_unit ??
          calculateProductHpp(
            product,
            state.materials
          )
        );

      return (
        total +
        hppPerUnit *
        Number(item.quantity || 0)
      );
    },
    0
  );
}


/*
 * Laba penjualan
 *
 * Penjualan - HPP
 *
 * PPN tidak dimasukkan sebagai HPP.
 */

function calculateOrderProfit(order) {
  const sales =
    Number(
      order.subtotal || 0
    );

  const hpp =
    Number(
      order.hpp ??
      calculateOrderHpp(order)
    );

  return sales - hpp;
}


/* =========================================================
   PEMAKAIAN BAHAN BAKU OTOMATIS
========================================================= */

function consumeMaterialsForOrder(
  data,
  items,
  orderId
) {
  const required =
    new Map();

  /*
   * Hitung total bahan yang diperlukan
   */

  for (const item of items) {
    const product =
      data.products.find(
        product =>
          product.id ===
          item.product_id
      );

    if (!product) {
      throw new Error(
        'Produk dalam pesanan tidak ditemukan.'
      );
    }

    for (
      const recipe
      of product.recipe || []
    ) {
      const used =
        Number(recipe.quantity || 0) *
        Number(item.quantity || 0);

      required.set(
        recipe.material_id,
        (
          required.get(
            recipe.material_id
          ) || 0
        ) + used
      );
    }
  }

  /*
   * VALIDASI STOK TERLEBIH DAHULU
   */

  for (
    const [materialId, amount]
    of required
  ) {
    const material =
      data.materials.find(
        item =>
          item.id === materialId
      );

    if (!material) {
      throw new Error(
        'Bahan dalam resep tidak ditemukan.'
      );
    }

    if (
      Number(material.stock_quantity) <
      amount
    ) {
      throw new Error(
        `Stok ${material.name} tidak cukup. ` +
        `Dibutuhkan ${amount.toFixed(2)} ${material.unit}, ` +
        `tersedia ${Number(
          material.stock_quantity
        ).toFixed(2)} ${material.unit}.`
      );
    }
  }

  /*
   * KURANGI STOK BAHAN
   */

  for (
    const [materialId, amount]
    of required
  ) {
    const material =
      data.materials.find(
        item =>
          item.id === materialId
      );

    material.stock_quantity =
      Number(
        material.stock_quantity
      ) - amount;

    addLocalMovement(
      material,
      -amount,
      'consume',
      `Penjualan ${orderId}`
    );
  }
}


/* =========================================================
   LOCAL API
========================================================= */

async function localApi(
  path,
  options = {}
) {
  const data =
    localData();

  const body =
    options.body
      ? JSON.parse(options.body)
      : {};


  /* DASHBOARD */

  if (
    path === '/api/dashboard'
  ) {
    return data;
  }

  if (
    path === '/api/production-records' &&
    (
      !options.method ||
      options.method === 'GET'
    )
  ) {
    return data.production_records;
  }


  /* MATERIAL */

  if (
    path === '/api/materials' &&
    (
      !options.method ||
      options.method === 'GET'
    )
  ) {
    return data.materials;
  }


  /* PRODUCT */

  if (
    path === '/api/products' &&
    (
      !options.method ||
      options.method === 'GET'
    )
  ) {
    return data.products;
  }


  /* ORDER */

  if (
    path === '/api/orders' &&
    (
      !options.method ||
      options.method === 'GET'
    )
  ) {
    return data.orders;
  }


  /* =====================================================
     TAMBAH BAHAN
  ===================================================== */

  if (
    path === '/api/materials' &&
    options.method === 'POST'
  ) {
    if (
      !body.name ||
      !body.unit
    ) {
      throw new Error(
        'Nama dan satuan bahan wajib diisi.'
      );
    }

    const material = {
      id:
        `m-${Date.now()}`,

      name:
        body.name,

      unit:
        body.unit,

      stock_quantity:
        0,

      minimum_stock:
        Number(
          body.minimum_stock
        ) || 0,

      expiry_date:
        body.expiry_date ||
        null,

      supplier:
        body.supplier ||
        '',

      unit_cost:
        Number(
          body.unit_cost
        ) || 0,

      stock_history: []
    };

    data.materials.push(
      material
    );

    saveLocal(data);

    return material;
  }


  /* =====================================================
     EDIT BAHAN
  ===================================================== */

  if (
    path.match(
      /^\/api\/materials\/[^/]+$/
    ) &&
    (
      options.method === 'PATCH' ||
      options.method === 'PUT'
    )
  ) {
    const material =
      data.materials.find(
        item =>
          item.id ===
          path.split('/').pop()
      );

    if (!material) {
      throw new Error(
        'Bahan baku tidak ditemukan.'
      );
    }

    const previousStock =
      Number(
        material.stock_quantity
      );

    const nextStock =
      Number(
        body.stock_quantity
      ) || 0;

    Object.assign(
      material,
      {
        name:
          body.name,

        unit:
          body.unit,

        stock_quantity:
          nextStock,

        minimum_stock:
          Number(
            body.minimum_stock
          ) || 0,

        expiry_date:
          body.expiry_date ||
          null,

        supplier:
          body.supplier ||
          '',

        unit_cost:
          Number(
            body.unit_cost
          ) || 0
      }
    );

    if (
      nextStock !==
      previousStock
    ) {
      addLocalMovement(
        material,
        nextStock -
        previousStock,
        'adjust',
        'Penyesuaian stok manual'
      );
    }

    saveLocal(data);

    return material;
  }


  /* =====================================================
     HAPUS BAHAN
  ===================================================== */

  if (
    path.match(
      /^\/api\/materials\/[^/]+$/
    ) &&
    options.method === 'DELETE'
  ) {
    const index =
      data.materials.findIndex(
        item =>
          item.id ===
          path.split('/').pop()
      );

    if (index < 0) {
      throw new Error(
        'Bahan baku tidak ditemukan.'
      );
    }

    const material =
      data.materials[index];

    const usedInRecipe =
      data.products.some(
        product =>
          (
            product.recipe || []
          ).some(
            recipe =>
              recipe.material_id ===
              material.id
          )
      );

    if (usedInRecipe) {
      throw new Error(
        'Bahan masih dipakai dalam resep produk.'
      );
    }

    const removed =
      data.materials.splice(
        index,
        1
      )[0];

    saveLocal(data);

    return removed;
  }


  /* =====================================================
     TAMBAH PRODUK
  ===================================================== */

  if (
    path === '/api/products' &&
    options.method === 'POST'
  ) {
    if (
      !body.name ||
      !body.category
    ) {
      throw new Error(
        'Nama dan kategori produk wajib diisi.'
      );
    }

    const recipe =
      Array.isArray(body.recipe)
        ? body.recipe
            .map(entry => ({
              material_id: entry.material_id,
              quantity: Number(entry.quantity) || 0
            }))
            .filter(entry => entry.material_id && entry.quantity > 0)
        : [];

    const product = {
      id:
        `p-${Date.now()}`,

      name:
        body.name,

      category:
        body.category,

      price:
        Number(
          body.price
        ) || 0,

      stock_quantity:
        Number(
          body.stock_quantity
        ) || 0,

      recipe
    };

    data.products.push(
      product
    );

    saveLocal(data);

    return product;
  }


  /* =====================================================
     EDIT PRODUK
  ===================================================== */

  if (
    path.match(
      /^\/api\/products\/[^/]+$/
    ) &&
    (
      options.method === 'PATCH' ||
      options.method === 'PUT'
    )
  ) {
    const product =
      data.products.find(
        item =>
          item.id ===
          path.split('/').pop()
      );

    if (!product) {
      throw new Error(
        'Produk tidak ditemukan.'
      );
    }

    const recipe =
      Array.isArray(body.recipe)
        ? body.recipe
            .map(entry => ({
              material_id: entry.material_id,
              quantity: Number(entry.quantity) || 0
            }))
            .filter(entry => entry.material_id && entry.quantity > 0)
        : [];

    Object.assign(
      product,
      {
        name:
          body.name,

        category:
          body.category,

        price:
          Number(
            body.price
          ) || 0,

        stock_quantity:
          Number(
            body.stock_quantity
          ) || 0,

        recipe
      }
    );

    saveLocal(data);

    return product;
  }


  /* =====================================================
     HAPUS PRODUK
  ===================================================== */

  if (
    path.match(
      /^\/api\/products\/[^/]+$/
    ) &&
    options.method === 'DELETE'
  ) {
    const index =
      data.products.findIndex(
        item =>
          item.id ===
          path.split('/').pop()
      );

    if (index < 0) {
      throw new Error(
        'Produk tidak ditemukan.'
      );
    }

    const removed =
      data.products.splice(
        index,
        1
      )[0];

    saveLocal(data);

    return removed;
  }


  /* =====================================================
     UPDATE ORDER
  ===================================================== */

  if (
    path.match(
      /^\/api\/orders\/[^/]+$/
    ) &&
    (
      options.method === 'PATCH' ||
      options.method === 'PUT'
    )
  ) {
    const order =
      data.orders.find(
        item =>
          item.id ===
          path.split('/').pop()
      );

    if (!order) {
      throw new Error(
        'Pesanan tidak ditemukan.'
      );
    }

    if (
      body.status &&
      [
        'Menunggu',
        'Diproses',
        'Selesai',
        'Dibatalkan'
      ].includes(
        body.status
      )
    ) {
      order.status =
        body.status;
    }

    if (
      body.cafe_name
    ) {
      order.cafe_name =
        body.cafe_name;
    }

    saveLocal(data);

    return order;
  }


  /* =====================================================
     HAPUS ORDER
     KEMBALIKAN STOK PRODUK + BAHAN
  ===================================================== */

  if (
    path.match(
      /^\/api\/orders\/[^/]+$/
    ) &&
    options.method === 'DELETE'
  ) {
    const index =
      data.orders.findIndex(
        item =>
          item.id ===
          path.split('/').pop()
      );

    if (index < 0) {
      throw new Error(
        'Pesanan tidak ditemukan.'
      );
    }

    const removed =
      data.orders.splice(
        index,
        1
      )[0];

    for (
      const item
      of removed.items || []
    ) {
      const product =
        data.products.find(
          entry =>
            entry.id ===
            item.product_id
        );

      if (!product) {
        continue;
      }

      /*
       * Kembalikan stok produk
       */

      product.stock_quantity +=
        Number(
          item.quantity
        );


      /*
       * Kembalikan bahan baku
       */

      for (
        const recipe
        of product.recipe || []
      ) {
        const material =
          data.materials.find(
            entry =>
              entry.id ===
              recipe.material_id
          );

        if (!material) {
          continue;
        }

        const restored =
          Number(
            recipe.quantity
          ) *
          Number(
            item.quantity
          );

        material.stock_quantity +=
          restored;

        addLocalMovement(
          material,
          restored,
          'adjust',
          `Pembatalan penjualan ${removed.id}`
        );
      }
    }

    saveLocal(data);

    return removed;
  }


  /* =====================================================
     PEMBELIAN BAHAN
  ===================================================== */

  if (
    path ===
    '/api/materials/purchase'
  ) {
    const quantity =
      Number(
        body.quantity
      );

      if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(
          'Jumlah bahan yang diterima wajib lebih dari 0.'
      );
    }

      if (body.new_material) {
        const details = body.new_material;
        const name = String(details.name || '').trim();
        const unit = String(details.unit || '').trim();

        if (!name || !unit) {
          throw new Error('Nama dan satuan bahan baru wajib diisi.');
        }

        if (data.materials.some(item => item.name.toLowerCase() === name.toLowerCase())) {
          throw new Error('Bahan ini sudah terdaftar. Pilih bahan tersebut dari daftar.');
        }

        const material = {
          id: `m-${Date.now()}`,
          name,
          unit,
          stock_quantity: quantity,
          minimum_stock: Number(details.minimum_stock) || 0,
          expiry_date: details.expiry_date || null,
          supplier: String(details.supplier || '').trim(),
          unit_cost: Number(body.unit_cost) || 0,
          stock_history: []
        };

        addLocalMovement(material, quantity, 'receive', 'Penerimaan bahan baru');
        data.materials.push(material);
        saveLocal(data);
        return material;
      }

      const material = data.materials.find(item => item.id === body.material_id);

      if (!material) {
        throw new Error('Pilih bahan baku yang valid.');
      }

    material.stock_quantity =
      Number(
        material.stock_quantity
      ) + quantity;


    /*
     * Simpan harga beli terbaru
     */

    if (
      Number(body.unit_cost) > 0
    ) {
      material.unit_cost =
        Number(
          body.unit_cost
        );
    }

    addLocalMovement(
      material,
      quantity,
      'receive',
      'Penerimaan pembelian'
    );

    saveLocal(data);

    return material;
  }


  /* =====================================================
     PRODUKSI
  ===================================================== */

  if (
    path ===
    '/api/production'
  ) {
    const product =
      data.products.find(
        item =>
          item.id ===
          body.product_id
      );

    const quantity =
      Number(
        body.quantity
      );

    if (
      !product ||
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      throw new Error(
        'Produk dan jumlah produksi tidak valid.'
      );
    }

    const materialMap =
      new Map(
        data.materials.map(
          item => [
            item.id,
            item
          ]
        )
      );


    /*
     * Validasi bahan
     */

    for (
      const recipe
      of product.recipe || []
    ) {
      const material =
        materialMap.get(
          recipe.material_id
        );

      const needed =
        Number(
          recipe.quantity
        ) *
        quantity;

      if (
        !material ||
        Number(
          material.stock_quantity
        ) < needed
      ) {
        throw new Error(
          `Stok ${
            material?.name ||
            'bahan'
          } tidak cukup.`
        );
      }
    }


    /*
     * Kurangi bahan
     */

    for (
      const recipe
      of product.recipe || []
    ) {
      const material =
        materialMap.get(
          recipe.material_id
        );

      const used =
        Number(
          recipe.quantity
        ) *
        quantity;

      material.stock_quantity -=
        used;

      addLocalMovement(
        material,
        -used,
        'consume',
        `Produksi ${product.name} (${quantity} batch)`
      );
    }


    /*
     * Tambah produk jadi
     */

    product.stock_quantity +=
      quantity;

    data.production_records.unshift({
      id: `pr-${Date.now()}-${Math.random()}`,
      product_id: product.id,
      product_name: product.name,
      quantity,
      created_at: new Date().toISOString()
    });

    saveLocal(data);

    return product;
  }


  /* =====================================================
     PENJUALAN
  ===================================================== */

  if (
    path === '/api/orders'
  ) {
    const source =
      body.items || [];

    if (!source.length) {
      throw new Error(
        'Produk pesanan belum dipilih.'
      );
    }


    /*
     * Validasi semua produk
     * sebelum mengubah stok
     */

    const items =
      source.map(item => {
        const product =
          data.products.find(
            entry =>
              entry.id ===
              item.product_id
          );

        const quantity =
          Number(
            item.quantity
          );

        if (
          !product ||
          !Number.isInteger(
            quantity
          ) ||
          quantity <= 0
        ) {
          throw new Error(
            'Produk dan jumlah pesanan tidak valid.'
          );
        }

        if (
          Number(
            product.stock_quantity
          ) < quantity
        ) {
          throw new Error(
            `Stok ${product.name} tidak cukup.`
          );
        }

        const hppPerUnit =
          calculateProductHpp(
            product,
            data.materials
          );

        return {
          product_id:
            product.id,

          name:
            product.name,

          price:
            Number(
              product.price
            ),

          quantity,

          hpp_per_unit:
            hppPerUnit,

          hpp_total:
            hppPerUnit *
            quantity
        };
      });


    /*
     * Penjualan sebelum PPN
     */

    const subtotal =
      items.reduce(
        (sum, item) =>
          sum +
          item.price *
          item.quantity,
        0
      );


    /*
     * Total HPP
     */

    const hpp =
      items.reduce(
        (sum, item) =>
          sum +
          item.hpp_total,
        0
      );


    /*
     * Laba penjualan
     */

    const profit =
      subtotal - hpp;


    /*
     * PPN 11%
     */

    const tax =
      Math.round(
        subtotal * 0.11
      );


    /*
     * Total pembayaran
     */

    const total =
      subtotal + tax;


    const orderId =
      `o-${Date.now()}`;


    /*
     * Kurangi stok produk
     */

    for (
      const item
      of items
    ) {
      const product =
        data.products.find(
          entry =>
            entry.id ===
            item.product_id
        );

      product.stock_quantity -=
        item.quantity;
    }


    /*
     * Kurangi bahan otomatis
     */

    consumeMaterialsForOrder(
      data,
      items,
      orderId
    );


    const order = {
      id:
        orderId,

      cafe_name:
        body.cafe_name,

      items,

      subtotal,

      hpp,

      profit,

      tax,

      total,

      status:
        'Menunggu',

      created_at:
        new Date().toISOString()
    };

    data.orders.unshift(
      order
    );

    saveLocal(data);

    return order;
  }


  throw new Error(
    'Endpoint lokal tidak ditemukan.'
  );
}


/* =========================================================
   API
========================================================= */

async function supabaseRest(
  table,
  options = {}
) {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Hubungkan Supabase terlebih dahulu.');
  }

  const headers = {
    apikey: config.key,
    'Content-Type': 'application/json',
    Prefer: options.prefer || 'return=representation'
  };
  if (config.key.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${config.key}`;
  }

  const response = await fetch(
    `${config.url}/rest/v1/${table}${options.query || ''}`,
    {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined
        ? undefined
        : JSON.stringify(options.body)
    }
  );

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.hint ||
      data?.details ||
      `Supabase menolak permintaan (${response.status}).`
    );
  }

  return data;
}

function supabaseMovement(material, quantity, type, reason) {
  const history = Array.isArray(material.stock_history)
    ? material.stock_history
    : [];
  history.unshift({
    id: `mv-${Date.now()}-${Math.random()}`,
    quantity: Number(quantity),
    type,
    reason,
    created_at: new Date().toISOString()
  });
  return history;
}

async function supabaseApi(path, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};

  if (path === '/api/dashboard' && method === 'GET') {
    const [materials, products, orders, production_records] = await Promise.all([
      supabaseRest('raw_materials', { query: '?select=*&order=name.asc' }),
      supabaseRest('products', { query: '?select=*&order=name.asc' }),
      supabaseRest('orders', { query: '?select=*&order=created_at.desc&limit=8' }),
      supabaseRest('production_records', { query: '?select=*&order=created_at.desc&limit=20' })
    ]);
    return { materials, products, orders, production_records };
  }

  if (path === '/api/materials' && method === 'GET') {
    return supabaseRest('raw_materials', { query: '?select=*&order=name.asc' });
  }
  if (path === '/api/products' && method === 'GET') {
    return supabaseRest('products', { query: '?select=*&order=name.asc' });
  }
  if (path === '/api/orders' && method === 'GET') {
    return supabaseRest('orders', { query: '?select=*&order=created_at.desc' });
  }
  if (path === '/api/production-records' && method === 'GET') {
    return supabaseRest('production_records', { query: '?select=*&order=created_at.desc' });
  }

  let match = path.match(/^\/api\/(materials|products|orders)\/([^/]+)$/);
  if (match && method === 'PATCH') {
    const [, resource, id] = match;
    const table = resource === 'materials' ? 'raw_materials' : resource;
    if (resource === 'materials') {
      const current = await supabaseRest(table, {
        query: `?select=*&id=eq.${encodeURIComponent(id)}`
      });
      if (!current[0]) throw new Error('Bahan baku tidak ditemukan.');
      const stock = Number(body.stock_quantity) || 0;
      const patch = {
        name: body.name,
        unit: body.unit,
        stock_quantity: stock,
        minimum_stock: Number(body.minimum_stock) || 0,
        expiry_date: body.expiry_date || null,
        supplier: body.supplier || '',
        unit_cost: Number(body.unit_cost) || 0
      };
      if (stock !== Number(current[0].stock_quantity)) {
        patch.stock_history = supabaseMovement(
          current[0],
          stock - Number(current[0].stock_quantity),
          'adjust',
          'Penyesuaian stok manual'
        );
      }
      const updated = await supabaseRest(table, {
        method: 'PATCH',
        query: `?id=eq.${encodeURIComponent(id)}`,
        body: patch
      });
      if (!updated[0]) throw new Error('Bahan baku tidak ditemukan.');
      return updated[0];
    }

    if (resource === 'products') {
      const patch = {
        name: body.name,
        category: body.category,
        price: Number(body.price) || 0,
        stock_quantity: Number(body.stock_quantity) || 0
      };
      if (Array.isArray(body.recipe)) {
        patch.recipe = body.recipe
          .map(entry => ({
            material_id: entry.material_id,
            quantity: Number(entry.quantity) || 0
          }))
          .filter(entry => entry.material_id && entry.quantity > 0);
      }
      const updated = await supabaseRest(table, {
        method: 'PATCH',
        query: `?id=eq.${encodeURIComponent(id)}`,
        body: patch
      });
      if (!updated[0]) throw new Error('Produk tidak ditemukan.');
      return updated[0];
    }

    const patch = {};
    if (body.status) patch.status = body.status;
    if (body.cafe_name) patch.cafe_name = body.cafe_name;
    const updated = await supabaseRest(table, {
      method: 'PATCH',
      query: `?id=eq.${encodeURIComponent(id)}`,
      body: patch
    });
    if (!updated[0]) throw new Error('Pesanan tidak ditemukan.');
    return updated[0];
  }

  if (match && method === 'DELETE') {
    const [, resource, id] = match;
    const table = resource === 'materials' ? 'raw_materials' : resource;

    if (resource === 'materials') {
      const products = await supabaseRest('products', { query: '?select=recipe' });
      if (products.some(product =>
        (product.recipe || []).some(recipe => recipe.material_id === id)
      )) {
        throw new Error('Bahan masih dipakai dalam resep produk.');
      }
    }

    if (resource === 'orders') {
      const orders = await supabaseRest('orders', {
        query: `?select=*&id=eq.${encodeURIComponent(id)}`
      });
      const order = orders[0];
      if (!order) throw new Error('Pesanan tidak ditemukan.');
      for (const item of order.items || []) {
        const products = await supabaseRest('products', {
          query: `?select=stock_quantity&id=eq.${encodeURIComponent(item.product_id)}`
        });
        if (products[0]) {
          await supabaseRest('products', {
            method: 'PATCH',
            query: `?id=eq.${encodeURIComponent(item.product_id)}`,
            body: {
              stock_quantity: Number(products[0].stock_quantity) + Number(item.quantity)
            }
          });
        }
      }
    }

    const removed = await supabaseRest(table, {
      method: 'DELETE',
      query: `?id=eq.${encodeURIComponent(id)}`
    });
    if (!removed[0]) throw new Error(`${resource} tidak ditemukan.`);
    return removed[0];
  }

  if (path === '/api/materials' && method === 'POST') {
    if (!body.name || !body.unit) throw new Error('Nama dan satuan bahan wajib diisi.');
    const created = await supabaseRest('raw_materials', {
      method: 'POST',
      body: {
        name: body.name,
        unit: body.unit,
        stock_quantity: 0,
        minimum_stock: Number(body.minimum_stock) || 0,
        expiry_date: body.expiry_date || null,
        supplier: body.supplier || '',
        unit_cost: Number(body.unit_cost) || 0
      }
    });
    return created[0];
  }

  if (path === '/api/products' && method === 'POST') {
    if (!body.name || !['Makanan', 'Minuman'].includes(body.category) ||
        !Number.isFinite(Number(body.price)) || Number(body.price) < 0) {
      throw new Error('Nama, kategori, dan harga produk wajib diisi dengan benar.');
    }
    const recipe = Array.isArray(body.recipe)
      ? body.recipe
          .map(entry => ({
            material_id: entry.material_id,
            quantity: Number(entry.quantity) || 0
          }))
          .filter(entry => entry.material_id && entry.quantity > 0)
      : [];
    const created = await supabaseRest('products', {
      method: 'POST',
      body: {
        name: String(body.name).trim(),
        category: body.category,
        price: Number(body.price),
        stock_quantity: Math.max(0, Math.trunc(Number(body.stock_quantity) || 0)),
        recipe
      }
    });
    return created[0];
  }

  if (path === '/api/materials/purchase' && method === 'POST') {
    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Jumlah bahan yang diterima wajib lebih dari 0.');
    }
    if (body.new_material) {
      const details = body.new_material;
      const name = String(details.name || '').trim();
      const unit = String(details.unit || '').trim();
      if (!name || !unit) throw new Error('Nama dan satuan bahan baru wajib diisi.');
      const existing = await supabaseRest('raw_materials', {
        query: `?select=id&name=eq.${encodeURIComponent(name)}`
      });
      if (existing[0]) throw new Error('Bahan ini sudah terdaftar. Pilih bahan tersebut dari daftar.');
      const material = {
        name,
        unit,
        stock_quantity: quantity,
        minimum_stock: Number(details.minimum_stock) || 0,
        expiry_date: details.expiry_date || null,
        supplier: String(details.supplier || '').trim(),
        unit_cost: Number(body.unit_cost) || 0,
        stock_history: []
      };
      material.stock_history = supabaseMovement(material, quantity, 'receive', 'Penerimaan bahan baru');
      const created = await supabaseRest('raw_materials', {
        method: 'POST',
        body: material
      });
      return created[0];
    }

    if (!body.material_id) throw new Error('Pilih bahan baku yang valid.');
    const current = await supabaseRest('raw_materials', {
      query: `?select=*&id=eq.${encodeURIComponent(body.material_id)}`
    });
    if (!current[0]) throw new Error('Bahan baku tidak ditemukan.');
    const patch = {
      stock_quantity: Number(current[0].stock_quantity) + quantity,
      stock_history: supabaseMovement(current[0], quantity, 'receive', 'Penerimaan pembelian')
    };
    if (Number(body.unit_cost) > 0) patch.unit_cost = Number(body.unit_cost);
    const updated = await supabaseRest('raw_materials', {
      method: 'PATCH',
      query: `?id=eq.${encodeURIComponent(body.material_id)}`,
      body: patch
    });
    return updated[0];
  }

  if (path === '/api/production' && method === 'POST') {
    const quantity = Number(body.quantity);
    if (!body.product_id || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Produk dan jumlah produksi wajib diisi.');
    }
    return supabaseRest('rpc/record_production', {
      method: 'POST',
      body: {
        p_product_id: body.product_id,
        p_quantity: quantity
      }
    });
  }

  if (path === '/api/orders' && method === 'POST') {
    const requestedItems = Array.isArray(body.items) ? body.items : [];
    if (!body.cafe_name || !requestedItems.length) {
      throw new Error('Nama cafe dan item pesanan wajib diisi.');
    }
    const items = [];
    const stocks = new Map();
    for (const requested of requestedItems) {
      const quantity = Number(requested.quantity);
      if (!requested.product_id || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Produk dan jumlah pesanan tidak valid.');
      }
      const products = await supabaseRest('products', {
        query: `?select=*&id=eq.${encodeURIComponent(requested.product_id)}`
      });
      const product = products[0];
      if (!product) throw new Error('Produk pesanan tidak ditemukan.');
      if (Number(product.stock_quantity) < quantity) {
        throw new Error(`Stok ${product.name} tidak cukup.`);
      }
      stocks.set(product.id, Number(product.stock_quantity));
      items.push({
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.11);
    const created = await supabaseRest('orders', {
      method: 'POST',
      body: {
        cafe_name: body.cafe_name,
        items,
        subtotal,
        tax,
        total: subtotal + tax,
        status: 'Menunggu'
      }
    });
    for (const item of items) {
      await supabaseRest('products', {
        method: 'PATCH',
        query: `?id=eq.${encodeURIComponent(item.product_id)}`,
        body: { stock_quantity: stocks.get(item.product_id) - item.quantity }
      });
    }
    return created[0];
  }

  throw new Error(`Operasi Supabase tidak dikenali: ${method} ${path}`);
}

async function api(
  path,
  options = {}
) {
  if (localMode && isDirectSupabaseMode()) {
    return supabaseApi(path, options);
  }

  if (localMode) {
    return localApi(
      path,
      options
    );
  }

  const response =
    await fetch(
      path,
      {
        headers: {
          'Content-Type':
            'application/json'
        },
        ...options
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      'Terjadi kesalahan.'
    );
  }

  return data;
}


/* =========================================================
   NOTIFICATION
========================================================= */

function notify(
  message,
  error = false
) {
  const el =
    $('#notice');

  el.textContent =
    message;

  el.className =
    `notice${error ? ' error' : ''}`;

  el.hidden =
    false;

  setTimeout(
    () => {
      el.hidden = true;
    },
    4200
  );
}


/* =========================================================
   NAVIGASI
========================================================= */

function showView(name) {
  document
    .querySelectorAll('.view')
    .forEach(view => {
      view.classList.toggle(
        'active-view',
        view.id ===
        `${name}-view`
      );
    });

  const nav = document.querySelector('.segment-nav');
  const slider = nav?.querySelector('.nav-slider');
  const activeItem = Array.from(document.querySelectorAll('.nav-item')).find(
    item => item.dataset.view === name
  );

  document
    .querySelectorAll('.nav-item')
    .forEach(item => {
      item.classList.toggle(
        'active',
        item.dataset.view ===
        name
      );
    });

  if (nav && slider && activeItem) {
    const isVertical = getComputedStyle(nav).flexDirection === 'column';

    if (isVertical) {
      slider.style.width = '100%';
      slider.style.height = `${activeItem.offsetHeight}px`;
      slider.style.transform = `translateY(${activeItem.offsetTop}px)`;
    } else {
      slider.style.width = `${activeItem.offsetWidth}px`;
      slider.style.height = '100%';
      slider.style.transform = `translateX(${activeItem.offsetLeft}px)`;
    }
  }

  $('#page-title')
    .textContent =
      'Ruang Rasa';
}


function fillSelect(
  selector,
  items,
  label
) {
  $(selector).innerHTML =
    items.map(
      item =>
        `<option value="${item.id}">
          ${item.name} · ${label(item)}
        </option>`
    ).join('');
}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {
  const low =
    state.materials.filter(
      item =>
        Number(
          item.stock_quantity
        ) <=
        Number(
          item.minimum_stock
        )
    );


  /*
   * Penjualan menggunakan subtotal
   * sebelum PPN.
   */

  const totalSales =
    state.orders.reduce(
      (sum, order) =>
        sum +
        Number(
          order.subtotal || 0
        ),
      0
    );


  const totalHpp =
    state.orders.reduce(
      (sum, order) =>
        sum +
        Number(
          order.hpp ??
          calculateOrderHpp(
            order
          )
        ),
      0
    );


  const totalProfit =
    totalSales -
    totalHpp;


  const metricSales = $('#metric-sales');
  const metricOrders = $('#metric-orders');
  const metricStock = $('#metric-stock');
  const metricProducts = $('#metric-products');
  const stockCount = $('#stock-count');
  const lowStockNote = $('#low-stock-note');
  const lowStockList = $('#low-stock-list');

  if (metricSales) metricSales.textContent = rupiah(totalSales);
  if (metricOrders) metricOrders.textContent = state.orders.filter(order => order.status !== 'Selesai').length;
  if (metricStock) metricStock.textContent = low.length;
  if (metricProducts) metricProducts.textContent = state.products.length;
  if (stockCount) stockCount.textContent = low.length;
  if (lowStockNote) lowStockNote.textContent = low.length ? `${low.length} bahan perlu diperiksa` : 'Semua stok dalam batas aman';

  if (lowStockList) {
    lowStockList.innerHTML =
      low.length
        ? low.map(
            item =>
              `<div class="stock-row">
                <div>
                  <strong>${item.name}</strong>
                  <small>
                    ${item.stock_quantity}
                    ${item.unit} tersisa
                  </small>
                </div>

                <small class="stock-alert">
                  Min.
                  ${item.minimum_stock}
                  ${item.unit}
                </small>
              </div>`
          ).join('')
        : '<p class="order-meta">Belum ada stok yang perlu direstock.</p>';
  }

  const railProductCount = $('#rail-product-count');
  const railProducts = $('#rail-products');

  if (railProductCount) railProductCount.textContent = state.products.length;
  if (railProducts) {
    railProducts.innerHTML = state.products.length
      ? state.products.slice(0, 4).map(product => `
          <button class="rail-product" data-view-link="production">
            <span class="rail-product-mark">${escapeHtml(product.category === 'Minuman' ? 'D' : 'M')}</span>
            <span class="rail-product-copy"><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)}</small></span>
            <span class="rail-product-stock">${Number(product.stock_quantity) || 0}</span>
          </button>
        `).join('')
      : '<p class="rail-empty">Belum ada menu.</p>';
  }

  /*
   * Tampilkan ringkasan laba
   * di catatan dashboard.
   */

  const heroNote =
    document.querySelector(
      '.hero-note'
    );

  if (heroNote) {
    heroNote.innerHTML = `
      <span class="hero-icon">✳</span>
      <span>
        Laba penjualan
        <br>
        <strong>
          ${rupiah(totalProfit)}
        </strong>
      </span>
    `;
  }


  const recentOrders = $('#recent-orders');

  if (recentOrders) {
    recentOrders.innerHTML =
      state.orders.length
        ? state.orders
            .slice(0, 5)
            .map(
              order =>
                `<div class="order-row">
                  <div>
                    <span class="order-name">
                      ${order.cafe_name}
                    </span>

                    <span class="order-meta">
                      ${new Date(
                        order.created_at
                      ).toLocaleDateString('id-ID')}
                      ·
                      ${
                        Array.isArray(
                          order.items
                        )
                          ? order.items.length
                          : 0
                      }
                      menu
                    </span>
                  </div>

                  <div>
                    <span class="order-value">
                      ${rupiah(
                        order.total
                      )}
                    </span>

                    <span class="pill">
                      ${order.status}
                    </span>
                  </div>
                </div>`
            )
            .join('')
        : '<p class="order-meta">Belum ada pesanan masuk.</p>';
  }
}


/* =========================================================
   PESANAN
========================================================= */

function renderOrders() {
  const search =
    (
      $('#order-search')
        ?.value || ''
    ).toLowerCase();


  const orders =
    state.orders.filter(
      order =>
        String(
          order.cafe_name || ''
        )
          .toLowerCase()
          .includes(search)
    );


  $('#orders-table')
    .innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Cafe pelanggan</th>
            <th>Tanggal</th>
            <th>Penjualan</th>
            <th>HPP</th>
            <th>Laba</th>
            <th>PPN 11%</th>
            <th>Total</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>

          ${
            orders.length

              ? orders.map(
                  order => {

                    const hpp =
                      Number(
                        order.hpp ??
                        calculateOrderHpp(
                          order
                        )
                      );

                    const profit =
                      Number(
                        order.profit ??
                        (
                          Number(
                            order.subtotal
                          ) - hpp
                        )
                      );

                    return `
                      <tr>

                        <td>
                          <strong>
                            ${order.cafe_name}
                          </strong>
                        </td>

                        <td>
                          ${new Date(
                            order.created_at
                          ).toLocaleDateString(
                            'id-ID'
                          )}
                        </td>

                        <td>
                          ${rupiah(
                            order.subtotal
                          )}
                        </td>

                        <td>
                          ${rupiah(
                            hpp
                          )}
                        </td>

                        <td>
                          <strong>
                            ${rupiah(
                              profit
                            )}
                          </strong>
                        </td>

                        <td>
                          ${rupiah(
                            order.tax
                          )}
                        </td>

                        <td>
                          ${rupiah(
                            order.total
                          )}
                        </td>

                        <td>
                          <select
                            class="status-select"
                            data-order-status="${order.id}"
                          >

                            <option
                              ${
                                order.status ===
                                'Menunggu'
                                  ? 'selected'
                                  : ''
                              }
                            >
                              Menunggu
                            </option>

                            <option
                              ${
                                order.status ===
                                'Diproses'
                                  ? 'selected'
                                  : ''
                              }
                            >
                              Diproses
                            </option>

                            <option
                              ${
                                order.status ===
                                'Selesai'
                                  ? 'selected'
                                  : ''
                              }
                            >
                              Selesai
                            </option>

                            <option
                              ${
                                order.status ===
                                'Dibatalkan'
                                  ? 'selected'
                                  : ''
                              }
                            >
                              Dibatalkan
                            </option>

                          </select>
                        </td>

                        <td>
                          <button
                            class="icon-button danger"
                            data-delete-order="${order.id}"
                            title="Hapus pesanan"
                          >
                            Hapus
                          </button>
                        </td>

                      </tr>
                    `;
                  }
                ).join('')

              : `
                <tr>
                  <td
                    colspan="9"
                    class="empty-state"
                  >
                    Belum ada pesanan.
                  </td>
                </tr>
              `
          }

        </tbody>
      </table>
    `;
}


/* =========================================================
   INVENTORY
========================================================= */

const catalogImageCache = new Map();

const catalogPinterestPhotos = {
  'kopi susu ruang': 'https://i.pinimg.com/736x/44/71/26/4471269f93bbcaf2e148ac8fc718a3b9.jpg',
  'es kopi aren': 'https://i.pinimg.com/736x/0c/f0/99/0cf099d79c8d9df91b35a318641c9ec8.jpg',
  'toast kaya': 'https://i.pinimg.com/736x/f8/28/eb/f828ebd3948b36e168556e2f767c5f39.jpg',
  'matcha latte': 'https://i.pinimg.com/736x/8d/6c/85/8d6c853d1827d681cb6d1fb5607190d2.jpg',
  'korean cream cheese garlic bread': 'https://i.pinimg.com/736x/9b/eb/5a/9beb5a586aa4d6ca0eb88c9ceca64e07.jpg'
};

const catalogImageAliases = {
  'kopi arabika': 'arabica coffee beans',
  'kopi susu ruang': 'iced coffee clear plastic cup',
  'es kopi aren': 'cappuccino glass foam coffee',
  'gula aren': 'palm sugar',
  'gula': 'sugar',
  'gula pasir': 'granulated sugar',
  'gula merah': 'palm sugar',
  'susu fresh milk': 'milk bottle',
  'tepung terigu': 'wheat flour',
  'toast kaya': 'toasted ham cheese sandwich',
  'matcha latte': 'iced matcha latte',
  'nasi ayam rempah': 'spiced chicken rice',
  'gelas plastik 16oz': 'plastic drinking cup',
  'sirup marjan': 'fruit syrup'
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function catalogImageQuery(item, itemType) {
  const normalizedName = String(item.name || '').trim().toLowerCase();
  const hasAlias = Object.hasOwn(catalogImageAliases, normalizedName);
  const searchName = catalogImageAliases[normalizedName] || item.name;
  const category = item.category === 'Minuman' ? 'drink beverage' : 'food dish';
  const qualifier = hasAlias
    ? ''
    : itemType === 'product'
      ? category
      : 'food ingredient';

  return `${searchName} ${qualifier} filetype:bitmap`.trim();
}

function catalogImageMarkup(item, itemType, variant) {
  const imageName = escapeHtml(item.name || 'Item');
  const query = escapeHtml(encodeURIComponent(catalogImageQuery(item, itemType)));
  const pinterestImage = escapeHtml(
    catalogPinterestPhotos[String(item.name || '').trim().toLowerCase()] || ''
  );

  return `
    <div class="catalog-photo ${variant}">
      <span class="catalog-photo-placeholder" aria-hidden="true">Mencari foto</span>
      <img class="catalog-photo-image" data-image-query="${query}" data-pinterest-image="${pinterestImage}" alt="Foto ${imageName}" loading="lazy">
      <div class="catalog-photo-links"><a class="photo-credit" target="_blank" rel="noopener noreferrer" hidden></a></div>
    </div>
  `;
}

function catalogMetadataText(value) {
  return new DOMParser()
    .parseFromString(value || '', 'text/html')
    .body
    .textContent
    .trim();
}

async function findCatalogImage(query) {
  if (catalogImageCache.has(query)) {
    return catalogImageCache.get(query);
  }

  const request = (async () => {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: '6',
      gsrlimit: '10',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: '640',
      format: 'json',
      origin: '*'
    });
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params}`
    );

    if (!response.ok) {
      throw new Error('Pencarian foto tidak tersedia.');
    }

    const data = await response.json();
    const page = Object.values(data.query?.pages || {}).find(result => {
      const image = result.imageinfo?.[0];
      return image?.mime?.startsWith('image/') &&
        !/\.pdf(?:$|[?#])/i.test(result.title);
    });

    if (!page?.imageinfo?.[0]?.thumburl) {
      throw new Error('Foto tidak ditemukan.');
    }

    const image = page.imageinfo[0];
    const metadata = image.extmetadata || {};

    return {
      imageUrl: image.thumburl,
      sourceUrl: image.descriptionurl,
      title: page.title,
      creator: catalogMetadataText(metadata.Artist?.value),
      license: catalogMetadataText(metadata.LicenseShortName?.value)
    };
  })();

  catalogImageCache.set(query, request);

  try {
    return await request;
  } catch (error) {
    catalogImageCache.delete(query);
    throw error;
  }
}

async function loadCatalogImages(root) {
  if (!root) return;

  const images = Array.from(
    root.querySelectorAll('img[data-image-query]')
  );

  await Promise.all(images.map(async image => {
    const photoContainer = image.closest('.catalog-photo');
    const sourceLink = photoContainer.querySelector('.photo-credit');
    const placeholder = photoContainer.querySelector('.catalog-photo-placeholder');

    try {
      const pinterestImage = image.dataset.pinterestImage;
      const imageQuery = decodeURIComponent(image.dataset.imageQuery);
      const photo = pinterestImage
        ? {
            imageUrl: pinterestImage,
            sourceUrl: '',
            title: 'Foto Pinterest',
            creator: 'Pinterest',
            license: ''
          }
        : await findCatalogImage(imageQuery);

      const setCredit = currentPhoto => {
        if (!currentPhoto.sourceUrl) {
          sourceLink.hidden = true;
          return;
        }

        const credit = [currentPhoto.creator, currentPhoto.license]
          .filter(Boolean)
          .join(' · ') || 'Wikimedia Commons';

        sourceLink.href = currentPhoto.sourceUrl;
        sourceLink.textContent = credit;
        sourceLink.title = `${currentPhoto.title} · ${credit}`;
        sourceLink.hidden = false;
      };

      const setImage = currentPhoto => {
        setCredit(currentPhoto);
        image.onload = () => photoContainer.classList.add('is-loaded');
        image.onerror = async () => {
          if (image.dataset.pinterestImage && !image.dataset.fallbackAttempted) {
            image.dataset.fallbackAttempted = 'true';
            try {
              const fallback = await findCatalogImage(imageQuery);
              setImage(fallback);
            } catch {
              photoContainer.classList.add('is-unavailable');
              sourceLink.hidden = true;
              placeholder.textContent = 'Foto tidak tersedia';
            }
            return;
          }

          photoContainer.classList.add('is-unavailable');
          sourceLink.hidden = true;
          placeholder.textContent = 'Foto tidak tersedia';
        };
        image.src = currentPhoto.imageUrl;
      };

      setImage(photo);
    } catch {
      photoContainer.classList.add('is-unavailable');
      placeholder.textContent = 'Foto belum tersedia';
    }
  }));
}

function renderInventory() {
  const search =
    (
      $('#material-search')
        ?.value || ''
    ).toLowerCase();


  const materials =
    state.materials.filter(
      item =>
        `${item.name} ${
          item.supplier || ''
        }`
          .toLowerCase()
          .includes(search)
    );


  $('#inventory-table')
    .innerHTML = `
      <table class="data-table">

        <thead>
          <tr>
            <th>Bahan baku</th>
            <th>Stok</th>
            <th>Minimum</th>
            <th>Harga beli</th>
            <th>Kedaluwarsa</th>
            <th>Supplier</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>

          ${
            materials.length

              ? materials.map(
                  item => {

                    const low =
                      Number(
                        item.stock_quantity
                      ) <=
                      Number(
                        item.minimum_stock
                      );

                    return `
                      <tr>

                        <td>
                          <strong>${item.name}</strong>
                        </td>

                        <td
                          class="${
                            low
                              ? 'stock-alert'
                              : ''
                          }"
                        >
                          ${Number(
                            item.stock_quantity
                          ).toFixed(2)}
                          ${item.unit}
                        </td>

                        <td>
                          ${Number(
                            item.minimum_stock
                          ).toFixed(2)}
                          ${item.unit}
                        </td>

                        <td>
                          ${rupiah(
                            item.unit_cost
                          )}
                          /
                          ${item.unit}
                        </td>

                        <td>
                          ${
                            item.expiry_date
                              ? new Date(
                                  item.expiry_date
                                ).toLocaleDateString(
                                  'id-ID'
                                )
                              : '-'
                          }
                        </td>

                        <td>
                          ${item.supplier || '-'}
                        </td>

                        <td>
                          <div
                            class="action-group"
                          >

                            <button
                              class="icon-button"
                              data-edit-material="${item.id}"
                            >
                              Edit
                            </button>

                            <button
                              class="icon-button danger"
                              data-delete-material="${item.id}"
                            >
                              Hapus
                            </button>

                          </div>
                        </td>

                      </tr>
                    `;
                  }
                ).join('')

              : `
                <tr>
                  <td
                    colspan="7"
                    class="empty-state"
                  >
                    Belum ada bahan baku.
                  </td>
                </tr>
              `
          }

        </tbody>
      </table>
    `;

}


/* =========================================================
   PRODUK
========================================================= */

function renderProducts() {
  const search =
    (
      $('#product-search')
        ?.value || ''
    ).toLowerCase();


  const products =
    state.products.filter(
      item =>
        item.name
          .toLowerCase()
          .includes(search)
    );


  $('#product-list')
    .innerHTML =
      products.length

        ? products.map(
            item => {

              const hpp =
                calculateProductHpp(
                  item,
                  state.materials
                );

              const profit =
                Number(
                  item.price
                ) - hpp;

              const recipeText =
                (item.recipe || [])
                  .map(entry => {
                    const material = state.materials.find(
                      materialItem =>
                        materialItem.id ===
                        entry.material_id
                    );

                    return material
                      ? `${entry.quantity} ${material.unit} ${material.name}`
                      : '';
                  })
                  .filter(Boolean)
                  .join(', ') || 'Belum ada resep';

              return `
                <div
                  class="product-item"
                >

                  ${catalogImageMarkup(item, 'product', 'catalog-photo-product')}

                  <strong>
                    ${item.name}
                  </strong>

                  <small>
                    ${item.category}
                  </small>

                  <b>
                    ${item.stock_quantity}
                    porsi ·
                    ${rupiah(
                      item.price
                    )}
                  </b>

                  <small>
                    Resep: ${recipeText}
                  </small>

                  <small>
                    HPP:
                    ${rupiah(hpp)}
                    ·
                    Laba:
                    ${rupiah(profit)}
                  </small>

                  <div
                    class="action-group"
                  >

                    <button
                      class="icon-button"
                      data-edit-product="${item.id}"
                    >
                      Edit
                    </button>

                    <button
                      class="icon-button danger"
                      data-delete-product="${item.id}"
                    >
                      Hapus
                    </button>

                  </div>

                </div>
              `;
            }
          ).join('')

        : `
          <p class="empty-state">
            Belum ada produk.
          </p>
        `;

  loadCatalogImages($('#product-list'));
}

function renderProductionRecords() {
  const records = state.production_records || [];
  const table = $('#production-records-table');
  if (!table) return;

  table.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Produk</th>
          <th>Jumlah produksi</th>
          <th>Waktu</th>
        </tr>
      </thead>
      <tbody>
        ${
          records.length
            ? records.map(record => `
                <tr>
                  <td><strong>${escapeHtml(record.product_name || 'Produk dihapus')}</strong></td>
                  <td>${Number(record.quantity) || 0}</td>
                  <td>${record.created_at ? new Date(record.created_at).toLocaleString('id-ID') : '-'}</td>
                </tr>
              `).join('')
            : '<tr><td colspan="3" class="empty-state">Belum ada riwayat produksi.</td></tr>'
        }
      </tbody>
    </table>
  `;
}


/* =========================================================
   STOCK MONITOR
========================================================= */

function allMovements() {
  return state.materials
    .flatMap(
      material =>
        (
          material.stock_history ||
          []
        ).map(
          movement => ({
            ...movement,
            material_name:
              material.name,
            unit:
              material.unit
          })
        )
    )
    .sort(
      (a, b) =>
        new Date(
          b.created_at
        ) -
        new Date(
          a.created_at
        )
    );
}


function renderStockMonitor() {
  const cards = state.materials.map(material => {
    const history = material.stock_history || [];

    const received = history
      .filter(item => item.type === 'receive')
      .reduce((sum, item) => sum + Number(item.quantity), 0);

    const consumed = Math.abs(
      history
        .filter(item => item.type === 'consume')
        .reduce((sum, item) => sum + Number(item.quantity), 0)
    );

    const currentStock = Number(material.stock_quantity) || 0;
    const minimumStock = Number(material.minimum_stock) || 0;
    const low = currentStock <= minimumStock;

    return `
      <article class="monitor-card ${low ? 'alert' : ''}">
        <strong>${material.name}</strong>

        <div class="monitor-value ${low ? 'trend-down' : ''}">
          ${currentStock.toFixed(2)} ${material.unit}
        </div>

        <small>
          Stok saat ini ·
          masuk ${received.toFixed(2)} ${material.unit} ·
          terpakai ${consumed.toFixed(2)} ${material.unit}
        </small>
      </article>
    `;
  }).join('');

  $('#stock-monitor').innerHTML =
    cards || '<p class="empty-state">Belum ada bahan untuk dipantau.</p>';

  $('#movement-filter').innerHTML = `
    <option value="all">Semua bahan</option>
    ${state.materials.map(material =>
      `<option value="${material.id}">${material.name}</option>`
    ).join('')}
  `;

  renderMovements();
}


function renderMovements() {
  const filter =
    $('#movement-filter')
      ?.value || 'all';


  const materialByName =
    new Map(
      state.materials.map(
        material => [
          material.name,
          material
        ]
      )
    );


  const movements =
    filter === 'all'
      ? allMovements()
      : allMovements().filter(
          movement =>
            materialByName.get(
              movement.material_name
            )?.id === filter
        );


  $('#movement-table')
    .innerHTML =
      movements.length

        ? `
          <table class="data-table">

            <thead>
              <tr>
                <th>Waktu</th>
                <th>Bahan</th>
                <th>Perubahan</th>
                <th>Jenis</th>
                <th>Keterangan</th>
              </tr>
            </thead>

            <tbody>

              ${movements
                .map(
                  movement => {

                    const positive =
                      Number(
                        movement.quantity
                      ) >= 0;

                    const label =
                      movement.type ===
                      'consume'
                        ? 'Terpakai'
                        : movement.type ===
                          'receive'
                          ? 'Masuk'
                          : 'Penyesuaian';

                    return `
                      <tr>

                        <td>
                          ${new Date(
                            movement.created_at
                          ).toLocaleString(
                            'id-ID'
                          )}
                        </td>

                        <td>
                          <strong>
                            ${movement.material_name}
                          </strong>
                        </td>

                        <td
                          class="${
                            positive
                              ? 'trend-up'
                              : 'trend-down'
                          }"
                        >
                          ${
                            positive
                              ? '+'
                              : ''
                          }

                          ${Number(
                            movement.quantity
                          ).toFixed(2)}

                          ${movement.unit}
                        </td>

                        <td>
                          <span
                            class="movement-type ${movement.type}"
                          >
                            ${label}
                          </span>
                        </td>

                        <td>
                          ${movement.reason}
                        </td>

                      </tr>
                    `;
                  }
                )
                .join('')}

            </tbody>
          </table>
        `

        : `
          <p class="empty-state">
            Belum ada pergerakan stok tercatat.
          </p>
        `;
}


/* =========================================================
   SELECT
========================================================= */

function bindSelects() {

  fillSelect(
    '#order-product',
    state.products,
    item =>
      rupiah(
        item.price
      )
  );


  fillSelect(
    '#production-product',
    state.products,
    item =>
      `${item.stock_quantity} stok`
  );


  fillSelect(
    '#purchase-material',
    state.materials,
    item =>
      `${item.stock_quantity} ${item.unit}`
  );

  $('#purchase-material').insertAdjacentHTML(
    'beforeend',
    '<option value="__new__">+ Bahan baru</option>'
  );
  updatePurchaseFields();


  updatePrice();
}

function updatePurchaseFields() {
  const isNewMaterial = $('#purchase-material').value === '__new__';
  const newFields = $('#purchase-new-fields');

  if (!newFields) return;

  newFields.hidden = !isNewMaterial;
  $('#purchase-new-name').required = isNewMaterial;
  $('#purchase-new-unit').required = isNewMaterial;
  $('#purchase-new-minimum').required = isNewMaterial;
}


function updatePrice() {

  const product =
    state.products.find(
      item =>
        item.id ===
        $('#order-product')
          .value
    );


  $('#order-preview')
    .textContent =
      product
        ? rupiah(
            product.price *
            Number(
              $('#order-quantity')
                .value || 1
            )
          )
        : rupiah(0);
}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadData() {

  try {

    Object.assign(
      state,
      await api(
        '/api/dashboard'
      )
    );

    if (isDirectSupabaseMode()) {
      document.querySelectorAll('#connection-status').forEach(element => {
        element.textContent = 'Supabase terhubung';
      });
    }


    /*
     * Pastikan order lama
     * punya HPP dan laba.
     */

    state.orders =
      state.orders.map(
        order => {

          const hpp =
            Number(
              order.hpp ??
              calculateOrderHpp(
                order
              )
            );

          const subtotal =
            Number(
              order.subtotal ||
              0
            );

          return {
            ...order,

            hpp,

            profit:
              Number(
                order.profit ??
                (
                  subtotal -
                  hpp
                )
              )
          };
        }
      );


    renderDashboard();

    renderOrders();

    renderInventory();

    renderProducts();

    renderProductionRecords();

    renderStockMonitor();

    bindSelects();

  } catch (error) {

    console.error(
      'Gagal memuat data:',
      error
    );
    if (isDirectSupabaseMode()) {
      document.querySelectorAll('#connection-status').forEach(element => {
        element.textContent = 'Koneksi Supabase gagal';
      });
      notify(`Gagal memuat data Supabase: ${error.message}`, true);
    }
  }
}


/* =========================================================
   TAMBAHKAN FIELD HARGA BELI KE MODAL
   TANPA MENGUBAH HTML
========================================================= */

function ensureCostFields() {

  /*
   * FIELD HARGA BELI BAHAN
   */

  if (
    !$('#material-unit-cost')
  ) {

    const supplier =
      $('#material-supplier');

    if (supplier) {

      const label =
        document.createElement(
          'label'
        );

      label.innerHTML = `
        Harga beli per unit

        <input
          id="material-unit-cost"
          type="number"
          min="0"
          step="100"
          value="0"
          placeholder="Contoh: 120000"
        >
      `;

      supplier.parentElement
        .insertAdjacentElement(
          'afterend',
          label
        );
    }
  }


  /*
   * FIELD HARGA BELI PADA PEMBELIAN
   */

  if (
    !$('#purchase-unit-cost')
  ) {

    const quantity =
      $('#purchase-quantity');

    if (quantity) {

      const label =
        document.createElement(
          'label'
        );

      label.innerHTML = `
        Harga beli per unit

        <input
          id="purchase-unit-cost"
          type="number"
          min="0"
          step="100"
          value="0"
          placeholder="Contoh: 120000"
        >
      `;

      quantity.parentElement
        .insertAdjacentElement(
          'afterend',
          label
        );
    }
  }
}


/* =========================================================
   EDIT BAHAN
========================================================= */

function openMaterialEditor(
  id = ''
) {

  const material =
    state.materials.find(
      item =>
        item.id === id
    );


  $('#material-form')
    .reset();


  $('#material-id')
    .value =
      material?.id || '';


  $('#material-dialog-title')
    .textContent =
      material
        ? 'Edit bahan baku'
        : 'Tambah bahan baru';

  $('#material-stock-field').style.display =
    material ? '' : 'none';
  $('#material-stock').required =
    Boolean(material);
  $('#material-stock-hint').hidden =
    Boolean(material);


  $('#material-name')
    .value =
      material?.name || '';


  $('#material-unit')
    .value =
      material?.unit || '';


  $('#material-stock')
    .value =
      material?.stock_quantity || 0;


  $('#material-minimum')
    .value =
      material?.minimum_stock || 0;


  $('#material-expiry')
    .value =
      material?.expiry_date || '';


  $('#material-supplier')
    .value =
      material?.supplier || '';


  $('#material-unit-cost')
    .value =
      material?.unit_cost || 0;


  $('#material-dialog')
    .showModal();
}


/* =========================================================
   EDIT PRODUK
========================================================= */

function createRecipeRow(materialId = '', quantity = 0) {
  return `
    <div class="recipe-row">
      <select class="recipe-material" required>
        <option value="">Pilih bahan</option>
        ${state.materials.map(material => `
          <option value="${material.id}" ${material.id === materialId ? 'selected' : ''}>
            ${material.name} (${material.unit})
          </option>
        `).join('')}
      </select>
      <input
        class="recipe-qty"
        type="number"
        min="0.001"
        step="0.001"
        value="${Number(quantity || 0).toFixed(3)}"
        placeholder="Jumlah"
        required
      >
      <button type="button" class="icon-button danger recipe-remove">Hapus</button>
    </div>
  `;
}

function renderRecipeBuilder(recipe = []) {
  const container = $('#recipe-rows');
  if (!container) return;

  const rows =
    Array.isArray(recipe) && recipe.length
      ? recipe
      : [{ material_id: state.materials[0]?.id || '', quantity: 0 }];

  container.innerHTML = rows
    .map(entry => createRecipeRow(entry.material_id, entry.quantity))
    .join('');
}

function openProductEditor(
  id = ''
) {

  const product =
    state.products.find(
      item =>
        item.id === id
    );


  $('#product-form')
    .reset();


  $('#product-id')
    .value =
      product?.id || '';


  $('#product-dialog-title')
    .textContent =
      product
        ? 'Edit produk menu'
        : 'Tambah produk menu';


  $('#product-name')
    .value =
      product?.name || '';


  $('#product-category')
    .value =
      product?.category ||
      'Makanan';


  $('#product-price')
    .value =
      product?.price || 0;


  $('#product-stock')
    .value =
      product?.stock_quantity || 0;


  renderRecipeBuilder(
    product?.recipe || []
  );


  $('#product-dialog')
    .showModal();
}


/* =========================================================
   SUBMIT BAHAN
========================================================= */

async function submitMaterial(
  event
) {

  event.preventDefault();


  const id =
    $('#material-id')
      .value;


  const payload = {

    name:
      $('#material-name')
        .value
        .trim(),

    unit:
      $('#material-unit')
        .value
        .trim(),

    stock_quantity:
      id
        ? Number(
            $('#material-stock')
              .value
          )
        : 0,

    minimum_stock:
      Number(
        $('#material-minimum')
          .value
      ),

    expiry_date:
      $('#material-expiry')
        .value ||
      null,

    supplier:
      $('#material-supplier')
        .value
        .trim(),

    unit_cost:
      Number(
        $('#material-unit-cost')
          .value
      ) || 0
  };


  try {

    await api(
      id
        ? `/api/materials/${id}`
        : '/api/materials',
      {
        method:
          id
            ? 'PATCH'
            : 'POST',

        body:
          JSON.stringify(
            payload
          )
      }
    );


    $('#material-dialog')
      .close();


    notify(
      id
        ? 'Data bahan berhasil diperbarui.'
        : 'Bahan berhasil didaftarkan. Stok tetap 0; gunakan Terima pembelian untuk menambah stok.'
    );


    await loadData();

  } catch (error) {

    notify(
      error.message,
      true
    );
  }
}


/* =========================================================
   SUBMIT PRODUK
========================================================= */

async function submitProduct(
  event
) {

  event.preventDefault();


  const id =
    $('#product-id')
      .value;


  const recipe =
    Array.from(
      document.querySelectorAll(
        '.recipe-row'
      )
    )
      .map(row => {
        const materialId =
          row.querySelector(
            '.recipe-material'
          )?.value;

        const quantity =
          Number(
            row.querySelector(
              '.recipe-qty'
            )?.value || 0
          );

        return materialId && quantity > 0
          ? {
              material_id: materialId,
              quantity
            }
          : null;
      })
      .filter(Boolean);

  const payload = {

    name:
      $('#product-name')
        .value
        .trim(),

    category:
      $('#product-category')
        .value,

    price:
      Number(
        $('#product-price')
          .value
      ),

    stock_quantity:
      Number(
        $('#product-stock')
          .value
      ),

    recipe
  };


  try {

    await api(
      id
        ? `/api/products/${id}`
        : '/api/products',
      {
        method:
          id
            ? 'PATCH'
            : 'POST',

        body:
          JSON.stringify(
            payload
          )
      }
    );


    $('#product-dialog')
      .close();


    notify(
      id
        ? 'Produk berhasil diperbarui.'
        : 'Produk berhasil ditambahkan.'
    );


    await loadData();

  } catch (error) {

    notify(
      error.message,
      true
    );
  }
}


/* =========================================================
   DELETE
========================================================= */

async function deleteRecord(
  path,
  message
) {

  if (
    !confirm(message)
  ) {
    return;
  }


  try {

    await api(
      path,
      {
        method:
          'DELETE'
      }
    );


    notify(
      'Data berhasil dihapus.'
    );


    await loadData();

  } catch (error) {

    notify(
      error.message,
      true
    );
  }
}


/* =========================================================
   UPDATE STATUS ORDER
========================================================= */

async function updateOrderStatus(
  id,
  status
) {

  try {

    await api(
      `/api/orders/${id}`,
      {
        method:
          'PATCH',

        body:
          JSON.stringify({
            status
          })
      }
    );


    notify(
      'Status pesanan diperbarui.'
    );


    await loadData();

  } catch (error) {

    notify(
      error.message,
      true
    );
  }
}


/* =========================================================
   SUBMIT ORDER
========================================================= */

async function submitOrder(
  event
) {

  event.preventDefault();


  const product =
    state.products.find(
      item =>
        item.id ===
        $('#order-product')
          .value
    );


  if (!product) {

    notify(
      'Produk belum dipilih.',
      true
    );

    return;
  }


  const quantity =
    Number(
      $('#order-quantity')
        .value
    );


  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity <= 0
  ) {

    notify(
      'Jumlah produk harus lebih dari 0.',
      true
    );

    return;
  }


  try {

    await api(
      '/api/orders',
      {
        method:
          'POST',

        body:
          JSON.stringify({

            cafe_name:
              $('#cafe-name')
                .value,

            items: [
              {
                product_id:
                  product.id,

                name:
                  product.name,

                price:
                  product.price,

                quantity
              }
            ]

          })
      }
    );


    $('#order-dialog')
      .close();


    event.target
      .reset();


    notify(
      'Pesanan berhasil dicatat. HPP, laba, PPN, dan pemakaian bahan dihitung otomatis.'
    );


    await loadData();

  } catch (error) {

    notify(
      error.message,
      true
    );
  }
}


/* =========================================================
   SUBMIT PURCHASE
========================================================= */

async function submitPurchase(
  event
) {

  event.preventDefault();


  try {
    const isNewMaterial = $('#purchase-material').value === '__new__';

    await api(
      '/api/materials/purchase',
      {
        method:
          'POST',

        body:
          JSON.stringify({

            material_id: isNewMaterial
              ? null
              : $('#purchase-material').value,

            new_material: isNewMaterial
              ? {
                  name: $('#purchase-new-name').value.trim(),
                  unit: $('#purchase-new-unit').value.trim(),
                  minimum_stock: Number($('#purchase-new-minimum').value),
                  expiry_date: $('#purchase-new-expiry').value || null,
                  supplier: $('#purchase-new-supplier').value.trim()
                }
              : null,

            quantity:
              Number(
                $('#purchase-quantity')
                  .value
              ),

            unit_cost:
              Number(
                $('#purchase-unit-cost')
                  ?.value || 0
              )

          })
      }
    );


    $('#purchase-dialog')
      .close();


    event.target
      .reset();


    notify(
      isNewMaterial
        ? 'Bahan baru dibuat dan stok penerimaan langsung ditambahkan.'
        : 'Penerimaan bahan berhasil ditambahkan.'
    );


    await loadData();

  } catch (error) {

    notify(
      error.message,
      true
    );
  }
}


/* =========================================================
   SUBMIT PRODUKSI
========================================================= */

async function submitProduction(
  event
) {

  event.preventDefault();


  try {

    await api(
      '/api/production',
      {
        method:
          'POST',

        body:
          JSON.stringify({

            product_id:
              $('#production-product')
                .value,

            quantity:
              Number(
                $('#production-quantity')
                  .value
              )

          })
      }
    );


    event.target
      .reset();


    notify(
      localMode && !isDirectSupabaseMode()
        ? 'Produksi dicatat di browser saja, belum masuk ke Supabase. Jalankan backend lalu buka http://localhost:3000.'
        : 'Produksi berhasil dicatat dan stok diperbarui di Supabase.'
    );


    await loadData();

  } catch (error) {

    notify(
      error.message,
      true
    );
  }
}


/* =========================================================
   EVENT NAVIGASI
========================================================= */

document
  .querySelectorAll(
    '.nav-item'
  )
  .forEach(
    button =>
      button.addEventListener(
        'click',
        () =>
          showView(
            button.dataset.view
          )
      )
  );


document.addEventListener('click', event => {
  const button = event.target.closest('[data-view-link]');
  if (button) showView(button.dataset.viewLink);
});

$('#add-recipe-row')?.addEventListener('click', () => {
  const rows = $('#recipe-rows');
  if (!rows) return;
  rows.insertAdjacentHTML(
    'beforeend',
    createRecipeRow()
  );
});

$('#recipe-rows')?.addEventListener('click', event => {
  const button = event.target.closest('.recipe-remove');
  if (!button) return;
  const row = button.closest('.recipe-row');
  if (row) row.remove();
});

showView(
  'dashboard'
);


/* =========================================================
   EVENT BUTTON
========================================================= */

$('#open-order')
  .addEventListener(
    'click',
    () =>
      $('#order-dialog')
        .showModal()
  );


$('#open-purchase')
  .addEventListener(
    'click',
    () =>
      $('#purchase-dialog')
        .showModal()
  );

$('#rail-open-purchase')
  .addEventListener(
    'click',
    () =>
      $('#purchase-dialog')
        .showModal()
  );


$('#open-product')
  .addEventListener(
    'click',
    () =>
      openProductEditor()
  );


/* =========================================================
   FORM
========================================================= */

$('#order-form')
  .addEventListener(
    'submit',
    submitOrder
  );


$('#purchase-form')
  .addEventListener(
    'submit',
    submitPurchase
  );

$('#purchase-material')
  .addEventListener(
    'change',
    updatePurchaseFields
  );


$('#material-form')
  .addEventListener(
    'submit',
    submitMaterial
  );


$('#product-form')
  .addEventListener(
    'submit',
    submitProduct
  );


$('#production-form')
  .addEventListener(
    'submit',
    submitProduction
  );


/* =========================================================
   SEARCH & INPUT
========================================================= */

$('#order-product')
  .addEventListener(
    'change',
    updatePrice
  );


$('#order-quantity')
  .addEventListener(
    'input',
    updatePrice
  );


$('#order-search')
  .addEventListener(
    'input',
    renderOrders
  );


$('#material-search')
  .addEventListener(
    'input',
    renderInventory
  );


$('#product-search')
  .addEventListener(
    'input',
    renderProducts
  );


$('#movement-filter')
  .addEventListener(
    'change',
    renderMovements
  );


/* =========================================================
   EVENT EDIT / DELETE
========================================================= */

document.addEventListener(
  'click',
  event => {

    const target =
      event.target;


    if (
      target.dataset
        .editMaterial
    ) {

      openMaterialEditor(
        target.dataset
          .editMaterial
      );
    }


    if (
      target.dataset
        .deleteMaterial
    ) {

      deleteRecord(
        `/api/materials/${
          target.dataset
            .deleteMaterial
        }`,
        'Hapus bahan baku ini? Bahan yang dipakai resep tidak dapat dihapus.'
      );
    }


    if (
      target.dataset
        .editProduct
    ) {

      openProductEditor(
        target.dataset
          .editProduct
      );
    }


    if (
      target.dataset
        .deleteProduct
    ) {

      deleteRecord(
        `/api/products/${
          target.dataset
            .deleteProduct
        }`,
        'Hapus produk ini?'
      );
    }


    if (
      target.dataset
        .deleteOrder
    ) {

      deleteRecord(
        `/api/orders/${
          target.dataset
            .deleteOrder
        }`,
        'Hapus pesanan ini? Stok produk dan bahan baku akan dikembalikan.'
      );
    }
  }
);


/* =========================================================
   STATUS ORDER
========================================================= */

document.addEventListener(
  'change',
  event => {

    if (
      event.target.dataset
        .orderStatus
    ) {

      updateOrderStatus(
        event.target.dataset
          .orderStatus,
        event.target.value
      );
    }
  }
);


/* =========================================================
   FIELD TAMBAHAN
========================================================= */

ensureCostFields();


/* =========================================================
   MODE SUPABASE
========================================================= */

if (!localMode) {
  $('#configure-supabase').hidden = true;

  document.querySelectorAll('#connection-status').forEach(element => {
    element.textContent = 'Supabase terhubung';
  });

  document.querySelectorAll('#connection-mode').forEach(element => {
    element.textContent = 'Data tersimpan di cloud';
  });

} else if (isDirectSupabaseMode()) {
  document.querySelectorAll('#connection-status').forEach(element => {
    element.textContent = 'Menghubungkan ke Supabase...';
  });

  document.querySelectorAll('#connection-mode').forEach(element => {
    element.textContent = 'Data dikirim langsung dari browser ke Supabase.';
  });
} else {
  document.querySelectorAll('#connection-status').forEach(element => {
    element.textContent = 'Mode lokal — tidak tersambung ke Supabase';
  });

  document.querySelectorAll('#connection-mode').forEach(element => {
    element.textContent = 'Mode lokal saja. Hubungkan Supabase untuk menyimpan data ke cloud.';
  });
}

$('#configure-supabase').addEventListener('click', () => {
  const config = getSupabaseConfig();
  $('#supabase-url').value = config?.url || '';
  $('#supabase-key').value = config?.key || '';
  $('#supabase-dialog').showModal();
});

$('#close-supabase-dialog').addEventListener('click', () => {
  $('#supabase-dialog').close();
});

$('#supabase-form').addEventListener('submit', event => {
  event.preventDefault();
  const urlInput = $('#supabase-url').value.trim().replace(/\/+$/, '');
  const key = $('#supabase-key').value.trim();

  let projectUrl;
  try {
    projectUrl = new URL(urlInput);
  } catch {
    notify('Project URL Supabase tidak valid.', true);
    return;
  }

  if (projectUrl.protocol !== 'https:') {
    notify('Project URL harus menggunakan HTTPS.', true);
    return;
  }
  let serviceRoleKey = key.startsWith('sb_secret_');
  const jwtParts = key.split('.');
  if (!serviceRoleKey && jwtParts.length === 3) {
    try {
      const payload = JSON.parse(atob(jwtParts[1].replace(/-/g, '+').replace(/_/g, '/')));
      serviceRoleKey = payload.role === 'service_role';
    } catch {
      serviceRoleKey = false;
    }
  }
  if (!key || serviceRoleKey) {
    notify('Gunakan anon/publishable key, bukan secret atau service_role key.', true);
    return;
  }

  localStorage.setItem(supabaseConfigKey, JSON.stringify({
    url: projectUrl.origin,
    key
  }));
  window.location.reload();
});

$('#disconnect-supabase').addEventListener('click', () => {
  localStorage.removeItem(supabaseConfigKey);
  window.location.reload();
});


/* =========================================================
   START APPLICATION
========================================================= */

loadData();

document.querySelectorAll('.close-button').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    const dialog = button.closest('dialog');
    if (dialog) {
      dialog.close();
    }
  });
});


function updateCurrentDate() {
  const dateElement = document.querySelector('#current-date');

  if (!dateElement) return;

  const today = new Date();

  const formattedDate = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  dateElement.textContent = formattedDate.toUpperCase();
}

updateCurrentDate();
