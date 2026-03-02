-- Supabase Initial Schema for EchoBook
-- NOTE: If using NextAuth (Credentials) without Supabase Auth, 
-- auth.uid() will be null. You may need to disable RLS for testing 
-- or use a custom session mapping.

-- 1. Profiles Table (Linked to users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- Removed hard reference for compatibility with external Auth (NextAuth)
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE projects (
    id TEXT PRIMARY KEY, -- Using the random string from store.ts for compatibility
    user_id UUID NOT NULL, -- Removed hard reference for compatibility with external Auth
    title TEXT NOT NULL,
    author TEXT DEFAULT '작가님',
    topic TEXT,
    interview_data JSONB DEFAULT '[]'::jsonb,
    full_draft TEXT DEFAULT '',
    cover_image_url TEXT,
    cover_design JSONB DEFAULT '{"layout": "classic", "theme": "amber"}'::jsonb,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security)

-- Profiles: Users can read and update their own profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Projects: Users can CRUD their own projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
