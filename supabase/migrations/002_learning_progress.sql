-- Accounts, roadmap progress, activity logs, usage events, and admin analytics.
-- Every student (including guests from anonymous sign-in) is an auth user, so RLS can key on auth.uid().

CREATE SCHEMA IF NOT EXISTS private;

-- ── Profiles ────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text CHECK (char_length(display_name) <= 40),
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Students may only change their display name, never is_admin.
REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

CREATE FUNCTION private.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id);
  RETURN new;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

CREATE FUNCTION private.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce((SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())), false)
$$;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

CREATE POLICY "Read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()) OR private.is_admin());
CREATE POLICY "Update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

-- ── Roadmap step progress ───────────────────────────────────
CREATE TABLE public.step_progress (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  step_id text NOT NULL CHECK (char_length(step_id) <= 64),
  status text NOT NULL CHECK (status IN ('in_progress', 'done', 'skipped')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, step_id)
);
ALTER TABLE public.step_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own progress" ON public.step_progress
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- ── Activity logs (the "try first" evidence) ────────────────
CREATE TABLE public.activity_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  step_id text NOT NULL CHECK (char_length(step_id) <= 64),
  attempt text NOT NULL CHECK (char_length(attempt) BETWEEN 1 AND 5000),
  minutes integer CHECK (minutes BETWEEN 0 AND 600),
  ai_usage text NOT NULL CHECK (ai_usage IN ('none', 'after_attempt', 'before_attempt')),
  prompt_ids integer[] NOT NULL DEFAULT '{}',
  reflection text CHECK (char_length(reflection) <= 5000),
  confidence smallint CHECK (confidence BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_user ON public.activity_logs (user_id, created_at DESC);
CREATE INDEX idx_activity_step ON public.activity_logs (step_id);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insert own activity" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Read own activity" ON public.activity_logs
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Delete own activity" ON public.activity_logs
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ── Usage events (write-only for students) ──────────────────
CREATE TABLE public.events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'page_view', 'prompt_open', 'prompt_copy', 'example_copy',
    'step_open', 'step_status', 'activity_submit', 'guest_start', 'account_saved')),
  step_id text CHECK (char_length(step_id) <= 64),
  prompt_id integer,
  path text CHECK (char_length(path) <= 200),
  props jsonb NOT NULL DEFAULT '{}' CHECK (pg_column_size(props) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_created ON public.events (created_at DESC);
CREATE INDEX idx_events_type ON public.events (type, prompt_id);
CREATE INDEX idx_events_user ON public.events (user_id);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insert own events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

-- ── Admin analytics (aggregates only, admin-gated) ──────────
CREATE FUNCTION public.admin_overview() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE result jsonb;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'users', (SELECT jsonb_build_object(
        'total', count(*),
        'guests', count(*) FILTER (WHERE u.is_anonymous),
        'saved', count(*) FILTER (WHERE NOT u.is_anonymous),
        'new_7d', count(*) FILTER (WHERE u.created_at > now() - interval '7 days'))
      FROM auth.users u),
    'active_7d', (SELECT count(DISTINCT e.user_id) FROM public.events e WHERE e.created_at > now() - interval '7 days'),
    'steps', (SELECT coalesce(jsonb_agg(s ORDER BY s.step_id), '[]') FROM (
        SELECT p.step_id,
               count(*) AS started,
               count(*) FILTER (WHERE p.status = 'done') AS done,
               count(*) FILTER (WHERE p.status = 'skipped') AS skipped,
               (SELECT round(avg(a.minutes), 1) FROM public.activity_logs a WHERE a.step_id = p.step_id) AS avg_minutes,
               (SELECT count(*) FROM public.activity_logs a WHERE a.step_id = p.step_id) AS activities
        FROM public.step_progress p GROUP BY p.step_id) s),
    'ai_usage', (SELECT coalesce(jsonb_object_agg(a.ai_usage, a.n), '{}') FROM (
        SELECT ai_usage, count(*) AS n FROM public.activity_logs GROUP BY ai_usage) a),
    'avg_confidence', (SELECT round(avg(confidence), 2) FROM public.activity_logs),
    'top_prompts', (SELECT coalesce(jsonb_agg(t), '[]') FROM (
        SELECT e.prompt_id, pr.title, count(*) AS copies
        FROM public.events e JOIN public.prompts pr ON pr.id = e.prompt_id
        WHERE e.type IN ('prompt_copy', 'example_copy')
        GROUP BY e.prompt_id, pr.title ORDER BY copies DESC LIMIT 10) t),
    'events_daily', (SELECT coalesce(jsonb_agg(d ORDER BY d.day), '[]') FROM (
        SELECT date_trunc('day', created_at)::date AS day, count(*) AS events, count(DISTINCT user_id) AS users
        FROM public.events WHERE created_at > now() - interval '14 days' GROUP BY 1) d),
    'recent_reflections', (SELECT coalesce(jsonb_agg(r), '[]') FROM (
        SELECT step_id, ai_usage, minutes, confidence, reflection, created_at
        FROM public.activity_logs WHERE reflection IS NOT NULL AND reflection <> ''
        ORDER BY created_at DESC LIMIT 20) r)
  ) INTO result;
  RETURN result;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_overview() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_overview() TO authenticated;
