TYS POS — Offline Stock Adjustment Release

Updated files:
- js/cloud-products.js
- js/inventory.js

What it does:
- + Stock and - Stock update Supabase immediately when online.
- If offline or Supabase cannot be reached, the final stock quantity is saved locally.
- Pending quantities synchronize automatically when internet returns.
- The bottom-right badge shows Online • Synced, Offline, or pending updates.
- Product editing and deletion still require internet.

Safe test:
1. Open Inventory while online and wait for products to load.
2. Disconnect internet.
3. Add 1 to one product.
4. Confirm the stock changes and the badge reports 1 pending.
5. Reconnect internet.
6. Wait for Online • Synced.
7. Confirm the quantity in Supabase products.
