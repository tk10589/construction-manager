"use client";

import { Project } from "@/types/project";

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
    <div className="max-h-[calc(100vh-260px)] overflow-auto overscroll-contain rounded-lg border border-gray-300">
      <table className="min-w-[1800px] table-fixed border-collapse bg-white text-sm">
        <thead className="sticky top-0 z-40 bg-gray-100 text-left text-gray-900">
          <tr>
            <th
              className="sticky top-0 left-0 z-50 w-[130px] min-w-[130px] bg-gray-100  px-4 py-3 font-bold text-left cursor-pointer hover:bg-gray-200"
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
            <th className="sticky top-0 left-[120px] z-50 w-[100px] min-w-[100px] bg-gray-100 px-4 py-3 font-bold">
              種別
              </th>
            <th className="sticky top-0 left-[220px] z-50 w-[260px] min-w-[260px] bg-gray-100 px-4 py-3 font-bold truncate">
              案件名
              </th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">受注日</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">発注者</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">担当者</th>
            <th
              className="sticky top-0 z-40 px-4 py-3 font-bold text-center cursor-pointer hover:bg-gray-200"
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
            <th className="sticky top-0 z-40 px-4 py-3 font-bold text-center">実行予算</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold text-center">原価率</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold text-center">粗利</th>            
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">着工日</th>
            <th className="sticky top-0 z-40 px-4 py-3 font-bold">完了日</th>
            <th className="sticky top-0 z-40 w-[100px] min-w-[100px] px-4 py-3 font-bold whitespace-nowrap">進捗</th>
            <th className="sticky top-0 right-0 z-40 w-[130px] min-w-[130px] bg-gray-100 px-4 py-3 font-bold text-center">
              操作
            </th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-t border-gray-200">
              <td className="sticky left-0 z-30 w-[120px] min-w-[120px] bg-white px-4 py-3 font-semibold text-gray-900">
                {project.code}
              </td>
              <td className="sticky left-[120px] z-30 w-[100px] min-w-[100px] bg-white px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(
                    project.type
                  )}`}
                >
                  {project.type}
                </span>
              </td>
              <td
                className="sticky left-[220px] z-30 w-[260px] min-w-[260px] bg-white px-4 py-3 font-semibold text-blue-600 cursor-pointer hover:underline"
                onClick={() => setSelectedProject(project)}
              >
                {project.name}
              </td>
              <td className="px-4 py-3 text-sm">
                {project.orderDate
                  ? new Date(project.orderDate).toLocaleDateString()
                  : "-"}
              </td>
              <td className="px-4 py-3 text-gray-800">{project.client}</td>
              <td className="px-4 py-3 text-gray-800">{project.manager}</td>
              <td className="px-4 py-3 font-semibold text-gray-900 text-center">
                ¥{project.amount.toLocaleString() || 0}
              </td>
              <td className="px-4 py-3 text-center">
                {project.budget
                  ? `¥${project.budget.toLocaleString()}`
                  : "-"}
              </td>

              {/* 原価率 */}
              <td className="px-4 py-3 text-center text-sm text-gray-700">
                {project.budget && project.amount > 0
                  ? `${((project.budget / project.amount) * 100).toFixed(1)}%`
                  : "-"}
              </td>

              {/* 粗利計算 */}
              <td className="px-4 py-3 text-center font-semibold text-gray-900">
                {project.budget
                  ? `¥${(project.amount - project.budget).toLocaleString()}`
                  : "-"}
              </td>
              
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
              <td className="sticky right-0 z-30 w-[130px] min-w-[130px] bg-white px-4 py-3 text-center shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.2)]">
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
    </div>
  );
}