"use client";

import { useState } from "react";
import { MasterItem, ProjectType } from "@/types/project";

type MasterModalProps = {
  target: "type" | "client" | "staff";
  action: "add" | "edit" | "delete" | "list";
  clients: MasterItem[];
  staffs: MasterItem[];
  projectTypes: ProjectType[];
  onClose: () => void;
  onMasterUpdated: () => void | Promise<void>;
};

export default function MasterModal({
  target,
  action,
  clients,
  staffs,
  projectTypes,
  onClose,
  onMasterUpdated,
}: MasterModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCode, setEditingCode] = useState("");
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

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
  
  const isProjectType = (
    item: MasterItem | ProjectType
  ): item is ProjectType => {
    return "code" in item;
  };
  
  const baseUrl =
    target === "type"
      ? "/api/project-types"
      : target === "client"
      ? "/api/clients"
      : "/api/staffs";

  const getErrorMessage = async (
    response: Response,
    fallback: string
  ) => {
    const errorText = await response.text();

    try {
      const errorData = JSON.parse(errorText);
      return errorData.error || fallback;
    } catch {
      return errorText || fallback;
    }
  };
  
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
        const errorText = await response.text();

        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.error || "登録に失敗しました");
        } catch {
          setError(errorText || "登録に失敗しました");
        }

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
        const errorText = await response.text();

        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.error || "登録に失敗しました");
        } catch {
          setError(errorText || "登録に失敗しました");
        }

        return;
      }
    }

    setEditingItemId(null);
    setEditingName("");
    setEditingCode("");

    await onMasterUpdated();
  };

  const handleDelete = async (id: number) => {
    setError("");

    const ok = confirm("このデータを削除しますか？");

    if (!ok) return;

    const response = await fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const message = await getErrorMessage(
        response,
        "削除に失敗しました"
      );

      setError(message);
      return;
    }

    setDeletingItemId(null);

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
                      <>
                      {isProjectType(item) ? (
                        <span>
                          <b>{item.code}</b>：{item.name}
                        </span>
                      ) : (
                        <span>{item.name}</span>
                      )}
                      </>
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
                                {isProjectType(item) ? (
                                  <span>
                                    <b>{item.code}</b>：{item.name}
                                  </span>
                                ) : (
                                  <span>{item.name}</span>
                                )}
                              </>
                            ) : (
                              item.name
                            )}
                          </span>

                          <button
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditingName(item.name);
                              setEditingCode(isProjectType(item) ? item.code : "");
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
          ) : action === "delete" ? (
            <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  削除する項目を選択してください。
                </p>

                <div className="max-h-80 overflow-y-auto rounded border border-gray-200">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm last:border-b-0"
                      >
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
                          onClick={() => handleDelete(item.id)}
                          className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                        >
                          削除
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      登録データがありません。
                    </p>
                  )}
                </div>
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