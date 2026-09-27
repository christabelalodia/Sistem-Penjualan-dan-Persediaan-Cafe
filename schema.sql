-- Ruang Rasa: tiga entitas inti untuk penjualan dan persediaan.
-- Jalankan seluruh file ini di Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists raw_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text not null,
  stock_quantity numeric(12,2) not null default 0 check (stock_quantity >= 0),
  minimum_stock numeric(12,2) not null default 0 check (minimum_stock >= 0),
  expiry_date date,
  supplier text,
  stock_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table raw_materials add column if not exists stock_history jsonb not null default '[]'::jsonb;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('Makanan', 'Minuman')),
  price numeric(12,2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  recipe jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

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
alter table orders enable row level security;

drop policy if exists "local access raw materials" on raw_materials;
drop policy if exists "local access products" on products;
drop policy if exists "local access orders" on orders;
create policy "local access raw materials" on raw_materials for all using (true) with check (true);
create policy "local access products" on products for all using (true) with check (true);
create policy "local access orders" on orders for all using (true) with check (true);

insert into raw_materials (name, unit, stock_quantity, minimum_stock, expiry_date, supplier) values
  ('Kopi Arabika', 'kg', 12, 5, '2027-01-15', 'PT Biji Nusantara'),
  ('Susu Fresh Milk', 'liter', 18, 8, '2026-10-04', 'Segar Jaya'),
  ('Tepung Terigu', 'kg', 25, 10, '2027-03-20', 'Pangan Makmur'),
  ('Gula Aren', 'kg', 9, 3, '2027-02-12', 'Manis Alami')
 on conflict do nothing;

insert into products (name, category, price, stock_quantity, recipe) values
  ('Kopi Susu Ruang', 'Minuman', 18000, 24, '[]'::jsonb),
  ('Nasi Ayam Rempah', 'Makanan', 32000, 12, '[]'::jsonb),
  ('Es Kopi Aren', 'Minuman', 22000, 18, '[]'::jsonb),
  ('Toast Kaya', 'Makanan', 16000, 20, '[]'::jsonb)
 on conflict do nothing;

update products set recipe = jsonb_build_array(
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Kopi Arabika'), 'quantity', 0.018),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Susu Fresh Milk'), 'quantity', 0.2),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Gula Aren'), 'quantity', 0.02)
) where name = 'Kopi Susu Ruang';

update products set recipe = jsonb_build_array(
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Tepung Terigu'), 'quantity', 0.12),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Gula Aren'), 'quantity', 0.015)
) where name = 'Nasi Ayam Rempah';

update products set recipe = jsonb_build_array(
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Kopi Arabika'), 'quantity', 0.018),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Susu Fresh Milk'), 'quantity', 0.2),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Gula Aren'), 'quantity', 0.025)
) where name = 'Es Kopi Aren';

update products set recipe = jsonb_build_array(
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Tepung Terigu'), 'quantity', 0.08),
  jsonb_build_object('material_id', (select id from raw_materials where name = 'Gula Aren'), 'quantity', 0.01)
) where name = 'Toast Kaya';
