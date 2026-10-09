PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  hidden INTEGER NOT NULL DEFAULT 0,
  image_count INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL,
  migrated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_images (
  project_id TEXT NOT NULL,
  image_index INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  public_url TEXT,
  PRIMARY KEY (project_id, image_index),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_images_project_id
ON project_images (project_id);
