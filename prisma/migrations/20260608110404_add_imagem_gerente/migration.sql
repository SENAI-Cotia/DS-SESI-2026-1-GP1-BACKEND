/*
  Warnings:

  - You are about to drop the column `codigo_barras` on the `produtos` table. All the data in the column will be lost.
  - You are about to drop the column `marca` on the `produtos` table. All the data in the column will be lost.
  - Added the required column `imagem` to the `gerentes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoria` to the `produtos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigo_barra` to the `produtos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imagem` to the `produtos` table without a default value. This is not possible if the table is not empty.

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
    "imagem" TEXT NOT NULL
);
INSERT INTO "new_gerentes" ("email", "id_filial", "id_usuario", "nome", "senha") SELECT "email", "id_filial", "id_usuario", "nome", "senha" FROM "gerentes";
DROP TABLE "gerentes";
ALTER TABLE "new_gerentes" RENAME TO "gerentes";
CREATE UNIQUE INDEX "gerentes_email_key" ON "gerentes"("email");
CREATE TABLE "new_produtos" (
    "id_produto" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "preco" REAL NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT,
    "codigo_barra" TEXT NOT NULL,
    "imagem" TEXT NOT NULL
);
INSERT INTO "new_produtos" ("descricao", "id_produto", "nome", "preco") SELECT "descricao", "id_produto", "nome", "preco" FROM "produtos";
DROP TABLE "produtos";
ALTER TABLE "new_produtos" RENAME TO "produtos";
CREATE UNIQUE INDEX "produtos_codigo_barra_key" ON "produtos"("codigo_barra");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
