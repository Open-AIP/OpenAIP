"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { CommentCard } from "../components/comment-card";
import {
  getCommentsFilterOptions,
  listComments,
} from "../services/comments.service";
import type { Comment, CommentProjectOption } from "../types";

export default function CommentsView() {
  const [year, setYear] = useState("2026");
  const [project, setProject] = useState("all");
  const [status, setStatus] = useState<"all" | "no_response" | "responded">("all");
  const [query, setQuery] = useState("");
  const [years, setYears] = useState<number[]>([]);
  const [projects, setProjects] = useState<CommentProjectOption[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);

  const yearParam = useMemo(
    () => (year === "all" ? "all" : Number(year)),
    [year]
  );

  useEffect(() => {
    let isActive = true;

    async function loadFilters() {
      const options = await getCommentsFilterOptions();
      if (!isActive) return;
      setYears(options.years);
      setProjects(options.projects);
    }

    loadFilters();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadComments() {
      const result = await listComments({
        year: yearParam,
        projectId: project,
        status,
        q: query,
      });
      if (!isActive) return;
      setComments(result.items);
      setTotal(result.total);
    }

    loadComments();

    return () => {
      isActive = false;
    };
  }, [yearParam, project, status, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Comments</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review citizen feedback and respond to comments related to published
          AIPs and projects.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">Year</div>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-500">Project</div>
            <Select value={project} onValueChange={setProject}>
              <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((option) => (
                  <SelectItem key={option.project_id} value={option.project_id}>
                    {option.project_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-500">Status</div>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as "all" | "no_response" | "responded")
              }
            >
              <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="no_response">No response</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by commenter name, comment, or project..."
              className="h-11 pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-slate-500">Showing {total} comments</div>

      <div className="space-y-5">
        {comments.map((comment) => (
          <CommentCard
            key={comment.id}
            commenterName={comment.commenter_name}
            barangayName={comment.commenter_scope_label}
            createdAt={comment.created_at}
            projectLabel={comment.project_title}
            comment={comment.message}
            status={comment.response_status}
            response={
              comment.response
                ? {
                    responderName: comment.response.responder_name,
                    responderRoleLabel: "City Official",
                    message: comment.response.message,
                    createdAt: comment.response.created_at,
                  }
                : null
            }
          />
        ))}
      </div>
    </div>
  );
}
