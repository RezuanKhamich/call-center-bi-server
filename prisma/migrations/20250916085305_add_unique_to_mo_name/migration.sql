/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `med_organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "med_organizations_name_key" ON "med_organizations"("name");
