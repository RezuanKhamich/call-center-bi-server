/*
  Warnings:

  - A unique constraint covering the columns `[mo_code]` on the table `med_organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "med_organizations" ADD COLUMN     "mo_code" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "med_organizations_mo_code_key" ON "med_organizations"("mo_code");
