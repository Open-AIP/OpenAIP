"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditLog } from "@/types";
import { getAuditEvents, getAuditYears } from "@/mock/audit";
import { Search } from "lucide-react";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AuditView({ logs }: { logs: AuditLog[] }) {
  const years = useMemo(() => getAuditYears(logs), [logs]);
  const events = useMemo(() => getAuditEvents(logs), [logs]);

  const [year, setYear] = useState<string>(String(years[0] ?? "all"));
  const [event, setEvent] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return logs
      .filter((x) => (year === "all" ? true : x.year === Number(year)))
      .filter((x) => (event === "all" ? true : x.event === event))
      .filter((x) => {
        if (!q) return true;
        return (
          x.name.toLowerCase().includes(q) ||
          x.position.toLowerCase().includes(q) ||
          x.event.toLowerCase().includes(q) ||
          x.details.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.dateTimeISO < b.dateTimeISO ? 1 : -1));
  }, [logs, year, event, query]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Audit and Accountability</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review recorded actions and events for transparency, compliance tracking, and accountability.
        </p>
      </div>

      {/* Filters bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">Year</div>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-500">Events</div>
            <Select value={event} onValueChange={setEvent}>
              <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-500">Search</div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or keyword"
                className="h-11 pl-9 bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-slate-500">Showing {filtered.length} events</div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[180px]">NAME</TableHead>
              <TableHead className="w-[200px]">POSITION</TableHead>
              <TableHead className="w-[170px]">EVENT</TableHead>
              <TableHead className="w-[240px]">DATE &amp; TIME</TableHead>
              <TableHead>DETAILS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id} className="border-slate-200">
                <TableCell className="font-medium text-slate-900 p-4">
                  {row.name}
                </TableCell>
                <TableCell className="text-slate-600">{row.position}</TableCell>
                <TableCell className="text-slate-900">{row.event}</TableCell>
                <TableCell className="text-slate-600">
                  {formatDateTime(row.dateTimeISO)}
                </TableCell>
                <TableCell className="text-slate-600">{row.details}</TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                  No events found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
