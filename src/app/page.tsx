"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Project, FormErrors,} from "@/types/project";
import ProjectsTable from "@/components/ProjectsTable";
import NewProjectForm from "@/components/NewProjectForm";
import EditModal from "@/components/EditModal";
import SettingsPage from "@/components/settings/SettingsPage";

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
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<"code" | "amount">("code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [amountInput, setAmountInput] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);

  const [detailClientKeyword, setDetailClientKeyword] = useState("");
  const [showDetailClientList, setShowDetailClientList] = useState(false);

  const [detailManagerKeyword, setDetailManagerKeyword] = useState("");
  const [showDetailManagerList, setShowDetailManagerList] = useState(false);

  const detailClientSearchRef = useRef<HTMLDivElement>(null);
  const detailManagerSearchRef = useRef<HTMLDivElement>(null);




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

    const typeRes = await fetch("/api/project-types");
    const typeData = await typeRes.json();

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

  // selectedProject が変わった時に初期値
  useEffect(() => {
    if (selectedProject) {
      setEditData(selectedProject);
      setIsEditing(false);

      setDetailClientKeyword(selectedProject.client);
      setDetailManagerKeyword(selectedProject.manager);

      setAmountInput(
        selectedProject.amount
          ? selectedProject.amount.toLocaleString("ja-JP")
          : ""
      );

      setBudgetInput(
        selectedProject.budget
          ? selectedProject.budget.toLocaleString("ja-JP")
          : ""
      );
    }
  }, [selectedProject]);

  // 外側クリック処理
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        detailClientSearchRef.current &&
        !detailClientSearchRef.current.contains(target)
      ) {
        setShowDetailClientList(false);
      }

      if (
        detailManagerSearchRef.current &&
        !detailManagerSearchRef.current.contains(target)
      ) {
        setShowDetailManagerList(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDetailClientList(false);
        setShowDetailManagerList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const addProject = async (
    newProject: Omit<Project, "id">
  ): Promise<boolean> => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newProject),
    });

    if (!response.ok) {
      const errorData = await response.json();

      alert(errorData.error || "案件の登録に失敗しました。");

      return false;
    }

    await fetchProjects();
    setSelectedMenu(menuItems[0]);

    return true;
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

    if (!editData?.type) {
      newErrors.type = "種別を選択してください";
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

    const newErrors: FormErrors = {};

    const numericAmount = Number(
      amountInput.replace(/,/g, "")
    );

    const numericBudget = budgetInput
      ? Number(budgetInput.replace(/,/g, ""))
      : undefined;

    if (!editData.code.trim()) {
      newErrors.code = "案件番号を入力してください";
    }

    if (!/^[A-Za-z0-9-]+$/.test(editData.code)) {
      newErrors.code =
        "案件番号は半角英数字とハイフンのみ使用できます";
    }

    if (!editData.type) {
      newErrors.type = "種別を選択してください";
    }

    if (!editData.name.trim()) {
      newErrors.name = "案件名は必須です";
    }

    if (!editData.client.trim()) {
      newErrors.client = "発注者は必須です";
    }

    if (!editData.manager.trim()) {
      newErrors.manager = "担当者は必須です";
    }

    if (!numericAmount || numericAmount <= 0) {
      newErrors.amount = "金額は正しく入力してください";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSaving(true);

      const response = await fetch(`/api/projects/${editData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editData,
          amount: numericAmount,
          budget: numericBudget,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "更新に失敗しました");
        return;
      }

      await fetchProjects();

      setSelectedProject(null);
      setIsEditing(false);
      setToast("更新しました！");
    } finally {
      setIsSaving(false);
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
  const filteredDetailClients = clients.filter((client) =>
    client.name
      .toLowerCase()
      .includes(detailClientKeyword.toLowerCase())
  );
  // 絞り込み配列
  const filteredDetailStaffs = staffs.filter((staff) =>
    staff.name
      .toLowerCase()
      .includes(detailManagerKeyword.toLowerCase())
  );

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
        <div
          className="fixed inset-0  z-[110] flex items-center justify-center bg-black/40"
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="relative z-[110] w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                案件詳細
              </h2>
            </div>

            {/* 表示モード */}
            {!isEditing && (
              <div className="px-6 py-3 mt-4 space-y-2 text-sm">
                <p><b>案件番号：</b>{selectedProject.code}</p>
                <p><b>受注日：</b>
                  {selectedProject.orderDate
                    ? new Date(selectedProject.orderDate).toLocaleDateString()
                    : "-"}
                </p>
                <p><b>種別：</b>{selectedProject.type}</p>
                <p><b>案件名：</b>{selectedProject.name}</p>
                <p><b>発注者：</b>{selectedProject.client}</p>
                <p><b>担当者：</b>{selectedProject.manager}</p>
                <p><b>受注金額：</b>¥{selectedProject.amount.toLocaleString()}</p>
                <p><b>実行予算：</b>
                  {selectedProject.budget
                    ? `¥${selectedProject.budget.toLocaleString()}`
                    : "-"}
                </p>
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
              <div className="space-y-2 max-h-[60vh] overflow-y-auto px-6 py-4">

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    案件番号
                  </label>

                  <input
                    value={editData.code}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (/^[A-Za-z0-9-]*$/.test(value)) {
                        setEditData({ ...editData, code: value });
                        setErrors((prev) => ({ ...prev, code: "" }));
                      }
                    }}
                    className={`w-full rounded-lg border px-4 py-2 ${
                      errors.code ? "border-red-500" : "border-gray-300"
                    }`}
                  />

                  {errors.code && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    受注日
                  </label>

                  <input
                    type="date"
                    value={editData.orderDate?.slice(0, 10) || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        orderDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    種別
                  </label>

                  <select
                    value={editData.type}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        type: e.target.value,
                      })
                    }
                    className={`w-full rounded-lg border px-4 py-2 text-gray-900 ${
                      errors.type ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">選択してください</option>

                    {projectTypes.map((type) => (
                      <option key={type.id} value={type.code}>
                        {type.name}（{type.code}）
                      </option>
                    ))}
                  </select>

                  {errors.type && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.type}
                  </p>
                )}
                </div>                

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    案件名
                  </label>

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
                </div>  

                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name}
                  </p>
                )}

                <div ref={detailClientSearchRef} className="relative">
                  <label className="mb-1 block text-sm font-semibold">
                    発注者
                  </label>

                  <input
                    value={detailClientKeyword}
                    onChange={(e) => {
                      setDetailClientKeyword(e.target.value);
                      setShowDetailClientList(true);

                      setEditData({
                        ...editData,
                        client: "",
                      });

                      setErrors((prev) => ({
                        ...prev,
                        client: "",
                      }));
                    }}
                    onFocus={() => setShowDetailClientList(true)}
                    placeholder="発注者を検索"
                    className={`w-full rounded-lg border px-4 py-2 ${
                      errors.client ? "border-red-500" : "border-gray-300"
                    }`}
                  />

                  {showDetailClientList && (
                    <div className="absolute z-30 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                      {filteredDetailClients.length > 0 ? (
                        filteredDetailClients.map((client) => (
                          <button
                            type="button"
                            key={client.id}
                            onClick={() => {
                              setEditData({
                                ...editData,
                                client: client.name,
                              });
                              setDetailClientKeyword(client.name);
                              setShowDetailClientList(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-blue-100"
                          >
                            {client.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          該当する発注者がありません
                        </div>
                      )}
                    </div>
                  )}

                  {errors.client && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.client}
                    </p>
                  )}
                </div>

                <div ref={detailManagerSearchRef} className="relative">
                  <label className="mb-1 block text-sm font-semibold">
                    担当者
                  </label>

                  <input
                    value={detailManagerKeyword}
                    onChange={(e) => {
                      setDetailManagerKeyword(e.target.value);
                      setShowDetailManagerList(true);

                      setEditData({
                        ...editData,
                        manager: "",
                      });

                      setErrors((prev) => ({
                        ...prev,
                        manager: "",
                      }));
                    }}
                    onFocus={() => setShowDetailManagerList(true)}
                    placeholder="担当者を検索"
                    className={`w-full rounded-lg border px-4 py-2 ${
                      errors.manager ? "border-red-500" : "border-gray-300"
                    }`}
                  />

                  {showDetailManagerList && (
                    <div className="absolute z-30 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                      {filteredDetailStaffs.length > 0 ? (
                        filteredDetailStaffs.map((staff) => (
                          <button
                            type="button"
                            key={staff.id}
                            onClick={() => {
                              setEditData({
                                ...editData,
                                manager: staff.name,
                              });
                              setDetailManagerKeyword(staff.name);
                              setShowDetailManagerList(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-blue-100"
                          >
                            {staff.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          該当する担当者がありません
                        </div>
                      )}
                    </div>
                  )}

                  {errors.manager && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.manager}
                    </p>
                  )}
                </div>

                {/* <div>
                  <label className="mb-1 block text-sm font-semibold">
                    受注金額
                  </label>

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
                    className={`w-full border px-3 py-2 text-right rounded ${
                      errors.amount ? "border-red-500" : ""
                    }`}
                  />
                </div> */}

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    受注金額
                  </label>

                  <input
                    value={amountInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, "");
                      setAmountInput(value);
                    }}
                    onFocus={() => {
                      setAmountInput(amountInput.replace(/,/g, ""));
                    }}
                    onBlur={() => {
                      if (!amountInput) return;
                      setAmountInput(
                        Number(amountInput.replace(/,/g, "")).toLocaleString("ja-JP")
                      );
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-right"
                  />
                </div>

                {errors.amount && (
                  <p className="text-red-500 text-xs">{errors.amount}</p>
                )}

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    実行予算
                  </label>

                  <input
                    value={budgetInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, "");
                      setBudgetInput(value);
                    }}
                    onFocus={() => {
                      setBudgetInput(budgetInput.replace(/,/g, ""));
                    }}
                    onBlur={() => {
                      if (!budgetInput) return;
                      setBudgetInput(
                        Number(budgetInput.replace(/,/g, "")).toLocaleString("ja-JP")
                      );
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-right"
                  />
                </div>

                <div>
                  <label>進捗</label>
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
                </div>

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
            <div className="flex justify-between border-t border-gray-200 px-6 py-4">
              {!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);

                    setAmountInput(
                      selectedProject.amount
                        ? selectedProject.amount.toLocaleString("ja-JP")
                        : ""
                    );

                    setBudgetInput(
                      selectedProject.budget
                        ? selectedProject.budget.toLocaleString("ja-JP")
                        : ""
                    );
                  }}
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










