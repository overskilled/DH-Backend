/*
  Warnings:

  - You are about to drop the column `caseId` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the `Case` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Dossier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dossierId` to the `Milestone` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED');

-- DropForeignKey
ALTER TABLE "public"."Case" DROP CONSTRAINT "Case_dossierId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Case" DROP CONSTRAINT "Case_responsibleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Milestone" DROP CONSTRAINT "Milestone_caseId_fkey";

-- AlterTable
ALTER TABLE "Dossier" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Milestone" DROP COLUMN "caseId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dossierId" TEXT NOT NULL,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "status" "MilestoneStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dueDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Case";

-- DropEnum
DROP TYPE "public"."CaseStatus";

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
