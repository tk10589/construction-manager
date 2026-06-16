import { Project } from "@/types/project";

export type PdfColumns = {
  code: boolean;
  type: boolean;
  name: boolean;

  client: boolean;
  manager: boolean;
  clientStaff: boolean;

  amount: boolean;
  budget: boolean;

  salesStaff: boolean;

  status: boolean;

  orderDate: boolean;
  startDate: boolean;
  endDate: boolean;
};

export type PdfExportParams = {
  projects: Project[];

  pdfColumns: PdfColumns;

  pdfPageSize: "A4" | "A3";

  mode: "preview" | "download";
};