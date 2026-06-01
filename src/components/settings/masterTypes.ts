import { MasterItem, ProjectType, FiscalYear } from "@/types/project";

export type MasterTarget =
  | "type"
  | "client"
  | "staff"
  | "fiscalYear";

export type MasterAction =
  | "add"
  | "edit"
  | "delete"
  | "list";

export type MasterDataItem =
  | MasterItem
  | ProjectType
  | FiscalYear;

export const isProjectType = (
  item: MasterDataItem
): item is ProjectType => {
  return "code" in item;
};

export const isFiscalYear = (
  item: MasterDataItem
): item is FiscalYear => {
  return "year" in item && "endMonth" in item;
};