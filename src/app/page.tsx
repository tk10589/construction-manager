"use client";

import { projectCompilationEventsSubscribe } from "next/dist/build/swc/generated-native";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

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
  type: string;

  name: string;
  client: string;
  manager: string;

  amount: number;
  budget?: number;

  status: string;

  // clients: any[];
  // staffs: any[];
  
  orderDate?: string;

  startDate?: string;
  endDate?: string;
};

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

  type FormErrors = {
    code?: string;
    type?: string;
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
    <div className="max-h-[600px] overflow-auto rounded-lg border border-gray-300">
      <table className="min-w-[1700px] table-fixed border-collapse bg-white text-sm">
        <thead className="sticky top-0 z-40 bg-gray-100 text-left text-gray-900">
          <tr>
            <th
              className="sticky top-0 left-0 z-50 w-[130px] min-w-[130px] bg-gray-100  px-4 py-3 font-bold text-left cursor-pointer hover:bg-gray-200"
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
            <th className="sticky top-0 left-[120px] z-50 w-[100px] min-w-[100px] bg-gray-100 px-4 py-3 font-bold">
              種別
              </th>
            <th className="sticky top-0 left-[220px] z-50 w-[260px] min-w-[260px] bg-gray-100 px-4 py-3 font-bold truncate">
              案件名
              </th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">受注日</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">発注者</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">担当者</th>
            <th
              className="sticky top-0 z-40 px-4 py-3 font-bold text-center cursor-pointer hover:bg-gray-200"
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
            <th className="sticky top-0 z-40 px-4 py-3 font-bold text-center">実行予算</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold text-center">原価率</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold text-center">粗利</th>            
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">着工日</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">完了日</th>
            <th className="sticky top-0 z-40 w-[100px] min-w-[100px] px-4 py-3 font-bold whitespace-nowrap">進捗</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">操作</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-t border-gray-200">
              <td className="sticky left-0 z-30 w-[120px] min-w-[120px] bg-white px-4 py-3 font-semibold text-gray-900">
                {project.code}
              </td>
              <td className="sticky left-[120px] z-30 w-[100px] min-w-[100px] bg-white px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(
                    project.type
                  )}`}
                >
                  {project.type}
                </span>
              </td>
              <td
                className="sticky left-[220px] z-30 w-[260px] min-w-[260px] bg-white px-4 py-3 font-semibold text-blue-600 cursor-pointer hover:underline"
                onClick={() => setSelectedProject(project)}
              >
                {project.name}
              </td>
              <td className="px-4 py-3 text-sm">
                {project.orderDate
                  ? new Date(project.orderDate).toLocaleDateString()
                  : "-"}
              </td>
              <td className="px-4 py-3 text-gray-800">{project.client}</td>
              <td className="px-4 py-3 text-gray-800">{project.manager}</td>
              <td className="px-4 py-3 font-semibold text-gray-900 text-center">
                ¥{project.amount.toLocaleString() || 0}
              </td>
              <td className="px-4 py-3 text-center">
                {project.budget
                  ? `¥${project.budget.toLocaleString()}`
                  : "-"}
              </td>

              {/* 原価率 */}
              <td className="px-4 py-3 text-center text-sm text-gray-700">
                {project.budget && project.amount > 0
                  ? `${((project.budget / project.amount) * 100).toFixed(1)}%`
                  : "-"}
              </td>

              {/* 粗利計算 */}
              <td className="px-4 py-3 text-center font-semibold text-gray-900">
                {project.budget
                  ? `¥${(project.amount - project.budget).toLocaleString()}`
                  : "-"}
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
              <td className="w-[100px] min-w-[100px] px-4 py-3 whitespace-nowrap">
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
  projectTypes,
}: {
  onAdd: (project: Omit<Project, "id">) => Promise<boolean>;
  clients: any[];
  staffs: any[];
  projectTypes: any[];
}) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [manager, setManager] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("未着手");
  const [type, setType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [staff, setStaff] = useState("");
  const [code, setCode] = useState("");
  const [budget, setBudget] = useState("");
  const [orderDate, setOrderDate] = useState("");

  const [clientKeyword, setClientKeyword] = useState("");
  const [showClientList, setShowClientList] = useState(false);

  const [managerKeyword, setManagerKeyword] = useState("");
  const [showManagerList, setShowManagerList] = useState(false);

  const clientSearchRef = useRef<HTMLDivElement>(null);
  const managerSearchRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState({
    name: "",
    client: "",
    manager: "",
    amount: "",
  });

  // 外側クリック・Escで閉じる処理
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        clientSearchRef.current &&
        !clientSearchRef.current.contains(target)
      ) {
        setShowClientList(false);
      }

      if (
        managerSearchRef.current &&
        !managerSearchRef.current.contains(target)
      ) {
        setShowManagerList(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowClientList(false);
        setShowManagerList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredClients = clients.filter((clientItem) =>
    clientItem.name
      .toLowerCase()
      .includes(clientKeyword.toLowerCase())
  );

  const filteredStaffs = staffs.filter((staff) =>
    staff.name
      .toLowerCase()
      .includes(managerKeyword.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!code || !type || !name || !client || !manager || !amount) {
      alert("未入力の項目があります。");
      return;
    }
    
    if (!code.trim()) {
      alert("案件番号を入力してください");
      return;
    }

    if (!type) {
      alert("種別を選択してください");
      return;
    }

    const success = await onAdd({
      code,
      type,
      name,
      client,
      manager,

      amount: Number(amount),
      budget: budget ? Number(budget) : undefined,

      status,

      orderDate: orderDate || undefined,

      startDate,
      endDate,

      // clients,
      // staffs,
    });
    // リセット（成功後）
    if (!success) {
      return;
    }

    setName("");
    setClient("");
    setStaff("");
    setManager("");
    setAmount("");
    setBudget("");
    setOrderDate("");
    setStatus("未着手");

    setClientKeyword("");
    setManagerKeyword("");
    setShowClientList(false);
    setShowManagerList(false);
  };

  return (
    <div className="max-w-2xl overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
      <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
        <div>
          <label className="mb-1 block text-sm font-semibold">
            種別
          </label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
          >
            <option value="">選択してください</option>

            {projectTypes.map((type) => (
              <option key={type.id} value={type.code}>
                {type.name}（{type.code}）
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-800">
            案件番号
          </label>

          <input
            value={code}
            onChange={(e) => {
              const value = e.target.value;

              // 半角英数字とハイフンのみ
              if (/^[A-Za-z0-9-]*$/.test(value)) {
                setCode(value);
              }
            }}
            placeholder="例: M-2026-001"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
          />
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
          <label className="text-sm">受注日</label>

          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div ref={clientSearchRef} className="relative">
          <label className="mb-1 block text-sm font-semibold text-gray-800">
            発注者
          </label>

          <input
            value={clientKeyword}
            onChange={(e) => {
              setClientKeyword(e.target.value);
              setShowClientList(true);
              setClient("");

              setErrors((prev) => ({
                ...prev,
                client: "",
              }));
            }}
            onFocus={() => setShowClientList(true)}
            placeholder="発注者を検索"
            className={`w-full rounded-lg border px-4 py-2 text-gray-900 ${
              errors.client
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />

          {showClientList && (
            <div className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
              {filteredClients.length > 0 ? (
                filteredClients.map((clientItem) => (
                  <button
                    type="button"
                    key={clientItem.id}
                    onClick={() => {
                      setClient(clientItem.name);
                      setClientKeyword(clientItem.name);
                      setShowClientList(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-blue-100"
                  >
                    {clientItem.name}
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

        <div ref={managerSearchRef} className="relative">
          <label className="mb-1 block text-sm font-semibold text-gray-800">
            担当者
          </label>

          <input
            value={managerKeyword}
            onChange={(e) => {
              setManagerKeyword(e.target.value);
              setShowManagerList(true);
              setManager("");

              setErrors((prev) => ({
                ...prev,
                manager: "",
              }));
            }}
            onFocus={() => setShowManagerList(true)}
            placeholder="担当者を検索"
            className={`w-full rounded-lg border px-4 py-2 text-gray-900 ${
              errors.manager
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />

          {showManagerList && (
            <div className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
              {filteredStaffs.length > 0 ? (
                filteredStaffs.map((staff) => (
                  <button
                    type="button"
                    key={staff.id}
                    onClick={() => {
                      setManager(staff.name);
                      setManagerKeyword(staff.name);
                      setShowManagerList(false);
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
          <label className="text-sm">実行予算</label>

          <input
            value={budget}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d]/g, "");
              setBudget(value);
            }}
            className="w-full rounded border px-3 py-2"
            placeholder="例: 1000000"
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
      </div>  
      
      <div className="border-t border-gray-200 px-6 py-4 text-right">
        <button
          onClick={handleSubmit}
          className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700"
        >
          登録する
        </button>
      </div>
    </div>
  );
}

function EditModal({
  project,
  onClose,
  onSave,
  clients,
  staffs,
  projectTypes,
}: {
  project: Project;
  onClose: () => void;
  onSave: (project: Project) => void;
  clients: any[];
  staffs: any[];
  projectTypes: any[];
}) {
  const [editData, setEditData] = useState<Project>(project);

  const [amount, setAmount] = useState(
    project.amount.toLocaleString("ja-JP")
  );

  const [budget, setBudget] = useState(
    project.budget
      ? project.budget.toLocaleString("ja-JP")
      : ""
  );

  const [clientKeyword, setClientKeyword] = useState(project.client);
  const [showClientList, setShowClientList] = useState(false);

  const [managerKeyword, setManagerKeyword] = useState(project.manager);
  const [showManagerList, setShowManagerList] = useState(false);

  const clientSearchRef = useRef<HTMLDivElement>(null);
  const managerSearchRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<{
    code?: string;
    name?: string;
    client?: string;
    manager?: string;
    amount?: string;
  }>({});

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

  // project変更時の同期
  useEffect(() => {
    setEditData(project);

    setAmount(project.amount.toLocaleString("ja-JP"));

    setBudget(
      project.budget
        ? project.budget.toLocaleString("ja-JP")
        : ""
    );

    setClientKeyword(project.client);
    setManagerKeyword(project.manager);
  }, [project]);

  // 外側クリック処理
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        clientSearchRef.current &&
        !clientSearchRef.current.contains(target)
      ) {
        setShowClientList(false);
      }

      if (
        managerSearchRef.current &&
        !managerSearchRef.current.contains(target)
      ) {
        setShowManagerList(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowClientList(false);
        setShowManagerList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 絞り込み配列
  const filteredClients = clients.filter((client) =>
    client.name
      .toLowerCase()
      .includes(clientKeyword.toLowerCase())
  );
  
  // 絞り込み配列
  const filteredStaffs = staffs.filter((staff) =>
    staff.name
      .toLowerCase()
      .includes(managerKeyword.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="px-6 py-4 relative z-[110] w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl bg-white shadow-lg"
      >
        <h2 className="text-xl font-bold">案件編集</h2>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto px-6 py-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">
              案件番号
            </label>

            <input
              value={editData.code}
              onChange={(e) => {
                const value = e.target.value;

                if (/^[A-Za-z0-9-]*$/.test(value)) {
                  setEditData({
                    ...editData,
                    code: value,
                  });

                  setErrors((prev) => ({
                    ...prev,
                    code: "",
                  }));
                }
              }}
              className={`w-full rounded-lg border px-4 py-2 ${
                errors.code ? "border-red-500" : "border-gray-300"
              }`}
            />

            {errors.code && (
              <p className="mt-1 text-sm text-red-600">
                {errors.code}
              </p>
            )}
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
              className="w-full rounded-lg border px-4 py-2"
            >
              <option value="">選択してください</option>

              {projectTypes.map((type) => (
                <option key={type.id} value={type.code}>
                  {type.name}（{type.code}）
                </option>
              ))}
            </select>
          </div>          

          <div>
            <label className="mb-1 block text-sm font-semibold">
              案件名
            </label>  
          
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

          <div ref={clientSearchRef} className="relative">
            <label className="mb-1 block text-sm font-semibold">
              発注者
            </label>

            <input
              value={clientKeyword}
              onChange={(e) => {
                setClientKeyword(e.target.value);
                setShowClientList(true);

                setEditData({
                  ...editData,
                  client: "",
                });

                setErrors((prev) => ({
                  ...prev,
                  client: "",
                }));
              }}
              onFocus={() => setShowClientList(true)}
              placeholder="発注者を検索"
              className={`w-full rounded-lg border px-4 py-2 ${
                errors.client ? "border-red-500" : "border-gray-300"
              }`}
            />

            {showClientList && (
              <div className="absolute z-30 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <button
                      type="button"
                      key={client.id}
                      onClick={() => {
                        setEditData({
                          ...editData,
                          client: client.name,
                        });

                        setClientKeyword(client.name);
                        setShowClientList(false);
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
              <p className="mt-1 text-sm text-red-600">
                {errors.client}
              </p>
            )}
          </div>

          <div ref={managerSearchRef} className="relative">
            <label className="mb-1 block text-sm font-semibold">
              担当者
            </label>

            <input
              value={managerKeyword}
              onChange={(e) => {
                setManagerKeyword(e.target.value);
                setShowManagerList(true);

                setEditData({
                  ...editData,
                  manager: "",
                });

                setErrors((prev) => ({
                  ...prev,
                  manager: "",
                }));
              }}
              onFocus={() => setShowManagerList(true)}
              placeholder="担当者を検索"
              className={`w-full rounded-lg border px-4 py-2 ${
                errors.manager ? "border-red-500" : "border-gray-300"
              }`}
            />

            {showManagerList && (
              <div className="absolute z-30 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                {filteredStaffs.length > 0 ? (
                  filteredStaffs.map((staff) => (
                    <button
                      type="button"
                      key={staff.id}
                      onClick={() => {
                        setEditData({
                          ...editData,
                          manager: staff.name,
                        });

                        setManagerKeyword(staff.name);
                        setShowManagerList(false);
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
              <p className="mt-1 text-sm text-red-600">
                {errors.manager}
              </p>
            )}
          </div>

          <div className="relative">
            <label className="mb-1 block text-sm font-semibold">
              受注金額
            </label>

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
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              実行予算
            </label>

            <input
              value={budget}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");

                if (!/^\d*$/.test(raw)) return;

                setBudget(raw);
              }}
              onFocus={() => {
                setBudget(budget.replace(/,/g, ""));
              }}
              onBlur={() => {
                if (!budget) return;

                setBudget(
                  Number(budget.replace(/,/g, "")).toLocaleString("ja-JP")
                );
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-right"
            />
          </div>

          <div>
            <label  className="mb-1 block text-sm font-semibold">
              着工日
            </label>

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
          </div>

          <div>
            <label  className="mb-1 block text-sm font-semibold">
              着工日
            </label>

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
            <label  className="mb-1 block text-sm font-semibold">
              完了日
            </label>
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
            className="rounded-lg border px-4 py-2 font-bold"
          >
            閉じる
          </button>

          <button
            onClick={() => {
              const newErrors: {
                code?: string;
                name?: string;
                client?: string;
                manager?: string;
                amount?: string;
              } = {};

              const numericAmount = Number(
                amount.replace(/,/g, "")
              );

              const numericBudget = budget
                ? Number(budget.replace(/,/g, ""))
                : undefined;

              if (!editData.code.trim()) {
                newErrors.code = "案件番号を入力してください";
              }

              if (!/^[A-Za-z0-9-]+$/.test(editData.code)) {
                newErrors.code =
                  "案件番号は半角英数字とハイフンのみ使用できます";
              }

              if (!editData.name.trim()) {
                newErrors.name = "案件名を入力してください";
              }

              if (!editData.client.trim()) {
                newErrors.client = "発注者を選択してください";
              }

              if (!editData.manager.trim()) {
                newErrors.manager = "担当者を選択してください";
              }

              if (!numericAmount || numericAmount <= 0) {
                newErrors.amount =
                  "受注金額は1以上で入力してください";
              }

              setErrors(newErrors);

              if (Object.keys(newErrors).length > 0) return;

              onSave({
                ...editData,
                amount: numericAmount,
                budget: numericBudget,
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

function SettingsPage({
    onMasterUpdated,
  }: {
    onMasterUpdated: () => void;
  }) {

  const [clients, setClients] = useState<any[]>([]);
  const [clientName, setClientName] = useState("");
  const [staffs, setStaffs] = useState<any[]>([]);
  const [staffName, setStaffName] = useState("");
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [editingClientName, setEditingClientName] = useState("");
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editingStaffName, setEditingStaffName] = useState("");

  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [typeCode, setTypeCode] = useState("");
  const [typeName, setTypeName] = useState("");

  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editingTypeCode, setEditingTypeCode] = useState("");
  const [editingTypeName, setEditingTypeName] = useState("");

  const [masterModal, setMasterModal] = useState<{
    target: "type" | "client" | "staff";
    action: "add" | "edit" | "delete" | "list";
  } | null>(null);

  // 種別追加関数
  const addProjectType = async () => {
    if (!typeCode.trim() || !typeName.trim()) {
      alert("種別コードと種別名を入力してください");
      return;
    }

    await fetch("/api/project-types", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: typeCode,
        name: typeName,
      }),
    });

    setTypeCode("");
    setTypeName("");

    await fetchProjectTypes();
    onMasterUpdated();
  };

  // 種別取得関数
  const fetchProjectTypes = async () => {
    const res = await fetch("/api/project-types");
    const data = await res.json();

    setProjectTypes(data);
  };

  // 種別編集関数
  const updateProjectType = async (id: number) => {
    if (!editingTypeCode.trim() || !editingTypeName.trim()) {
      alert("種別コードと種別名を入力してください");
      return;
    }

    await fetch(`/api/project-types/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: editingTypeCode,
        name: editingTypeName,
      }),
    });

    setEditingTypeId(null);
    setEditingTypeCode("");
    setEditingTypeName("");

    await fetchProjectTypes();
    onMasterUpdated();
  };

  // 種別削除関数
  const deleteProjectType = async (id: number) => {
    const ok = confirm("この種別を削除しますか？");

    if (!ok) return;

    const response = await fetch(
      `/api/project-types/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();

      alert(
        errorData.error ||
          "種別の削除に失敗しました"
      );

      return;
    }

    await fetchProjectTypes();
    onMasterUpdated();
  };

  // 発注者取得関数
  const fetchClients = async () => {
    const response = await fetch("/api/clients");
    const data = await response.json();

    setClients(data);
  };

  // 担当者取得関数
  const fetchStaffs = async () => {
    const response = await fetch("/api/staffs");
    const data = await response.json();

    setStaffs(data);
  };

  // 発注者追加関数
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
    await fetchClients();
    onMasterUpdated();
  };

  // 担当者追加関数
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
    await fetchStaffs();
    onMasterUpdated();
  };

  // 発注者削除関数
  const deleteClient = async (id: number) => {
    const ok = confirm("この発注者を削除しますか？");

    if (!ok) return;

    const response = await fetch(`/api/clients/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();

      alert(
        errorData.error ||
          "発注者の削除に失敗しました"
      );

      return;
    }

    await fetchClients();
    onMasterUpdated();
  };

  // 担当者削除関数
  const deleteStaff = async (id: number) => {
    const ok = confirm("この担当者を削除しますか？");

    if (!ok) return;

    const response = await fetch(`/api/staffs/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();

      alert(
        errorData.error ||
          "担当者の削除に失敗しました"
      );

      return;
    }

    await fetchStaffs();
    onMasterUpdated();
  };

  // 発注者編集関数
  const updateClient = async (id: number) => {
    if (!editingClientName.trim()) return;

    await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: editingClientName,
      }),
    });

    setEditingClientId(null);
    setEditingClientName("");
    await fetchClients();
    onMasterUpdated();
  };

  // 担当者編集関数
  const updateStaff = async (id: number) => {
    if (!editingStaffName.trim()) return;

    await fetch(`/api/staffs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: editingStaffName,
      }),
    });

    setEditingStaffId(null);
    setEditingStaffName("");
    await fetchStaffs();
    onMasterUpdated();
  };

  useEffect(() => {
    fetchClients();
    fetchStaffs();
    fetchProjectTypes();
  }, []);

  return (
    
    <div className="space-y-6">
      <div className="space-y-3">
        <MasterRow
          title="種別管理"
          onAdd={() =>
            setMasterModal({
              target: "type",
              action: "add",
            })
          }
          onEdit={() =>
            setMasterModal({
              target: "type",
              action: "edit",
            })
          }
          onDelete={() =>
            setMasterModal({
              target: "type",
              action: "delete",
            })
          }
          onList={() =>
            setMasterModal({
              target: "type",
              action: "list",
            })
          }
        />

        <MasterRow
          title="発注者管理"
          onAdd={() =>
            setMasterModal({
              target: "client",
              action: "add",
            })
          }
          onEdit={() =>
            setMasterModal({
              target: "client",
              action: "edit",
            })
          }
          onDelete={() =>
            setMasterModal({
              target: "client",
              action: "delete",
            })
          }
          onList={() =>
            setMasterModal({
              target: "client",
              action: "list",
            })
          }
        />

        <MasterRow
          title="担当者管理"
          onAdd={() =>
            setMasterModal({
              target: "staff",
              action: "add",
            })
          }
          onEdit={() =>
            setMasterModal({
              target: "staff",
              action: "edit",
            })
          }
          onDelete={() =>
            setMasterModal({
              target: "staff",
              action: "delete",
            })
          }
          onList={() =>
            setMasterModal({
              target: "staff",
              action: "list",
            })
          }
        />
      </div>
    
      {masterModal && (
        <MasterModal
          target={masterModal.target}
          action={masterModal.action}
          clients={clients}
          staffs={staffs}
          projectTypes={projectTypes}
          onClose={() => setMasterModal(null)}
          onMasterUpdated={async () => {
            await fetchClients();
            await fetchStaffs();
            await fetchProjectTypes();
            onMasterUpdated();
          }}
        />
      )}
      
    </div>
  );
}

function MasterRow({
  title,
  onAdd,
  onEdit,
  onDelete,
  onList,
}: {
  title: string;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onList: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-5 py-4 shadow-sm">
      <h3 className="font-bold text-gray-900">
        {title}
      </h3>

      <div className="flex gap-2">
        <button
          onClick={onAdd}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          追加
        </button>

        <button
          onClick={onEdit}
          className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
        >
          編集
        </button>

        <button
          onClick={onDelete}
          className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
        >
          削除
        </button>

        <button
          onClick={onList}
          className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
        >
          一覧
        </button>
      </div>
    </div>
  );
}

function MasterModal({
  target,
  action,
  clients,
  staffs,
  projectTypes,
  onClose,
  onMasterUpdated,
}: {
  target: "type" | "client" | "staff";
  action: "add" | "edit" | "delete" | "list";
  clients: any[];
  staffs: any[];
  projectTypes: any[];
  onClose: () => void;
  onMasterUpdated: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCode, setEditingCode] = useState("");

  const titleMap = {
    type: "種別",
    client: "発注者",
    staff: "担当者",
  };

  const actionMap = {
    add: "追加",
    edit: "編集",
    delete: "削除",
    list: "登録内容一覧",
  };

  const items =
    target === "type"
      ? projectTypes
      : target === "client"
      ? clients
      : staffs;
  
  const baseUrl =
    target === "type"
      ? "/api/project-types"
      : target === "client"
      ? "/api/clients"
      : "/api/staffs";
  
  const handleAdd = async () => {
    setError("");

    if (target === "type") {
      if (!code.trim() || !name.trim()) {
        setError("種別コードと種別名を入力してください");
        return;
      }

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "登録に失敗しました");
        return;
      }
    } else {
      if (!name.trim()) {
        setError("名称を入力してください");
        return;
      }

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "登録に失敗しました");
        return;
      }
    }

    setName("");
    setCode("");

    await onMasterUpdated();
    onClose();
  };

  const handleUpdate = async () => {
    setError("");

    if (!editingItemId) return;

    if (target === "type") {
      if (!editingCode.trim() || !editingName.trim()) {
        setError("種別コードと種別名を入力してください");
        return;
      }

      const response = await fetch(`${baseUrl}/${editingItemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: editingCode,
          name: editingName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "更新に失敗しました");
        return;
      }
    } else {
      if (!editingName.trim()) {
        setError("名称を入力してください");
        return;
      }

      const response = await fetch(`${baseUrl}/${editingItemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "更新に失敗しました");
        return;
      }
    }

    setEditingItemId(null);
    setEditingName("");
    setEditingCode("");

    await onMasterUpdated();
  };

  return (
    <div
      className="fixed inset-0 z-[10] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900">
          {titleMap[target]}管理 - {actionMap[action]}
        </h2>

        <div className="mt-4">
          {action === "list" ? (
            <div className="max-h-80 overflow-y-auto rounded border border-gray-200">
              {items.length > 0 ? (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-gray-100 px-4 py-2 text-sm text-gray-800 last:border-b-0"
                  >
                    {target === "type" ? (
                      <span>
                        <b>{item.code}</b>：{item.name}
                      </span>
                    ) : (
                      <span>{item.name}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-gray-500">
                  登録データがありません。
                </p>
              )}
            </div>
          ) : action === "add" ? (
            <div className="space-y-4">
              {target === "type" && (
                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    種別コード
                  </label>

                  <input
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (/^[A-Za-z0-9-]*$/.test(value)) {
                        setCode(value);
                      }
                    }}
                    placeholder="例: F"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  {target === "type" ? "種別名" : "名称"}
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    target === "type"
                      ? "例: 自火報・防排煙"
                      : "名称を入力"
                  }
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="text-right">
                <button
                  onClick={handleAdd}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  登録
                </button>
              </div>
            </div>
          ) : action === "edit" ? (
            <div className="space-y-3">
              <div className="max-h-80 overflow-y-auto rounded border border-gray-200">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="border-b border-gray-100 px-4 py-3 text-sm last:border-b-0"
                    >
                      {editingItemId === item.id ? (
                        <div className="space-y-2">
                          {target === "type" && (
                            <input
                              value={editingCode}
                              onChange={(e) => {
                                const value = e.target.value;

                                if (/^[A-Za-z0-9-]*$/.test(value)) {
                                  setEditingCode(value);
                                }
                              }}
                              className="w-full rounded border px-3 py-2"
                              placeholder="種別コード"
                            />
                          )}

                          <input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full rounded border px-3 py-2"
                            placeholder={
                              target === "type"
                                ? "種別名"
                                : "名称"
                            }
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              onClick={handleUpdate}
                              className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                            >
                              保存
                            </button>

                            <button
                              onClick={() => {
                                setEditingItemId(null);
                                setEditingName("");
                                setEditingCode("");
                                setError("");
                              }}
                              className="rounded bg-gray-400 px-3 py-1 text-sm text-white hover:bg-gray-500"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900">
                            {target === "type" ? (
                              <>
                                <b>{item.code}</b>：{item.name}
                              </>
                            ) : (
                              item.name
                            )}
                          </span>

                          <button
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditingName(item.name);
                              setEditingCode(item.code || "");
                              setError("");
                            }}
                            className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                          >
                            編集
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    登録データがありません。
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              この操作は次のステップで実装します。
            </p>
          )}
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}