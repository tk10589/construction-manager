"use client";

import { MasterItem, ProjectType, FiscalYear } from "@/types/project";
import {
  MasterAction,
  MasterTarget,
} from "./masterTypes";
import MasterListView from "./MasterListView";
import MasterAddView from "./MasterAddView";
import MasterEditView from "./MasterEditView";
import MasterDeleteView from "./MasterDeleteView";

type MasterModalProps = {
  target: MasterTarget;
  action: MasterAction;
  clients: MasterItem[];
  staffs: MasterItem[];
  projectTypes: ProjectType[];
  onClose: () => void;
  onMasterUpdated: () => void | Promise<void>;
  fiscalYears: FiscalYear[];
};

export default function MasterModal({
  target,
  action,
  clients,
  staffs,
  projectTypes,
  fiscalYears,
  onClose,
  onMasterUpdated,
}: MasterModalProps) {
  const titleMap = {
    type: "種別",
    client: "発注者",
    staff: "担当者",
    fiscalYear: "年度",
  };

  const actionMap = {
    add: "追加",
    edit: "編集",
    delete: "削除",
    list: "登録内容一覧",
  };

  const items =
    target === "type"
      ? projectTypes
      : target === "client"
      ? clients
      : target === "staff"
      ? staffs
      : fiscalYears;

  const baseUrl =
    target === "type"
      ? "/api/project-types"
      : target === "client"
      ? "/api/clients"
      : target === "staff"
      ? "/api/staffs"
      : "/api/fiscal-years";

  return (
    <div
      className="fixed inset-0 z-[100] flex touch-none items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative z-[110] w-full max-w-lg max-h-[85vh] overflow-hidden rounded-xl bg-white p-6 shadow-xl touch-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900">
          {titleMap[target]}管理 - {actionMap[action]}
        </h2>

        <div className="mt-4 max-h-[60vh] overflow-y-auto overscroll-contain">
          {action === "list" && (
            <MasterListView items={items} />
          )}

          {action === "add" && (
            <MasterAddView
              target={target}
              baseUrl={baseUrl}
              onClose={onClose}
              onMasterUpdated={onMasterUpdated}
            />
          )}

          {action === "edit" && (
            <MasterEditView
              target={target}
              baseUrl={baseUrl}
              items={items}
              onMasterUpdated={onMasterUpdated}
            />
          )}

          {action === "delete" && (
            <MasterDeleteView
              baseUrl={baseUrl}
              items={items}
              onMasterUpdated={onMasterUpdated}
            />
          )}
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}