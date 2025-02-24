-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Survey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "isFrenchVersion" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Survey" ("id", "title") SELECT "id", "title" FROM "Survey";
DROP TABLE "Survey";
ALTER TABLE "new_Survey" RENAME TO "Survey";
CREATE UNIQUE INDEX "Survey_title_key" ON "Survey"("title");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
