-- Move canvas persistence from UploadThing file refs to an inline JSON column.
ALTER TABLE "Project" DROP COLUMN "canvasFileKey",
DROP COLUMN "canvasFileUrl",
ADD COLUMN     "canvasJson" JSONB;
