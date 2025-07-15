/*
  Warnings:

  - You are about to drop the column `appeal_end_date` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `appeal_start_date` on the `reports` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reports" DROP COLUMN "appeal_end_date",
DROP COLUMN "appeal_start_date",
ADD COLUMN     "reporting_period_end_date" DATE,
ADD COLUMN     "reporting_period_start_date" DATE;
