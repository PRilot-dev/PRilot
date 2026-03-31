-- CreateTable
CREATE TABLE "blocks" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "promptConcise" TEXT NOT NULL,
    "promptStandard" TEXT NOT NULL,
    "promptDetailed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_blocks" (
    "id" UUID NOT NULL,
    "repositoryId" UUID NOT NULL,
    "blockId" UUID NOT NULL,
    "branchType" TEXT NOT NULL DEFAULT 'default',
    "position" INTEGER NOT NULL,
    "detailLevel" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repository_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blocks_slug_key" ON "blocks"("slug");

-- CreateIndex
CREATE INDEX "repository_blocks_repositoryId_branchType_idx" ON "repository_blocks"("repositoryId", "branchType");

-- CreateIndex
CREATE UNIQUE INDEX "repository_blocks_repositoryId_blockId_branchType_key" ON "repository_blocks"("repositoryId", "blockId", "branchType");

-- AddForeignKey
ALTER TABLE "repository_blocks" ADD CONSTRAINT "repository_blocks_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_blocks" ADD CONSTRAINT "repository_blocks_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
