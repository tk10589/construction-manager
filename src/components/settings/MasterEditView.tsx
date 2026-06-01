"use client";

import { useState } from "react";
import {
  MasterDataItem,
  MasterTarget,
  isProjectType,
  isFiscalYear,
} from "./masterTypes";
import { getErrorMessage } from "./masterUtils";

type Props = {
  target: MasterTarget;
  baseUrl: string;
  items: MasterDataItem[];
  onMasterUpdated: () => void | Promise<void>;
};

export default function MasterEditView({
  target,
  baseUrl,
  items,
  onMasterUpdated,
}: Props) {
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCode, setEditingCode] = useState("");
  const [error, setError] = useState("");

  const [editingYear, setEditingYear] = useState("");
  const [editingEndMonth, setEditingEndMonth] = useState("3");

  const handleUpdate = async () => {
    setError("");

    if (!editingItemId) return;

    if (target === "fiscalYear") {
      if (!editingYear.trim()) {
        setError("年度を入力してください");
        return;
      }

      const year = Number(editingYear);
      const endMonth = Number(editingEndMonth);

      if (!year || year < 2000) {
        setError("年度を正しく入力してください");
        return;
      }

      if (!endMonth || endMonth < 1 || endMonth > 12) {
        setError("年度末月を1〜12で選択してください");
        return;
      }
    } else if (target === "type") {
      if (!editingCode.trim() || !editingName.trim()) {
        setError("種別コードと種別名を入力してください");
        return;
      }
    } else {
      if (!editingName.trim()) {
        setError("名称を入力してください");
        return;
      }
    }

    const body =
      target === "type"
        ? {
            code: editingCode,
            name: editingName,
          }
        : target === "fiscalYear"
        ? {
            year: Number(editingYear),
            endMonth: Number(editingEndMonth),
          }
        : {
            name: editingName,
          };

    const response = await fetch(`${baseUrl}/${editingItemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await getErrorMessage(
        response,
        "更新に失敗しました"
      );

      setError(message);
      return;
    }

    setEditingItemId(null);
    setEditingName("");
    setEditingCode("");
    setEditingYear("");
    setEditingEndMonth("3");

    await onMasterUpdated();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        編集する項目を選択してください。
      </p>

      <div className="max-h-80 overflow-y-auto rounded border border-gray-200">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="border-b border-gray-100 px-4 py-3 text-sm last:border-b-0"
            >
              {editingItemId === item.id ? (
                <div className="space-y-2">
                  {target === "fiscalYear" ? (
                    <div className="space-y-2">
                      <input
                        value={editingYear}
                        onChange={(e) =>
                          setEditingYear(e.target.value.replace(/[^\d]/g, ""))
                        }
                        className="w-full rounded border px-3 py-2"
                        placeholder="年度"
                      />

                      <select
                        value={editingEndMonth}
                        onChange={(e) => setEditingEndMonth(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                      >
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map((month) => (
                          <option key={month} value={month}>
                            {month}月
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
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
                        placeholder={target === "type" ? "種別名" : "名称"}
                      />
                    </>
                  )}

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
                    {isProjectType(item) ? (
                      <>
                        <b>{item.code}</b>：{item.name}
                      </>
                    ) : isFiscalYear(item) ? (
                      <>
                        <b>{item.year}年度</b>：年度末 {item.endMonth}月
                      </>
                    ) : (
                      item.name
                    )}
                  </span>

                  <button
                    onClick={() => {
                      setEditingItemId(item.id);

                      if (isFiscalYear(item)) {
                        setEditingYear(String(item.year));
                        setEditingEndMonth(String(item.endMonth));
                        setEditingName("");
                        setEditingCode("");
                      } else {
                        setEditingName(item.name);
                        setEditingCode(isProjectType(item) ? item.code : "");
                      }
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
  );
}