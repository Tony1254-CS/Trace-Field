create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 72),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 500),
  place text check (place is null or char_length(place) <= 100),
  visit_date date,
  target_lat double precision,
  target_lng double precision,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint missions_target_pair check ((target_lat is null) = (target_lng is null)),
  constraint missions_target_latitude check (target_lat is null or target_lat between -90 and 90),
  constraint missions_target_longitude check (target_lng is null or target_lng between -180 and 180)
);

create index if not exists missions_user_updated_idx on public.missions (user_id, updated_at desc);
create index if not exists missions_user_title_idx on public.missions (user_id, lower(title));
create trigger missions_set_updated_at before update on public.missions
for each row execute function public.set_updated_at();

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete restrict,
  answer text not null check (answer in ('supports', 'contradicts', 'inconclusive', 'not-observable')),
  note text not null default '' check (char_length(note) <= 1200),
  captured_at timestamptz not null,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  photo_path text,
  verification_state text not null default 'awaiting_review' check (verification_state = 'awaiting_review'),
  created_at timestamptz not null default now(),
  constraint observations_location_pair check ((latitude is null) = (longitude is null) and (latitude is null) = (accuracy is null)),
  constraint observations_latitude check (latitude is null or latitude between -90 and 90),
  constraint observations_longitude check (longitude is null or longitude between -180 and 180),
  constraint observations_accuracy check (accuracy is null or accuracy between 0 and 1000000),
  constraint observations_photo_owner_path check (photo_path is null or photo_path like user_id::text || '/%')
);

create index if not exists observations_user_captured_idx on public.observations (user_id, captured_at desc);
create index if not exists observations_user_mission_idx on public.observations (user_id, mission_id);
create index if not exists observations_user_answer_idx on public.observations (user_id, answer, captured_at desc);
create index if not exists observations_note_search_idx on public.observations using gin (to_tsvector('simple', note));

alter table public.missions enable row level security;
alter table public.observations enable row level security;
revoke all on public.missions, public.observations from anon;
grant select, insert, update, delete on public.missions, public.observations to authenticated;

create policy "Users read their own missions" on public.missions
  for select to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy "Users create their own missions" on public.missions
  for insert to authenticated with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy "Users update their own missions" on public.missions
  for update to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy "Users delete their own missions without observations" on public.missions
  for delete to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "Users read their own observations" on public.observations
  for select to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy "Users create observations for their missions" on public.observations
  for insert to authenticated with check (
    (select auth.uid()) is not null and user_id = (select auth.uid())
    and exists (select 1 from public.missions m where m.id = mission_id and m.user_id = (select auth.uid()))
  );
create policy "Users update their own observations" on public.observations
  for update to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid())
    and exists (select 1 from public.missions m where m.id = mission_id and m.user_id = (select auth.uid())));
create policy "Users delete their own observations" on public.observations
  for delete to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trace-photos', 'trace-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = false, file_size_limit = 8388608, allowed_mime_types = excluded.allowed_mime_types;

create policy "Users read their own TRACE photos" on storage.objects
  for select to authenticated using (bucket_id = 'trace-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users upload their own TRACE photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'trace-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users delete their own TRACE photos" on storage.objects
  for delete to authenticated using (bucket_id = 'trace-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create or replace function public.restore_trace_records(p_missions jsonb, p_observations jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  mission_count integer := 0;
  observation_count integer := 0;
  item jsonb;
  location jsonb;
  target jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;

  for item in select value from jsonb_array_elements(p_missions) loop
    target := item -> 'target';
    insert into public.missions (id, user_id, title, prompt, place, visit_date, target_lat, target_lng, archived_at, created_at, updated_at)
    values (
      (item ->> 'id')::uuid, (select auth.uid()), item ->> 'title', item ->> 'prompt', nullif(item ->> 'place', ''),
      nullif(item ->> 'visitDate', '')::date, nullif(target ->> 'lat', '')::double precision, nullif(target ->> 'lng', '')::double precision,
      nullif(item ->> 'archivedAt', '')::timestamptz, (item ->> 'createdAt')::timestamptz, (item ->> 'updatedAt')::timestamptz
    );
    mission_count := mission_count + 1;
  end loop;

  for item in select value from jsonb_array_elements(p_observations) loop
    location := item -> 'location';
    insert into public.observations (id, user_id, mission_id, answer, note, captured_at, latitude, longitude, accuracy, photo_path, verification_state, created_at)
    values (
      (item ->> 'id')::uuid, (select auth.uid()), (item ->> 'missionId')::uuid, item ->> 'answer', coalesce(item ->> 'note', ''),
      (item ->> 'capturedAt')::timestamptz, nullif(location ->> 'lat', '')::double precision, nullif(location ->> 'lng', '')::double precision,
      nullif(location ->> 'accuracy', '')::double precision, nullif(item ->> 'photoPath', ''), 'awaiting_review', (item ->> 'createdAt')::timestamptz
    );
    observation_count := observation_count + 1;
  end loop;

  return jsonb_build_object('missions', mission_count, 'observations', observation_count);
end;
$$;

revoke all on function public.restore_trace_records(jsonb, jsonb) from public, anon;
grant execute on function public.restore_trace_records(jsonb, jsonb) to authenticated;
