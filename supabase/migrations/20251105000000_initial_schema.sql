-- Migration: Initial schema for 10xCards
-- Description: Creates the initial database schema for the 10xCards application
-- Tables: users (managed by Supabase Auth), flashcards, generations, generation_error_logs
-- Author: AI Assistant
-- Date: 2025-11-05

-- Note: The users table is managed by Supabase Auth and doesn't need to be created manually

-- Create flashcards table
create table if not exists public.flashcards (
    id bigserial primary key,
    front varchar(200) not null,
    back varchar(500) not null,
    source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    generation_id bigint,
    user_id uuid not null
);

comment on table public.flashcards is 'Stores flashcards created by users';
comment on column public.flashcards.front is 'Front side of the flashcard (question/prompt)';
comment on column public.flashcards.back is 'Back side of the flashcard (answer/explanation)';
comment on column public.flashcards.source is 'Source of the flashcard: ai-full (unedited AI generation), ai-edited (AI generation edited by user), or manual (created by user)';
comment on column public.flashcards.generation_id is 'Reference to the generation that created this flashcard (if applicable)';
comment on column public.flashcards.user_id is 'Reference to the user who owns this flashcard';

-- Create generations table
create table if not exists public.generations (
    id bigserial primary key,
    user_id uuid not null,
    model varchar not null,
    generated_count integer not null,
    accepted_unedited_count integer,
    accepted_edited_count integer,
    source_text_hash varchar not null,
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    generation_duration integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.generations is 'Stores information about AI flashcard generation sessions';
comment on column public.generations.user_id is 'Reference to the user who initiated the generation';
comment on column public.generations.model is 'The AI model used for generation';
comment on column public.generations.generated_count is 'Number of flashcards generated in this session';
comment on column public.generations.accepted_unedited_count is 'Number of flashcards accepted without edits';
comment on column public.generations.accepted_edited_count is 'Number of flashcards accepted with edits';
comment on column public.generations.source_text_hash is 'Hash of the source text used for generation';
comment on column public.generations.source_text_length is 'Length of the source text in characters';
comment on column public.generations.generation_duration is 'Duration of the generation process in milliseconds';

-- Create generation_error_logs table
create table if not exists public.generation_error_logs (
    id bigserial primary key,
    user_id uuid not null,
    model varchar not null,
    source_text_hash varchar not null,
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    error_code varchar(100) not null,
    error_message text not null,
    created_at timestamptz not null default now()
);

comment on table public.generation_error_logs is 'Logs errors that occur during flashcard generation';
comment on column public.generation_error_logs.user_id is 'Reference to the user who experienced the error';
comment on column public.generation_error_logs.model is 'The AI model that was being used';
comment on column public.generation_error_logs.source_text_hash is 'Hash of the source text that caused the error';
comment on column public.generation_error_logs.source_text_length is 'Length of the source text in characters';
comment on column public.generation_error_logs.error_code is 'Error code or type';
comment on column public.generation_error_logs.error_message is 'Detailed error message';

-- Add foreign key constraints
alter table public.flashcards 
    add constraint flashcards_user_id_fkey
    foreign key (user_id) 
    references auth.users(id) 
    on delete cascade;

alter table public.flashcards 
    add constraint flashcards_generation_id_fkey
    foreign key (generation_id) 
    references public.generations(id) 
    on delete set null;

alter table public.generations 
    add constraint generations_user_id_fkey
    foreign key (user_id) 
    references auth.users(id) 
    on delete cascade;

alter table public.generation_error_logs 
    add constraint generation_error_logs_user_id_fkey
    foreign key (user_id) 
    references auth.users(id) 
    on delete cascade;

-- Create indexes for better performance
create index if not exists flashcards_user_id_idx on public.flashcards(user_id);
create index if not exists flashcards_generation_id_idx on public.flashcards(generation_id);
create index if not exists generations_user_id_idx on public.generations(user_id);
create index if not exists generation_error_logs_user_id_idx on public.generation_error_logs(user_id);

-- Create trigger for updating the updated_at column in flashcards table
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_flashcards_updated_at
before update on public.flashcards
for each row
execute function public.update_updated_at_column();

create trigger update_generations_updated_at
before update on public.generations
for each row
execute function public.update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
alter table public.flashcards enable row level security;
alter table public.generations enable row level security;
alter table public.generation_error_logs enable row level security;

-- Create RLS policies for flashcards table
create policy "Users can view their own flashcards"
on public.flashcards for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own flashcards"
on public.flashcards for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own flashcards"
on public.flashcards for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own flashcards"
on public.flashcards for delete
to authenticated
using (auth.uid() = user_id);

-- Create RLS policies for generations table
create policy "Users can view their own generations"
on public.generations for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own generations"
on public.generations for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own generations"
on public.generations for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own generations"
on public.generations for delete
to authenticated
using (auth.uid() = user_id);

-- Create RLS policies for generation_error_logs table
create policy "Users can view their own error logs"
on public.generation_error_logs for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own error logs"
on public.generation_error_logs for insert
to authenticated
with check (auth.uid() = user_id);

-- No update/delete policies for error_logs as they should be immutable
