-- Text layers table storing editable OCR regions
CREATE TABLE IF NOT EXISTS text_layers (
    id TEXT PRIMARY KEY,
    translation_id TEXT NOT NULL REFERENCES translations(id) ON DELETE CASCADE,
    bbox TEXT NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    style TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_text_layers_translation ON text_layers(translation_id);
