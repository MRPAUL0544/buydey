-- Content moderation and category administration.
create policy "categories_admin_read_all" on public.categories for select to authenticated
using(public.current_user_is_admin());

alter table public.moderation_actions drop constraint if exists moderation_actions_target_type_check;
alter table public.moderation_actions add constraint moderation_actions_target_type_check
check(target_type in ('user','listing','report','verification','review','question','category','support'));
