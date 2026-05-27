"use client";

import { useState } from "react";
import {
  MasterDataItem,
  MasterTarget,
  isProjectType,
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

  const handleUpdate = async () => {
    setError("");

    if (!editingItemId) return;

    if (target === "type") {
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
                      target === "type" ? "種別名" : "名称"
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
                    {isProjectType(item) ? (
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
                      setEditingCode(
                        isProjectType(item) ? item.code : ""
                      );
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