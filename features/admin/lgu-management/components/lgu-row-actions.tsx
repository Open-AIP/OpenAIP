"use client";

import { EllipsisVertical, Pencil, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LguRecord } from "@/lib/repos/lgu/repo";

export default function LguRowActions({
  lgu,
  onEdit,
  onDeactivate,
  onActivate,
}: {
  lgu: LguRecord;
  onEdit: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
}) {
  const isActive = lgu.status === "active";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Actions">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isActive ? (
          <DropdownMenuItem variant="destructive" onClick={onDeactivate}>
            <PowerOff className="h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onActivate}>
            <Power className="h-4 w-4" />
            Activate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

