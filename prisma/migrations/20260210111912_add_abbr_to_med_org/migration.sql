/*
  Warnings:

  - A unique constraint covering the columns `[abbr]` on the table `med_organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "med_organizations" ADD COLUMN     "abbr" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "med_organizations_abbr_key" ON "med_organizations"("abbr");
