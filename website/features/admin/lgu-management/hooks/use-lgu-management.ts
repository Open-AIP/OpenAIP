"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createLguAction,
  listLgusAction,
  setLguStatusAction,
  updateLguAction,
} from "../actions/lgu-management.actions";
import type {
  CreateLguInput,
  LguRecord,
  LguStatus,
  LguType,
  UpdateLguInput,
} from "@/lib/repos/lgu/repo";

export type TypeFilter = "all" | LguType;
export type StatusFilter = "all" | LguStatus;

export function useLguManagement() {
  const [lgus, setLgus] = useState<LguRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listLgusAction();
      setLgus(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load LGUs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => (selectedId ? lgus.find((lgu) => lgu.id === selectedId) ?? null : null),
    [lgus, selectedId]
  );

  const filteredLgus = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lgus.filter((lgu) => {
      if (typeFilter !== "all" && lgu.type !== typeFilter) return false;
      if (statusFilter !== "all" && lgu.status !== statusFilter) return false;

      if (!q) return true;
      return (
        lgu.name.toLowerCase().includes(q) ||
        lgu.code.toLowerCase().includes(q) ||
        (lgu.parentName ?? "").toLowerCase().includes(q)
      );
    });
  }, [lgus, query, typeFilter, statusFilter]);

  function openAdd() {
    setSelectedId(null);
    setAddOpen(true);
  }

  function openEdit(id: string) {
    setSelectedId(id);
    setEditOpen(true);
  }

  function openDeactivate(id: string) {
    setSelectedId(id);
    setDeactivateOpen(true);
  }

  async function addLgu(input: CreateLguInput) {
    const created = await createLguAction(input);
    setLgus((prev) => [created, ...prev]);
    return created;
  }

  async function editLgu(id: string, patch: UpdateLguInput) {
    const updated = await updateLguAction(id, patch);
    setLgus((prev) => prev.map((row) => (row.id === id ? updated : row)));
    return updated;
  }

  async function setStatus(id: string, status: LguStatus) {
    const updated = await setLguStatusAction(id, status);
    setLgus((prev) => prev.map((row) => (row.id === id ? updated : row)));
    return updated;
  }

  return {
    lgus,
    loading,
    error,

    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,

    filteredLgus,

    addOpen,
    setAddOpen,
    editOpen,
    setEditOpen,
    deactivateOpen,
    setDeactivateOpen,

    selected,

    openAdd,
    openEdit,
    openDeactivate,

    addLgu,
    editLgu,
    setStatus,
  };
}
