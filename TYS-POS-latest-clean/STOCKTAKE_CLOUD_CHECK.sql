-- TYS POS Stocktake cloud check and repair
-- Run in Supabase SQL Editor once if Stocktake is blocked by table structure or RLS.

create extension if not exists pgcrypto;

create table if not exists public.stocktakes (
    id uuid primary key default gen_random_uuid(),
    created_by uuid references public.profiles(id) on delete set null,
    created_by_name text,
    counted_items integer not null default 0,
    shortage_items integer not null default 0,
    extra_items integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.stocktake_items (
    id uuid primary key default gen_random_uuid(),
    stocktake_id uuid not null references public.stocktakes(id) on delete cascade,
    product_id uuid references public.products(id) on delete set null,
    product_name text not null,
    system_stock numeric not null default 0,
    physical_stock numeric not null default 0,
    difference numeric not null default 0
);

alter table public.stocktakes enable row level security;
alter table public.stocktake_items enable row level security;

-- These policies permit only authenticated Admin profiles.
drop policy if exists "Admins manage stocktakes" on public.stocktakes;
create policy "Admins manage stocktakes"
on public.stocktakes for all to authenticated
using (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and lower(profiles.role) = 'admin'
    )
)
with check (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and lower(profiles.role) = 'admin'
    )
);

drop policy if exists "Admins manage stocktake items" on public.stocktake_items;
create policy "Admins manage stocktake items"
on public.stocktake_items for all to authenticated
using (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and lower(profiles.role) = 'admin'
    )
)
with check (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and lower(profiles.role) = 'admin'
    )
);

drop policy if exists "Admins update products for stocktake" on public.products;
create policy "Admins update products for stocktake"
on public.products for update to authenticated
using (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and lower(profiles.role) = 'admin'
    )
)
with check (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and lower(profiles.role) = 'admin'
    )
);

notify pgrst, 'reload schema';
