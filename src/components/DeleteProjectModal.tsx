"use client";

import { Project } from "@/types/project";

type DeleteProjectModalProps = {
  project: Project;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function DeleteProjectModal({
  project,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteProjectModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900">
          削除確認
        </h2>

        <p className="mt-3 text-gray-700">
          本当に削除しますか？
        </p>

        <div className="mt-4 rounded-md bg-gray-100 p-3 text-sm">
          <p>案件番号：{project.code}</p>
          <p>案件名：{project.name}</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
            disabled={isDeleting}
          >
            キャンセル
          </button>

          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-white"
            disabled={isDeleting}
          >
            {isDeleting ? "削除中..." : "削除する"}
          </button>
        </div>
      </div>
    </div>
  );
}