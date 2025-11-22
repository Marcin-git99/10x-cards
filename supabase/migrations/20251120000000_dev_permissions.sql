-- Migration: Development permissions for testing
-- Description: Allows operations for DEFAULT_USER_ID during development
-- Author: AI Assistant  
-- Date: 2025-11-20

-- Create temporary RLS policies for DEFAULT_USER_ID during development
-- These should be removed in production

-- Create service policies for generations table that allow DEFAULT_USER_ID
create policy "Allow default user for dev - generations select"
on public.generations for select
to anon, authenticated
using (user_id = '00000000-0000-0000-0000-000000000000');

create policy "Allow default user for dev - generations insert"  
on public.generations for insert
to anon, authenticated
with check (user_id = '00000000-0000-0000-0000-000000000000');

-- Create service policies for generation_error_logs table that allow DEFAULT_USER_ID
create policy "Allow default user for dev - error_logs select"
on public.generation_error_logs for select
to anon, authenticated  
using (user_id = '00000000-0000-0000-0000-000000000000');

create policy "Allow default user for dev - error_logs insert"
on public.generation_error_logs for insert
to anon, authenticated
with check (user_id = '00000000-0000-0000-0000-000000000000');
