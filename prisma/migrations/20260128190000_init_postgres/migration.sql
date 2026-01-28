-- CreateTable
CREATE TABLE "CartShare" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "basketName" TEXT,
    "products" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "CartShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NpsVote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "transactionId" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "NpsVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddToCartLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" TEXT,
    "product" TEXT,
    "action" TEXT NOT NULL DEFAULT 'add-to-basket',

    CONSTRAINT "AddToCartLog_pkey" PRIMARY KEY ("id")
);

