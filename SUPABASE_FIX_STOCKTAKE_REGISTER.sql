-- TYS POS: stocktake repair + cashier register access
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ---------- STOCKTAKE TABLES ----------
create table if not exists public.stocktakes (
    id uuid primary key default gen_random_uuid(),
    created_by uuid references public.profiles(id) on delete set null,
    created_by_name text,
    counted_items integer not null default 0,
    shortage_items integer not null default 0,
    extra_items integer not null default 0,
    created_at timestamptz not null default now()
);

alter table public.stocktakes
    add column if not exists created_by uuid references public.profiles(id) on delete set null,
    add column if not exists created_by_name text,
    add column if not exists counted_items integer not null default 0,
    add column if not exists shortage_items integer not null default 0,
    add column if not exists extra_items integer not null default 0,
    add column if not exists created_at timestamptz not null default now();

create table if not exists public.stocktake_items (
    id uuid primary key default gen_random_uuid(),
    stocktake_id uuid not null references public.stocktakes(id) on delete cascade,
    product_id uuid references public.products(id) on delete set null,
    product_name text not null,
    system_stock numeric not null default 0,
    physical_stock numeric not null default 0,
    difference numeric not null default 0
);

alter table public.stocktake_items
    add column if not exists stocktake_id uuid references public.stocktakes(id) on delete cascade,
    add column if not exists product_id uuid references public.products(id) on delete set null,
    add column if not exists product_name text,
    add column if not exists system_stock numeric not null default 0,
    add column if not exists physical_stock numeric not null default 0,
    add column if not exists difference numeric not null default 0;

alter table public.stocktakes enable row level security;
alter table public.stocktake_items enable row level security;

-- Admin-only stocktake permissions.
drop policy if exists "Admins manage stocktakes" on public.stocktakes;
create policy "Admins manage stocktakes"
on public.stocktakes for all to authenticated
using (public.is_pos_admin())
with check (public.is_pos_admin());

drop policy if exists "Admins manage stocktake items" on public.stocktake_items;
create policy "Admins manage stocktake items"
on public.stocktake_items for all to authenticated
using (public.is_pos_admin())
with check (public.is_pos_admin());

-- Admin must be able to adjust products and add stock movements.
-- Keep any existing policies; these add explicit admin access.
drop policy if exists "Admins update products for stocktake" on public.products;
create policy "Admins update products for stocktake"
on public.products for update to authenticated
using (public.is_pos_admin())
with check (public.is_pos_admin());

drop policy if exists "Admins insert stock movements" on public.stock_movements;
create policy "Admins insert stock movements"
on public.stock_movements for insert to authenticated
with check (public.is_pos_admin());

-- ---------- CASHIER REGISTER ACCESS ----------
alter table public.registers enable row level security;

-- Remove the earlier admin-only all-action policy if present.
drop policy if exists "Admins manage registers" on public.registers;

-- Admin can see and manage every register.
drop policy if exists "Admins manage all registers" on public.registers;
create policy "Admins manage all registers"
on public.registers for all to authenticated
using (public.is_pos_admin())
with check (public.is_pos_admin());

-- Cashiers can read their own register records.
drop policy if exists "Cashiers read own registers" on public.registers;
create policy "Cashiers read own registers"
on public.registers for select to authenticated
using (cashier_id = auth.uid());

-- Cashiers can open a register only for themselves.
drop policy if exists "Cashiers open own registers" on public.registers;
create policy "Cashiers open own registers"
on public.registers for insert to authenticated
with check (cashier_id = auth.uid());

-- Cashiers can close/update only their own register.
drop policy if exists "Cashiers update own registers" on public.registers;
create policy "Cashiers update own registers"
on public.registers for update to authenticated
using (cashier_id = auth.uid())
with check (cashier_id = auth.uid());

notify pgrst, 'reload schema';
