-- CreateTable
CREATE TABLE "produtos" (
    "id_produto" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "preco" REAL NOT NULL,
    "nome" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "descricao" TEXT,
    "codigo_barras" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "estoque" (
    "id_estoque" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_produto" INTEGER NOT NULL,
    "id_filial" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "estoque_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos" ("id_produto") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movimentacoes" (
    "id_movimentacao" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_filial" INTEGER NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "id_administrador" INTEGER,
    "id_gerente" INTEGER,
    CONSTRAINT "movimentacoes_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos" ("id_produto") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimentacoes_id_administrador_fkey" FOREIGN KEY ("id_administrador") REFERENCES "administradores" ("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimentacoes_id_gerente_fkey" FOREIGN KEY ("id_gerente") REFERENCES "gerentes" ("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "administradores" (
    "id_usuario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_filial" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "gerentes" (
    "id_usuario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_filial" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_barras_key" ON "produtos"("codigo_barras");

-- CreateIndex
CREATE UNIQUE INDEX "administradores_email_key" ON "administradores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gerentes_email_key" ON "gerentes"("email");
