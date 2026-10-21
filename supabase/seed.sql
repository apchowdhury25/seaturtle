-- Development seed only. Every commercial row is flagged is_demonstration = true.
-- Do not run this file against production. It contains no orders, payments, or donations.

insert into public.categories (id, parent_id, name, slug, description, sort_order)
values
  ('10000000-0000-4000-8000-000000000001', null, 'Men', 'men', 'Men''s clothing.', 1),
  ('10000000-0000-4000-8000-000000000002', null, 'Women', 'women', 'Women''s clothing.', 2),
  ('10000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001', 'Men''s Jeans', 'mens-jeans', 'Demonstration category.', 1),
  ('10000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000001', 'Men''s Denim', 'mens-denim', 'Demonstration category.', 2),
  ('10000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'Men''s Cotton Polos', 'mens-polos', 'Demonstration category.', 3),
  ('10000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000001', 'Men''s Underwear', 'mens-underwear', 'Demonstration category.', 4),
  ('10000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000002', 'Women''s Jeans', 'womens-jeans', 'Demonstration category.', 1),
  ('10000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000002', 'Women''s Denim', 'womens-denim', 'Demonstration category.', 2),
  ('10000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000002', 'Women''s Dresses', 'womens-dresses', 'Demonstration category.', 3),
  ('10000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000002', 'Women''s Underwear', 'womens-underwear', 'Demonstration category.', 4)
on conflict (id) do nothing;

insert into public.products (
  id, name, slug, sku, description, short_description, category_id, gender, product_type, currency, status,
  is_demonstration, is_featured, material_composition, fit, care_instructions, sustainability_summary,
  seo_title, seo_description, tax_category, published_at
) values
  ('20000000-0000-4000-8000-000000000001', 'Demonstration Indigo Jean', 'demonstration-indigo-jean', 'DEMO-JEAN-M',
   'Demonstration product for local development. This is not a production garment and cannot be published as live inventory.',
   'Demonstration men''s jean.', '10000000-0000-4000-8000-000000000011', 'men', 'jeans', 'USD', 'active',
   true, true, 'Not recorded — demonstration data', 'Straight', 'Demonstration care text.',
   'No verified sustainability attributes are attached to this demonstration product.',
   'Demonstration Indigo Jean', 'Development-only product.', 'apparel', now()),
  ('20000000-0000-4000-8000-000000000002', 'Demonstration Coastal Jean', 'demonstration-coastal-jean', 'DEMO-JEAN-W',
   'Demonstration product for local development. Not a photograph or specification of a current production garment.',
   'Demonstration women''s jean.', '10000000-0000-4000-8000-000000000021', 'women', 'jeans', 'USD', 'active',
   true, true, 'Not recorded — demonstration data', 'Straight', 'Demonstration care text.',
   'No verified sustainability attributes are attached to this demonstration product.',
   'Demonstration Coastal Jean', 'Development-only product.', 'apparel', now()),
  ('20000000-0000-4000-8000-000000000003', 'Demonstration Navy Polo', 'demonstration-navy-polo', 'DEMO-POLO',
   'Demonstration product for local development.',
   'Demonstration cotton polo.', '10000000-0000-4000-8000-000000000013', 'men', 'polo', 'USD', 'active',
   true, true, 'Not recorded — demonstration data', 'Regular', 'Demonstration care text.',
   'No verified sustainability attributes are attached to this demonstration product.',
   'Demonstration Navy Polo', 'Development-only product.', 'apparel', now()),
  ('20000000-0000-4000-8000-000000000004', 'Demonstration Ivory Dress', 'demonstration-ivory-dress', 'DEMO-DRESS',
   'Demonstration product for local development.',
   'Demonstration shirt dress.', '10000000-0000-4000-8000-000000000023', 'women', 'dress', 'USD', 'active',
   true, false, 'Not recorded — demonstration data', 'Relaxed', 'Demonstration care text.',
   'No verified sustainability attributes are attached to this demonstration product.',
   'Demonstration Ivory Dress', 'Development-only product.', 'apparel', now())
on conflict (id) do nothing;

insert into public.product_images (id, product_id, storage_path, alt_text, sort_order)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '/images/editorial/mens-denim.jpg', 'Provisional campaign photograph of a man wearing indigo jeans. Not a current production sample.', 0),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '/images/editorial/womens-denim.jpg', 'Provisional campaign photograph of a woman wearing jeans beside the sea. Not a current production sample.', 0),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '/images/editorial/polo.jpg', 'Provisional campaign photograph of a man wearing a navy polo. Not a current production sample.', 0),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', '/images/editorial/dress.jpg', 'Provisional campaign photograph of a woman wearing an ivory shirt dress. Not a current production sample.', 0)
on conflict (id) do nothing;

insert into public.product_variants (
  id, product_id, sku, color_name, color_hex, size_label, regular_price_minor, currency, weight_grams
) values
  ('40000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000001', 'DEMO-JEAN-M-30', 'Indigo', '#1d3d6e', '30', 12800, 'USD', 700),
  ('40000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000001', 'DEMO-JEAN-M-32', 'Indigo', '#1d3d6e', '32', 12800, 'USD', 720),
  ('40000000-0000-4000-8000-000000000021', '20000000-0000-4000-8000-000000000002', 'DEMO-JEAN-W-28', 'Indigo', '#1d3d6e', '28', 12800, 'USD', 640),
  ('40000000-0000-4000-8000-000000000031', '20000000-0000-4000-8000-000000000003', 'DEMO-POLO-S', 'Navy', '#0e2433', 'S', 7800, 'USD', 280),
  ('40000000-0000-4000-8000-000000000032', '20000000-0000-4000-8000-000000000003', 'DEMO-POLO-M', 'Navy', '#0e2433', 'M', 7800, 'USD', 300),
  ('40000000-0000-4000-8000-000000000041', '20000000-0000-4000-8000-000000000004', 'DEMO-DRESS-S', 'Ivory', '#f4efe4', 'S', 14800, 'USD', 420),
  ('40000000-0000-4000-8000-000000000042', '20000000-0000-4000-8000-000000000004', 'DEMO-DRESS-M', 'Ivory', '#f4efe4', 'M', 14800, 'USD', 440)
on conflict (id) do nothing;

insert into public.inventory (variant_id, on_hand, reserved, low_stock_threshold)
values
  ('40000000-0000-4000-8000-000000000011', 6, 0, 2),
  ('40000000-0000-4000-8000-000000000012', 4, 0, 2),
  ('40000000-0000-4000-8000-000000000021', 5, 0, 2),
  ('40000000-0000-4000-8000-000000000031', 8, 0, 2),
  ('40000000-0000-4000-8000-000000000032', 8, 0, 2),
  ('40000000-0000-4000-8000-000000000041', 3, 0, 2),
  ('40000000-0000-4000-8000-000000000042', 3, 0, 2)
on conflict (variant_id) do nothing;

insert into public.shipping_zones (id, name, countries)
values ('50000000-0000-4000-8000-000000000001', 'Demonstration destinations', array['US', 'BD'])
on conflict (id) do nothing;

insert into public.shipping_methods (
  id, zone_id, name, countries, currency, flat_minor, free_threshold_minor, per_kg_minor,
  estimate_min_days, estimate_max_days, is_active, is_demonstration
) values (
  '50000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001',
  'Demonstration flat rate', array['US', 'BD'], 'USD', 1800, 20000, 0, null, null, true, true
) on conflict (id) do nothing;

insert into public.discounts (
  id, code, description, type, percentage_bps, is_active, is_demonstration, per_customer_limit
) values (
  '60000000-0000-4000-8000-000000000001', 'DEMO10',
  'Development-only ten percent code. Not valid in production.', 'percentage', 1000, true, true, 5
) on conflict (id) do nothing;

insert into public.suppliers (id, public_name, legal_name, country_code, status, is_public, is_demonstration, summary)
values (
  '70000000-0000-4000-8000-000000000001', 'Demonstration Mill', 'Not a real supplier', 'BD', 'pending', false, true,
  'Placeholder record for exercising the supplier workflow. Do not describe this mill as vetted.'
) on conflict (id) do nothing;

insert into public.manufacturing_facilities (id, supplier_id, name, country_code, city, status, is_public, is_demonstration, summary)
values (
  '70000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001',
  'Planned Dhaka facility (unverified)', 'BD', 'Dhaka', 'planned', false, true,
  'The owner intends to establish a facility in Dhaka. No certification, permit, or performance record is on file.'
) on conflict (id) do nothing;

insert into public.conservation_programs (
  id, name, model, currency, is_active, is_public, is_demonstration, public_explanation
) values (
  '80000000-0000-4000-8000-000000000001', 'Demonstration contribution program', 'percent_profit', 'USD',
  false, false, true,
  'Draft program for development. No rate is active and no contribution has been accrued or paid.'
) on conflict (id) do nothing;

insert into public.announcements (id, message, is_active, sort_order)
values
  ('90000000-0000-4000-8000-000000000001', 'Thoughtfully Made. Responsibly Sourced.', true, 1),
  ('90000000-0000-4000-8000-000000000002', 'Discover Premium Denim with a Purpose.', true, 2),
  ('90000000-0000-4000-8000-000000000003', 'Every Better Choice Helps Build a Better Future.', true, 3)
on conflict (id) do nothing;

insert into public.site_settings (key, value)
values
  ('brand', '{"tagline":"Wear the Change. Protect Our Oceans.","support_tagline":"Premium Style. Responsible Choices. A Healthier Planet."}'::jsonb),
  ('commerce', '{"reservation_minutes":30,"base_currency":"USD"}'::jsonb),
  ('contact', '{"email":null,"phone":null,"address":null}'::jsonb)
on conflict (key) do nothing;
