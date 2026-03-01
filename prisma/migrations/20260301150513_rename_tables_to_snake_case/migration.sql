/*
  Warnings:

  - You are about to drop the `ProviderInstallation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Repository` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProviderInstallation" DROP CONSTRAINT "ProviderInstallation_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Repository" DROP CONSTRAINT "Repository_installationId_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "pull_requests" DROP CONSTRAINT "pull_requests_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "repository_members" DROP CONSTRAINT "repository_members_repositoryId_fkey";

-- DropTable
DROP TABLE "ProviderInstallation";

-- DropTable
DROP TABLE "Repository";

-- CreateTable
CREATE TABLE "provider_installations" (
    "id" UUID NOT NULL,
    "provider" "Provider" NOT NULL,
    "installationId" TEXT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID NOT NULL,

    CONSTRAINT "provider_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repositories" (
    "id" UUID NOT NULL,
    "provider" "Provider" NOT NULL,
    "providerRepoId" TEXT NOT NULL,
    "status" "RepositoryStatus" NOT NULL DEFAULT 'active',
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "installationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_installations_createdById_idx" ON "provider_installations"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "provider_installations_provider_installationId_key" ON "provider_installations"("provider", "installationId");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_provider_providerRepoId_key" ON "repositories"("provider", "providerRepoId");

-- AddForeignKey
ALTER TABLE "provider_installations" ADD CONSTRAINT "provider_installations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "provider_installations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_members" ADD CONSTRAINT "repository_members_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
