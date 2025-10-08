-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "profilePic" TEXT NOT NULL DEFAULT 'https://cdn-icons-png.flaticon.com/512/3607/3607444.png';
