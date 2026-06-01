/*
  Warnings:

  - Added the required column `endMonth` to the `FiscalYear` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FiscalYear" ADD COLUMN     "endMonth" INTEGER NOT NULL;
