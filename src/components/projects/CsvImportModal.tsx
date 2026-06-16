"use client";

import { RefObject } from "react";

type CsvImportProjectRow = {
  code: string;
  name: string;
};

type CsvImportResult = {
  imported: CsvImportProjectRow[];
  skipped: number;
};

type CsvImportSummary = {
  totalCount: number;
  importCount: number;
  skipCount: number;
};

type CsvImportModalProps = {
  csvFileInputRef: RefObject<HTMLInputElement | null>;

  isCsvResultMode: boolean;
  isCsvConfirmMode: boolean;
  isCsvImporting: boolean;

  csvImportResult: CsvImportResult | null;
  csvImportSummary: CsvImportSummary;
  csvImportTargetRows: CsvImportProjectRow[];

  csvImportRows: string[][];
  csvImportError: string;
  csvValidationErrors: string[];
  csvDuplicateErrors: string[];
  csvMasterErrors: string[];

  selectedCsvFileName: string;
  csvImportMode: "append" | "replace";

  onClose: () => void;
  onClear: () => void;
  onFileChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onChangeImportMode: (
    mode: "append" | "replace"
  ) => void;
  onBackToInput: () => void;
  onGoConfirm: () => void;
  onImport: () => void;
};

export default function CsvImportModal({
  csvFileInputRef,
  isCsvResultMode,
  isCsvConfirmMode,
  isCsvImporting,
  csvImportResult,
  csvImportSummary,
  csvImportTargetRows,
  csvImportRows,
  csvImportError,
  csvValidationErrors,
  csvDuplicateErrors,
  csvMasterErrors,
  selectedCsvFileName,
  csvImportMode,
  onClose,
  onClear,
  onFileChange,
  onChangeImportMode,
  onBackToInput,
  onGoConfirm,
  onImport,
}: CsvImportModalProps) {
  return (
    <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
    >
        <div
        className="relative z-[110] flex w-full max-w-4xl max-h-[90dvh] flex-col overflow-hidden rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
        >
        {isCsvResultMode ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {csvImportResult && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h3 className="mb-3 text-lg font-bold text-green-800">
                  CSV取込完了
                </h3>

                <div className="space-y-2 text-sm">
                  <p>
                    登録件数：
                    <span className="font-bold text-green-700">
                      {csvImportResult.imported.length}件
                    </span>
                  </p>

                  <p>
                    スキップ件数：
                    <span className="font-bold text-yellow-700">
                      {csvImportResult.skipped}件
                    </span>
                  </p>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-sm font-bold text-gray-700">
                    登録案件
                  </p>

                  {csvImportResult.imported.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      登録された案件はありません。
                    </p>
                  ) : (
                    <div className="space-y-1 text-sm">
                      {csvImportResult.imported
                        .slice(0, 10)
                        .map((project) => (
                          <div key={project.code}>
                            ✓ {project.code}　{project.name}
                          </div>
                        ))}
                    </div>
                  )}

                  {csvImportResult.imported.length > 10 && (
                    <p className="mt-2 text-xs text-gray-500">
                      他 {csvImportResult.imported.length - 10} 件
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : isCsvConfirmMode ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h3 className="mb-3 text-lg font-bold text-blue-800">
                    CSV取込確認
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs font-semibold text-gray-500">
                        取込方式
                      </p>
                      <p className="mt-1 font-bold text-gray-900">
                        追加登録
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs font-semibold text-gray-500">
                          CSV件数
                        </p>
                        <p className="mt-1 font-bold text-gray-900">
                          {csvImportSummary.totalCount}件
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs font-semibold text-gray-500">
                          登録予定
                        </p>
                        <p className="mt-1 font-bold text-green-700">
                          {csvImportSummary.importCount}件
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs font-semibold text-gray-500">
                          スキップ予定
                        </p>
                        <p className="mt-1 font-bold text-yellow-700">
                          {csvImportSummary.skipCount}件
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg bg-white p-3 text-sm text-gray-700">
                      <div className="space-y-1">
                        <p className="font-semibold text-green-700">
                          ✓ 入力チェック完了
                        </p>
                        <p className="font-semibold text-green-700">
                          ✓ 重複チェック完了
                        </p>
                        <p className="font-semibold text-green-700">
                          ✓ マスタチェック完了
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg bg-white p-3">
                      <h4 className="mb-2 text-sm font-bold text-gray-700">
                        登録予定案件
                      </h4>

                      {csvImportTargetRows.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          登録予定の案件はありません。
                        </p>
                      ) : (
                        <div className="space-y-1 text-sm text-gray-700">
                          {csvImportTargetRows.slice(0, 5).map((row) => (
                            <div
                              key={row.code}
                              className="flex gap-3 rounded border border-gray-100 px-2 py-1"
                            >
                              <span className="w-24 shrink-0 font-bold text-blue-700">
                                {row.code}
                              </span>
                              <span className="truncate">
                                {row.name}
                              </span>
                            </div>
                          ))}

                          {csvImportTargetRows.length > 5 && (
                            <p className="mt-2 text-xs text-gray-500">
                              他 {csvImportTargetRows.length - 5} 件あります。
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-blue-700">
                    追加登録モードでは、既に存在する案件番号はスキップし、
                    新規案件番号のみ登録します。
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
            <>
            <div className="shrink-0 border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">
                CSV取込
                </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <input
                ref={csvFileInputRef}
                type="file"
                accept=".csv"
                onChange={onFileChange}
                className="hidden"
                />

                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-2 text-sm font-bold text-gray-700">
                    取込方式
                </p>

                <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input
                    type="radio"
                    checked={csvImportMode === "append"}
                    onChange={() => onChangeImportMode("append")}
                    className="mt-1"
                    />
                    <span>
                    <span className="font-bold">追加登録</span>
                    <br />
                    既存案件は残し、CSVの新規案件だけ登録します。
                    </span>
                </label>
                </div>

                <div className="mb-4 flex gap-2">
                <button
                    onClick={() => csvFileInputRef.current?.click()}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                    CSVファイル選択
                </button>

                <button
                    onClick={onClear}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    クリア
                </button>
                </div>

                {selectedCsvFileName && (
                <div className="mb-4 text-sm text-gray-600">
                    選択中: {selectedCsvFileName}
                </div>
                )}

                {csvImportError && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {csvImportError}
                </div>
                )}

                {csvValidationErrors.length > 0 && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <h3 className="mb-2 font-bold text-red-700">
                    入力エラー
                    </h3>

                    <ul className="space-y-1 text-sm text-red-600">
                    {csvValidationErrors
                        .slice(0, 20)
                        .map((error, index) => (
                        <li key={index}>{error}</li>
                        ))}
                    </ul>

                    {csvValidationErrors.length > 20 && (
                    <p className="mt-2 text-xs text-red-500">
                        他にもエラーがあります
                    </p>
                    )}
                </div>
                )}

                {csvDuplicateErrors.length > 0 && (
                <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <h3 className="mb-2 font-bold text-yellow-700">
                    重複エラー
                    </h3>

                    <ul className="space-y-1 text-sm text-yellow-700">
                    {csvDuplicateErrors
                        .slice(0, 20)
                        .map((error, index) => (
                        <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
                )}

                {csvMasterErrors.length > 0 && (
                <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <h3 className="mb-2 font-bold text-orange-700">
                    マスタ未登録
                    </h3>

                    <ul className="space-y-1 text-sm text-orange-700">
                    {csvMasterErrors
                        .slice(0, 20)
                        .map((error, index) => (
                        <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
                )}

                {csvImportRows.length > 0 && (
                <div className="rounded-lg border border-gray-200">
                    <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold">
                    プレビュー：{csvImportRows.length - 1}件
                    </div>

                    <div className="max-h-[50dvh] overflow-auto">
                    <table className="min-w-[1600px] table-fixed border-collapse text-xs">
                        <tbody>
                        {csvImportRows.slice(0, 6).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td
                                key={cellIndex}
                                className={`max-w-[180px] truncate border border-gray-200 px-2 py-1 ${
                                    rowIndex === 0
                                    ? "bg-gray-100 font-bold"
                                    : "bg-white"
                                }`}
                                >
                                {cell}
                                </td>
                            ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>

                    {csvImportRows.length > 6 && (
                    <p className="px-3 py-2 text-xs text-gray-500">
                        ※先頭5件のみ表示しています。
                    </p>
                    )}
                </div>
                )}
            </div>
            </>
        )}

        <div className="shrink-0 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end gap-3">
            {isCsvResultMode ? (
              <button
                onClick={() => {
                  onClear();
                  onClose();
                }}
                className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
              >
                閉じる
              </button>
            ) : isCsvConfirmMode ? (
              <>
                <button
                  onClick={onBackToInput}
                  className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                >
                  戻る
                </button>

                <button
                  onClick={onImport}
                  disabled={
                    isCsvImporting ||
                    csvImportSummary.importCount === 0
                  }
                  className={`rounded-lg px-6 py-2 font-semibold text-white ${
                    isCsvImporting ||
                    csvImportSummary.importCount === 0
                      ? "bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isCsvImporting ? "登録中..." : "登録実行"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                >
                  閉じる
                </button>

                <button
                  onClick={onGoConfirm}
                  disabled={
                    csvImportRows.length === 0 ||
                    csvValidationErrors.length > 0 ||
                    csvDuplicateErrors.length > 0 ||
                    csvMasterErrors.length > 0
                  }
                  className={`rounded-lg px-6 py-2 font-semibold text-white ${
                    csvImportRows.length === 0 ||
                    csvValidationErrors.length > 0 ||
                    csvDuplicateErrors.length > 0 ||
                    csvMasterErrors.length > 0
                      ? "bg-gray-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  取込確認へ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}