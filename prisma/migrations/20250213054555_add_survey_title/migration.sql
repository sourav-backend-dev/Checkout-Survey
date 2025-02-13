/*
  Warnings:

  - You are about to drop the `UserAnswer` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "ApiProxyData" ADD COLUMN "surveyTitle" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserAnswer";
PRAGMA foreign_keys=on;
