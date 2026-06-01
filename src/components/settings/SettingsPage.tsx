"use client";

import { useEffect, useState } from "react";
import { MasterItem, ProjectType, FiscalYear } from "@/types/project";
import MasterRow from "./MasterRow";
import MasterModal from "./MasterModal";

type SettingsPageProps = {
  onMasterUpdated: () => void | Promise<void>;
};

export default function SettingsPage({
  onMasterUpdated,
}: SettingsPageProps) {

  const [clients, setClients] = useState<MasterItem[]>([]);
  const [clientName, setClientName] = useState("");
  const [staffs, setStaffs] = useState<MasterItem[]>([]);
  const [staffName, setStaffName] = useState("");
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [editingClientName, setEditingClientName] = useState("");
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editingStaffName, setEditingStaffName] = useState("");

  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [typeCode, setTypeCode] = useState("");
  const [typeName, setTypeName] = useState("");

  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editingTypeCode, setEditingTypeCode] = useState("");
  const [editingTypeName, setEditingTypeName] = useState("");

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);

  const [masterModal, setMasterModal] = useState<{
    target: "type" | "client" | "staff" | "fiscalYear";
    action: "add" | "edit" | "delete" | "list";
  } | null>(null);

  // 種別追加関数
  const addProjectType = async () => {
    if (!typeCode.trim() || !typeName.trim()) {
      alert("種別コードと種別名を入力してください");
      return;
    }

    await fetch("/api/project-types", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: typeCode,
        name: typeName,
      }),
    });

    setTypeCode("");
    setTypeName("");

    await fetchProjectTypes();
    onMasterUpdated();
  };

  // 種別取得関数
  const fetchProjectTypes = async () => {
    const res = await fetch("/api/project-types");
    const data = await res.json();

    setProjectTypes(data);
  };

  // 種別編集関数
  const updateProjectType = async (id: number) => {
    if (!editingTypeCode.trim() || !editingTypeName.trim()) {
      alert("種別コードと種別名を入力してください");
      return;
    }

    await fetch(`/api/project-types/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: editingTypeCode,
        name: editingTypeName,
      }),
    });

    setEditingTypeId(null);
    setEditingTypeCode("");
    setEditingTypeName("");

    await fetchProjectTypes();
    onMasterUpdated();
  };

  // 種別削除関数
  const deleteProjectType = async (id: number) => {
    const ok = confirm("この種別を削除しますか？");

    if (!ok) return;

    const response = await fetch(
      `/api/project-types/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();

      alert(
        errorData.error ||
          "種別の削除に失敗しました"
      );

      return;
    }

    await fetchProjectTypes();
    onMasterUpdated();
  };

  // 発注者取得関数
  const fetchClients = async () => {
    const response = await fetch("/api/clients");
    const data = await response.json();

    setClients(data);
  };

  // 担当者取得関数
  const fetchStaffs = async () => {
    const response = await fetch("/api/staffs");
    const data = await response.json();

    setStaffs(data);
  };

  // 年度取得関数
  const fetchFiscalYears = async () => {
    const response = await fetch("/api/fiscal-years");
    const data = await response.json();

    setFiscalYears(data);
  };

  // 発注者追加関数
  const addClient = async () => {
    if (!clientName) return;

    await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: clientName,
      }),
    });

    setClientName("");
    await fetchClients();
    onMasterUpdated();
  };

  // 担当者追加関数
  const addStaff = async () => {
    if (!staffName) return;

    await fetch("/api/staffs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: staffName,
      }),
    });

    setStaffName("");
    await fetchStaffs();
    onMasterUpdated();
  };

  // 発注者削除関数
  const deleteClient = async (id: number) => {
    const ok = confirm("この発注者を削除しますか？");

    if (!ok) return;

    const response = await fetch(`/api/clients/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();

      alert(
        errorData.error ||
          "発注者の削除に失敗しました"
      );

      return;
    }

    await fetchClients();
    onMasterUpdated();
  };

  // 担当者削除関数
  const deleteStaff = async (id: number) => {
    const ok = confirm("この担当者を削除しますか？");

    if (!ok) return;

    const response = await fetch(`/api/staffs/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();

      alert(
        errorData.error ||
          "担当者の削除に失敗しました"
      );

      return;
    }

    await fetchStaffs();
    onMasterUpdated();
  };

  // 発注者編集関数
  const updateClient = async (id: number) => {
    if (!editingClientName.trim()) return;

    await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: editingClientName,
      }),
    });

    setEditingClientId(null);
    setEditingClientName("");
    await fetchClients();
    await fetchFiscalYears();
    onMasterUpdated();
  };

  // 担当者編集関数
  const updateStaff = async (id: number) => {
    if (!editingStaffName.trim()) return;

    await fetch(`/api/staffs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: editingStaffName,
      }),
    });

    setEditingStaffId(null);
    setEditingStaffName("");
    await fetchStaffs();
    await fetchFiscalYears();
    onMasterUpdated();
  };

  useEffect(() => {
    fetchProjectTypes();
    fetchClients();
    fetchStaffs();
    fetchFiscalYears();
  }, []);

  return (
    
    <div className="space-y-6">
      <div className="space-y-3">
        <MasterRow
          title="種別管理"
          onAdd={() =>
            setMasterModal({
              target: "type",
              action: "add",
            })
          }
          onEdit={() =>
            setMasterModal({
              target: "type",
              action: "edit",
            })
          }
          onDelete={() =>
            setMasterModal({
              target: "type",
              action: "delete",
            })
          }
          onList={() =>
            setMasterModal({
              target: "type",
              action: "list",
            })
          }
        />

        <MasterRow
          title="発注者管理"
          onAdd={() =>
            setMasterModal({
              target: "client",
              action: "add",
            })
          }
          onEdit={() =>
            setMasterModal({
              target: "client",
              action: "edit",
            })
          }
          onDelete={() =>
            setMasterModal({
              target: "client",
              action: "delete",
            })
          }
          onList={() =>
            setMasterModal({
              target: "client",
              action: "list",
            })
          }
        />

        <MasterRow
          title="担当者管理"
          onAdd={() =>
            setMasterModal({
              target: "staff",
              action: "add",
            })
          }
          onEdit={() =>
            setMasterModal({
              target: "staff",
              action: "edit",
            })
          }
          onDelete={() =>
            setMasterModal({
              target: "staff",
              action: "delete",
            })
          }
          onList={() =>
            setMasterModal({
              target: "staff",
              action: "list",
            })
          }
        />

        <MasterRow
          title="年度管理"
          onAdd={() =>
            setMasterModal({
              target: "fiscalYear",
              action: "add",
            })
          }
          onEdit={() =>
            setMasterModal({
              target: "fiscalYear",
              action: "edit",
            })
          }
          onDelete={() =>
            setMasterModal({
              target: "fiscalYear",
              action: "delete",
            })
          }
          onList={() =>
            setMasterModal({
              target: "fiscalYear",
              action: "list",
            })
          }
        />
      </div>
    
      {masterModal && (
        <MasterModal
          target={masterModal.target}
          action={masterModal.action}
          clients={clients}
          staffs={staffs}
          projectTypes={projectTypes}
          fiscalYears={fiscalYears}
          onClose={() => setMasterModal(null)}
          onMasterUpdated={async () => {
            await fetchClients();
            await fetchStaffs();
            await fetchProjectTypes();
            await fetchFiscalYears();
            onMasterUpdated();
          }}
        />
      )}
      
    </div>
  );
}