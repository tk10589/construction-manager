import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

import { Project } from "@/types/project";

import { PdfColumns } from "./types";
import { arrayBufferToBase64 } from "./utils";
import { pdfColumnDefinitions } from "./pdfColumnDefinitions";

import type {
  TDocumentDefinitions,
} from "pdfmake/interfaces";

type ExportProjectsPdfParams = {
  projects: Project[];

  pdfColumns: PdfColumns;

  pdfPageSize: "A4" | "A3";

  mode: "preview" | "download";
};

export const exportProjectsPdf = async ({
  projects,
  pdfColumns,
  pdfPageSize,
  mode,
}: ExportProjectsPdfParams) => {
  const res = await fetch(
    "/fonts/NotoSansJP-Regular.ttf"
  );

  const fontBuffer =
    await res.arrayBuffer();

  const notoSansJpBase64 =
    arrayBufferToBase64(fontBuffer);

  const totalAmount = projects.reduce(
    (sum, project) =>
      sum + project.amount,
    0
  );

  const totalCount = projects.length;
  
  // 選択された列だけ抽出
  const selectedPdfColumns =
    pdfColumnDefinitions.filter(
      (column) => pdfColumns[column.key]
    );

  // 未選択チェック  
  if (selectedPdfColumns.length === 0) {
    alert("出力項目を1つ以上選択してください");
    return;
  }

  // ヘッダー行を動的生成
  const pdfHeaderRow =
    selectedPdfColumns.map((column) => ({
      text: column.label,
      bold: true,
      fillColor: "#e5e7eb",
      alignment: "center",
    }));

  // データ行を動的生成
  const pdfRows = projects.map(
    (project) =>
      selectedPdfColumns.map((column) =>
        column.getValue(project)
      )
  );

  const tableWidths =
    selectedPdfColumns.map((column) =>
      pdfPageSize === "A3"
        ? column.widthA3
        : column.widthA4
    );

    console.log(
      "PDFテーブル生成確認",
      selectedPdfColumns.length,
      pdfHeaderRow.length,
      pdfRows.length,
      tableWidths.length
    );

  // 選択項目数が多い場合のフォント調整 
  const selectedColumnCount = selectedPdfColumns.length;

  const tableFontSize =
    pdfPageSize === "A4" &&
    selectedColumnCount >= 10
      ? 6
      : pdfPageSize === "A4"
        ? 7
        : selectedColumnCount >= 10
          ? 7
          : 8;

  const docDefinition: TDocumentDefinitions = {
    pageSize: pdfPageSize,
    pageOrientation: "landscape",

    defaultStyle: {
      font: "NotoSansJP",
      fontSize: tableFontSize,
    },
    

    footer: (
      currentPage: number,
      pageCount: number
    ) => {
      return {
        text: `${currentPage} / ${pageCount}`,
        alignment: "center",
        fontSize: 8,
        margin: [0, 0, 0, 10],
      };
    },

    content: [
      {
        text: "案件一覧表",
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 8],
      },
      {
        text: `出力日: ${new Date().toLocaleDateString("ja-JP")}`,
        fontSize: 10,
        margin: [0, 0, 0, 10],
      },
      {
        text: `案件件数：${totalCount}件`,
        fontSize: 9,
        margin: [0, 0, 0, 2],
      },

      {
        text: `受注金額合計：¥${totalAmount.toLocaleString("ja-JP")}`,
        fontSize: 9,
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: tableWidths,
          body: [
            pdfHeaderRow,
            ...pdfRows,
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,

          hLineColor: () => "#666666",
          vLineColor: () => "#666666",

          paddingLeft: () =>
            selectedColumnCount >= 10 ? 2 : 4,
          paddingRight: () =>
            selectedColumnCount >= 10 ? 2 : 4,
          paddingTop: () =>
            selectedColumnCount >= 10 ? 2 : 3,
          paddingBottom: () =>
            selectedColumnCount >= 10 ? 2 : 3,
        },
      },
    ],
  };

  const fonts = {
    NotoSansJP: {
      normal: "NotoSansJP-Regular.ttf",
      bold: "NotoSansJP-Regular.ttf",
      italics: "NotoSansJP-Regular.ttf",
      bolditalics: "NotoSansJP-Regular.ttf",
    },
  };

  const vfs = {
    ...(pdfFonts as any),
    "NotoSansJP-Regular.ttf":
      notoSansJpBase64,
  };

  const pdf = pdfMake.createPdf(
    docDefinition,
    undefined,
    fonts,
    vfs
  );

  if (mode === "preview") {
    pdf.open();
  } else {
    pdf.download("projects.pdf");
  }

};