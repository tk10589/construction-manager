"use client";

import { useEffect, useRef, useState } from "react";

type ProjectFilters = {
  types: string[];
  clients: string[];
  clientStaffs: string[];
  salesStaffs: string[];
  managers: string[];
  outsourceCompanies: string[];
};

type FilterOptions = {
  types: string[];
  clients: string[];
  clientStaffs: string[];
  salesStaffs: string[];
  managers: string[];
  outsourceCompanies: string[];
};

type FilterModalProps = {
  filters: ProjectFilters;
  filterOptions: FilterOptions;
  onClose: () => void;
  onApply: (filters: ProjectFilters) => void;
};

export default function FilterModal({
  filters,
  filterOptions,
  onClose,
  onApply,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] =
    useState<ProjectFilters>(filters);

  const [typeKeyword, setTypeKeyword] = useState("");
  const [showTypeList, setShowTypeList] = useState(false);
  const typeFilterRef = useRef<HTMLDivElement>(null);

  // useEffect関係
  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

    if (
      typeFilterRef.current &&
      !typeFilterRef.current.contains(target)
    ) {
      setShowTypeList(false);
    }
  };

  // 補助関数
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setShowTypeList(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  document.addEventListener("keydown", handleKeyDown);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("keydown", handleKeyDown);
  };
}, []);

  const selectedCount =
    localFilters.types.length +
    localFilters.clients.length +
    localFilters.clientStaffs.length +
    localFilters.salesStaffs.length +
    localFilters.managers.length +
    localFilters.outsourceCompanies.length;

  const toggleValue = (
    key: keyof ProjectFilters,
    value: string
  ) => {
    setLocalFilters((prev) => {
      const exists = prev[key].includes(value);

      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((item) => item !== value)
          : [...prev[key], value],
      };
    });
  };

  // フィルター関係
  const filteredTypes = filterOptions.types.filter((type) =>
    type.toLowerCase().includes(typeKeyword.toLowerCase())
  );

  const clearFilters = () => {
    setLocalFilters({
      types: [],
      clients: [],
      clientStaffs: [],
      salesStaffs: [],
      managers: [],
      outsourceCompanies: [],
    });
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex touch-none items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-lg touch-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            フィルター条件
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            選択中：{selectedCount}件
          </p>
        </div>

        <div
          ref={typeFilterRef}
          className="relative space-y-2 rounded-lg border border-gray-200 p-4"
        >
          <h3 className="font-bold text-gray-900">種別</h3>

          <input
            value={typeKeyword}
            onChange={(e) => {
              setTypeKeyword(e.target.value);
              setShowTypeList(true);
            }}
            onFocus={() => setShowTypeList(true)}
            placeholder="種別を検索"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          {showTypeList && (
            <div className="absolute left-4 right-4 z-30 max-h-40 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
              {filteredTypes.length > 0 ? (
                filteredTypes.map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.types.includes(type)}
                      onChange={() => toggleValue("types", type)}
                    />
                    <span>{type}</span>
                  </label>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-gray-500">
                  該当する種別がありません
                </p>
              )}
            </div>
          )}

          {localFilters.types.length > 0 && (
            <p className="text-xs text-gray-500">
              選択中：{localFilters.types.join("、")}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
            >
              クリア
            </button>

            <button
              onClick={() => {
                onApply(localFilters);
                onClose();
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              適用
            </button>

            <button
              onClick={onClose}
              className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-bold text-white hover:bg-gray-600"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}