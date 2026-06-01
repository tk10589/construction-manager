"use client";

import { useState } from "react";
import {
  MasterDataItem,
  isProjectType,
  isFiscalYear,
} from "./masterTypes";
import { getErrorMessage } from "./masterUtils";

type Props = {
  baseUrl: string;
  items: MasterDataItem[];
  onMasterUpdated: () => void | Promise<void>;
};

export default function MasterDeleteView({
  baseUrl,
  items,
  onMasterUpdated,
}: Props) {
  const [error, setError] = useState("");

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

    await onMasterUpdated();
  };

  return (
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
                ) : isFiscalYear(item) ? (
                  <>
                    <b>{item.year}年度</b>：年度末 {item.endMonth}月
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

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}