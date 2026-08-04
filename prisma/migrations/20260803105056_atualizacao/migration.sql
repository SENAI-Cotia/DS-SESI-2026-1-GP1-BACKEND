/*
  Warnings:

  - Added the required column `role` to the `gerentes` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_gerentes" (
    "id_usuario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_filial" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "imagem" TEXT NOT NULL,
    "role" TEXT NOT NULL
);
INSERT INTO "new_gerentes" ("email", "id_filial", "id_usuario", "imagem", "nome", "senha") SELECT "email", "id_filial", "id_usuario", "imagem", "nome", "senha" FROM "gerentes";
DROP TABLE "gerentes";
ALTER TABLE "new_gerentes" RENAME TO "gerentes";
CREATE UNIQUE INDEX "gerentes_email_key" ON "gerentes"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
