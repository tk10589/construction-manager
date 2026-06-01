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

type FilterSelectSectionProps = {
  title: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
};



function FilterSelectSection({
  title,
  options,
  selectedValues,
  onToggle,
}: FilterSelectSectionProps) {
  const [keyword, setKeyword] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        sectionRef.current &&
        !sectionRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <div
      ref={sectionRef}
      className="relative space-y-2 rounded-lg border border-gray-200 p-4"
    >
      <h3 className="font-bold text-gray-900">{title}</h3>

      <input
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={`${title}を検索`}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />

      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute left-4 right-4 z-30 max-h-40 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <label
                key={option}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => {
                    onToggle(option);
                    setIsOpen(true);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                />

                <span>{option}</span>
              </label>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-gray-500">
              該当する項目がありません
            </p>
          )}
        </div>
      )}

      {selectedValues.length > 0 && (
        <p className="text-xs text-gray-500">
          選択中：{selectedValues.join("、")}
        </p>
      )}
    </div>
  );
}

export default function FilterModal({
  filters,
  filterOptions,
  onClose,
  onApply,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] =
    useState<ProjectFilters>(filters);

  <div className="space-y-4">
    <FilterSelectSection
      title="種別"
      options={filterOptions.types}
      selectedValues={localFilters.types}
      onToggle={(value) => toggleValue("types", value)}
    />

    <FilterSelectSection
      title="発注者"
      options={filterOptions.clients}
      selectedValues={localFilters.clients}
      onToggle={(value) => toggleValue("clients", value)}
    />

    <FilterSelectSection
      title="発注者担当"
      options={filterOptions.clientStaffs}
      selectedValues={localFilters.clientStaffs}
      onToggle={(value) => toggleValue("clientStaffs", value)}
    />

    <FilterSelectSection
      title="営業担当"
      options={filterOptions.salesStaffs}
      selectedValues={localFilters.salesStaffs}
      onToggle={(value) => toggleValue("salesStaffs", value)}
    />

    <FilterSelectSection
      title="担当者"
      options={filterOptions.managers}
      selectedValues={localFilters.managers}
      onToggle={(value) => toggleValue("managers", value)}
    />

    <FilterSelectSection
      title="外注依頼先"
      options={filterOptions.outsourceCompanies}
      selectedValues={localFilters.outsourceCompanies}
      onToggle={(value) => toggleValue("outsourceCompanies", value)}
    />
  </div>

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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          <div className="space-y-4">
            <FilterSelectSection
              title="種別"
              options={filterOptions.types}
              selectedValues={localFilters.types}
              onToggle={(value) => toggleValue("types", value)}
            />
          </div>
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