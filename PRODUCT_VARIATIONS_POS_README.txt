TYS POS — PRODUCT VARIATIONS POS INTEGRATION

FILES TO REPLACE
1. index.html
2. js/product-variations.js
3. js/sales.js
4. js/cloud-sales.js

WHAT THIS UPDATE DOES
- Loads saved Supabase product variations on the POS.
- Shows active variation buttons under the parent product.
- Adds the selected variation at its own selling price.
- Shows the variation name in the cart, receipt and saved sale item name.
- Deducts the configured fractional stock amount locally and in Supabase.
- Uses proportional cost for the variation so reports calculate cost/profit correctly.
- Supports optional variation barcodes.
- Leaves previous sales unchanged.

TEST BEFORE PUSHING
1. Refresh with Ctrl+F5.
2. Open a product that has saved active variations.
3. Confirm the variation buttons appear.
4. Sell one variation with stock deduction 0.25.
5. Confirm stock reduces by 0.25.
6. Confirm the receipt and sale history show Product - Variation.
7. Confirm Supabase products stock has the same new quantity.

IMPORTANT
The product_variations table must already exist. Since your variations page is saving online, it already exists in your project.
