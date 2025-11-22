-- Migration: Remove foreign key constraints for development
-- Description: Temporarily removes FK constraints to allow testing with DEFAULT_USER_ID
-- Author: AI Assistant  
-- Date: 2025-11-20

-- WARNING: This is for development only - should be reverted in production

-- Drop foreign key constraints
ALTER TABLE public.generations DROP CONSTRAINT IF EXISTS generations_user_id_fkey;
ALTER TABLE public.generation_error_logs DROP CONSTRAINT IF EXISTS generation_error_logs_user_id_fkey;
ALTER TABLE public.flashcards DROP CONSTRAINT IF EXISTS flashcards_user_id_fkey;
