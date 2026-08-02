-- ─────────────────────────────────────────────────────────────────────────────
-- Chat — conversations & messages for RAG health advocate
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.message_role_enum AS ENUM ('user', 'assistant');

CREATE TABLE public.conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title      TEXT,
  summary    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.conversations IS 'AI health advocate chat sessions';
COMMENT ON COLUMN public.conversations.summary IS 'Reserved for future rolling conversation summary';

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role            public.message_role_enum NOT NULL,
  content         TEXT NOT NULL,
  sources         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT messages_content_not_empty CHECK (length(trim(content)) > 0)
);

COMMENT ON TABLE public.messages IS 'User and assistant messages within a conversation';
COMMENT ON COLUMN public.messages.sources IS 'Citation metadata for assistant replies';

CREATE INDEX conversations_user_id_updated_at_idx
  ON public.conversations (user_id, updated_at DESC);

CREATE INDEX messages_conversation_id_created_at_idx
  ON public.messages (conversation_id, created_at ASC);

CREATE INDEX messages_user_id_idx
  ON public.messages (user_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_own"
  ON public.conversations
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "messages_own"
  ON public.messages
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- GRANTS (required for Supabase API roles to access tables through RLS)

GRANT ALL ON TABLE public.conversations TO authenticated;
GRANT ALL ON TABLE public.conversations TO service_role;

GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;
