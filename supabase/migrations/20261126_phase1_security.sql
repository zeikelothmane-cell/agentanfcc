-- Apply after initial migration. Existing inconsistent rows must be repaired first.
begin;
alter table public.clients add constraint clients_id_owner_unique unique(id,owner_id);
alter table public.demands add constraint demands_client_owner_fk foreign key(client_id,owner_id) references public.clients(id,owner_id);
create unique index demands_active_unique on public.demands(owner_id,client_id,lower(trim(land_title))) where status not in ('completed','error');
alter table public.demands add constraint nonnegative_fees check(ancfcc_fee>=0 and service_fee>=0);
drop policy "operators manage own demands" on public.demands;
create policy "read own demands" on public.demands for select to authenticated using(auth.uid()=owner_id);
create policy "create own simulation demands" on public.demands for insert to authenticated with check(auth.uid()=owner_id and status='sms_required' and not payment_confirmed and certificate_url is null);
revoke update,delete on public.demands from anon,authenticated;
revoke all on public.clients,public.demands,public.profiles,public.demand_events from anon;
commit;
