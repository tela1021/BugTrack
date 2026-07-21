-- Persist a SHA-256 checksum for each newly stored private attachment.
-- Existing local test files are intentionally not backfilled; their checksum is
-- empty until the file is re-uploaded.
ALTER TABLE "attachments" ADD COLUMN "checksum" TEXT NOT NULL DEFAULT '';
