"use client";

import { useEffect, useRef, useState } from "react";

type MasterCsvImportModalProps = {
  title: string;
  existingNames: string[];
	csvHeader: string;
	onImport: (names: string[]) => Promise<void>;
	onImported: () => Promise<void>;
	onClose: () => void;
};

export default function MasterCsvImportModal({
  title,
	existingNames,
	csvHeader,
	onImport,
	onImported,
  onClose,
}: MasterCsvImportModalProps) {
	const [importRows, setImportRows] = useState<string[]>([]);
	const [importError, setImportError] = useState("");
	const [selectedFileName, setSelectedFileName] = useState("");
	const [duplicateNames, setDuplicateNames] = useState<string[]>([]);

	const [isConfirmMode, setIsConfirmMode] = useState(false);
	const [isImporting, setIsImporting] = useState(false);	
	const [isResultMode, setIsResultMode] = useState(false);
	const [importResult, setImportResult] =
		useState<{
			imported: string[];
			skipped: number;
		} | null>(null);

	// 登録予定一覧取得
	const importTargets = importRows
		.slice(1)
		.filter(
			(name) =>
				!duplicateNames.includes(name)
		);
		
	// CSVインポート関数
	const handleImport = async () => {
		try {
			setIsImporting(true);

			await onImport(importTargets);

			await onImported();

			setImportResult({
				imported: importTargets,
				skipped: duplicateNames.length,
			});

			setIsConfirmMode(false);
			setIsResultMode(true);

			await onImported();

			setImportResult({
				imported: importTargets,
				skipped: duplicateNames.length,
			});

			setIsConfirmMode(false);
			setIsResultMode(true);

		} catch (error) {
			console.error(error);

			alert("CSV取込に失敗しました");
		} finally {
			setIsImporting(false);
		}
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setImportError("");

		const file = event.target.files?.[0];

		if (!file) return;

		if (!file.name.endsWith(".csv")) {
			setImportError(
				"CSVファイルを選択してください"
			);
			return;
		}

		const text = await file.text();

		const rows = text
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);

		if (rows.length === 0) {
			setImportError(
				"CSVデータがありません"
			);
			return;
		}

		const header = rows[0]
			.replace(/^\uFEFF/, "")
			.replace(/^"|"$/g, "")
			.trim();

		if (header !== csvHeader) {
			setImportError(
				`CSVヘッダーが一致しません。「${csvHeader}」のCSVを選択してください`
			);
			return;
		}

		const dataRows = rows.slice(1);

		const duplicates = dataRows.filter((name) =>
			existingNames.includes(name)
		);

		setDuplicateNames(duplicates);

		setSelectedFileName(file.name);
		setImportRows(rows);
	};

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold">
            {title}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
					{isResultMode ? (
						<div className="space-y-4">
							<h3 className="text-lg font-bold">
								CSV取込完了
							</h3>

							<div className="grid grid-cols-2 gap-3">
								<div className="rounded-lg bg-green-100 p-3">
									<p className="text-xs text-gray-500">
										登録件数
									</p>

									<p className="font-bold">
										{importResult?.imported.length ?? 0}件
									</p>
								</div>

								<div className="rounded-lg bg-yellow-100 p-3">
									<p className="text-xs text-gray-500">
										スキップ件数
									</p>

									<p className="font-bold">
										{importResult?.skipped ?? 0}件
									</p>
								</div>
							</div>

							<div>
								<h4 className="font-bold">
									登録一覧
								</h4>

								<div className="mt-2 space-y-1">
									{importResult?.imported
										.slice(0, 10)
										.map((name) => (
											<div key={name}>
												✓ {name}
											</div>
										))}
								</div>
							</div>
						</div>
					) : isConfirmMode ? (
						<div className="space-y-4">
							<h3 className="text-lg font-bold">
								発注者CSV取込確認
							</h3>

							<div className="grid grid-cols-3 gap-3">
								<div className="rounded-lg bg-gray-100 p-3">
									<p className="text-xs text-gray-500">
										CSV件数
									</p>

									<p className="font-bold">
										{importRows.length - 1}件
									</p>
								</div>

								<div className="rounded-lg bg-green-100 p-3">
									<p className="text-xs text-gray-500">
										登録予定
									</p>

									<p className="font-bold">
										{importTargets.length}件
									</p>
								</div>

								<div className="rounded-lg bg-yellow-100 p-3">
									<p className="text-xs text-gray-500">
										スキップ予定
									</p>

									<p className="font-bold">
										{duplicateNames.length}件
									</p>
								</div>
							</div>

							<div>
								<h4 className="font-bold">
									登録予定一覧
								</h4>

								<div className="mt-2 space-y-1">
									{importTargets
										.slice(0, 10)
										.map((name) => (
											<div key={name}>
												✓ {name}
											</div>
										))}
								</div>
							</div>

							<div className="flex justify-end gap-3">
								<button
									onClick={() =>
										setIsConfirmMode(false)
									}
									className="rounded-lg border px-4 py-2"
								>
									戻る
								</button>

								{/* 登録中の多重クリック防止処理含む */}
								<button
									onClick={handleImport}
									disabled={
										isImporting ||
										importTargets.length === 0
									}
									className={`rounded-lg px-4 py-2 text-white ${
										isImporting || importTargets.length === 0
											? "bg-gray-400 cursor-not-allowed"
											: "bg-blue-600 hover:bg-blue-700"
									}`}
								>
									{importTargets.length === 0
										? "登録対象なし"
										: isImporting
										? "登録中..."
										: "登録実行"}
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<label
								className="
									inline-flex
									cursor-pointer
									rounded-lg
									bg-blue-600
									px-4
									py-2
									font-semibold
									text-white
									hover:bg-blue-700
								"
							>
								CSV選択

								<input
									type="file"
									accept=".csv"
									className="hidden"
									onChange={handleFileChange}
								/>
							</label>

							{selectedFileName && (
								<p className="text-sm text-gray-600">
									選択ファイル：
									{selectedFileName}
								</p>
							)}

							{importError && (
								<p className="text-sm font-semibold text-red-600">
									{importError}
								</p>
							)}

							{importRows.length > 0 && (
								<div className="grid grid-cols-3 gap-3">
									<div className="rounded-lg bg-gray-100 p-3">
										<p className="text-xs text-gray-500">
											CSV件数
										</p>

										<p className="font-bold">
											{importRows.length - 1}件
										</p>
									</div>

									<div className="rounded-lg bg-green-100 p-3">
										<p className="text-xs text-gray-500">
											登録予定
										</p>

										<p className="font-bold">
											{importRows.length - 1 - duplicateNames.length}件
										</p>
									</div>

									<div className="rounded-lg bg-yellow-100 p-3">
										<p className="text-xs text-gray-500">
											スキップ予定
										</p>

										<p className="font-bold">
											{duplicateNames.length}件
										</p>
									</div>
								</div>
							)}

							{importRows.length > 0 && (
								<div className="rounded-lg border p-3">
									<h3 className="mb-2 font-bold">
										CSVプレビュー
									</h3>

									<div className="space-y-1 text-sm">
										{importRows.slice(0, 10).map((row, index) => (
											<div key={index}>
												{row}
											</div>
										))}
									</div>
								</div>
							)}

							{importRows.length > 1 && (
								<div className="mt-4">
									<button
										onClick={() =>
											setIsConfirmMode(true)
										}
										className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
									>
										取込確認
									</button>
								</div>
							)}						
						</div>
					)}
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <button
					onClick={() => {
						setIsResultMode(false);
						onClose();
					}}
					className="rounded-lg bg-gray-500 px-4 py-2 text-white"
				>
					閉じる
				</button>
        </div>
      </div>
    </div>
  );
}