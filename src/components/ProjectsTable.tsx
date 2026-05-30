"use client";

import { Project } from "@/types/project";
import { useState } from "react";
import {
  getTotalAmount,
  getExecutionBudget,
  getGrossProfit,
  getCostRate,
} from "@/lib/projectCalculations";

type ProjectsTableProps = {
  projects: Project[];
  sortKey: "code" | "amount";
  setSortKey: React.Dispatch<React.SetStateAction<"code" | "amount">>;
  sortOrder: "asc" | "desc";
  setSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  onEdit: (project: Project) => void;
  setDeletingProject: (project: Project) => void;
  setSelectedProject: React.Dispatch<
    React.SetStateAction<Project | null>
  >;
};

export default function ProjectsTable({
  projects,
  sortKey,
  setSortKey,
  sortOrder,
  setSortOrder,
  onEdit,
  setDeletingProject,
  setSelectedProject,
}: ProjectsTableProps) {

  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-gray-300 p-6 text-gray-700">
        登録されている案件はありません。
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "F":
        return "bg-red-100 text-red-700";
      case "FE":
        return "bg-orange-100 text-orange-700";
      case "E":
        return "bg-blue-100 text-blue-700";
      case "MM":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="h-full min-h-[260px] overflow-auto overscroll-contain rounded-lg border border-gray-300">
      <table className="min-w-[2200px] lg:min-w-[2500px] table-fixed border-collapse bg-white text-xs lg:text-sm">
        <thead className="sticky top-0 z-40 bg-gray-100 text-left text-gray-900">
          <tr>
            <th
              className="sticky top-0 left-0 z-50 w-[120px] min-w-[120px] bg-gray-100 px-4 py-3 font-bold text-left cursor-pointer hover:bg-gray-200"
              onClick={() => {
                if (sortKey === "code") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortKey("code");
                  setSortOrder("asc");
                }
              }}
            >
              案件番号 {sortKey === "code" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="lg:sticky lg:top-0 lg:left-[120px] lg:z-50 w-[100px] min-w-[100px] bg-gray-100 px-4 py-3 font-bold">
              種別
              </th>
            <th className="lg:sticky lg:top-0 lg:left-[220px] lg:z-50 w-[260px] min-w-[260px] bg-gray-100 px-4 py-3 font-bold truncate">
              案件名
              </th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">受注日</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">発注者</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">
              発注者担当
            </th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">
              営業担当
            </th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">担当者</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">
              外注依頼先
            </th>
            <th
              className="sticky top-0 z-40 w-[120px] min-w-[120px] bg-gray-100 px-4 py-3 font-bold text-right"
              onClick={() => {
                if (sortKey === "amount") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortKey("amount");
                  setSortOrder("asc");
                }
              }}
            >
              受注金額 {sortKey === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="sticky top-0 z-40 w-[120px] min-w-[120px] bg-gray-100 px-4 py-3 font-bold text-right">
              追加受注
            </th>

            <th className="sticky top-0 z-40 w-[120px] min-w-[120px] bg-gray-100 px-4 py-3 font-bold text-right">
              売上合計
            </th>

            <th className="sticky top-0 z-40 w-[120px] min-w-[120px] bg-gray-100 px-4 py-3 font-bold text-right">
              実行予算
            </th>

            <th className="sticky top-0 z-40 w-[100px] min-w-[100px] bg-gray-100 px-4 py-3 font-bold text-right">
              原価率
            </th>

            <th className="sticky top-0 z-40 w-[120px] min-w-[120px] bg-gray-100 px-4 py-3 font-bold text-center">
              粗利
            </th>           
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">着工日</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">完了日</th>
            <th className="sticky top-0 z-40 w-[100px] min-w-[100px] px-4 py-3 font-bold whitespace-nowrap">進捗</th>
            <th className="sticky top-0 z-40 w-[180px] min-w-[180px] px-4 py-3 font-bold">
              備考
            </th>
            <th className="lg:sticky lg:top-0 lg:right-0 lg:z-50 w-[130px] min-w-[130px] bg-gray-100 px-4 py-3 font-bold text-center">
              操作
            </th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-t border-gray-200">
              {/* 案件番号 */}
              <td className="sticky left-0 z-30 w-[120px] min-w-[120px] bg-white px-4 py-3 font-semibold text-gray-900">
                {project.code}
              </td>
              {/* 種別 */}
              <td className="lg:sticky lg:left-[120px] lg:z-30 w-[100px] min-w-[100px] bg-white px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(
                    project.type
                  )}`}
                >
                  {project.type}
                </span>
              </td>
              {/* 案件名 */}
              <td
                className="sticky left-[220px] z-30 w-[260px] min-w-[260px] bg-white px-4 py-3 font-semibold text-blue-600 cursor-pointer hover:underline"
                onClick={() => setSelectedProject(project)}
              >
                {project.name}
              </td>
              {/* 受注日 */}
              <td className="px-4 py-3 text-sm">
                {project.orderDate
                  ? new Date(project.orderDate).toLocaleDateString()
                  : "-"}
              </td>
              {/* 発注者 */}
              <td className="px-4 py-3 text-gray-800">{project.client}</td>
              {/* 発注者担当者 */}
              <td className="px-4 py-3 text-gray-800">
                {project.clientStaff || "-"}
              </td>
              {/* 営業担当 */}
              <td className="px-4 py-3 text-gray-800">
                {project.salesStaff || "-"}
              </td>
              {/* 現場担当 */}
              <td className="px-4 py-3 text-gray-800">{project.manager}</td>
              {/* 外注依頼先 */}
              <td className="px-4 py-3 text-gray-800">
                {project.outsourceCompany || "-"}
              </td>
              {/* 受注金額 */}
              <td className="w-[120px] min-w-[120px] px-4 py-3 text-right">
                ¥{project.amount.toLocaleString("ja-JP")}
              </td>

              {/* 追加受注 */}
              <td className="w-[120px] min-w-[120px] px-4 py-3 text-right">
                {project.additionalAmount !== undefined &&
                project.additionalAmount !== null
                  ? `¥${project.additionalAmount.toLocaleString("ja-JP")}`
                  : "-"}
              </td>

              {/* 売上合計 */}
              <td className="w-[120px] min-w-[120px] px-4 py-3 text-right font-semibold">
                ¥{getTotalAmount(project).toLocaleString("ja-JP")}
              </td>

              {/* 実行予算 */}
              <td className="w-[120px] min-w-[120px] px-4 py-3 text-right">
                ¥{getExecutionBudget(project).toLocaleString("ja-JP")}
              </td>

              {/* 外注費 */}
              {/* <td className="px-4 py-3 text-center">
                {project.outsourceCost !== undefined &&
                project.outsourceCost !== null
                  ? `¥${project.outsourceCost.toLocaleString()}`
                  : "-"}
              </td> */}

              {/* 原価率 */}
              <td className="w-[100px] min-w-[100px] px-4 py-3 text-right">
                {getCostRate(project) !== null
                  ? `${(getCostRate(project)! * 100).toFixed(1)}%`
                  : "-"}
              </td>

              {/* 原価率 */}
              {/* <td className="px-4 py-3 text-center text-sm text-gray-700">
                {project.budget && project.amount > 0
                  ? `${((project.budget / project.amount) * 100).toFixed(1)}%`
                  : "-"}
              </td> */}

              {/* 粗利計算 */}
              <td className="w-[120px] min-w-[120px] px-4 py-3 text-right font-semibold">
                ¥{getGrossProfit(project).toLocaleString("ja-JP")}
              </td>

              {/* <td className="px-4 py-3 text-center font-semibold text-gray-900">
                {project.budget
                  ? `¥${(project.amount - project.budget).toLocaleString()}`
                  : "-"}
              </td> */}
              
              <td className="px-4 py-3 text-sm">
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString()
                  : "-"}
              </td>

              <td className="px-4 py-3 text-sm">
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : "-"}
              </td>
              <td className="w-[100px] min-w-[100px] px-4 py-3 whitespace-nowrap">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                  {project.status}
                </span>
              </td>
              {/* 備考 */}
              <td className="w-[180px] min-w-[180px] px-4 py-3 text-sm">
                {project.note ? (
                  <button
                    type="button"
                    onClick={() => setSelectedNote(project.note || "")}
                    className="max-w-[160px] truncate text-left text-blue-600 hover:underline"
                    title={project.note}
                  >
                    {project.note.length > 10
                      ? `${project.note.slice(0, 10)}...`
                      : project.note}
                  </button>
                ) : (
                  "-"
                )}
              </td>
              <td className="lg:sticky lg:right-0 lg:z-30 w-[130px] min-w-[130px] bg-white px-4 py-3 text-center lg:shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.2)]">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onEdit(project)}
                    className="rounded-lg bg-green-600 px-1 py-2 text-xs font-bold text-white hover:bg-green-700"
                  >
                    編集
                  </button>

                  <button
                    onClick={() => setDeletingProject(project)}
                    className="rounded-lg bg-red-500 px-1 py-2 text-xs font-bold text-white hover:bg-red-600"
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedNote && (
        <div
          className="fixed inset-0 z-[120] flex touch-none items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedNote(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg touch-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">
              備考
            </h2>

            <div className="mt-4 max-h-[50vh] overflow-y-auto overscroll-contain whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
              {selectedNote}
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedNote(null)}
                className="rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}