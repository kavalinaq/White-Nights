-- Index for case-insensitive prefix search on tag names
CREATE INDEX ON tags (LOWER(name));

-- Column for moderation: hide post from feeds without hard-deleting
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
