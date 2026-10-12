-- Ruang Rasa: empat entitas inti untuk penjualan dan persediaan.
-- Jalankan seluruh file ini di Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists raw_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text not null,
  stock_quantity numeric(12,2) not null default 0 check (stock_quantity >= 0),
  minimum_stock numeric(12,2) not null default 0 check (minimum_stock >= 0),
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  expiry_date date,
  supplier text,
  stock_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table raw_materials add column if not exists stock_history jsonb not null default '[]'::jsonb;
alter table raw_materials add column if not exists unit_cost numeric(12,2) not null default 0;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('Makanan', 'Minuman')),
  price numeric(12,2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  recipe jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists production_records (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

-- Lengkapi tabel yang mungkin sudah dibuat sebelum skema riwayat produksi tersedia.
alter table production_records add column if not exists product_id uuid references products(id) on delete set null;
alter table production_records add column if not exists product_name text;
alter table production_records add column if not exists quantity integer not null default 0;
alter table production_records add column if not exists created_at timestamptz not null default now();

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  cafe_name text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'Menunggu' check (status in ('Menunggu', 'Diproses', 'Selesai', 'Dibatalkan')),
  created_at timestamptz not null default now()
);

alter table raw_materials enable row level security;
alter table products enable row level security;
alter table production_records enable row level security;
alter table orders enable row level security;

drop policy if exists "local access raw materials" on raw_materials;
drop policy if exists "local access products" on products;
drop policy if exists "local access production records" on production_records;
drop policy if exists "local access orders" on orders;
create policy "local access raw materials" on raw_materials for all using (true) with check (true);
create policy "local access products" on products for all using (true) with check (true);
create policy "local access production records" on production_records for all using (true) with check (true);
create policy "local access orders" on orders for all using (true) with check (true);

insert into raw_materials (name, unit, stock_quantity, minimum_stock, expiry_date, supplier) values
  ('Kopi Arabika', 'kg', 12, 5, '2027-01-15', 'PT Biji Nusantara'),
  ('Susu Fresh Milk', 'liter', 18, 8, '2026-10-04', 'Segar Jaya'),
  ('Tepung Terigu', 'kg', 25, 10, '2027-03-20', 'Pangan Makmur'),
  ('Gula Aren', 'kg', 9, 3, '2027-02-12', 'Manis Alami')
 on conflict do nothing;

insert into raw_materials (name, unit, stock_quantity, minimum_stock, supplier) values
  ('Roti Bun', 'pcs', 0, 1, ''),
  ('Cream Cheese', 'kg', 0, 0.25, ''),
  ('Mentega', 'kg', 0, 0.1, ''),
  ('Bawang Putih', 'kg', 0, 0.05, ''),
  ('Susu Kental Manis', 'liter', 0, 0.2, ''),
  ('Parsley', 'kg', 0, 0.01, '')
 on conflict do nothing;

update raw_materials
set stock_quantity = case name
      when 'Roti Bun' then 24
      when 'Cream Cheese' then 2
      when 'Mentega' then 1
      when 'Bawang Putih' then 0.5
      when 'Susu Kental Manis' then 2
      when 'Parsley' then 0.1
    end,
    stock_history = jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid()::text,
      'quantity', case name
        when 'Roti Bun' then 24
        when 'Cream Cheese' then 2
        when 'Mentega' then 1
        when 'Bawang Putih' then 0.5
        when 'Susu Kental Manis' then 2
        when 'Parsley' then 0.1
      end,
      'type', 'receive',
      'reason', 'Stok awal contoh',
      'created_at', now()
    ))
where name in ('Roti Bun', 'Cream Cheese', 'Mentega', 'Bawang Putih', 'Susu Kental Manis', 'Parsley')
  and stock_quantity = 0
  and stock_history = '[]'::jsonb;

update raw_materials
set unit_cost = case when unit_cost = 0 then case name
      when 'Roti Bun' then 4000
      when 'Cream Cheese' then 120000
      when 'Mentega' then 130000
      when 'Bawang Putih' then 35000
      when 'Susu Kental Manis' then 45000
      when 'Parsley' then 80000
    end else unit_cost end,
    supplier = case when coalesce(nullif(trim(supplier), ''), '') = '' then case name
      when 'Roti Bun' then 'Bakery Lokal'
      when 'Cream Cheese' then 'DairyFresh'
      when 'Mentega' then 'DairyFresh'
      when 'Bawang Putih' then 'Pasar Segar'
      when 'Susu Kental Manis' then 'Toko Bahan Kue'
      when 'Parsley' then 'Sayur Segar'
    end else supplier end,
    expiry_date = coalesce(expiry_date, case name
      when 'Roti Bun' then date '2026-10-06'
      when 'Cream Cheese' then date '2026-10-20'
      when 'Mentega' then date '2027-01-03'
      when 'Bawang Putih' then date '2026-11-03'
      when 'Susu Kental Manis' then date '2027-04-03'
      when 'Parsley' then date '2026-10-10'
    end)
where name in ('Roti Bun', 'Cream Cheese', 'Mentega', 'Bawang Putih', 'Susu Kental Manis', 'Parsley');

update products
set name = 'Korean Cream Cheese Garlic Bread'
where name = 'Nasi Ayam Rempah'
  and not exists (
    select 1 from products where name = 'Korean Cream Cheese Garlic Bread'
  );

insert into products (name, category, price, stock_quantity, recipe) values
  ('Kopi Susu Ruang', 'Minuman', 18000, 24, '[]'::jsonb),
  ('Korean Cream Cheese Garlic Bread', 'Makanan', 32000, 12, '[]'::jsonb),
  ('Es Kopi Aren', 'Minuman', 22000, 18, '[]'::jsonb),
  ('Toast Kaya', 'Makanan', 16000, 20, '[]'::jsonb)
 on conflict do nothing;

update products set recipe = jsonb_build_array(
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Kopi Arabika'), 'quantity', 0.018),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Susu Fresh Milk'), 'quantity', 0.2),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Gula Aren'), 'quantity', 0.02)
) where name = 'Kopi Susu Ruang';

update products set recipe = jsonb_build_array(
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Roti Bun'), 'quantity', 1),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Cream Cheese'), 'quantity', 0.05),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Mentega'), 'quantity', 0.03),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Bawang Putih'), 'quantity', 0.006),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Susu Kental Manis'), 'quantity', 0.02),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Parsley'), 'quantity', 0.002)
) where name = 'Korean Cream Cheese Garlic Bread';

update products set recipe = jsonb_build_array(
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Kopi Arabika'), 'quantity', 0.018),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Susu Fresh Milk'), 'quantity', 0.2),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Gula Aren'), 'quantity', 0.025)
) where name = 'Es Kopi Aren';

update products set recipe = jsonb_build_array(
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Tepung Terigu'), 'quantity', 0.08),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Gula Aren'), 'quantity', 0.01)
) where name = 'Toast Kaya';

-- Simpan produksi, kurangi bahan resep, dan tambah stok produk secara atomik.
create or replace function public.record_production(
  p_product_id uuid,
  p_quantity integer
)
returns public.production_records
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_product public.products%rowtype;
  v_material public.raw_materials%rowtype;
  v_recipe jsonb;
  v_used numeric;
  v_record public.production_records%rowtype;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Jumlah produksi harus lebih dari 0.';
  end if;

  select *
  into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Produk tidak ditemukan.';
  end if;

  for v_recipe in
    select recipe.value
    from jsonb_array_elements(coalesce(v_product.recipe, '[]'::jsonb)) as recipe(value)
  loop
    select *
    into v_material
    from public.raw_materials
    where id = (v_recipe->>'material_id')::uuid
    for update;

    if not found then
      raise exception 'Bahan dalam resep tidak ditemukan.';
    end if;

    v_used := coalesce((v_recipe->>'quantity')::numeric, 0) * p_quantity;
    if v_used <= 0 then
      raise exception 'Jumlah bahan dalam resep tidak valid.';
    end if;

    if v_material.stock_quantity < v_used then
      raise exception 'Stok % tidak cukup.', v_material.name;
    end if;
  end loop;

  for v_recipe in
    select recipe.value
    from jsonb_array_elements(coalesce(v_product.recipe, '[]'::jsonb)) as recipe(value)
  loop
    v_used := (v_recipe->>'quantity')::numeric * p_quantity;

    update public.raw_materials
    set stock_quantity = stock_quantity - v_used,
        stock_history = jsonb_build_array(jsonb_build_object(
          'id', gen_random_uuid()::text,
          'quantity', -v_used,
          'type', 'consume',
          'reason', format('Produksi %s (%s batch)', v_product.name, p_quantity),
          'created_at', now()
        )) || coalesce(stock_history, '[]'::jsonb)
    where id = (v_recipe->>'material_id')::uuid;
  end loop;

  update public.products
  set stock_quantity = stock_quantity + p_quantity
  where id = v_product.id;

  insert into public.production_records (product_id, product_name, quantity)
  values (v_product.id, v_product.name, p_quantity)
  returning * into v_record;

  return v_record;
end;
$$;

grant execute on function public.record_production(uuid, integer) to anon, authenticated;
