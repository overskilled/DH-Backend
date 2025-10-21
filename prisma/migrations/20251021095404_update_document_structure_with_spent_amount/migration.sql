-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "spent" DECIMAL(14,2),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
