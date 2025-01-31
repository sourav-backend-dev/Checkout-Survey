-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "isMultiChoice" BOOLEAN NOT NULL DEFAULT false,
    "isConditional" BOOLEAN NOT NULL DEFAULT false,
    "isTextBox" BOOLEAN NOT NULL DEFAULT false,
    "conditionAnswer" TEXT,
    CONSTRAINT "Question_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("conditionAnswer", "id", "isConditional", "isMultiChoice", "surveyId", "text") SELECT "conditionAnswer", "id", "isConditional", "isMultiChoice", "surveyId", "text" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
