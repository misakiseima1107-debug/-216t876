-- Instagram競合分析AI: Supabase (Postgres) スキーマ
-- Phase 3で実行予定。実データ検証前のためカラムはPhase 4以降で微調整の可能性あり。

create extension if not exists "pgcrypto";

-- 競合アカウントマスタ
create table if not exists competitors (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  profile_url text,
  display_name text,
  category text,
  is_active boolean not null default true,
  followers_count integer,
  following_count integer,
  posts_count integer,
  bio text,
  registered_at timestamptz not null default now(),
  last_fetched_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 自社アカウント情報（1レコードのみ想定）
create table if not exists own_account_profile (
  id uuid primary key default gen_random_uuid(),
  theme text,
  target_audience text,
  purpose text,
  product_service text,
  strengths text,
  cast_info text,
  shooting_environment text,
  postable_frequency text,
  brand_tone text,
  ng_themes text,
  updated_at timestamptz not null default now()
);

-- 投稿 / Reels
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references competitors(id) on delete cascade,
  platform_post_id text unique not null,
  post_url text,
  post_type text, -- 'reel' | 'photo' | 'carousel'
  posted_at timestamptz,
  caption text,
  hashtags text[],
  video_duration_seconds numeric,
  thumbnail_url text,
  video_url text,
  audio_name text,
  audio_url text,
  source text not null default 'apify',
  first_seen_at timestamptz not null default now(),
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_posts_competitor on posts(competitor_id);
create index if not exists idx_posts_posted_at on posts(posted_at);

-- 数値の時系列スナップショット（初回/24h/72h/7d/以降）
create table if not exists performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  checkpoint_label text not null, -- 'first_seen' | '24h' | '72h' | '7d' | 'later'
  captured_at timestamptz not null default now(),
  hours_since_post numeric,
  views_count bigint,
  likes_count bigint,
  comments_count bigint,
  shares_count bigint, -- 取得不可の場合はNULL
  source text not null default 'apify',
  created_at timestamptz not null default now()
);
create index if not exists idx_perf_post on performance_snapshots(post_id);

-- コメント
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_username text,
  comment_text text,
  like_count integer,
  commented_at timestamptz,
  fetched_at timestamptz not null default now()
);
create index if not exists idx_comments_post on post_comments(post_id);

-- バズスコア（計算式は docs/SCORING.md 参照）
create table if not exists buzz_scores (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  snapshot_id uuid references performance_snapshots(id),
  size_bucket text not null,
  views_per_follower numeric,
  engagement_rate numeric,
  engagement_score numeric,
  velocity_score numeric,
  relative_performance_score numeric,
  virality_score numeric,
  final_score numeric,
  is_breakout_candidate boolean not null default false,
  notes text,
  calculated_at timestamptz not null default now()
);
create index if not exists idx_buzz_post on buzz_scores(post_id);
create index if not exists idx_buzz_final on buzz_scores(final_score desc);

-- Claude APIによる構造化分析結果（投稿単位・種類別）
create table if not exists post_ai_analysis (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  analysis_type text not null, -- 'basic' | 'hook' | 'structure' | 'caption' | 'comment_insight'
  model_used text,
  confidence_label text not null default 'ai_analysis', -- 'data' | 'ai_analysis' | 'hypothesis'
  result_json jsonb not null,
  analyzed_at timestamptz not null default now(),
  unique(post_id, analysis_type)
);

-- 横断分析: 勝ちパターン
create table if not exists winning_patterns (
  id uuid primary key default gen_random_uuid(),
  pattern_type text not null, -- 'hook_type' | 'theme' | 'duration' | 'post_time' | 'structure' | 'cta' | 'cast_style' | 'telop_style' | 'series'
  pattern_value text not null,
  sample_size integer not null,
  avg_buzz_score numeric,
  correlation_score numeric,
  period_start date,
  period_end date,
  calculated_at timestamptz not null default now()
);

-- トレンド検知
create table if not exists trends (
  id uuid primary key default gen_random_uuid(),
  trend_type text not null, -- 'theme' | 'hook' | 'keyword' | 'format' | 'audio'
  trend_value text not null,
  window_label text not null, -- '24h' | '3d' | '7d' | '30d'
  growth_rate numeric,
  is_emerging boolean not null default false,
  detected_at timestamptz not null default now()
);

-- Content Gap（市場の空白）
create table if not exists content_gaps (
  id uuid primary key default gen_random_uuid(),
  gap_type text not null,
  description text not null,
  evidence_json jsonb,
  confidence_label text not null default 'hypothesis',
  identified_at timestamptz not null default now()
);

-- 生成された投稿企画
create table if not exists content_ideas (
  id uuid primary key default gen_random_uuid(),
  generated_date date not null default current_date,
  title text not null,
  target_audience text,
  reason text,
  reference_competitor_pattern text,
  hook_options text[],
  structure_plan text,
  shooting_method text,
  required_materials text,
  telop_plan text,
  cta text,
  caption_draft text,
  expected_kpi text,
  priority text, -- 'high' | 'mid' | 'low'
  differentiation_point text,
  is_todays_pick boolean not null default false,
  created_at timestamptz not null default now()
);

-- パイプライン実行ログ
create table if not exists pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null, -- 'daily' | 'weekly'
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text, -- 'success' | 'partial_failure' | 'failed'
  new_posts_count integer,
  errors_json jsonb,
  cost_estimate_usd numeric
);

-- エラーログ
create table if not exists error_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  stage text not null,
  competitor_id uuid references competitors(id),
  post_id uuid references posts(id),
  error_type text,
  error_message text,
  raw_context jsonb
);
