"use client";

import { useEffect, useState } from "react";
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
    const [clientData, staffData, typeData] = await Promise.all([
      fetchClientsApi(),
      fetchStaffsApi(),
      fetchProjectTypesApi(),
    ]);

    setClients(clientData);
    setStaffs(staffData);
    setProjectTypes(typeData);
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

  const averageCostRate =
    summary.totalAmount > 0
      ? summary.executionBudget / summary.totalAmount
      : null;

  
  // ｃｓｖ出力処理
  const exportCSV = () => {
    // ヘッダー
    const header = [
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

    // データ（今表示されているものを使う）
    const rows = sortedProjects.map((p) => {
      const costRate = getCostRate(p);

      const formatDate = (date?: string) =>
        date ? new Date(date).toLocaleDateString("ja-JP") : "";

      const cleanNote = p.note
        ? p.note.replace(/\r?\n/g, " ")
        : "";

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
        getTotalAmount(p),

        p.materialCost ?? 0,
        p.laborCost ?? 0,
        p.expenseCost ?? 0,
        p.outsourceCost ?? 0,
        getExecutionBudget(p),

        costRate !== null ? costRate.toFixed(4) : "",
        getGrossProfit(p),

        formatDate(p.startDate),
        formatDate(p.endDate),
        p.status,
        cleanNote,
      ];
    });

    // CSV文字列作成
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
      .join("\n");

    // BOM付き（Excel文字化け防止）
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // ダウンロード処理
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "projects.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (   
    // <main className="fixed inset-0 overflow-hidden bg-gray-100 text-gray-900">  
      // <div className="flex h-full overflow-hidden">
    <main className="min-h-screen overflow-x-hidden bg-gray-100 text-gray-900 lg:fixed lg:inset-0 lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-full lg:flex-row lg:overflow-hidden">
        <aside
          className={`shrink-0 overflow-hidden bg-gray-900 p-4 text-white transition-all duration-300 lg:h-full ${
          isSidebarCollapsed ? "w-full lg:w-16" : "w-full lg:w-64"
        }`}
          // className={`h-full shrink-0 overflow-hidden bg-gray-900 p-4 text-white transition-all duration-300 ${
          //   isSidebarCollapsed ? "w-16" : "w-64"
          // }`}
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

        <section className="flex min-w-0 flex-1 flex-col overflow-visible p-4 md:p-8 lg:h-full lg:overflow-hidden">
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
                  onClick={exportCSV}
                  className="h-8 w-fit shrink-0 rounded-lg bg-green-600 px-3 text-sm font-bold text-white hover:bg-green-700"
                >
                  CSV出力
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

          <div className="min-h-0 flex-1 overflow-hidden">
            {selectedMenu.id === "projects" ? (
              loading ? (
                <p className="text-gray-700">読み込み中...</p>
              ) : (
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
            className="relative z-[110] w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl bg-white shadow-lg touch-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                新規案件登録
              </h2>
            </div>

            <div className="max-h-[calc(85vh-72px)] overflow-hidden">
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

    </main>
  );
}
