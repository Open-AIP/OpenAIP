import { FileQuestion } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
};

export default function Placeholder({
  title = "Page Under Development",
  description = "This page is currently being built. Please check back later.",
}: Props) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-slate-100 p-6">
            <FileQuestion className="h-16 w-16 text-slate-400" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="text-slate-500">{description}</p>
      </div>
    </div>
  );
}
