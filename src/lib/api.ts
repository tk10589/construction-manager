import { Project } from "@/types/project";
import { FiscalYear } from "@/types/project";

export const fetchProjectsApi = async (
  keyword: string
): Promise<Project[]> => {
  const res = await fetch(`/api/projects?q=${keyword}`);

  if (!res.ok) {
    throw new Error("案件一覧の取得に失敗しました");
  }

  return res.json();
};

export const fetchClientsApi = async () => {
  const res = await fetch("/api/clients");

  if (!res.ok) {
    throw new Error("発注者一覧の取得に失敗しました");
  }

  return res.json();
};

export const fetchStaffsApi = async () => {
  const res = await fetch("/api/staffs");

  if (!res.ok) {
    throw new Error("担当者一覧の取得に失敗しました");
  }

  return res.json();
};

export const fetchProjectTypesApi = async () => {
  const res = await fetch("/api/project-types");

  if (!res.ok) {
    throw new Error("種別一覧の取得に失敗しました");
  }

  return res.json();
};

export const createProjectApi = async (
  project: Omit<Project, "id">
): Promise<Project> => {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(project),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.error || "案件の登録に失敗しました。"
    );
  }

  return res.json();
};

export const updateProjectApi = async (
  project: Project
): Promise<Project> => {
  const res = await fetch(`/api/projects/${project.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(project),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.error || "案件の更新に失敗しました。"
    );
  }

  return res.json();
};

export const deleteProjectApi = async (
  id: number
): Promise<void> => {
  const res = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("案件の削除に失敗しました");
  }
};

export const fetchFiscalYearsApi = async (): Promise<FiscalYear[]> => {
  const res = await fetch("/api/fiscal-years");

  if (!res.ok) {
    throw new Error("年度一覧の取得に失敗しました");
  }

  return res.json();
};