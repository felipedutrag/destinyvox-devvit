-- ==============================================================================
-- DESTINYVOX: Script SQL para criacao da tabela de Usuarios VIP / Pagantes
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/zesbznfykirwzoubatio/sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.vip_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reddit_username TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'canceled'
    plan TEXT NOT NULL DEFAULT 'vip',       -- 'vip', 'premium', 'lifetime'
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vip_users_reddit_username_lower 
ON public.vip_users (LOWER(reddit_username));

ALTER TABLE public.vip_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY vip_users_anon_select 
ON public.vip_users 
FOR SELECT 
TO anon 
USING (status = 'active');

CREATE POLICY vip_users_service_all 
ON public.vip_users 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
