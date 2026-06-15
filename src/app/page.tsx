"use client";

import { useEffect, useRef, useState } from "react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

import type { TDocumentDefinitions } from "pdfmake/interfaces";

import { signOut } from "next-auth/react";
import ProjectsTable from "@/components/ProjectsTable";
import NewProjectForm from "@/components/NewProjectForm";
import EditModal from "@/components/EditModal";
import SettingsPage from "@/components/settings/SettingsPage";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import DeleteProjectModal from "@/components/DeleteProjectModal";
import FilterModal from "@/components/FilterModal";
import { useRouter } from "next/navigation";
import {
  fetchProjectsApi,
  fetchClientsApi,
  fetchStaffsApi,
  fetchProjectTypesApi,
  fetchFiscalYearsApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
} from "@/lib/api";

import {
  getTotalAmount,
  getExecutionBudget,
  getGrossProfit,
  getCostRate,
} from "@/lib/projectCalculations";

import {
  Project,
  FiscalYear,
  MasterItem,
  ProjectType,
} from "@/types/project";

type ProjectFilters = {
  types: string[];
  clients: string[];
  clientStaffs: string[];
  salesStaffs: string[];
  managers: string[];
  outsourceCompanies: string[];
};

type LoginUser = {
  id: string;
  loginId: string;
  name?: string | null;
  email?: string | null;
  companyId: number;
  companyName: string;
};

const menuItems = [
  { id: "projects", title: "案件管理", description: "案件一覧、進捗、受注金額を確認します。" },
  { id: "materials", title: "材料管理", description: "使用材料、発注状況、在庫状況を管理します。" },
  { id: "progress", title: "進捗管理", description: "未着手、施工中、完了などの状況を確認します。" },
  { id: "settings", title: "設定", description: "マスタ管理を行います" },
];

export default function Home() {
  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);
  const router = useRouter();

  const [selectedMenu, setSelectedMenu] = useState(menuItems[0]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);

  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortKey, setSortKey] = useState<"code" | "amount">("code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  
  const [toast, setToast] = useState<string | null>(null);
  
  const [clients, setClients] = useState<MasterItem[]>([]);
  const [staffs, setStaffs] = useState<MasterItem[]>([]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("all");

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [csvImportRows, setCsvImportRows] = useState<string[][]>([]);
  const [csvImportError, setCsvImportError] = useState("");
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCsvFileName, setSelectedCsvFileName] = useState("");
  const [csvHeaderValid, setCsvHeaderValid] = useState(false);
  const [csvValidationErrors, setCsvValidationErrors] = useState<string[]>([]);
  const [csvDuplicateErrors, setCsvDuplicateErrors] = useState<string[]>([]);

  const [csvImportMode, setCsvImportMode] = useState<"append" | "replace">("append");
  const [csvMasterErrors, setCsvMasterErrors] = useState<string[]>([]);
  const [isCsvConfirmMode, setIsCsvConfirmMode] = useState(false);
  const [isCsvImporting, setIsCsvImporting] = useState(false);
  const [isCsvResultMode, setIsCsvResultMode] = useState(false);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfPageSize, setPdfPageSize] = useState<"A4" | "A3">("A3");
  const [pdfColumns, setPdfColumns] = useState({
    code: true,
    type: true,
    name: true,
    client: true,
    amount: true,
    status: true,
  });

  const [filters, setFilters] = useState<ProjectFilters>({
    types: [],
    clients: [],
    clientStaffs: [],
    salesStaffs: [],
    managers: [],
    outsourceCompanies: [],
  });  

  // fetch関係
  const fetchProjects = async () => {
    try {
      const data = await fetchProjectsApi("");
      setProjects(data);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "案件一覧の取得に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMasters = async () => {
    try {
      const [clientData, staffData, typeData] = await Promise.all([
        fetchClientsApi(),
        fetchStaffsApi(),
        fetchProjectTypesApi(),
      ]);

      setClients(clientData);
      setStaffs(staffData);
      setProjectTypes(typeData);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "マスタ一覧の取得に失敗しました"
      );
    }
  };

  const fetchLoginUser = async (): Promise<LoginUser | null> => {
    const response = await fetch("/api/auth/me");

    if (!response.ok) {
      setLoginUser(null);
      return null;
    }

    const data = await response.json();
    setLoginUser(data);

    return data;
  };

   // 年度取得関数
  const fetchFiscalYears = async () => {
    try {
      const data = await fetchFiscalYearsApi();
      setFiscalYears(data);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "年度一覧の取得に失敗しました"
      );
    }
  };

  // 案件登録関係
  const addProject = async (
    newProject: Omit<Project, "id">
  ): Promise<boolean> => {
    try {
      await createProjectApi(newProject);

      await fetchProjects();
      setSelectedMenu(menuItems.find((item) => item.id === "projects")!);

      return true;
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "案件の登録に失敗しました。"
      );

      return false;
    }
  };

  // 案件削除関係
  const confirmDelete = async () => {
    if (!deletingProject) return;

    try {
      setIsDeleting(true);

      await deleteProjectApi(deletingProject.id);

      await fetchProjects();
      setDeletingProject(null);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "案件の削除に失敗しました"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // 案件編集・更新関係
  const editProject = (project: Project) => {
    setEditingProject(project);
  };

  const updateProject = async (project: Project) => {
    try {
      await updateProjectApi(project);

      await fetchProjects();
      setEditingProject(null);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "案件の更新に失敗しました。"
      );
    }
  };    

  // useEffect関係
    // 初期読み込み
  useEffect(() => {
    const initialize = async () => {
      const user = await fetchLoginUser();

      if (!user) {
        router.push("/login");
        return;
      }

      await fetchProjects();
      await fetchMasters();
      await fetchFiscalYears();
    };

    initialize();
  }, [router]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [toast]);

  // 補助関数
  const getUniqueValues = (
    projects: Project[],
    key: keyof Project
  ) => {
    return Array.from(
      new Set(
        projects
          .map((project) => project[key])
          .filter((value): value is string => {
            return typeof value === "string" && value.trim() !== "";
          })
      )
    ).sort((a, b) => a.localeCompare(b, "ja"));
  };

  const matchesFilter = (
    value: string | undefined,
    selectedValues: string[]
  ) => {
    if (selectedValues.length === 0) return true;
    if (!value) return false;

    return selectedValues.includes(value);
  };
    // フィルター対象項目  型設定
  const filterOptions = {
    types: getUniqueValues(projects, "type"),
    clients: getUniqueValues(projects, "client"),
    clientStaffs: getUniqueValues(projects, "clientStaff"),
    salesStaffs: getUniqueValues(projects, "salesStaff"),
    managers: getUniqueValues(projects, "manager"),
    outsourceCompanies: getUniqueValues(projects, "outsourceCompany"),
  };
  
  // フィルター処理
    // 年度フィルター処理（絞り込み）
  const selectedFiscalYear =
    selectedFiscalYearId === "all"
      ? null
      : fiscalYears.find(
          (year) => year.id === Number(selectedFiscalYearId)
        );

    // 年度末フィルター処理（絞り込み）
  const fiscalFilteredProjects = projects.filter((project) => {
    if (!selectedFiscalYear) return true;
    if (!project.endDate) return false;

    const projectEndDate = new Date(project.endDate);
    const startDate = new Date(selectedFiscalYear.startDate);
    const endDate = new Date(selectedFiscalYear.endDate);

    return projectEndDate >= startDate && projectEndDate <= endDate;
  });

    // 項目フィルターＡＮＤ処理（絞り込み）
  const filteredProjects = fiscalFilteredProjects.filter((project) => {
    return (
      matchesFilter(project.type, filters.types) &&
      matchesFilter(project.client, filters.clients) &&
      matchesFilter(project.clientStaff, filters.clientStaffs) &&
      matchesFilter(project.salesStaff, filters.salesStaffs) &&
      matchesFilter(project.manager, filters.managers) &&
      matchesFilter(project.outsourceCompany, filters.outsourceCompanies)
    );
  });

    // 選択中フィルター数（絞り込みカウント表示）
  const activeFilterCount =
    filters.types.length +
    filters.clients.length +
    filters.clientStaffs.length +
    filters.salesStaffs.length +
    filters.managers.length +
    filters.outsourceCompanies.length;

    // ソート処理（並び替え）
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortKey === "code") {
      return sortOrder === "asc"
        ? a.code.localeCompare(b.code)
        : b.code.localeCompare(a.code);
    }

    if (sortKey === "amount") {
      return sortOrder === "asc"
        ? a.amount - b.amount
        : b.amount - a.amount;
    }

    return 0;
  });

  // 集計値処理
  const summary = sortedProjects.reduce(
    (acc, project) => {
      const totalAmount = getTotalAmount(project);
      const executionBudget = getExecutionBudget(project);
      const grossProfit = getGrossProfit(project);

      acc.projectCount += 1;
      acc.totalAmount += totalAmount;
      acc.executionBudget += executionBudget;
      acc.grossProfit += grossProfit;

      return acc;
    },
    {
      projectCount: 0,
      totalAmount: 0,
      executionBudget: 0,
      grossProfit: 0,
    }
  );
    // 進捗集計
  const statusSummary = sortedProjects.reduce<Record<string, number>>(
    (acc, project) => {
      const status = project.status || "未設定";

      acc[status] = (acc[status] || 0) + 1;

      return acc;
    },
    {}
  );
    // 進捗表示順設定
  const statusOrder = [
    "未着手",
    "施工中",
    "完了",
    "保留",
    "中止",
    "未設定",
  ];

    // 表示用データ作成
  const otherStatuses = Object.keys(statusSummary).filter(
    (status) => !statusOrder.includes(status)
  );

  const statusSummaryItems = [
    ...statusOrder
      .filter((status) => statusSummary[status])
      .map((status) => ({
        status,
        count: statusSummary[status],
      })),
    ...otherStatuses.map((status) => ({
      status,
      count: statusSummary[status],
    })),
  ];

  // PDF出力関数  
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  };

  // チェック切替用関数（PDFモーダル用）
  const togglePdfColumn = (
    key: keyof typeof pdfColumns
  ) => {
    setPdfColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const exportProjectsPdf = async (
    mode: "preview" | "download"
  ) => {
    const res = await fetch("/fonts/NotoSansJP-Regular.ttf");
    const fontBuffer = await res.arrayBuffer();
    const notoSansJpBase64 = arrayBufferToBase64(fontBuffer);
    const totalAmount = sortedProjects.reduce(
      (sum, project) => sum + project.amount,
      0
    );

    const totalCount = sortedProjects.length;

    // PDF列定義
    const pdfColumnDefinitions = [
      {
        key: "code",
        label: "案件番号",
        widthA4: 55,
        widthA3: 70,
        getValue: (project: Project) => project.code,
      },
      {
        key: "type",
        label: "種別",
        widthA4: 25,
        widthA3: 30,
        getValue: (project: Project) => project.type || "",
      },
      {
        key: "name",
        label: "案件名",
        widthA4: "*",
        widthA3: "*",
        getValue: (project: Project) => project.name,
      },
      {
        key: "client",
        label: "発注者",
        widthA4: 90,
        widthA3: 130,
        getValue: (project: Project) => project.client,
      },
      {
        key: "amount",
        label: "受注金額",
        widthA4: 50,
        widthA3: 60,
        getValue: (project: Project) => ({
          text: `¥${project.amount.toLocaleString("ja-JP")}`,
          alignment: "right",
        }),
      },
      {
        key: "status",
        label: "進捗",
        widthA4: 35,
        widthA3: 40,
        getValue: (project: Project) => project.status || "",
      },
    ] as const;

    // 選択された列だけ抽出
    const selectedPdfColumns = pdfColumnDefinitions.filter(
      (column) => pdfColumns[column.key]
    );

    // 未選択チェック
    if (selectedPdfColumns.length === 0) {
      alert("出力項目を1つ以上選択してください");
      return;
    }

    // ヘッダー行を動的生成
    const pdfHeaderRow = selectedPdfColumns.map((column) => ({
      text: column.label,
      bold: true,
      fillColor: "#e5e7eb",
      alignment: "center",
    }));

    // データ行を動的生成
    const pdfRows = sortedProjects.map((project) =>
      selectedPdfColumns.map((column) =>
        column.getValue(project)
      )
    );

    const tableWidths = selectedPdfColumns.map((column) =>
      pdfPageSize === "A3"
        ? column.widthA3
        : column.widthA4
    );

    const docDefinition: TDocumentDefinitions = {
      pageSize: pdfPageSize,
      pageOrientation: "landscape",

      defaultStyle: {
        font: "NotoSansJP",
        fontSize: 8,
      },
      

      footer: (currentPage, pageCount) => {
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

            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 3,
            paddingBottom: () => 3,
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
      "NotoSansJP-Regular.ttf": notoSansJpBase64,
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

  // CSV取込ファイルリセットボタン（state初期化ｸﾘｱ）
  const clearCsvImport = () => {
    setCsvImportRows([]);
    setCsvImportError("");
    setSelectedCsvFileName("");
    setCsvValidationErrors([]);
    setCsvDuplicateErrors([]);
    setCsvMasterErrors([]);
    setIsCsvConfirmMode(false);
    setIsCsvImporting(false);
    setCsvImportResult(null);
    setIsCsvResultMode(false);

    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = "";
    }
  };
  
  // ｃｓｖ出力処理（共通関数）
  const downloadCSV = (
    fileName: string,
    header: string[],
    rows: (string | number)[][]
  ) => {
    // CSV文字列作成（カンマ対策含）
    const csvContent = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            const escaped = value.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      )
      .join("\r\n");

    // BOM付き（Excel文字化け防止）
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // ダウンロード処理
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  };

  // CSV改行をスペースに変換する関数
  const normalizeCsvCell = (value?: string) => {
    return (value || "")
      .replace(/\r?\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // 重複チェック関数
  const validateDuplicateCodes = (
    rows: string[][],
    projects: Project[],
    mode: "append" | "replace"
  ) => {
    const errors: string[] = [];

    const header = rows[0];
    const codeIndex = header.indexOf("案件番号");

    const existingCodes = new Set(projects.map((p) => p.code));
    const csvCodes = new Set<string>();

    rows.slice(1).forEach((row, index) => {
      const lineNo = index + 2;
      const code = normalizeCsvCell(row[codeIndex]);

      if (!code) return;

      if (csvCodes.has(code)) {
        errors.push(
          `${lineNo}行目：案件番号 ${code} がCSV内で重複しています`
        );
      }

      csvCodes.add(code);
    });

    return errors;
  };

  // 発注者管理
  // 発注者CSVヘッダー作成
  const clientCsvHeader = [
    "発注者名",
  ];
  
  // 発注者CSV出力関数
  const exportClientsCsv = () => {
    const rows = clients.map((client) => [
      client.name,
    ]);

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    downloadCSV(
      `clients_${today}.csv`,
      clientCsvHeader,
      rows
    );
  };

  // CSVヘッダーを共通化
  const projectCsvHeader = [
    "案件番号",
    "種別",
    "案件名",
    "受注日",
    "発注者",
    "発注者担当者",
    "営業担当者",
    "担当者",
    "外注依頼先",
    "受注金額",
    "追加受注金額",
    "売上合計",
    "材料費",
    "労務費",
    "経費他",
    "外注費",
    "実行予算",
    "原価率",
    "粗利",
    "着工日",
    "完了日",
    "進捗",
    "備考",
  ];

  // CSV取込用テンプレートヘッダー
  const projectImportCsvHeader = [
    "案件番号",
    "種別",
    "案件名",
    "受注日",
    "発注者",
    "発注者担当者",
    "営業担当者",
    "担当者",
    "外注依頼先",
    "受注金額",
    "追加受注金額",
    "材料費",
    "労務費",
    "経費他",
    "外注費",
    "着工日",
    "完了日",
    "進捗",
    "備考",
  ];
  
  // CSV読み込み関数（引用符内の改行を行区切りにしない）
  const parseCSV = (text: string) => {
    const rows: string[][] = [];
    let row: string[] = [];
    let current = "";
    let inQuotes = false;

    const normalizedText = text.replace(/^\uFEFF/, "");

    for (let i = 0; i < normalizedText.length; i++) {
      const char = normalizedText[i];
      const nextChar = normalizedText[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        row.push(current);
        current = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }

        row.push(current);

        const hasValue = row.some((cell) => cell.trim() !== "");

        if (hasValue) {
          rows.push(row);
        }

        row = [];
        current = "";
        continue;
      }

      current += char;
    }

    row.push(current);

    const hasValue = row.some((cell) => cell.trim() !== "");

    if (hasValue) {
      rows.push(row);
    }

    return rows;
  };

  const getCsvImportSummary = () => {
    if (csvImportRows.length <= 1) {
      return {
        totalCount: 0,
        importCount: 0,
        skipCount: 0,
      };
    }

    const header = csvImportRows[0];
    const codeIndex = header.indexOf("案件番号");

    const existingCodes = new Set(
      projects.map((project) => project.code)
    );

    const dataRows = csvImportRows.slice(1);

    const skipCount = dataRows.filter((row) => {
      const code = normalizeCsvCell(row[codeIndex]);
      return existingCodes.has(code);
    }).length;

    return {
      totalCount: dataRows.length,
      importCount: dataRows.length - skipCount,
      skipCount,
    };
  };

  const normalizeMasterValue = (value?: string) => {
    const normalized = normalizeCsvCell(value);
    return normalized || "未登録";
  };

  const normalizeForCompare = (value?: string) => {
    return normalizeMasterValue(value)
      .replace(/\s+/g, " ")
      .trim();
  };

  // 登録対象データ作成関数
  const getCsvImportProjects = () => {
    if (csvImportRows.length <= 1) return [];

    const header = csvImportRows[0];

    const indexOf = (name: string) => header.indexOf(name);

    const codeIndex = indexOf("案件番号");
    const typeIndex = indexOf("種別");
    const nameIndex = indexOf("案件名");
    const orderDateIndex = indexOf("受注日");
    const clientIndex = indexOf("発注者");
    const clientStaffIndex = indexOf("発注者担当者");
    const salesStaffIndex = indexOf("営業担当者");
    const managerIndex = indexOf("担当者");
    const outsourceCompanyIndex = indexOf("外注依頼先");
    const amountIndex = indexOf("受注金額");
    const additionalAmountIndex = indexOf("追加受注金額");
    const materialCostIndex = indexOf("材料費");
    const laborCostIndex = indexOf("労務費");
    const expenseCostIndex = indexOf("経費他");
    const outsourceCostIndex = indexOf("外注費");
    const startDateIndex = indexOf("着工日");
    const endDateIndex = indexOf("完了日");
    const statusIndex = indexOf("進捗");
    const noteIndex = indexOf("備考");

    const existingCodes = new Set(
      projects.map((project) => project.code)
    );

    const toNumber = (value?: string) => {
      const normalized = normalizeCsvCell(value).replace(/,/g, "");
      return normalized ? Number(normalized) : 0;
    };

    const toOptionalDate = (value?: string) => {
      const normalized = normalizeCsvCell(value);
      return normalized || undefined;
    };

    return csvImportRows
      .slice(1)
      .filter((row) => {
        const code = normalizeCsvCell(row[codeIndex]);
        return !existingCodes.has(code);
      })
      .map((row) => {
        const type = normalizeMasterValue(row[typeIndex]);
        const client = normalizeMasterValue(row[clientIndex]);
        const manager = normalizeMasterValue(row[managerIndex]);
        const salesStaff = normalizeMasterValue(row[salesStaffIndex]);

        return {
          code: normalizeCsvCell(row[codeIndex]),
          type,
          name: normalizeCsvCell(row[nameIndex]),
          orderDate: toOptionalDate(row[orderDateIndex]),
          client,
          clientStaff: normalizeCsvCell(row[clientStaffIndex]) || undefined,
          salesStaff,
          manager,
          outsourceCompany:
            normalizeCsvCell(row[outsourceCompanyIndex]) || undefined,
          amount: toNumber(row[amountIndex]),
          additionalAmount: toNumber(row[additionalAmountIndex]),
          materialCost: toNumber(row[materialCostIndex]),
          laborCost: toNumber(row[laborCostIndex]),
          expenseCost: toNumber(row[expenseCostIndex]),
          outsourceCost: toNumber(row[outsourceCostIndex]),
          status: normalizeCsvCell(row[statusIndex]) || "未着手",
          note: normalizeCsvCell(row[noteIndex]) || undefined,
          startDate: toOptionalDate(row[startDateIndex]),
          endDate: toOptionalDate(row[endDateIndex]),
        };
      });
  };

  const [csvImportResult, setCsvImportResult] = useState<{
    imported: {
      code: string;
      name: string;
    }[];
    skipped: number;
  } | null>(null);

  // 登録実行テスト関数
  const handleCsvImport = async () => {
    const importProjects = getCsvImportProjects();
    const importedProjects: {
      code: string;
      name: string;
    }[] = [];

    if (importProjects.length === 0) {
      alert("登録対象の案件がありません");
      return;
    }

    try {
      setIsCsvImporting(true);

      for (const project of importProjects) {
        await createProjectApi(project);

        importedProjects.push({
          code: project.code,
          name: project.name,
        });
      }

      await fetchProjects();

      setCsvImportResult({
        imported: importedProjects,
        skipped: csvImportSummary.skipCount,
      });

      setIsCsvConfirmMode(false);
      setIsCsvResultMode(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "CSV取込に失敗しました"
      );
    } finally {
      setIsCsvImporting(false);
    }
  };

  // CSV取込ファイル選択処理
  const handleCsvFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCsvImportError("");
    setCsvImportRows([]);
    setCsvValidationErrors([]);
    setSelectedCsvFileName("");

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setCsvImportError("CSVファイルを選択してください");
      return;
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length < 2) {
          setCsvImportError("取込できるデータがありません");
          return;
    }

    const header = rows[0];

    const headerValid =
      JSON.stringify(header) ===
      JSON.stringify(projectImportCsvHeader);

    if (!headerValid) {
      setCsvImportError(
        "CSVヘッダーがテンプレートと一致しません"
      );
      return;
    }

    const duplicateErrors =
      validateDuplicateCodes(
        rows,
        sortedProjects,
        csvImportMode
      );

    setCsvDuplicateErrors(
      duplicateErrors
    );

    const masterErrors = validateMasterData(rows);    

    const validationErrors = validateCsvRows(rows);    
    
    setCsvImportRows(rows);
    setSelectedCsvFileName(file.name);
    setCsvValidationErrors(validationErrors);
    setCsvMasterErrors(masterErrors);
  };
  
  //CSVインポート必須項目チェック
  const validateCsvRows = (rows: string[][]) => {
    const errors: string[] = [];
    const header = rows[0];

    const indexOf = (name: string) => header.indexOf(name);

    const codeIndex = indexOf("案件番号");
    const nameIndex = indexOf("案件名");
    const clientIndex = indexOf("発注者");
    const clientStaffIndex = indexOf("発注者担当者");
    const salesStaffIndex = indexOf("営業担当者");  
    const managerIndex = indexOf("担当者");
    const amountIndex = indexOf("受注金額");
    const noteIndex = indexOf("備考");

    rows.slice(1).forEach((row, index) => {
      const lineNo = index + 2;

      const code = normalizeCsvCell(row[codeIndex]);
      const name = normalizeCsvCell(row[nameIndex]);
      const client = normalizeCsvCell(row[clientIndex]);
      const clientStaff = normalizeCsvCell(row[clientStaffIndex]);
      const salesStaff = normalizeForCompare(row[salesStaffIndex]);
      const manager = normalizeForCompare(row[managerIndex]);
      const amount = normalizeCsvCell(row[amountIndex]);      
      const note = normalizeCsvCell(row[noteIndex]);

      if (!code) errors.push(`${lineNo}行目：案件番号が未入力`);
      if (!name) errors.push(`${lineNo}行目：案件名が未入力`);
      // if (!client) errors.push(`${lineNo}行目：発注者が未入力`);
      // if (!manager) errors.push(`${lineNo}行目：担当者が未入力`);
      if (!amount) errors.push(`${lineNo}行目：受注金額が未入力`);

      if (amount && (isNaN(Number(amount)) || Number(amount) <= 0)) {
        errors.push(`${lineNo}行目：受注金額が不正`);
      }
    });

    return errors;
  };

  const validateMasterData = (
    rows: string[][]
  ) => {
    const errors: string[] = [];

    const header = rows[0];

    const typeIndex = header.indexOf("種別");
    const clientIndex = header.indexOf("発注者");
    const managerIndex = header.indexOf("担当者");
    const salesStaffIndex = header.indexOf("営業担当者");

    const clientSet = new Set(
      clients.map((c) => c.name)
    );

    const staffSet = new Set(
      staffs.map((s) => normalizeForCompare(s.name))
    );

    const typeSet = new Set(
      projectTypes.map((t) => t.code)
    );

    rows.slice(1).forEach((row, index) => {
      const lineNo = index + 2;

      const type =
        normalizeMasterValue(
          row[typeIndex]
        );

      const client =
        normalizeMasterValue(
          row[clientIndex]
        );

      const manager =
        normalizeMasterValue(
          row[managerIndex]
        );

      const salesStaff =
        normalizeMasterValue(
          row[salesStaffIndex]
        );

      if (!clientSet.has(client)) {
        errors.push(
          `${lineNo}行目：発注者「${client}」が未登録です`
        );
      }

      if (!staffSet.has(manager)) {
        errors.push(
          `${lineNo}行目：担当者「${manager}」が未登録です`
        );
      }

      if (!staffSet.has(salesStaff)) {
        errors.push(
          `${lineNo}行目：営業担当者「${salesStaff}」が未登録です`
        );
      }

      if (!typeSet.has(type)) {
        errors.push(
          `${lineNo}行目：種別「${type}」が未登録です`
        );
      }
    });

    return errors;
  };

  // CSV出力・CSV読み込み関数関係
  const exportCSV = () => {
    const formatDate = (date?: string | null) => {
      if (!date) return "";

      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return "";

      return d.toISOString().slice(0, 10);
    };

    const rows = sortedProjects.map((p) => {
      const totalAmount = getTotalAmount(p);
      const executionBudget = getExecutionBudget(p);
      const grossProfit = getGrossProfit(p);
      const costRate = getCostRate(p);

      return [
        p.code,
        p.type,
        p.name,
        formatDate(p.orderDate),
        p.client,
        p.clientStaff || "",
        p.salesStaff || "",
        p.manager,
        p.outsourceCompany || "",
        p.amount,
        p.additionalAmount ?? 0,
        totalAmount,
        p.materialCost ?? 0,
        p.laborCost ?? 0,
        p.expenseCost ?? 0,
        p.outsourceCost ?? 0,
        executionBudget,
        costRate !== null ? `${(costRate * 100).toFixed(1)}%` : "",
        grossProfit,
        formatDate(p.startDate),
        formatDate(p.endDate),
        p.status,
        p.note || "",
      ];
    });

    const today = new Date().toISOString().slice(0, 10);

    downloadCSV(
      `projects_${today}.csv`,
      projectCsvHeader,
      rows
    );
  };

  // CSV取込用テンプレート出力
  const exportProjectTemplateCSV = () => {
    const sampleRows = [
      [
        "A-001",
        "新設",
        "サンプル案件",
        "2026-06-09",
        "サンプル株式会社",
        "佐藤様",
        "田中",
        "鈴木",
        "外注会社A",
        1000000,
        0,
        200000,
        300000,
        50000,
        100000,
        "2026-06-10",
        "2026-06-30",
        "未着手",
        "備考を入力",
      ],
    ];

    downloadCSV(
      "projects_import_template.csv",
      projectImportCsvHeader,
      sampleRows
    );
  };

  const averageCostRate =
    summary.totalAmount > 0
      ? summary.executionBudget / summary.totalAmount
      : null;

  const csvImportSummary = getCsvImportSummary();

  const getCsvImportTargetRows = () => {
    if (csvImportRows.length <= 1) return [];

    const header = csvImportRows[0];
    const codeIndex = header.indexOf("案件番号");
    const nameIndex = header.indexOf("案件名");

    const existingCodes = new Set(
      projects.map((project) => project.code)
    );

    return csvImportRows.slice(1).filter((row) => {
      const code = normalizeCsvCell(row[codeIndex]);
      return !existingCodes.has(code);
    }).map((row) => ({
      code: normalizeCsvCell(row[codeIndex]),
      name: normalizeCsvCell(row[nameIndex]),
    }));
  };

  const csvImportTargetRows = getCsvImportTargetRows();

  return (   
    <main className="min-h-screen overflow-x-hidden bg-gray-100 text-gray-900 md:fixed md:inset-0 md:overflow-hidden">
      <div className="flex min-h-screen flex-col md:h-full md:flex-row md:overflow-hidden">
        <aside
          className={`shrink-0 overflow-hidden bg-gray-900 p-4 text-white transition-all duration-300 md:h-full ${
          isSidebarCollapsed ? "w-full md:w-16" : "w-full md:w-64"
        }`}
        >
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold">施工管理</h1>
                <p className="mt-2 text-sm text-gray-300">
                  Construction Manager
                </p>
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="rounded bg-gray-700 px-2 py-1 text-sm text-white hover:bg-gray-600"
            >
              {isSidebarCollapsed ? "▶" : "◀"}
            </button>
          </div>
          
          <nav className="mt-8 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedMenu(item)}
                className={`w-full rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                  selectedMenu.id === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-100 hover:bg-gray-700"
                }`}
                title={item.title}
              >
                {isSidebarCollapsed ? item.title.slice(0, 1) : item.title}
              </button>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-6 w-full rounded-lg bg-gray-700 px-3 py-2 text-sm font-bold text-white hover:bg-gray-600"
              title="ログアウト"
            >
              {isSidebarCollapsed ? "出" : "ログアウト"}
            </button>            
          </nav>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-visible p-4 md:h-full md:overflow-hidden md:p-8">
          <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-sm font-bold text-gray-500">
                Dashboard
              </h1>

              <p className="text-2xl font-bold text-gray-900">
                {selectedMenu.title}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                {selectedMenu.description}
              </p>
            </div>

            {loginUser && (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {loginUser.companyName}
                  </p>

                  <p className="text-xs text-gray-500">
                    {loginUser.name || loginUser.loginId}
                  </p>
                </div>

                <button
                  onClick={() =>
                    signOut({
                      callbackUrl: "/login",
                    })
                  }
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
            
          <div>
            {selectedMenu.id === "projects" && (
              <div className="mb-3 flex flex-wrap justify-end gap-2">
                <select
                  value={selectedFiscalYearId}
                  onChange={(e) => setSelectedFiscalYearId(e.target.value)}
                  className="h-8 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 hover:bg-white"
                >
                  <option value="all">全年度</option>

                  {fiscalYears.map((fiscalYear) => (
                    <option key={fiscalYear.id} value={fiscalYear.id}>
                      {fiscalYear.year}年度
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className="h-8 w-fit shrink-0 rounded-lg bg-gray-600 px-3 text-sm font-bold text-white hover:bg-gray-700"
                >
                  フィルター
                  {activeFilterCount > 0 && `（${activeFilterCount}）`}
                </button>

                <button
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="h-8 w-fit shrink-0 rounded-lg bg-blue-600 px-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  ＋ 新規案件
                </button>

                <button
                  onClick={() => setIsPdfModalOpen(true)}
                  className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                >
                  PDF出力
                </button>

                <button
                  onClick={exportCSV}
                  className="h-8 w-fit shrink-0 rounded-lg bg-green-600 px-3 text-sm font-bold text-white hover:bg-green-700"
                >
                  CSV出力
                </button>

                <button
                  onClick={exportProjectTemplateCSV}
                  className="h-8 w-fit shrink-0 rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  CSVテンプレート
                </button>

                <button
                  onClick={() => setIsCsvImportModalOpen(true)}
                  className="h-8 w-fit shrink-0 rounded-lg bg-orange-600 px-3 text-sm font-bold text-white hover:bg-orange-700"
                >
                  CSV取込
                </button>
              </div>
            )}
            

            {selectedMenu.id === "projects" && statusSummaryItems.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {statusSummaryItems.map((item) => (
                  <div
                    key={item.status}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm"
                  >
                    <span className="font-semibold text-gray-600">
                      {item.status}
                    </span>
                    <span className="ml-2 font-bold text-gray-900">
                      {item.count}件
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedMenu.id === "projects" && (
            <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <p className="text-xs font-semibold text-gray-500">表示案件数</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {summary.projectCount}件
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <p className="text-xs font-semibold text-gray-500">売上合計</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  ¥{summary.totalAmount.toLocaleString("ja-JP")}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <p className="text-xs font-semibold text-gray-500">実行予算合計</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  ¥{summary.executionBudget.toLocaleString("ja-JP")}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <p className="text-xs font-semibold text-gray-500">粗利合計</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  ¥{summary.grossProfit.toLocaleString("ja-JP")}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <p className="text-xs font-semibold text-gray-500">平均原価率</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {averageCostRate !== null
                    ? `${(averageCostRate * 100).toFixed(1)}%`
                    : "-"}
                </p>
              </div>
            </div>
          )}

          <div className="min-h-[320px] flex-1 overflow-hidden md:min-h-0">
            {selectedMenu.id === "projects" ? (
              loading ? (
                <p className="text-gray-700">読み込み中...</p>
              ) : (
                <div className="h-full max-w-full overflow-auto rounded-xl border border-gray-200 bg-white">
                  <ProjectsTable
                    projects={sortedProjects}
                    sortKey={sortKey}
                    setSortKey={setSortKey}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    setDeletingProject={setDeletingProject}
                    onEdit={editProject}
                    setSelectedProject={setSelectedProject}
                  />
                </div>
              )

            ) : selectedMenu.id === "settings" ? (
              <SettingsPage
                onMasterUpdated={async () => {
                  await fetchMasters();
                  await fetchProjects();
                  await fetchFiscalYears();
                }}
              />
            ) : (
              <div className="rounded-lg border border-gray-300 p-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedMenu.title}の内容
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  ここに「{selectedMenu.title}」に関する情報を表示します。
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {editingProject && (
        <EditModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={updateProject}
          clients={clients}
          staffs={staffs}
          projectTypes={projectTypes}
        />
      )}

      {deletingProject && (
        <DeleteProjectModal
          project={deletingProject}
          isDeleting={isDeleting}
          onClose={() => setDeletingProject(null)}
          onConfirm={confirmDelete}
        />
      )}

      {isFilterModalOpen && (
        <FilterModal
          filters={filters}
          filterOptions={filterOptions}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={(newFilters) => setFilters(newFilters)}
        />
      )}
      

      {selectedProject && (
        <ProjectDetailModal
          selectedProject={selectedProject}
          clients={clients}
          staffs={staffs}
          projectTypes={projectTypes}
          onClose={() => setSelectedProject(null)}
          onSaved={async () => {
            await fetchProjects();
            setToast("更新しました！");
          }}
        />
      )}      

      {toast && (
        <div className="fixed top-5 right-5 z-50">
          <div className="rounded-lg bg-green-600 px-4 py-3 text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {isNewProjectModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsNewProjectModalOpen(false)}
        >
          <div
            className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                新規案件登録
              </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <NewProjectForm
                onAdd={async (project) => {
                  const success = await addProject(project);

                  if (success) {
                    setIsNewProjectModalOpen(false);
                  }

                  return success;
                }}
                onClose={() => setIsNewProjectModalOpen(false)}
                clients={clients}
                staffs={staffs}
                projectTypes={projectTypes}
              />
            </div>
          </div>
        </div>
      )}

      {isPdfModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsPdfModalOpen(false)}
        >
          <div
            className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                案件一覧PDF出力
              </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4 text-sm text-gray-700">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">

                  <div className="mb-4">
                    <p className="mb-2 font-semibold">
                      出力項目
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pdfColumns.code}
                          onChange={() =>
                            togglePdfColumn("code")
                          }
                        />
                        <span>案件番号</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pdfColumns.type}
                          onChange={() =>
                            togglePdfColumn("type")
                          }
                        />
                        <span>種別</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pdfColumns.name}
                          onChange={() =>
                            togglePdfColumn("name")
                          }
                        />
                        <span>案件名</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pdfColumns.client}
                          onChange={() =>
                            togglePdfColumn("client")
                          }
                        />
                        <span>発注者</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pdfColumns.amount}
                          onChange={() =>
                            togglePdfColumn("amount")
                          }
                        />
                        <span>受注金額</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pdfColumns.status}
                          onChange={() =>
                            togglePdfColumn("status")
                          }
                        />
                        <span>進捗</span>
                      </label>
                    </div>
                  </div>

                  <p className="font-bold">用紙サイズ</p>
                  <div className="mt-2 flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="pdfPageSize"
                        value="A4"
                        checked={pdfPageSize === "A4"}
                        onChange={() => setPdfPageSize("A4")}
                      />
                      <span>A4横</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="pdfPageSize"
                        value="A3"
                        checked={pdfPageSize === "A3"}
                        onChange={() => setPdfPageSize("A3")}
                      />
                      <span>A3横</span>
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="mb-2 font-bold">出力項目</p>
                  <ul className="space-y-1">
                    <li>✓ 案件番号</li>
                    <li>✓ 種別</li>
                    <li>✓ 案件名</li>
                    <li>✓ 発注者</li>
                    <li>✓ 受注金額</li>
                    <li>✓ 進捗</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  onClick={() =>
                    exportProjectsPdf("preview")
                  }
                  className="
                    rounded-lg
                    bg-gray-600
                    px-4
                    py-2
                    text-white
                    hover:bg-gray-700
                  "
                >
                  プレビュー
                </button>

                <button
                  onClick={() =>
                    exportProjectsPdf("download")
                  }
                  className="
                    rounded-lg
                    bg-blue-600
                    px-4
                    py-2
                    text-white
                    hover:bg-blue-700
                  "
                >
                  PDF出力
                </button>

                <button
                  onClick={() =>
                    setIsPdfModalOpen(false)
                  }
                  className="
                    rounded-lg
                    bg-gray-300
                    px-4
                    py-2
                    hover:bg-gray-400
                  "
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV取込モーダル */}
      {isCsvImportModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsCsvImportModalOpen(false)}
        >
          <div
            className="relative z-[110] flex w-full max-w-4xl max-h-[90dvh] flex-col overflow-hidden rounded-xl bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {isCsvResultMode ? (
              <>
                {csvImportResult && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h3 className="mb-3 text-lg font-bold text-green-800">
                      CSV取込完了
                    </h3>

                    <div className="space-y-2 text-sm">
                      <p>
                        登録件数：
                        <span className="font-bold text-green-700">
                          {csvImportResult.imported.length}件
                        </span>
                      </p>

                      <p>
                        スキップ件数：
                        <span className="font-bold text-yellow-700">
                          {csvImportResult.skipped}件
                        </span>
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-sm font-bold text-gray-700">
                        登録案件
                      </p>

                      <div className="space-y-1 text-sm">
                        {csvImportResult.imported
                          .slice(0, 10)
                          .map((project) => (
                            <div key={project.code}>
                              ✓ {project.code}　{project.name}
                            </div>
                          ))}
                      </div>

                      {csvImportResult.imported.length > 10 && (
                        <p className="mt-2 text-xs text-gray-500">
                          他 {csvImportResult.imported.length - 10} 件
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : isCsvConfirmMode ? (
              <>
                {isCsvConfirmMode && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <h3 className="mb-3 text-lg font-bold text-blue-800">
                        CSV取込確認
                      </h3>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs font-semibold text-gray-500">
                            取込方式
                          </p>
                          <p className="mt-1 font-bold text-gray-900">
                            追加登録
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="rounded-lg bg-white p-3">
                            <p className="text-xs font-semibold text-gray-500">
                              CSV件数
                            </p>
                            <p className="mt-1 font-bold text-gray-900">
                              {csvImportSummary.totalCount}件
                            </p>
                          </div>

                          <div className="rounded-lg bg-white p-3">
                            <p className="text-xs font-semibold text-gray-500">
                              登録予定
                            </p>
                            <p className="mt-1 font-bold text-green-700">
                              {csvImportSummary.importCount}件
                            </p>
                          </div>

                          <div className="rounded-lg bg-white p-3">
                            <p className="text-xs font-semibold text-gray-500">
                              スキップ予定
                            </p>
                            <p className="mt-1 font-bold text-yellow-700">
                              {csvImportSummary.skipCount}件
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-lg bg-white p-3 text-sm text-gray-700">
                          <div className="space-y-1">
                            <p className="font-semibold text-green-700">
                              ✓ 入力チェック完了
                            </p>
                            <p className="font-semibold text-green-700">
                              ✓ 重複チェック完了
                            </p>
                            <p className="font-semibold text-green-700">
                              ✓ マスタチェック完了
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-lg bg-white p-3">
                          <h4 className="mb-2 text-sm font-bold text-gray-700">
                            登録予定案件
                          </h4>

                          {csvImportTargetRows.length === 0 ? (
                            <p className="text-sm text-gray-500">
                              登録予定の案件はありません。
                            </p>
                          ) : (
                            <div className="space-y-1 text-sm text-gray-700">
                              {csvImportTargetRows.slice(0, 5).map((row) => (
                                <div
                                  key={row.code}
                                  className="flex gap-3 rounded border border-gray-100 px-2 py-1"
                                >
                                  <span className="w-24 shrink-0 font-bold text-blue-700">
                                    {row.code}
                                  </span>
                                  <span className="truncate">
                                    {row.name}
                                  </span>
                                </div>
                              ))}

                              {csvImportTargetRows.length > 5 && (
                                <p className="mt-2 text-xs text-gray-500">
                                  他 {csvImportTargetRows.length - 5} 件あります。
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-blue-700">
                        追加登録モードでは、既に存在する案件番号はスキップし、
                        新規案件番号のみ登録します。
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="shrink-0 border-b border-gray-200 px-6 py-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    CSV取込
                  </h2>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                  <input
                    ref={csvFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="hidden"
                  />

                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-2 text-sm font-bold text-gray-700">
                      取込方式
                    </p>

                    <label className="flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        checked={csvImportMode === "append"}
                        onChange={() => setCsvImportMode("append")}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-bold">追加登録</span>
                        <br />
                        既存案件は残し、CSVの新規案件だけ登録します。
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={() => csvFileInputRef.current?.click()}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    CSVファイル選択
                  </button>

                  {selectedCsvFileName && (
                    <div className="mt-2 text-sm text-gray-600">
                      選択中: {selectedCsvFileName}
                    </div>
                  )}

                  <button
                    onClick={clearCsvImport}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    クリア
                  </button>

                  {csvImportError && (
                    <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                      {csvImportError}
                    </div>
                  )}

                  {csvValidationErrors.length > 0 && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <h3 className="mb-2 font-bold text-red-700">
                        入力エラー
                      </h3>

                      <ul className="space-y-1 text-sm text-red-600">
                        {csvValidationErrors
                          .slice(0, 20)
                          .map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                      </ul>

                      {csvValidationErrors.length > 20 && (
                        <p className="mt-2 text-xs text-red-500">
                          他にもエラーがあります
                        </p>
                      )}
                    </div>
                  )}

                  {csvDuplicateErrors.length > 0 && (
                    <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <h3 className="mb-2 font-bold text-yellow-700">
                        重複エラー
                      </h3>

                      <ul className="space-y-1 text-sm text-yellow-700">
                        {csvDuplicateErrors
                          .slice(0, 20)
                          .map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {csvMasterErrors.length > 0 && (
                    <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                      <h3 className="mb-2 font-bold text-orange-700">
                        マスタ未登録
                      </h3>

                      <ul className="space-y-1 text-sm text-orange-700">
                        {csvMasterErrors
                          .slice(0, 20)
                          .map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {csvImportRows.length > 0 && (
                    <div className="rounded-lg border border-gray-200">
                      <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold">
                        プレビュー：{csvImportRows.length - 1}件
                      </div>

                      <div className="max-h-[50dvh] overflow-auto">
                        <table className="min-w-[1600px] table-fixed border-collapse text-xs">
                          <tbody>
                            {csvImportRows.slice(0, 6).map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={cellIndex}
                                    className={`max-w-[180px] truncate border border-gray-200 px-2 py-1 ${
                                      rowIndex === 0
                                        ? "bg-gray-100 font-bold"
                                        : "bg-white"
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {csvImportRows.length > 6 && (
                        <p className="px-3 py-2 text-xs text-gray-500">
                          ※先頭5件のみ表示しています。
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="shrink-0 border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end gap-3">
                {isCsvResultMode ? (
                  <button
                    onClick={() => {
                      clearCsvImport();
                      setIsCsvImportModalOpen(false);
                    }}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    閉じる
                  </button>
                ) : isCsvConfirmMode ? (
                  <>
                    <button
                      onClick={() => setIsCsvConfirmMode(false)}
                      className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      戻る
                    </button>

                    <button
                      onClick={handleCsvImport}
                      disabled={isCsvImporting || csvImportSummary.importCount === 0}
                      className={`rounded-lg px-6 py-2 font-semibold text-white ${
                        isCsvImporting || csvImportSummary.importCount === 0
                          ? "bg-gray-400"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {isCsvImporting ? "登録中..." : "登録実行"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsCsvImportModalOpen(false)}
                      className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      閉じる
                    </button>

                    <button
                      onClick={() => setIsCsvConfirmMode(true)}
                      disabled={
                        csvImportRows.length === 0 ||
                        csvValidationErrors.length > 0 ||
                        csvDuplicateErrors.length > 0 ||
                        csvMasterErrors.length > 0
                      }
                      className={`rounded-lg px-6 py-2 font-semibold text-white ${
                        csvImportRows.length === 0 ||
                        csvValidationErrors.length > 0 ||
                        csvDuplicateErrors.length > 0 ||
                        csvMasterErrors.length > 0
                          ? "bg-gray-400"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      取込確認へ
                    </button>
                  </>
                )}          
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
