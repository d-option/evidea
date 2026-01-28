-- CreateTable
CREATE TABLE "CartShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "basketName" TEXT,
    "products" TEXT NOT NULL,
    "userId" TEXT
);

-- CreateTable
CREATE TABLE "NpsVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "transactionId" TEXT NOT NULL,
    "note" TEXT
);

-- CreateTable
CREATE TABLE "AddToCartLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" TEXT,
    "product" TEXT,
    "action" TEXT NOT NULL DEFAULT 'add-to-basket'
);
