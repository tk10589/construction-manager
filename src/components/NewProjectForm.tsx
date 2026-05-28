"use client";

import { useEffect, useRef, useState } from "react";
import {
  Project,
  MasterItem,
  ProjectType,
} from "@/types/project";

type NewProjectFormProps = {
  onAdd: (project: Omit<Project, "id">) => Promise<boolean>;
  clients: MasterItem[];
  staffs: MasterItem[];
  projectTypes: ProjectType[];
};

export default function NewProjectForm({
  onAdd,
  clients,
  staffs,
  projectTypes,
}: NewProjectFormProps) {
    
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

  const [salesStaff, setSalesStaff] = useState("");
  const [clientStaff, setClientStaff] = useState("");
  const [outsourceCompany, setOutsourceCompany] = useState("");
  const [outsourceCost, setOutsourceCost] = useState("");
  const [note, setNote] = useState("");

  const [salesStaffKeyword, setSalesStaffKeyword] = useState("");
  const [showSalesStaffList, setShowSalesStaffList] = useState(false);

  const salesStaffSearchRef = useRef<HTMLDivElement>(null);

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

      if (
        salesStaffSearchRef.current &&
        !salesStaffSearchRef.current.contains(target)
      ) {
        setShowSalesStaffList(false);
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

  const filteredSalesStaffs = staffs.filter((staff) =>
    staff.name
      .toLowerCase()
      .includes(salesStaffKeyword.toLowerCase())
  );

  const handleSubmit = async () => {
    
    const numericAmount = Number(amount.replace(/,/g, ""));
    const numericBudget = budget
      ? Number(budget.replace(/,/g, ""))
      : undefined;
    const numericOutsourceCost = outsourceCost
      ? Number(outsourceCost.replace(/,/g, ""))
      : 0;

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

    if (!numericAmount || numericAmount <= 0) {
      alert("受注金額を入力してください");
      return;
    }

    const success = await onAdd({
      code,
      type,
      name,
      client,
      manager,

      salesStaff: salesStaff || undefined,
      clientStaff: clientStaff || undefined,
      outsourceCompany: outsourceCompany || undefined,
      outsourceCost: numericOutsourceCost,

      amount: numericAmount,
      budget: numericBudget,

      status,

      note: note || undefined,

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

    setSalesStaff("");
    setClientStaff("");
    setOutsourceCompany("");
    setOutsourceCost("");
    setNote("");

    setSalesStaffKeyword("");
    setShowSalesStaffList(false);
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

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-800">
            発注者担当者
          </label>

          <input
            value={clientStaff}
            onChange={(e) => setClientStaff(e.target.value)}
            placeholder="例：佐藤様"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
          />
        </div>

        <div ref={salesStaffSearchRef} className="relative">
          <label className="mb-1 block text-sm font-semibold text-gray-800">
            営業担当者
          </label>

          <input
            value={salesStaffKeyword}
            onChange={(e) => {
              setSalesStaffKeyword(e.target.value);
              setShowSalesStaffList(true);
              setSalesStaff("");
            }}
            onFocus={() => setShowSalesStaffList(true)}
            placeholder="営業担当者を検索"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
          />

          {showSalesStaffList && (
            <div className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
              {filteredSalesStaffs.length > 0 ? (
                filteredSalesStaffs.map((staff) => (
                  <button
                    type="button"
                    key={staff.id}
                    onClick={() => {
                      setSalesStaff(staff.name);
                      setSalesStaffKeyword(staff.name);
                      setShowSalesStaffList(false);
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
            外注依頼先
          </label>

          <input
            value={outsourceCompany}
            onChange={(e) => setOutsourceCompany(e.target.value)}
            placeholder="例：〇〇電工"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-800">
            受注金額
          </label>

          <input
            type="text"
            value={amount}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d]/g, "");
              setAmount(value);
            }}
            onFocus={() => {
              setAmount(amount.replace(/,/g, ""));
            }}
            onBlur={() => {
              if (!amount) return;
              setAmount(
                Number(amount.replace(/,/g, "")).toLocaleString("ja-JP")
              );
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-right text-gray-900"
          />
          {/* <input
            type="number"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
            placeholder="例：1800000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          /> */}
        </div>

        <div>
          <label className="text-sm">実行予算</label>

          <input
            type="text"
            value={budget}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d]/g, "");
              setBudget(value);
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-right text-gray-900"
          />

          {/* <input
            value={budget}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d]/g, "");
              setBudget(value);
            }}
            className="w-full rounded border px-3 py-2"
            placeholder="例: 1000000"
          /> */}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-800">
            外注費
          </label>

          <input
            value={outsourceCost}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d]/g, "");
              setOutsourceCost(value);
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
            placeholder="例：300000"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-right text-gray-900"
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

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-800">
            備考
          </label>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="現場情報・注意事項など"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
          />

          <p className="mt-1 text-right text-xs text-gray-500">
            {note.length}/300
          </p>
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