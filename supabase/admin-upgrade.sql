create extension if not exists pgcrypto;

alter table public.users
  add column if not exists avatar_url text;

alter table public.settings
  add column if not exists background_image_url text,
  add column if not exists accent_color text,
  add column if not exists welcome_message text,
  add column if not exists hero_badge text,
  add column if not exists reward_label text,
  add column if not exists deal_label text,
  add column if not exists card_style text;

update public.settings
set
  accent_color = coalesce(accent_color, '#111827'),
  welcome_message = coalesce(welcome_message, 'Tap your QR code in-store to collect punches.'),
  hero_badge = coalesce(hero_badge, 'Member status'),
  reward_label = coalesce(reward_label, 'Free drink'),
  deal_label = coalesce(deal_label, 'Deal bar'),
  card_style = coalesce(card_style, 'luxe')
where id = 'default';
