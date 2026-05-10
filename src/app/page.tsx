"use client";

import { projectCompilationEventsSubscribe } from "next/dist/build/swc/generated-native";
import { useEffect, useState } from "react";

const menuItems = [
  { id: "projects", title: "案件管理", description: "案件一覧、進捗、受注金額を確認します。" },
  { id: "new-project", title: "新規案件登録", description: "現場名、住所、担当者、受注金額を登録します。" },
  { id: "materials", title: "材料管理", description: "使用材料、発注状況、在庫状況を管理します。" },
  { id: "progress", title: "進捗管理", description: "未着手、施工中、完了などの状況を確認します。" },
  { id: "settings", title: "設定", description: "マスタ管理を行います" },
];

type Project = {
  id: number;
  code: string;
  name: string;
  type: string; // ←これ追加
  client: string;
  manager: string;
  amount: number;
  status: string;
  clients: any[];
  staffs: any[];

  startDate?: string;
  endDate?: string;
};

export default function Home() {
  const [selectedMenu, setSelectedMenu] = useState(menuItems[0]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [codeSort, setCodeSort] = useState<"asc" | "desc">("asc");
  const [amountSort, setAmountSort] = useState<"none" | "desc" | "asc">("none");
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<"code" | "amount">("code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] =
    useState<FormErrors>({});
  // const [errors, setErrors] = useState<{
  //   name?: string;
  //   client?: string;
  //   manager?: string;
  //   amount?: string;
  // }>({});
  const [amountInput, setAmountInput] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  // const [amountInput, setAmountInput] =
  // useState(
  //   selectedProject.amount.toLocaleString()
  // );
  type FormErrors = {
    name?: string;
    client?: string;
    manager?: string;
    amount?: string;
  };


  const fetchProjects = async () => {
    const res = await fetch(
      `/api/projects?q=${keyword}`
    );
    const data = await res.json();

    setProjects(data);
    setLoading(false);
  };

  const fetchMasters = async () => {
    const clientRes = await fetch("/api/clients");
    const clientData = await clientRes.json();

    const staffRes = await fetch("/api/staffs");
    const staffData = await staffRes.json();

    setClients(clientData);
    setStaffs(staffData);
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
    if (selectedProject) {
      setEditData(selectedProject);
      setIsEditing(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (editData) {
      setAmountInput(editData.amount.toString());
    }
  }, [editData]);

  useEffect(() => {
    fetchProjects();
    fetchMasters();
  }, []);

  const addProject = async (
    newProject: Omit<Project, "id" | "code">
  ) => {
    await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newProject),
    });

    await fetchProjects();
    setSelectedMenu(menuItems[0]);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingProject) return;

    setIsDeleting(true);

    await fetch(`/api/projects/${deletingProject.id}`, {
      method: "DELETE",
    });

    await fetchProjects();
    setDeletingProject(null);
    setIsDeleting(false);
  };

  const editProject = (project: Project) => {
    setEditingProject(project);
  };

  const updateProject = async (project: Project) => {
    await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(project),
    });

    await fetchProjects();
    setEditingProject(null);
  };

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!editData?.name) {
      newErrors.name = "案件名は必須です";
    }

    if (!editData?.client) {
      newErrors.client = "発注者は必須です";
    }

    if (!editData?.manager) {
      newErrors.manager = "担当者は必須です";
    }

    if (!editData?.amount || editData.amount <= 0) {
      newErrors.amount = "金額は正しく入力してください";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!editData) return;

    const numericAmount = Number(
    amountInput.replace(/,/g, "")
    );

    if (!numericAmount || numericAmount <= 0) {
      setErrors((prev) => ({
        ...prev,
        amount: "金額を正しく入力してください",
      }));
      return;
    }

    if (!validate()) return; // ←これ追加
    
    try {
      setIsSaving(true); // ←開始

      await fetch(`/api/projects/${editData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editData,
          amount: numericAmount, // ←ここ重要
        }),
      });          

      await fetchProjects(); // 一覧更新

      setToast("更新しました！");

      setSelectedProject(null); // モーダル閉じる
      setIsEditing(false); // 編集モード解除

    } catch (error) {
      console.error(error);
      alert("更新に失敗しました");
    }finally {
      setIsSaving(false); // ←終了（超重要）
    };
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

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-gray-900 p-6 text-white">
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
              <p className="mb-1 text-xs text-gray-400">
                種別フィルター
              </p>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white shadow-sm"
              >
                <option value="ALL">全て</option>
                <option value="F">自火報・防排煙</option>
                <option value="FE">弱電設備</option>
                <option value="E">環境設備</option>
                <option value="MM">点検・維持</option>
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
          </nav>
        </aside>

        <section className="flex-1 p-8">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
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
                />
              ) : selectedMenu.id === "settings" ? (
                <SettingsPage />
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
        />
      )}
      {deletingProject && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40"
          onClick={() => setDeletingProject(null)} // 背景クリックで閉じる
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()} // 中クリック無効
          >
            <h2 className="text-lg font-bold text-gray-900">
              削除確認
            </h2>

            <p className="mt-3 text-gray-700">
              本当に削除しますか？
            </p>

            <div className="mt-4 rounded-md bg-gray-100 p-3 text-sm">
              <p>案件番号：{deletingProject.code}</p>
              <p>案件名：{deletingProject.name}</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingProject(null)}
                className="rounded-lg border px-4 py-2"
                disabled={isDeleting}
              >
                キャンセル
              </button>

              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-white"
                disabled={isDeleting}
              >
                {isDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProject && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">
              案件詳細
            </h2>

            {/* 表示モード */}
            {!isEditing && (
              <div className="mt-4 space-y-2 text-sm">
                <p><b>案件番号：</b>{selectedProject.code}</p>
                <p><b>種別：</b>{selectedProject.type}</p>
                <p><b>案件名：</b>{selectedProject.name}</p>
                <p><b>発注者：</b>{selectedProject.client}</p>
                <p><b>担当者：</b>{selectedProject.manager}</p>
                <p><b>受注金額：</b>¥{selectedProject.amount.toLocaleString()}</p>
                <p>
                  <b>着工日：</b>
                  {selectedProject.startDate
                    ? new Date(selectedProject.startDate).toLocaleDateString()
                    : "-"}
                </p>

                <p>
                  <b>完了日：</b>
                  {selectedProject.endDate
                    ? new Date(selectedProject.endDate).toLocaleDateString()
                    : "-"}
                </p>
                <p><b>進捗：</b>{selectedProject.status}</p>
              </div>
            )}

            {/* 編集モード */}
            {isEditing && editData && (
              <div className="mt-4 space-y-3 text-sm">

                <input
                  value={editData.name}
                  onChange={(e) => {
                    setEditData({ ...editData, name: e.target.value });

                    setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  className={`w-full border px-3 py-2 rounded ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />

                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name}
                  </p>
                )}

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    発注者
                  </label>

                  <select
                    value={editData.client}
                    onChange={(e) => {
                      setEditData({
                        ...editData,
                        client: e.target.value,
                      });

                      setErrors((prev) => ({
                        ...prev,
                        client: "",
                      }));
                    }}
                    className={`w-full rounded-lg border px-4 py-2 ${
                      errors.client
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">
                      選択してください
                    </option>

                    {clients.map((client) => (
                      <option
                        key={client.id}
                        value={client.name}
                      >
                        {client.name}
                      </option>
                    ))}
                  </select>

                  {errors.client && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.client}
                    </p>
                  )}
                </div>

                {/* <input
                  value={editData.client}
                  onChange={(e) => {
                    setEditData({ ...editData, client: e.target.value });
                    setErrors((prev) => ({ ...prev, client: undefined }));
                  }}
                  className={`w-full border px-3 py-2 rounded ${
                    errors.client ? "border-red-500" : ""
                  }`}
                />

                {errors.client && (
                  <p className="text-red-500 text-xs">{errors.client}</p>
                )} */}

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    担当者
                  </label>

                  <select
                    value={editData.manager}
                    onChange={(e) => {
                      setEditData({
                        ...editData,
                        manager: e.target.value,
                      });

                      setErrors((prev) => ({
                        ...prev,
                        manager: "",
                      }));
                    }}
                    className={`w-full rounded-lg border px-4 py-2 ${
                      errors.manager
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">
                      選択してください
                    </option>

                    {staffs.map((staff) => (
                      <option
                        key={staff.id}
                        value={staff.name}
                      >
                        {staff.name}
                      </option>
                    ))}
                  </select>

                  {errors.manager && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.manager}
                    </p>
                  )}
                </div>

                {/* <input
                  value={editData.manager}
                  onChange={(e) => {
                    setEditData({ ...editData, manager: e.target.value });
                    setErrors((prev) => ({ ...prev, manager: undefined }));
                  }}
                  className={`w-full border px-3 py-2 rounded ${
                    errors.manager ? "border-red-500" : ""
                  }`}
                />

                {errors.manager && (
                  <p className="text-red-500 text-xs">{errors.client}</p>
                )} */}

                <input
                  value={amountInput}
                  onChange={(e) => {
                    // 数字だけ許可
                    const value = e.target.value.replace(/[^\d]/g, "");
                    setAmountInput(value);

                    setErrors((prev) => ({ ...prev, amount: "" }));
                  }}
                  onBlur={() => {
                    if (!amountInput) return;

                    // 表示用カンマ
                    setAmountInput(
                      Number(amountInput).toLocaleString('ja-JP')
                    );
                  }}
                  onFocus={() => {
                    // カンマ削除
                    setAmountInput(amountInput.replace(/,/g, ""));
                  }}
                  className={`w-full border px-3 py-2 rounded ${
                    errors.amount ? "border-red-500" : ""
                  }`}
                />

                {errors.amount && (
                  <p className="text-red-500 text-xs">{errors.amount}</p>
                )}

                <select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option>未着手</option>
                  <option>施工中</option>
                  <option>完了</option>
                </select>

                <div>
                  <label>着工日</label>
                  <input
                    type="date"
                    value={editData.startDate?.slice(0, 10) || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>

                <div>
                  <label>完了日</label>
                  <input
                    type="date"
                    value={editData.endDate?.slice(0, 10) || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              </div>
            )}  

            {/* ボタン */}
            <div className="mt-6 flex justify-between">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  編集
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`rounded-lg px-4 py-2 text-white hover:bg-gray-700 ${
                    isSaving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isSaving ? "保存中…" : "保存"}
                </button>
              )}

              <button
                onClick={() => setSelectedProject(null)}
                className="rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
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

function ProjectsTable({
  projects,
  sortKey,
  setSortKey,
  sortOrder,
  setSortOrder,
  onEdit,
  setDeletingProject,
  setSelectedProject,
}: {
  projects: Project[];
  sortKey: "code" | "amount";
  setSortKey: React.Dispatch<React.SetStateAction<"code" | "amount">>;
  sortOrder: "asc" | "desc";
  setSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  onEdit: (project: Project) => void;
  setDeletingProject: (project: Project) => void;

  setSelectedProject: React.Dispatch<
    React.SetStateAction<Project | null>
  >;
}) {

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-gray-300 p-6 text-gray-700">
        登録されている案件はありません。
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "F":
        return "bg-red-100 text-red-700";
      case "FE":
        return "bg-orange-100 text-orange-700";
      case "E":
        return "bg-blue-100 text-blue-700";
      case "MM":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300">
      <table className="w-full border-collapse bg-white text-sm">
        <thead className="bg-gray-100 text-left text-gray-900">
          <tr>
            <th
              className="px-4 py-3 font-bold text-left cursor-pointer hover:bg-gray-200"
              onClick={() => {
                if (sortKey === "code") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortKey("code");
                  setSortOrder("asc");
                }
              }}
            >
              案件番号 {sortKey === "code" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 py-3 font-bold">種別</th>
            <th className="px-4 py-3 font-bold">案件名</th>
            <th className="px-4 py-3 font-bold">発注者</th>
            <th className="px-4 py-3 font-bold">担当者</th>
            <th
              className="px-4 py-3 font-bold text-center cursor-pointer hover:bg-gray-200"
              onClick={() => {
                if (sortKey === "amount") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortKey("amount");
                  setSortOrder("asc");
                }
              }}
            >
              受注金額 {sortKey === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 py-3 font-bold">着工日</th>
            <th className="px-4 py-3 font-bold">完了日</th>
            <th className="px-4 py-3 font-bold">進捗</th>
            <th className="px-4 py-3 font-bold">操作</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-t border-gray-200">
              <td className="px-4 py-3 font-semibold text-gray-900">
                {project.code}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(
                    project.type
                  )}`}
                >
                  {project.type}
                </span>
              </td>
              <td
                className="px-4 py-3 font-semibold text-blue-600 cursor-pointer hover:underline"
                onClick={() => setSelectedProject(project)}
              >
                {project.name}
              </td>
              <td className="px-4 py-3 text-gray-800">{project.client}</td>
              <td className="px-4 py-3 text-gray-800">{project.manager}</td>
              <td className="px-4 py-3 font-semibold text-gray-900 text-center">
                ¥{project.amount.toLocaleString() || 0}
              </td>
              <td className="px-4 py-3 text-sm">
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString()
                  : "-"}
              </td>

              <td className="px-4 py-3 text-sm">
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : "-"}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                  {project.status}
                </span>
              </td>
              <td className="px-4 py-3 space-x-2">
                <button
                  onClick={() => onEdit(project)}
                  className="rounded-lg bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700"
                >
                  編集
                </button>

                <button
                  onClick={() => setDeletingProject(project)}
                  className="rounded-lg bg-red-500 px-3 py-1 text-xs font-bold text-white hover:bg-red-600"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewProjectForm({
  onAdd,
  clients,
  staffs,
}: {
  onAdd: (project: Omit<Project, "id" | "code">) => void;
  
  clients: any[];
  staffs: any[];
}) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [manager, setManager] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("未着手");
  const [type, setType] = useState("F");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [staff, setStaff] = useState("");

    const [errors, setErrors] = useState({
    name: "",
    client: "",
    manager: "",
    amount: "",
  });

  const handleSubmit = () => {
    if (!name || !client || !manager || !amount) {
      alert("未入力の項目があります。");
      return;
    }

    if (!type) {
      alert("種別を選択してください");
      return;
    }

    onAdd({
      type,
      name,
      client,
      manager,
      amount: Number(amount),
      status,
      startDate,
      endDate,
      clients,
      staffs,
    });

    setName("");
    setClient("");
    setStaff("");
    setManager("");
    setAmount("");
    setStatus("未着手");
  };

  return (
    <div className="max-w-2xl space-y-5 rounded-lg border border-gray-300 p-6">
      <div>
        <label className="mb-1 block text-sm font-semibold">
          種別
        </label>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="F">消防（F）</option>
          <option value="FE">防火設備（FE）</option>
          <option value="E">電気（E）</option>
          <option value="MM">保守（MM）</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-800">
          案件名
        </label>
        <input
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
          placeholder="例：青葉ビル 自火報更新工事"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-800">
          発注者
        </label>
        <select
          value={client}
          onChange={(e) => {
            setClient(e.target.value);

            setErrors((prev) => ({
              ...prev,
              client: "",
            }));
          }}
          className={`w-full rounded-lg border px-4 py-2 ${
            errors.client
              ? "border-red-500"
              : "border-gray-300"
          }`}
        >
          <option value="">
            選択してください
          </option>

          {clients.map((clientItem) => (
            <option
              key={clientItem.id}
              value={clientItem.name}
            >
              {clientItem.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-800">
          担当者
        </label>
        <select
          value={manager}
          onChange={(e) => {
            setManager(e.target.value);

            setErrors((prev) => ({
              ...prev,
              manager: "",
            }));
          }}
          className={`w-full rounded-lg border px-4 py-2 ${
            errors.manager
              ? "border-red-500"
              : "border-gray-300"
          }`}
        >
          <option value="">
            選択してください
          </option>

          {staffs.map((staff) => (
            <option
              key={staff.id}
              value={staff.name}
            >
              {staff.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-800">
          受注金額
        </label>
        <input
          type="number"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
          placeholder="例：1800000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-800">
          進捗
        </label>
        <select
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 outline-none focus:border-blue-500"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>未着手</option>
          <option>施工中</option>
          <option>完了</option>
        </select>
      </div>

      <div>
        <label className="text-sm">着工日</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      <div>
        <label className="text-sm">完了日</label>
        <input
        type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700"
      >
        登録する
      </button>
    </div>
  );
}

function EditModal({
  project,
  onClose,
  onSave,
  clients,
  staffs,
}: {
  project: Project;
  onClose: () => void;

  onSave: (project: Project) => void;

  clients: any[];
  staffs: any[];
}) {
  const [amount, setAmount] = useState(
    project.amount.toLocaleString()
  );
  // const [status, setStatus] = useState(project.status);
  const [errors, setErrors] = useState({
    name: "",
    client: "",
    manager: "",
    amount: "",
  });
  const [editData, setEditData] = useState<Project>(project);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    setEditData(project);
  }, [project]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center bg-black/40"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-xl font-bold">案件編集</h2>

        <div className="mt-6 space-y-4">
          <input
            value={editData.name}
            onChange={(e) => {
              setEditData({
                ...editData,
                name: e.target.value,
              });

              setErrors((prev) => ({
                ...prev,
                name: "",
              }));
            }}
            placeholder="案件名"
            className={`w-full rounded-lg border px-4 py-2 ${
              errors.name
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.name}
            </p>
          )}

          <select
            value={editData.client}
            onChange={(e) =>
              setEditData({
                ...editData,
                client: e.target.value,
              })
            }
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">
              選択してください
            </option>

            {clients.map((client) => (
              <option
                key={client.id}
                value={client.name}
              >
                {client.name}
              </option>
            ))}
          </select>

          {errors.client && (
            <p className="mt-1 text-sm text-red-600">
              {errors.client}
            </p>
          )}

          <select
            value={editData.manager}
            onChange={(e) =>
              setEditData({
                ...editData,
                manager: e.target.value,
              })
            }
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">
              選択してください
            </option>

            {staffs.map((staff) => (
              <option
                key={staff.id}
                value={staff.name}
              >
                {staff.name}
              </option>
            ))}
          </select>

          {errors.manager && (
            <p className="mt-1 text-sm text-red-600">
              {errors.manager}
            </p>
          )}

          <input
            type="text"
            value={amount}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");

              if (!/^\d*$/.test(raw)) return;

              setAmount(raw);

              setErrors((prev) => ({
                ...prev,
                amount: "",
              }));
            }}
            onFocus={() => {
              setAmount(amount.replace(/,/g, ""));
            }}
            onBlur={() => {
              if (!amount) return;

              setAmount(
                Number(amount.replace(/,/g, "")).toLocaleString()
              );
            }}
            className={`w-full rounded-lg border px-4 py-2 text-right ${
              errors.amount
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">
              {errors.amount}
            </p>
          )}

          <select
            value={editData.status}
            onChange={(e) =>
              setEditData({
                ...editData,
                status: e.target.value,
              })
            }
            className="w-full rounded-lg border px-4 py-2"
          >
            <option>未着手</option>
            <option>施工中</option>
            <option>完了</option>
          </select>

          <div>
            <label className="text-sm">着工日</label>
            <input
              type="date"
              value={editData.startDate?.slice(0, 10) || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  startDate: e.target.value,
                })
              }
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="text-sm">完了日</label>
            <input
              type="date"
              value={editData.endDate?.slice(0, 10) || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  endDate: e.target.value,
                })
              }
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
          >
            閉じる
          </button>

          <button
            onClick={() => {
              const newErrors = {
                name: "",
                client: "",
                manager: "",
                amount: "",
              };

              if (!editData.name.trim()) {
                newErrors.name =
                  "案件名を入力してください";
              }

              if (!editData.client.trim()) {
                newErrors.client =
                  "発注者を入力してください";
              }

              if (!editData.manager.trim()) {
                newErrors.manager =
                  "担当者を入力してください";
              }

              if (
                Number(amount.replace(/,/g, "")) <= 0
              ) {
                newErrors.amount =
                  "受注金額は1以上で入力してください";
              }

              setErrors(newErrors);

              const hasError =
                newErrors.name ||
                newErrors.client ||
                newErrors.manager ||
                newErrors.amount;

              if (hasError) return;

              onSave({
                ...editData,
                amount: Number(
                  amount.replace(/,/g, "")
                ),
              });
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {

  const [clients, setClients] = useState<any[]>([]);
  const [clientName, setClientName] = useState("");
  const [staffs, setStaffs] = useState<any[]>([]);
  const [staffName, setStaffName] = useState("");

  const fetchClients = async () => {
    const response = await fetch("/api/clients");
    const data = await response.json();

    setClients(data);
  };

  const fetchStaffs = async () => {
    const response = await fetch("/api/staffs");
    const data = await response.json();

    setStaffs(data);
  };

  const addClient = async () => {
    if (!clientName) return;

    await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: clientName,
      }),
    });

    setClientName("");
    fetchClients();
  };

  const addStaff = async () => {
    if (!staffName) return;

    await fetch("/api/staffs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: staffName,
      }),
    });

    setStaffName("");
    fetchStaffs();
  };

  const deleteClient = async (id: number) => {
    const ok = confirm("削除しますか？");

    if (!ok) return;

    await fetch(`/api/clients/${id}`, {
      method: "DELETE",
    });

    fetchClients();
  };

  const deletestaff = async (id: number) => {
    const ok = confirm("削除しますか？");

    if (!ok) return;

    await fetch(`/api/staffs/${id}`, {
      method: "DELETE",
    });

    fetchStaffs();
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchStaffs();
  }, []);

  return (
    <div className="space-y-6">

      <div className="max-w-3xl rounded-lg border border-gray-300 p-6">
        <h3 className="text-lg font-bold">
          発注者管理
        </h3>
        <div className="mt-4 flex gap-2">
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="border px-3 py-2 rounded w-full"
            placeholder="発注者名"
          />

          <button
            onClick={addClient}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            登録
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between rounded border px-3 py-2"
            >
              <span>{client.name}</span>

              <button
                onClick={() => deleteClient(client.id)}
                className="rounded bg-red-500 px-2 py-1 text-xs text-white"
              > 
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl rounded-lg border border-gray-300 p-6">
        <h3 className="text-lg font-bold">
          担当者管理
        </h3>
        <div className="mt-4 flex gap-2">
          <input
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            className="border px-3 py-2 rounded w-full"
            placeholder="担当者名"
          />

          <button
            onClick={addStaff}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            登録
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {staffs.map((staff) => (
            <div
              key={staff.id}
              className="flex items-center justify-between rounded border px-3 py-2"
            >
              <span>{staff.name}</span>

              <button
                onClick={() => deletestaff(staff.id)}
                className="rounded bg-red-500 px-2 py-1 text-xs text-white"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}