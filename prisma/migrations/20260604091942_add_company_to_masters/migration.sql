-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "companyId" INTEGER;

-- AlterTable
ALTER TABLE "FiscalYear" ADD COLUMN     "companyId" INTEGER;

-- AlterTable
ALTER TABLE "ProjectType" ADD COLUMN     "companyId" INTEGER;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "companyId" INTEGER;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectType" ADD CONSTRAINT "ProjectType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
