/*
  Warnings:

  - A unique constraint covering the columns `[companyId,year]` on the table `FiscalYear` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "FiscalYear_year_key";

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_companyId_year_key" ON "FiscalYear"("companyId", "year");
