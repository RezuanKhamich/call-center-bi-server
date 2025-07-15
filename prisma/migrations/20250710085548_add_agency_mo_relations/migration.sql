-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "agency_type" TEXT,
ADD COLUMN     "mo_id" INTEGER;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_mo_id_fkey" FOREIGN KEY ("mo_id") REFERENCES "med_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
