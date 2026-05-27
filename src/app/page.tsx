"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Project } from "@/types/project";
import ProjectsTable from "@/components/ProjectsTable";
import NewProjectForm from "@/components/NewProjectForm";
import EditModal from "@/components/EditModal";
import SettingsPage from "@/components/settings/SettingsPage";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import DeleteProjectModal from "@/components/DeleteProjectModal";
import {
  fetchProjectsApi,
  fetchClientsApi,
  fetchStaffsApi,
  fetchProjectTypesApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
} from "@/lib/api";

const menuItems = [
  { id: "projects", title: "案件管理", description: "案件一覧、進捗、受注金額を確認します。" },
  { id: "new-project", title: "新規案件登録", description: "現場名、住所、担当者、受注金額を登録します。" },
  { id: "materials", title: "材料管理", description: "使用材料、発注状況、在庫状況を管理します。" },
  { id: "progress", title: "進捗管理", description: "未着手、施工中、完了などの状況を確認します。" },
  { id: "settings", title: "設定", description: "マスタ管理を行います" },
];



export default function Home() {
  const [selectedMenu, setSelectedMenu] = useState(menuItems[0]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [projectTypes, setProjectTypes] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [codeSort, setCodeSort] = useState<"asc" | "desc">("asc");
  const [amountSort, setAmountSort] = useState<"none" | "desc" | "asc">("none");
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<"code" | "amount">("code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [toast, setToast] = useState<string | null>(null);
  
  const [clients, setClients] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);

  
  const fetchProjects = async () => {
    try {
      const data = await fetchProjectsApi(keyword);
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

  useEffect(() => {
    fetchProjects();
  }, [keyword]);

  useEffect(() => {
    const saved = localStorage.getItem("keyword");
    if (saved) {
      setKeyword(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("keyword", keyword);
  }, [keyword]);

  useEffect(() => {
    const saved = localStorage.getItem("typeFilter");
    if (saved) {
      setTypeFilter(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("typeFilter", typeFilter);
  }, [typeFilter]);

  

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [toast]);

  

  useEffect(() => {
    fetchProjects();
    fetchMasters();
  }, []);

  // selectedProject が変わった時に初期値
  

  // 外側クリック処理


  const addProject = async (
    newProject: Omit<Project, "id">
  ): Promise<boolean> => {
    try {
      await createProjectApi(newProject);

      await fetchProjects();
      setSelectedMenu(menuItems[0]);

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

  

  

  const filteredProjects = projects.filter((p) => {
    if (typeFilter === "ALL") return true;
    return p.type === typeFilter;
  });

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

  const exportCSV = () => {
    // ヘッダー
    const header = [
      "案件番号",
      "種別",
      "案件名",
      "発注者",
      "担当者",
      "受注金額",
      "進捗",
    ];

    // データ（今表示されているものを使う）
    const rows = sortedProjects.map((p) => [
      p.code,
      p.type,
      p.name,
      p.client,
      p.manager,
      p.amount,
      p.status,
    ]);

    // CSV文字列作成
    const csvContent = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
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

  // 絞り込み配列


  return (   
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <div className="flex min-h-screen overflow-hidden">
        <aside className="sticky top-0 h-screen w-64 shrink-0 bg-gray-900 p-6 text-white">
          <h1 className="text-xl font-bold">施工管理</h1>
          <p className="mt-2 text-sm text-gray-300">Construction Manager</p>
          
          <nav className="mt-8 space-y-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="案件番号検索（例：F-2026）"
              className="border px-3 py-2 rounded"
            />

            <div className="mb-4">
              <p className="mb-1 text-xs text-gray-100">
                種別フィルター
              </p>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border px-3 py-2 text-gray-300"
              >
                <option value="ALL">全て</option>

                {projectTypes.map((type) => (
                  <option key={type.id} value={type.code}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedMenu(item)}
                className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                  selectedMenu.id === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-100 hover:bg-gray-700"
                }`}
              >
                {item.title}
              </button>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-6 w-full rounded-lg bg-gray-700 px-4 py-2 text-sm font-bold text-white hover:bg-gray-600"
            >
              ログアウト
            </button>            
          </nav>
        </aside>

        <section className="min-w-0 flex-1 overflow-hidden p-8">
          <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold text-blue-700">Dashboard</p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              {selectedMenu.title}
            </h2>

            <p className="mt-4 text-base text-gray-700">
              {selectedMenu.description}
            </p>

            <button
              onClick={exportCSV}
              className="ml-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
            >
              CSV出力
            </button>

            <div className="mt-8">
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
              ) : selectedMenu.id === "new-project" ? (
                <NewProjectForm
                  onAdd={addProject}
                  clients={clients}
                  staffs={staffs} 
                  projectTypes={projectTypes}
                />
              ) : selectedMenu.id === "settings" ? (
                <SettingsPage
                  onMasterUpdated={async () => {
                    await fetchMasters();
                    await fetchProjects();
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

    </main>
  );
}



