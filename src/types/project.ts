export type Project = {
  id: number;
  code: string;
  type: string;
  name: string;

  client: string;
  manager: string;

  salesStaff?: string;
  clientStaff?: string;

  outsourceCompany?: string;
  outsourceCost?: number;

  additionalAmount?: number;

  materialCost?: number;
  laborCost?: number;
  expenseCost?: number;

  amount: number;
  budget?: number;

  status: string;

  note?: string;

  orderDate?: string;
  startDate?: string;
  endDate?: string;
};

export type MasterItem = {
  id: number;
  name: string;
};

export type ProjectType = {
  id: number;
  code: string;
  name: string;
};

export type FormErrors = {
  code?: string;
  type?: string;
  name?: string;
  client?: string;
  manager?: string;
  amount?: string;
};