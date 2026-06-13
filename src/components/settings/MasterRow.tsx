"use client";

type MasterRowProps = {
  title: string;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onList: () => void;
  onCsvExport?: () => void;
  onCsvImport?: () => void;
};

export default function MasterRow({
  title,
  onAdd,
  onEdit,
  onDelete,
  onList,
  onCsvExport,
  onCsvImport,
}: MasterRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-5 py-4 shadow-sm">
      <h3 className="font-bold text-gray-900">
        {title}
      </h3>

      <div className="flex gap-2">
        <button
          onClick={onAdd}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          追加
        </button>

        <button
          onClick={onEdit}
          className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
        >
          編集
        </button>

        <button
          onClick={onDelete}
          className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
        >
          削除
        </button>

        <button
          onClick={onList}
          className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
        >
          一覧
        </button>

        <button
          onClick={onCsvExport}
          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700"
        >
          CSV出力
        </button>

        <button
          onClick={onCsvImport}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          CSV取込
        </button>
                
      </div>
    </div>
  );
}