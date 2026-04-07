create table if not exists public.users (
  id text primary key,
  name text not null,
  phone text not null unique,
  punch_count integer not null default 0,
  total_punches integer not null default 10,
  qr_code text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id text primary key default 'default',
  stamp_type text not null default 'star',
  background_style text not null default 'white',
  progress_style text not null default 'stamps',
  shop_name text not null default 'Punch Card'
);

create table if not exists public.notifications (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

insert into public.settings (id, stamp_type, background_style, progress_style, shop_name)
values ('default', 'star', 'white', 'stamps', 'Punch Card')
on conflict (id) do nothing;
