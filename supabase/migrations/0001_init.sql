-- Meu planejamento — schema inicial (uso individual).
-- Toda tabela tem user_id e RLS: só o dono da linha lê e escreve.

-- ---------- Planejamento & metas ----------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'Pessoal' check (category in ('Pessoal','Apartamento','Finanças','Estudos','Trabalho')),
  priority text not null default 'Média' check (priority in ('Alta','Média','Baixa')),
  horizon text not null default 'diario' check (horizon in ('diario','semanal','semestral','anual')),
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  milestone text,
  scope text not null default 'semestral' check (scope in ('semestral','anual')),
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now()
);

-- ---------- Estudos ----------
create table public.study_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null,
  goal text,
  step_reading boolean not null default false,
  step_summary boolean not null default false,
  step_exercise boolean not null default false,
  step_review boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Links (estudos e referências do apartamento) ----------
create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  area text not null check (area in ('estudos','apartamento')),
  category text,
  room text,
  title text not null,
  url text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- Finanças ----------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text not null check (payment_method in ('receita','cartao','debito','custo_fixo')),
  category text check (category in ('Moradia','Investimentos','Educação','Assinaturas','Cuidado Pessoal','Outros')),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.piggy_banks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  target numeric(12,2) not null check (target > 0),
  current numeric(12,2) not null default 0 check (current >= 0),
  created_at timestamptz not null default now()
);

-- ---------- Meu Apartamento ----------
create table public.apt_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  budget_cap numeric(12,2) not null default 0 check (budget_cap >= 0)
);

create table public.apt_stages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  note text,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.apt_works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  service text not null,
  provider text,
  status text not null default 'Planejado' check (status in ('Planejado','Orçando','Em Andamento','Concluído')),
  estimated numeric(12,2) not null default 0 check (estimated >= 0),
  paid numeric(12,2) not null default 0 check (paid >= 0),
  created_at timestamptz not null default now()
);

create table public.apt_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  room text not null check (room in ('Cozinha','Sala','Quarto','Banheiro','Home Office','Lavanderia')),
  item text not null,
  status text not null default 'Pesquisando' check (status in ('Pesquisando','Comprado','Entregue')),
  estimated numeric(12,2) not null default 0 check (estimated >= 0),
  paid numeric(12,2) not null default 0 check (paid >= 0),
  created_at timestamptz not null default now()
);

create table public.apt_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  room text not null check (room in ('Sala de Estar','Home Office','Cozinha','Quarto','Banheiro')),
  kind text not null check (kind in ('Projeto 3D','Render','Planta Baixa','Inspiração')),
  title text not null,
  image_path text,          -- caminho no bucket privado apt-images
  image_url text,           -- alternativa: URL externa
  dimensions text,
  lighting text,
  palette text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.apt_room_specs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  room text not null,
  notes text not null default '',
  unique (user_id, room)
);

-- ---------- Rotina, hábitos e desenvolvimento pessoal ----------
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.habit_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  day date not null,
  unique (habit_id, day)
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question text not null,
  impact_10_minutes text,
  impact_10_months text,
  impact_10_years text,
  created_at timestamptz not null default now()
);

create table public.personal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('gratidao','desejo','amo_fazer')),
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- Índices ----------
create index on public.tasks (user_id);
create index on public.goals (user_id);
create index on public.study_topics (user_id);
create index on public.links (user_id, area);
create index on public.transactions (user_id, occurred_on);
create index on public.piggy_banks (user_id);
create index on public.apt_stages (user_id);
create index on public.apt_works (user_id);
create index on public.apt_purchases (user_id);
create index on public.apt_projects (user_id);
create index on public.habits (user_id);
create index on public.habit_checks (user_id, day);
create index on public.decisions (user_id);
create index on public.personal_items (user_id, kind);

-- ---------- RLS: somente o dono ----------
do $$
declare t text;
begin
  foreach t in array array[
    'tasks','goals','study_topics','links','transactions','piggy_banks',
    'apt_settings','apt_stages','apt_works','apt_purchases','apt_projects',
    'apt_room_specs','habits','habit_checks','decisions','personal_items'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy "%s_select_own" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s_insert_own" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s_update_own" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s_delete_own" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t, t);
  end loop;
end $$;

-- ---------- Storage: bucket privado para imagens do apartamento ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('apt-images', 'apt-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Arquivos ficam em <user_id>/<arquivo>. Upsert exige insert + select + update.
create policy "apt_images_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'apt-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "apt_images_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'apt-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "apt_images_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'apt-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'apt-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "apt_images_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'apt-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
