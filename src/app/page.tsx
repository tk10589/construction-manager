"use client";

import { useEffect, useRef, useState } from "react";
import PdfExportModal from "@/components/projects/PdfExportModal";
import {
  PdfColumns,
} from "@/lib/pdf/types";
import {
  exportProjectsPdf,
} from "@/lib/pdf/exportProjectsPdf";

import CsvImportModal from "@/components/projects/CsvImportModal";


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
  const [pdfColumns, setPdfColumns] = useState<PdfColumns>({
    code: true,
    type: true,
    name: true,
    client: true,
    manager: true,

    salesStaff: false,
    clientStaff: false,

    amount: true,
    budget: false,

    orderDate: false,
    startDate: false,
    endDate: false,

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

  // PDF設定保持（localStorage）
  useEffect(() => {
    const savedPdfColumns =
      localStorage.getItem("pdfColumns");

    const savedPdfPageSize =
      localStorage.getItem("pdfPageSize");

    if (savedPdfColumns) {
      setPdfColumns((prev) => ({
        ...prev,
        ...JSON.parse(savedPdfColumns),
      }));
    }

    if (
      savedPdfPageSize === "A4" ||
      savedPdfPageSize === "A3"
    ) {
      setPdfPageSize(savedPdfPageSize);
    }
  }, []);

  // 自動保存（PDF出力用項目チェック）
  useEffect(() => {
    localStorage.setItem(
      "pdfColumns",
      JSON.stringify(pdfColumns)
    );
  }, [pdfColumns]);

  // 自動保存（A3,A4選択状態）
  useEffect(() => {
    localStorage.setItem(
      "pdfPageSize",
      pdfPageSize
    );
  }, [pdfPageSize]);

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

  // チェック切替用関数（PDFモーダル用）
  const togglePdfColumn = (
    key: keyof typeof pdfColumns
  ) => {
    setPdfColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectedColumnCount =
      Object.values(pdfColumns).filter(Boolean)
        .length;


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
                  className="h-8 w-fit shrink-0 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700"
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
        <PdfExportModal
          pdfColumns={pdfColumns}
          pdfPageSize={pdfPageSize}
          selectedColumnCount={selectedColumnCount}
          projectCount={sortedProjects.length}
          onToggleColumn={togglePdfColumn}
          onChangePageSize={setPdfPageSize}
          onPreview={() =>
            exportProjectsPdf({
              projects: sortedProjects,
              pdfColumns,
              pdfPageSize,
              mode: "preview",
            })
          }
          onDownload={() =>
            exportProjectsPdf({
              projects: sortedProjects,
              pdfColumns,
              pdfPageSize,
              mode: "download",
            })
          }
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}

      {/* CSV取込モーダル */}
      {isCsvImportModalOpen && (
        <CsvImportModal
          csvFileInputRef={csvFileInputRef}
          isCsvResultMode={isCsvResultMode}
          isCsvConfirmMode={isCsvConfirmMode}
          isCsvImporting={isCsvImporting}
          csvImportResult={csvImportResult}
          csvImportSummary={csvImportSummary}
          csvImportTargetRows={csvImportTargetRows}
          csvImportRows={csvImportRows}
          csvImportError={csvImportError}
          csvValidationErrors={csvValidationErrors}
          csvDuplicateErrors={csvDuplicateErrors}
          csvMasterErrors={csvMasterErrors}
          selectedCsvFileName={selectedCsvFileName}
          csvImportMode={csvImportMode}
          onClose={() => setIsCsvImportModalOpen(false)}
          onClear={clearCsvImport}
          onFileChange={handleCsvFileChange}
          onChangeImportMode={setCsvImportMode}
          onBackToInput={() => setIsCsvConfirmMode(false)}
          onGoConfirm={() => setIsCsvConfirmMode(true)}
          onImport={handleCsvImport}
        />
      )}
    </main>
  );
}
