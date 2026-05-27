import { MasterItem, ProjectType } from "@/types/project";

export type MasterTarget = "type" | "client" | "staff";
export type MasterAction = "add" | "edit" | "delete" | "list";

export type MasterDataItem = MasterItem | ProjectType;

export const isProjectType = (
  item: MasterDataItem
): item is ProjectType => {
  return "code" in item;
};