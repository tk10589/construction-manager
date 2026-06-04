"use client";

import { useState } from "react";
import { MasterTarget } from "./masterTypes";

export default function MasterAddView({
  target,
  baseUrl,
  onClose,
  onMasterUpdated,
}: {
  target: MasterTarget;
  baseUrl: string;
  onClose: () => void;
  onMasterUpdated: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  // 年度追加用
  const [year, setYear] = useState("");
  const [endMonth, setEndMonth] = useState("3");

  const handleAdd = async () => {
    setError("");

    const body =
      target === "type"
        ? { code, name }
        : target === "fiscalYear"
        ? {
            year: Number(year),
            endMonth: Number(endMonth),
          }
        : { name };

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setError("登録に失敗しました");
      return;
    }

    await onMasterUpdated();
    onClose();
  };

  return (
    <div className="space-y-4">
      {target === "fiscalYear" ? (
        <>
          <div>
            <label className="mb-1 block text-sm font-semibold">
              年度
            </label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="例：2026"
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              年度末月
            </label>
            <select
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              className="w-full rounded border px-3 py-2"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                <option key={month} value={month}>
                  {month}月
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <>
          {target === "type" && (
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="種別コード"
              className="w-full rounded border px-3 py-2"
            />
          )}

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={target === "type" ? "種別名" : "名称"}
            className="w-full rounded border px-3 py-2"
          />
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="text-right">
        <button
          onClick={handleAdd}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          登録
        </button>
      </div>
    </div>
  );
}