"use client";

import { useEffect, useMemo, useState } from "react";
import { getLguRepo } from "@/lib/repos/lgu";
import type {
  CreateLguInput,
  LguRecord,
  LguStatus,
  LguType,
  UpdateLguInput,
} from "@/lib/repos/lgu";

export type TypeFilter = "all" | LguType;
export type StatusFilter = "all" | LguStatus;

export function useLguManagement() {
  const repo = useMemo(() => getLguRepo(), []);

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

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await repo.list();
        if (!isActive) return;
        setLgus(rows);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load LGUs.");
      } finally {
        if (isActive) setLoading(false);
      }
    }

    load();
    return () => {
      isActive = false;
    };
  }, [repo]);

  const selected = useMemo(
    () => (selectedId ? lgus.find((lgu) => lgu.id === selectedId) ?? null : null),
    [lgus, selectedId]
  );

  const cityOptions = useMemo(
    () =>
      lgus
        .filter((lgu) => lgu.type === "city")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [lgus]
  );

  const filteredLgus = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lgus.filter((lgu) => {
      if (typeFilter !== "all" && lgu.type !== typeFilter) return false;
      if (statusFilter !== "all" && lgu.status !== statusFilter) return false;

      if (!q) return true;
      return lgu.name.toLowerCase().includes(q) || lgu.code.toLowerCase().includes(q);
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
    const created = await repo.create(input);
    setLgus((prev) => [created, ...prev]);
    return created;
  }

  async function editLgu(id: string, patch: UpdateLguInput) {
    const updated = await repo.update(id, patch);
    setLgus((prev) => prev.map((row) => (row.id === id ? updated : row)));
    return updated;
  }

  async function setStatus(id: string, status: LguStatus) {
    const updated = await repo.setStatus(id, status);
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
    cityOptions,

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
