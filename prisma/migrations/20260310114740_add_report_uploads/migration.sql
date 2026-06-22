-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "upload_id" INTEGER;

-- CreateTable
CREATE TABLE "report_uploads" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,
    "reporting_period_start_date" DATE,
    "reporting_period_end_date" DATE,
    "agencies" TEXT[],

    CONSTRAINT "report_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_uploads_created_at_idx" ON "report_uploads"("created_at");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "report_uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_uploads" ADD CONSTRAINT "report_uploads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_mo_id_fkey" FOREIGN KEY ("mo_id") REFERENCES "med_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
