"use client";

import { useEffect, useRef, useState } from "react";
import {
  Project,
  MasterItem,
  ProjectType,
  FormErrors,
} from "@/types/project";

type ProjectDetailModalProps = {
  selectedProject: Project;
  clients: MasterItem[];
  staffs: MasterItem[];
  projectTypes: ProjectType[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
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

  const [detailSalesStaffKeyword, setDetailSalesStaffKeyword] = useState("");
  const [showDetailSalesStaffList, setShowDetailSalesStaffList] = useState(false);

  const detailSalesStaffSearchRef = useRef<HTMLDivElement>(null);

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
    }
  }, [selectedProject]);

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

  return (
    <div
      className="fixed inset-0 z-[100] flex touch-none items-center justify-center bg-black/40 p-4"
      onClick={onClose}
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
            <p><b>発注者担当者：</b>{selectedProject.clientStaff || "-"}</p>
            <p><b>営業担当者：</b>{selectedProject.salesStaff || "-"}</p>
            <p><b>担当者：</b>{selectedProject.manager}</p>
            <p><b>外注依頼先：</b>{selectedProject.outsourceCompany || "-"}</p>
            <p><b>受注金額：</b>¥{selectedProject.amount.toLocaleString()}</p>
            <p><b>実行予算：</b>
              {selectedProject.budget
              ? `¥${selectedProject.budget.toLocaleString()}`
              : "-"}
            </p>
            <p><b>外注費：</b>
              {selectedProject.outsourceCost !== undefined &&
              selectedProject.outsourceCost !== null
                ? `¥${selectedProject.outsourceCost.toLocaleString()}`
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
            <p><b>備考：</b>{selectedProject.note || "-"}</p>
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