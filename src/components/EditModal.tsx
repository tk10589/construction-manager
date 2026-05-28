"use client";

import { useEffect, useRef, useState } from "react";
import {
  Project,
  MasterItem,
  ProjectType,
  FormErrors,
} from "@/types/project";

type EditModalProps = {
  project: Project;
  onClose: () => void;
  onSave: (project: Project) => void;
  clients: MasterItem[];
  staffs: MasterItem[];
  projectTypes: ProjectType[];
};

export default function EditModal({
  project,
  onClose,
  onSave,
  clients,
  staffs,
  projectTypes,
}: EditModalProps) {

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

  const [errors, setErrors] = useState<FormErrors>({});

  const [outsourceCost, setOutsourceCost] = useState(
    project.outsourceCost !== undefined &&
      project.outsourceCost !== null
      ? project.outsourceCost.toLocaleString("ja-JP")
      : ""
  );

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

    setOutsourceCost(
      project.outsourceCost !== undefined &&
        project.outsourceCost !== null
        ? project.outsourceCost.toLocaleString("ja-JP")
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

          <div>
            <label className="mb-1 block text-sm font-semibold">
              営業担当者
            </label>

            <select
              value={editData.salesStaff || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  salesStaff: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="">選択してください</option>

              {staffs.map((staff) => (
                <option key={staff.id} value={staff.name}>
                  {staff.name}
                </option>
              ))}
            </select>
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
            <label className="mb-1 block text-sm font-semibold">
              外注費
            </label>

            <input
              value={outsourceCost}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");

                if (!/^\d*$/.test(raw)) return;

                setOutsourceCost(raw);
              }}
              onFocus={() => {
                setOutsourceCost(outsourceCost.replace(/,/g, ""));
              }}
              onBlur={() => {
                if (!outsourceCost) return;

                setOutsourceCost(
                  Number(outsourceCost.replace(/,/g, "")).toLocaleString("ja-JP")
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

              const numericOutsourceCost = outsourceCost
                ? Number(outsourceCost.replace(/,/g, ""))
                : 0;

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
                outsourceCost: numericOutsourceCost,
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
