"use client";

import { useEffect, useRef, useState } from "react";
import {
  Project,
  MasterItem,
  ProjectType,
  FormErrors,
} from "@/types/project";
import {
  getTotalAmount,
  getExecutionBudget,
  getGrossProfit,
  getCostRate,
} from "@/lib/projectCalculations";

type ProjectDetailModalProps = {
  selectedProject: Project;
  clients: MasterItem[];
  staffs: MasterItem[];
  projectTypes: ProjectType[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

type ProjectSchedule = {
  id: number;

  projectId: number;

  startDate: string;
  endDate: string;

  title: string;
  status: string;

  memo?: string;
};

export default function ProjectDetailModal({
  selectedProject,
  clients,
  staffs,
  projectTypes,
  onClose,
  onSaved,
}: ProjectDetailModalProps) {

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [amountInput, setAmountInput] = useState("");
  const [budgetInput, setBudgetInput] = useState("");

  const [detailClientKeyword, setDetailClientKeyword] = useState("");
  const [showDetailClientList, setShowDetailClientList] = useState(false);

  const [detailManagerKeyword, setDetailManagerKeyword] = useState("");
  const [showDetailManagerList, setShowDetailManagerList] = useState(false);

  const detailClientSearchRef = useRef<HTMLDivElement>(null);
  const detailManagerSearchRef = useRef<HTMLDivElement>(null);

  const [outsourceCostInput, setOutsourceCostInput] = useState("");
  const [additionalAmountInput, setAdditionalAmountInput] = useState("");
  const [materialCostInput, setMaterialCostInput] = useState("");
  const [laborCostInput, setLaborCostInput] = useState("");
  const [expenseCostInput, setExpenseCostInput] = useState("");

  const [detailSalesStaffKeyword, setDetailSalesStaffKeyword] = useState("");
  const [showDetailSalesStaffList, setShowDetailSalesStaffList] = useState(false);

  const detailSalesStaffSearchRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<
    "basic" | "cost" | "schedule" | "files" | "history"
  >("basic");

  const [schedules, setSchedules] = useState<ProjectSchedule[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] =
    useState(false);

  const [scheduleForm, setScheduleForm] =
    useState({
      startDate: "",
      endDate: "",

      status: "未着手",

      title: "",

      memo: "",
    });

  useEffect(() => {
    
    if (selectedProject) {
      setEditData(selectedProject);
      setIsEditing(false);

      setDetailClientKeyword(selectedProject.client);
      setDetailManagerKeyword(selectedProject.manager);
      setDetailSalesStaffKeyword(selectedProject.salesStaff || "");

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

      setOutsourceCostInput(
        selectedProject.outsourceCost !== undefined &&
          selectedProject.outsourceCost !== null
          ? selectedProject.outsourceCost.toLocaleString("ja-JP")
          : ""
      );

      setAdditionalAmountInput(
        selectedProject.additionalAmount !== undefined &&
          selectedProject.additionalAmount !== null
          ? selectedProject.additionalAmount.toLocaleString("ja-JP")
          : ""
      );

      setMaterialCostInput(
        selectedProject.materialCost !== undefined &&
          selectedProject.materialCost !== null
          ? selectedProject.materialCost.toLocaleString("ja-JP")
          : ""
      );

      setLaborCostInput(
        selectedProject.laborCost !== undefined &&
          selectedProject.laborCost !== null
          ? selectedProject.laborCost.toLocaleString("ja-JP")
          : ""
      );

      setExpenseCostInput(
        selectedProject.expenseCost !== undefined &&
          selectedProject.expenseCost !== null
          ? selectedProject.expenseCost.toLocaleString("ja-JP")
          : ""
      );
    }
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;

    loadSchedules(selectedProject.id);
  }, [selectedProject]);

  // useEffect(() => {
  //   setSchedules([
  //     {
  //       id: 1,
  //       projectId: selectedProject.id,

  //       startDate: "2026-06-01",
  //       endDate: "2026-06-01",

  //       title: "受注日",

  //       status: "完了",

  //       memo: "",
  //     },

  //     {
  //       id: 2,
  //       projectId: selectedProject.id,

  //       startDate: "2026-06-20",
  //       endDate: "2026-06-20",

  //       title: "現場打合せ",

  //       status: "完了",

  //       memo: "客先打合せ",
  //     },

  //     {
  //       id: 3,
  //       projectId: selectedProject.id,

  //       startDate: "2026-06-21",
  //       endDate: "2026-07-15",

  //       title: "事前準備",

  //       status: "進行中",

  //       memo: "機器手配・図面確認",
  //     },
  //   ]);
  // }, [selectedProject]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

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

      if (
        detailSalesStaffSearchRef.current &&
        !detailSalesStaffSearchRef.current.contains(target)
      ) {
        setShowDetailSalesStaffList(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowDetailClientList(false);
        setShowDetailManagerList(false);
        setShowDetailSalesStaffList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  const loadSchedules = async (
    projectId: number
  ) => {
    try {
      const res = await fetch(
        `/api/project-schedules?projectId=${projectId}`
      );

      if (!res.ok) {
        throw new Error(
          "工程取得に失敗しました"
        );
      }

      const data = await res.json();

      setSchedules(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddSchedule = async () => {
    if (!scheduleForm.startDate) {
      alert("開始日を入力してください");
      return;
    }

    if (!scheduleForm.endDate) {
      alert("終了日を入力してください");
      return;
    }

    if (!scheduleForm.title.trim()) {
      alert("内容を入力してください");
      return;
    }

    const res = await fetch("/api/project-schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: selectedProject.id,
        startDate: scheduleForm.startDate,
        endDate: scheduleForm.endDate,
        status: scheduleForm.status,
        title: scheduleForm.title,
        memo: scheduleForm.memo,
      }),
    });

    if (!res.ok) {
      alert("工程登録に失敗しました");
      return;
    }

    setScheduleForm({
      startDate: "",
      endDate: "",
      status: "未着手",
      title: "",
      memo: "",
    });

    setIsScheduleModalOpen(false);

    await loadSchedules(selectedProject.id);
  };

  const toNumber = (value: string) => {
    return value ? Number(value.replace(/,/g, "")) : 0;
  };

  const formatMoney = (value?: number | null) => {
    return value !== undefined && value !== null
      ? `¥${value.toLocaleString("ja-JP")}`
      : "-";
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

    const numericOutsourceCost = outsourceCostInput
      ? Number(outsourceCostInput.replace(/,/g, ""))
      : 0;
    
    const numericAdditionalAmount = toNumber(additionalAmountInput);
    const numericMaterialCost = toNumber(materialCostInput);
    const numericLaborCost = toNumber(laborCostInput);
    const numericExpenseCost = toNumber(expenseCostInput);

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
          additionalAmount: numericAdditionalAmount,
          materialCost: numericMaterialCost,
          laborCost: numericLaborCost,
          expenseCost: numericExpenseCost,
          outsourceCost: numericOutsourceCost,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "更新に失敗しました");
        return;
      }

      await onSaved();

      setIsEditing(false);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDetailClients = clients.filter((client) =>
    client.name
      .toLowerCase()
      .includes(detailClientKeyword.toLowerCase())
  );

  const filteredDetailStaffs = staffs.filter((staff) =>
    staff.name
      .toLowerCase()
      .includes(detailManagerKeyword.toLowerCase())
  );

  const filteredDetailSalesStaffs = staffs.filter((staff) =>
    staff.name
      .toLowerCase()
      .includes(detailSalesStaffKeyword.toLowerCase())
  );

  const editTotalAmount =
    (editData?.amount ?? 0) + toNumber(additionalAmountInput);

  const editExecutionBudget =
    toNumber(materialCostInput) +
    toNumber(laborCostInput) +
    toNumber(expenseCostInput) +
    toNumber(outsourceCostInput);

  const editGrossProfit = editTotalAmount - editExecutionBudget;

  const editCostRate =
    editTotalAmount > 0
      ? editExecutionBudget / editTotalAmount
      : null;
  
  const formatYen = (value?: number | null) => {
    if (value === null || value === undefined) return "-";
    return `¥${Number(value).toLocaleString("ja-JP")}`;
  };

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("ja-JP");
  };

  const totalAmount =
    selectedProject.amount + (selectedProject.additionalAmount || 0);

  const executionBudget =
    (selectedProject.materialCost || 0) +
    (selectedProject.laborCost || 0) +
    (selectedProject.expenseCost || 0) +
    (selectedProject.outsourceCost || 0);

  const grossProfit = totalAmount - executionBudget;

  const costRate =
    totalAmount > 0 ? executionBudget / totalAmount : null;

  const profitRate =
    totalAmount > 0 ? grossProfit / totalAmount : null;

  const DetailItem = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <div className="mt-1 text-sm font-bold text-gray-900">
        {value || "-"}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      >
      <div
        className="relative z-[110] flex w-full max-w-2xl max-h-[90dvh] flex-col overflow-hidden rounded-xl bg-white shadow-lg touch-auto"
        onClick={(e) => e.stopPropagation()}
        >
        <div className="shrink-0 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
          案件詳細
          </h2>
        </div>

        <div className="shrink-0 flex gap-2 overflow-x-auto border-b border-gray-200 px-6 py-3">
          {[
            { id: "basic", label: "基本情報" },
            { id: "cost", label: "原価情報" },
            { id: "schedule", label: "工程" },
            { id: "files", label: "資料" },
            { id: "history", label: "履歴" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 表示モード */}
        {!isEditing && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 text-sm">
            <div className="space-y-5">
              
              <div className="border-b border-gray-200 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-blue-600">
                      {selectedProject.code}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-gray-900">
                      {selectedProject.name}
                    </h2>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">
                    {selectedProject.status || "未設定"}
                  </span>
                </div>
              </div>

              {activeTab === "basic" && (
                <>                  
                  <section>
                    <h3 className="mb-3 text-sm font-bold text-gray-700">
                      基本情報
                    </h3>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <DetailItem label="種別" value={selectedProject.type} />
                      <DetailItem label="発注者" value={selectedProject.client} />
                      <DetailItem label="発注者担当" value={selectedProject.clientStaff} />
                      <DetailItem label="営業担当" value={selectedProject.salesStaff} />
                      <DetailItem label="担当者" value={selectedProject.manager} />
                      <DetailItem label="外注依頼先" value={selectedProject.outsourceCompany} />
                    </div>

                    <h3 className="mt-5 mb-3 text-sm font-bold text-gray-700">
                      日程情報
                    </h3>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <DetailItem label="受注日" value={formatDate(selectedProject.orderDate)} />
                      <DetailItem label="開始日" value={formatDate(selectedProject.startDate)} />
                      <DetailItem label="完了日" value={formatDate(selectedProject.endDate)} />
                    </div>
                  
                    <h3 className="mt-5 mb-3 text-sm font-bold text-gray-700">
                      備考
                    </h3>

                    <div className="min-h-[80px] rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 whitespace-pre-wrap">
                      {selectedProject.note || "備考はありません"}
                    </div>
                  </section>                  
                </>
              )}

              {activeTab === "cost" && (
                <>
                  <section>
                    <h3 className="mb-3 text-sm font-bold text-gray-700">
                      金額・原価情報
                    </h3>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <DetailItem label="受注金額" value={formatYen(selectedProject.amount)} />
                      <DetailItem label="追加受注金額" value={formatYen(selectedProject.additionalAmount)} />
                      <DetailItem label="売上合計" value={formatYen(totalAmount)} />

                      <DetailItem label="材料費" value={formatYen(selectedProject.materialCost)} />
                      <DetailItem label="労務費" value={formatYen(selectedProject.laborCost)} />
                      <DetailItem label="経費他" value={formatYen(selectedProject.expenseCost)} />
                      <DetailItem label="外注費" value={formatYen(selectedProject.outsourceCost)} />
                      <DetailItem label="実行予算" value={formatYen(executionBudget)} />
                      <DetailItem label="粗利" value={formatYen(grossProfit)} />

                      <DetailItem
                        label="原価率"
                        value={
                          costRate !== null
                            ? `${(costRate * 100).toFixed(1)}%`
                            : "-"
                        }
                      />
                      <DetailItem
                        label="利益率"
                        value={
                          profitRate !== null
                            ? `${(profitRate * 100).toFixed(1)}%`
                            : "-"
                        }
                      />
                    </div>
                  </section>                  
                </>
              )}

              {activeTab === "schedule" && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-700">
                      工程管理
                    </h3>

                    <button
                      onClick={() =>
                        setIsScheduleModalOpen(true)
                      }
                      className="
                        rounded-lg
                        bg-blue-600
                        px-3
                        py-2
                        text-sm
                        font-semibold
                        text-white
                        hover:bg-blue-700
                      "
                    >
                      ＋予定追加
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full table-fixed text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="w-[90px] px-2 py-2 text-left">
                            開始日
                          </th>

                          <th className="w-[90px] px-2 py-2 text-left">
                            終了日
                          </th>

                          <th className="w-[80px] px-2 py-2 text-left">
                            状態
                          </th>

                          <th className="w-[180px] px-2 py-2 text-left">
                            内容
                          </th>

                          <th className="px-2 py-2 text-left">
                            備考
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {schedules.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="
                                px-4
                                py-8
                                text-center
                                text-gray-500
                              "
                            >
                              工程データはありません
                            </td>
                          </tr>
                        ) : (
                          schedules.map((schedule) => (
                            <tr
                              key={schedule.id}
                              className="
                                border-t
                                border-gray-300
                                hover:bg-gray-50
                                cursor-pointer
                              "
                            >
                              <td className="px-2 py-1">
                                {new Date(
                                  schedule.startDate
                                ).toLocaleDateString("ja-JP")}
                              </td>

                              <td className="px-2 py-1">
                                {new Date(
                                  schedule.endDate
                                ).toLocaleDateString("ja-JP")}
                              </td>

                              <td className="px-2 py-1">
                                {schedule.status}
                              </td>

                              <td className="px-2 py-1">
                                {schedule.title}
                              </td>

                              <td
                                className="
                                  px-2
                                  py-1
                                  whitespace-normal
                                  break-words
                                "
                              >
                                {schedule.memo}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeTab === "files" && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  資料・添付ファイル機能は今後追加予定です。
                </div>
              )}

              {activeTab === "history" && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  変更履歴機能は今後追加予定です。
                </div>
              )}
            </div>
          </div>
        )}

        {/* 編集モード */}
        {isEditing && editData && (
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain touch-auto px-6 py-4">

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

            <div>
              <label className="mb-1 block text-sm font-semibold">
                発注者担当者
              </label>

              <input
                value={editData.clientStaff || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    clientStaff: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

            <div ref={detailSalesStaffSearchRef} className="relative">
              <label className="mb-1 block text-sm font-semibold">
                営業担当者
              </label>

              <input
                value={detailSalesStaffKeyword}
                onChange={(e) => {
                  setDetailSalesStaffKeyword(e.target.value);
                  setShowDetailSalesStaffList(true);

                  setEditData({
                    ...editData,
                    salesStaff: "",
                  });
                }}
                onFocus={() => setShowDetailSalesStaffList(true)}
                placeholder="営業担当者を検索"
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />

              {showDetailSalesStaffList && (
                <div className="absolute z-30 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                  {filteredDetailSalesStaffs.length > 0 ? (
                    filteredDetailSalesStaffs.map((staff) => (
                      <button
                        type="button"
                        key={staff.id}
                        onClick={() => {
                          setEditData({
                            ...editData,
                            salesStaff: staff.name,
                          });

                          setDetailSalesStaffKeyword(staff.name);
                          setShowDetailSalesStaffList(false);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-blue-100"
                      >
                        {staff.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      該当する営業担当者がありません
                    </div>
                  )}
                </div>
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

            <div>
              <label className="mb-1 block text-sm font-semibold">
                外注依頼先
              </label>

              <input
                value={editData.outsourceCompany || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    outsourceCompany: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

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
                追加受注金額
              </label>

              <input
                value={additionalAmountInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, "");
                  setAdditionalAmountInput(value);
                }}
                onFocus={() => {
                  setAdditionalAmountInput(additionalAmountInput.replace(/,/g, ""));
                }}
                onBlur={() => {
                  if (!additionalAmountInput) return;
                  setAdditionalAmountInput(
                    Number(additionalAmountInput.replace(/,/g, "")).toLocaleString("ja-JP")
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-right"
              />
            </div>            

            <div>
              <label className="mb-1 block text-sm font-semibold">
                材料費
              </label>

              <input
                value={materialCostInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, "");
                  setMaterialCostInput(value);
                }}
                onFocus={() => {
                  setMaterialCostInput(materialCostInput.replace(/,/g, ""));
                }}
                onBlur={() => {
                  if (!materialCostInput) return;
                  setMaterialCostInput(
                    Number(materialCostInput.replace(/,/g, "")).toLocaleString("ja-JP")
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-right"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                労務費
              </label>

              <input
                value={laborCostInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, "");
                  setLaborCostInput(value);
                }}
                onFocus={() => {
                  setLaborCostInput(laborCostInput.replace(/,/g, ""));
                }}
                onBlur={() => {
                  if (!laborCostInput) return;
                  setLaborCostInput(
                    Number(laborCostInput.replace(/,/g, "")).toLocaleString("ja-JP")
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-right"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                経費他
              </label>

              <input
                value={expenseCostInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, "");
                  setExpenseCostInput(value);
                }}
                onFocus={() => {
                  setExpenseCostInput(expenseCostInput.replace(/,/g, ""));
                }}
                onBlur={() => {
                  if (!expenseCostInput) return;
                  setExpenseCostInput(
                    Number(expenseCostInput.replace(/,/g, "")).toLocaleString("ja-JP")
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-right"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                外注費
              </label>

              <input
                value={outsourceCostInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, "");
                  setOutsourceCostInput(value);
                }}
                onFocus={() => {
                  setOutsourceCostInput(outsourceCostInput.replace(/,/g, ""));
                }}
                onBlur={() => {
                  if (!outsourceCostInput) return;

                  setOutsourceCostInput(
                    Number(
                      outsourceCostInput.replace(/,/g, "")
                    ).toLocaleString("ja-JP")
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-right"
              />
            </div>

            <div className="space-y-1 rounded-lg bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800">
              <p>売上合計：¥{editTotalAmount.toLocaleString("ja-JP")}</p>
              <p>実行予算：¥{editExecutionBudget.toLocaleString("ja-JP")}</p>
              <p>
                原価率：
                {editCostRate !== null
                  ? `${(editCostRate * 100).toFixed(1)}%`
                  : "-"}
              </p>
              <p>粗利：¥{editGrossProfit.toLocaleString("ja-JP")}</p>
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

            <div>
              <label className="mb-1 block text-sm font-semibold">
                備考
              </label>

              <textarea
                value={editData.note || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    note: e.target.value,
                  })
                }
                rows={3}
                maxLength={300}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />

              <p className="mt-1 text-right text-xs text-gray-500">
                {(editData.note || "").length}/300
              </p>
            </div>
          </div>
        )}  

        {/* ボタン */}
        <div className="shrink-0 flex justify-between border-t border-gray-200 px-6 py-4">
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

          {isScheduleModalOpen && (
            <div
              className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                bg-black/50
              "
            >
              <div
                className="
                  w-full
                  max-w-md
                  rounded-lg
                  bg-white
                  p-6
                "
              >
                <h2 className="mb-4 text-lg font-bold">
                  工程追加
                </h2>

                <div className="space-y-4">

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      開始日
                    </label>

                    <input
                      type="date"
                      value={scheduleForm.startDate}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="
                        w-full
                        rounded-lg
                        border
                        px-3
                        py-2
                      "
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      終了日
                    </label>

                    <input
                      type="date"
                      value={scheduleForm.endDate}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="
                        w-full
                        rounded-lg
                        border
                        px-3
                        py-2
                      "
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      状態
                    </label>

                    <select
                      value={scheduleForm.status}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="
                        w-full
                        rounded-lg
                        border
                        px-3
                        py-2
                      "
                    >
                      <option value="未着手">
                        未着手
                      </option>

                      <option value="進行中">
                        進行中
                      </option>

                      <option value="完了">
                        完了
                      </option>

                      <option value="保留">
                        保留
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      内容
                    </label>

                    <input
                      type="text"
                      value={scheduleForm.title}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="
                        w-full
                        rounded-lg
                        border
                        px-3
                        py-2
                      "
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      備考
                    </label>

                    <textarea
                      value={scheduleForm.memo}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          memo: e.target.value,
                        }))
                      }
                      rows={3}
                      className="
                        w-full
                        rounded-lg
                        border
                        px-3
                        py-2
                      "
                      maxLength={200}
                    />
                  </div>

                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="rounded-lg bg-gray-300 px-4 py-2"
                  >
                    閉じる
                  </button>

                  <button
                    onClick={handleAddSchedule}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-700"
            >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}