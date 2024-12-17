/*
  Warnings:

  - Added the required column `duration` to the `movies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `videoUrl` to the `movies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `showtimes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "resolution" TEXT[],
ADD COLUMN     "videoUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "showtimes" ADD COLUMN     "location" TEXT NOT NULL;
