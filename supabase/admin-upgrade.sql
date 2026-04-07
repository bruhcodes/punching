create extension if not exists pgcrypto;

alter table public.users
  add column if not exists avatar_url text;

alter table public.settings
  add column if not exists background_image_url text,
  add column if not exists accent_color text,
  add column if not exists welcome_message text;

update public.settings
set
  accent_color = coalesce(accent_color, '#111827'),
  welcome_message = coalesce(welcome_message, 'Tap your QR code in-store to collect punches.')
where id = 'default';
