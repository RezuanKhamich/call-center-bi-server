/*
  Warnings:

  - You are about to drop the column `abbr` on the `med_organizations` table. All the data in the column will be lost.
  - You are about to drop the column `mo_code` on the `med_organizations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "med_organizations_abbr_key";

-- DropIndex
DROP INDEX "med_organizations_mo_code_key";

-- AlterTable
ALTER TABLE "med_organizations" DROP COLUMN "abbr",
DROP COLUMN "mo_code";
