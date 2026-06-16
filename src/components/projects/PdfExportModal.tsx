"use client";

type PdfColumns = {
  code: boolean;
  type: boolean;
  name: boolean;
  client: boolean;
  clientStaff: boolean;
  amount: boolean;
  budget: boolean;
  salesStaff: boolean;
  status: boolean;
  orderDate: boolean;
  startDate: boolean;
  endDate: boolean;
};

type PdfExportModalProps = {
  pdfColumns: PdfColumns;
  pdfPageSize: "A4" | "A3";
  selectedColumnCount: number;
  projectCount: number;
  onToggleColumn: (key: keyof PdfColumns) => void;
  onChangePageSize: (size: "A4" | "A3") => void;
  onPreview: () => void;
  onDownload: () => void;
  onClose: () => void;
};

export default function PdfExportModal({
  pdfColumns,
  pdfPageSize,
  selectedColumnCount,
  projectCount,
  onToggleColumn,
  onChangePageSize,
  onPreview,
  onDownload,
  onClose,
}: PdfExportModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            案件一覧PDF出力
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4 text-sm text-gray-700">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4">
                <p className="mb-2 font-semibold">出力項目</p>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["code", "案件番号"],
                    ["type", "種別"],
                    ["name", "案件名"],
                    ["client", "発注者"],
                    ["clientStaff", "発注者担当"],
                    ["amount", "受注金額"],
                    ["budget", "予算"],
                    ["salesStaff", "営業担当"],
                    ["status", "進捗"],
                    ["orderDate", "受注日"],
                    ["startDate", "着工日"],
                    ["endDate", "完了日"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={pdfColumns[key as keyof PdfColumns]}
                        onChange={() =>
                          onToggleColumn(key as keyof PdfColumns)
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <p className="font-bold">用紙サイズ</p>

              <div className="mt-2 flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="pdfPageSize"
                    value="A4"
                    checked={pdfPageSize === "A4"}
                    onChange={() => onChangePageSize("A4")}
                  />
                  <span>A4横</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="pdfPageSize"
                    value="A3"
                    checked={pdfPageSize === "A3"}
                    onChange={() => onChangePageSize("A3")}
                  />
                  <span>A3横</span>
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="mb-2 font-bold text-blue-900">
                出力内容
              </p>

              <div className="space-y-1 text-sm">
                <p>
                  案件数：
                  <span className="font-semibold">
                    {projectCount}
                  </span>
                  件
                </p>

                <p>
                  出力項目数：
                  <span className="font-semibold">
                    {selectedColumnCount}
                  </span>
                  項目
                </p>

                <p>
                  用紙サイズ：
                  <span className="font-semibold">
                    {pdfPageSize}横
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={onPreview}
              disabled={selectedColumnCount === 0}
              className={`
                rounded-lg px-4 py-2 text-white
                ${
                  selectedColumnCount === 0
                    ? "bg-gray-600"
                    : "bg-gray-700 hover:bg-gray-900"
                }
              `}
            >
              プレビュー
            </button>

            <button
              onClick={onDownload}
              disabled={selectedColumnCount === 0}
              className={`
                rounded-lg px-4 py-2 text-white
                ${
                  selectedColumnCount === 0
                    ? "bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-700"
                }
              `}
            >
              PDF出力
            </button>

            <button
              onClick={onClose}
              className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}