/*
  Warnings:

  - You are about to drop the column `videoUrl` on the `movies` table. All the data in the column will be lost.
  - Added the required column `video` to the `movies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "movies" RENAME COLUMN "videoUrl" TO "video";
