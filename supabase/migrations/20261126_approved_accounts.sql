create policy "approved profiles only clients" on public.clients as restrictive for all to authenticated using (exists(select 1 from public.profiles p where p.id=(select auth.uid()))) with check (exists(select 1 from public.profiles p where p.id=(select auth.uid())));
create policy "approved profiles only demands" on public.demands as restrictive for all to authenticated using (exists(select 1 from public.profiles p where p.id=(select auth.uid()))) with check (exists(select 1 from public.profiles p where p.id=(select auth.uid())));
grant select on public.profiles,public.demand_events to authenticated;
grant select,insert on public.clients,public.demands to authenticated;
revoke insert,update,delete on public.profiles,public.demand_events from authenticated;
