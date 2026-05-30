import { Project } from "@/types/project";

export const getTotalAmount = (project: Project) => {
  return project.amount + (project.additionalAmount ?? 0);
};

export const getExecutionBudget = (project: Project) => {
  return (
    (project.materialCost ?? 0) +
    (project.laborCost ?? 0) +
    (project.expenseCost ?? 0) +
    (project.outsourceCost ?? 0)
  );
};

export const getGrossProfit = (project: Project) => {
  return getTotalAmount(project) - getExecutionBudget(project);
};

export const getCostRate = (project: Project) => {
  const totalAmount = getTotalAmount(project);

  if (totalAmount <= 0) return null;

  return getExecutionBudget(project) / totalAmount;
};