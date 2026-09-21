# Vasthi Couture — Shopify OS 2.0 Theme

A production-ready Shopify Online Store 2.0 theme built for Vasthi Couture,
a women's fashion brand currently selling 3-piece Kurti Sets (Kurti + Bottom
+ Dupatta).

## Install

1. Download `vasthi-couture-shopify-theme.zip` (see Releases / project root).
2. In Shopify Admin, go to **Online Store → Themes → Add theme → Upload zip file**.
3. Select the zip and upload.
4. Publish the theme, then open the **Theme Editor** to:
   - Upload your logo and favicon (**Theme settings → Logo**)
   - Set brand colors, fonts and page width (**Theme settings → Colors / Typography / Layout**)
   - Set the homepage hero image, heading and CTAs (**Home page → Hero banner**)
   - Assign a **Main menu** in **Settings → Navigation** (Home, 3-Piece Kurti
     Sets, New Arrivals, Best Sellers, Sale) and pick it in **Header** settings
   - Pick collections for New Arrivals / Best Sellers / Shop by Style sections
   - Add products with `compare_at_price` set higher than `price` to show the
     MRP + discount pricing automatically

## Structure

Standard Shopify OS 2.0 architecture: `layout/`, `templates/` (JSON),
`sections/`, `snippets/`, `assets/`, `config/`, `locales/`. No external
frameworks — vanilla Liquid, HTML, CSS and JS only.

## Notes

- Pricing (MRP, selling price, discount %) is calculated automatically from
  each product's native `price` and `compare_at_price` — never hard-coded.
- Currency follows the store's configured currency (set it to INR in
  **Settings → General** in Shopify Admin); the theme uses Shopify's native
  `money` filter throughout.
- The category focus (3-piece Kurti Sets only) is enforced through
  navigation/homepage content, not code restrictions — additional product
  types can be added later through collections without any theme changes.
