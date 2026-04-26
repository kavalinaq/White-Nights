ALTER TABLE shelves ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0;
ALTER TABLE shelves ADD CONSTRAINT uq_shelves_user_name UNIQUE (user_id, name);
CREATE INDEX IF NOT EXISTS idx_shelves_user ON shelves (user_id);
CREATE INDEX IF NOT EXISTS idx_books_on_shelves_shelf_pos ON books_on_shelves (shelf_id, position);
