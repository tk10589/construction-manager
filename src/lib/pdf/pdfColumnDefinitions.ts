import { Project } from "@/types/project";

// PDF列定義
export const pdfColumnDefinitions = [
  {
    key: "code",
    label: "案件番号",
    widthA4: 55,
    widthA3: 70,
    getValue: (project: Project) => project.code,
  },
  {
    key: "type",
    label: "種別",
    widthA4: 20,
    widthA3: 25,
    getValue: (project: Project) => project.type || "",
  },
  {
    key: "name",
    label: "案件名",
    widthA4: "*",
    widthA3: "*",
    getValue: (project: Project) => project.name,
  },
  {
    key: "client",
    label: "発注者",
    widthA4: 100,
    widthA3: 120,
    getValue: (project: Project) => project.client,
  },
  {
    key: "manager",
    label: "担当者",
    widthA4: 60,
    widthA3: 70,
    getValue: (project: Project) => project.manager,
  },
  {
    key: "clientStaff",
    label: "発注者担当",
    widthA4: 60,
    widthA3: 70,
    getValue: (project: Project) =>
      project.clientStaff ?? "",
  },
  {
    key: "amount",
    label: "受注金額",
    widthA4: 50,
    widthA3: 60,
    getValue: (project: Project) => ({
      text: `¥${project.amount.toLocaleString("ja-JP")}`,
      alignment: "right",
    }),
  },
  {
    key: "budget",
    label: "予算",
    widthA4: 50,
    widthA3: 60,
    getValue: (project: Project) => ({
      text: `¥${(project.budget ?? 0).toLocaleString("ja-JP")}`,
      alignment: "right",
    }),
  },
  {
    key: "salesStaff",
    label: "営業担当",
    widthA4: 70,
    widthA3: 90,
    getValue: (project: Project) =>
      project.salesStaff ?? "",
  },
  {
    key: "status",
    label: "進捗",
    widthA4: 30,
    widthA3: 35,
    getValue: (project: Project) => project.status || "",
  },
  {
    key: "orderDate",
    label: "受注日",
    widthA4: 40,
    widthA3: 50,
    getValue: (project: Project) =>
      project.orderDate
        ? new Date(project.orderDate).toLocaleDateString("ja-JP")
        : "",
  },
  {
    key: "startDate",
    label: "着工日",
    widthA4: 40,
    widthA3: 50,
    getValue: (project: Project) =>
      project.startDate
        ? new Date(project.startDate).toLocaleDateString("ja-JP")
        : "",
  },
  {
    key: "endDate",
    label: "完了日",
    widthA4: 40,
    widthA3: 50,
    getValue: (project: Project) =>
      project.endDate
        ? new Date(project.endDate).toLocaleDateString("ja-JP")
        : "",
  },
] as const;