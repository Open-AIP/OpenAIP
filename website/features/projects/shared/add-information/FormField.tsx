import * as React from "react";
import { UseFormRegister, FieldErrors, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { FieldConfig } from "./field-config";

type FormFieldProps<T extends FieldValues> = {
  config: FieldConfig;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  value?: string;
  onChange?: (value: string) => void;
};

function formatSelectOptionLabel(option: string): string {
  if (!/^[a-z_]+$/.test(option)) return option;

  return option
    .split("_")
    .map((word) => (word ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function FormField<T extends FieldValues>({
  config,
  register,
  errors,
  value,
  onChange,
}: FormFieldProps<T>) {
  const fieldName = config.name as FieldPath<T>;
  const error = errors[fieldName]?.message?.toString();

  return (
    <div className={`space-y-2 ${config.gridColumn === "full" ? "md:col-span-2" : ""}`}>
      <Label>
        {config.label} {config.required && "*"}
      </Label>
      
      {config.type === "text" && (
        <Input
          {...register(fieldName)}
          className="h-11 w-full bg-slate-50 border-slate-200"
          placeholder={config.placeholder}
          disabled={config.disabled}
          readOnly={config.readOnly}
        />
      )}
      
      {config.type === "textarea" && (
        <Textarea
          {...register(fieldName)}
          className="bg-slate-50 border-slate-200 min-h-[90px] w-full"
          placeholder={config.placeholder}
          disabled={config.disabled}
          readOnly={config.readOnly}
        />
      )}
      
      {config.type === "date" && (
        <Input
          {...register(fieldName)}
          type="date"
          className="h-11 w-full bg-slate-50 border-slate-200"
          disabled={config.disabled}
          readOnly={config.readOnly}
        />
      )}
      
      {config.type === "select" && config.options && (
        <Select value={value} onValueChange={onChange} disabled={config.disabled}>
          <SelectTrigger className="h-11 w-full bg-slate-50 border-slate-200">
            <SelectValue placeholder={`Select ${config.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {config.options.map((option) => (
              <SelectItem key={option} value={option}>
                {formatSelectOptionLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
