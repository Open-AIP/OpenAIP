export default function ProjectUpdatesPlaceholder() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-[13.5px] text-slate-700">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Projects Updates & Media</h2>
        <p className="text-sm text-slate-500">
          Placeholder — will be implemented after DBv2 wiring.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-medium text-slate-900">Planned moderation actions</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
          <li>View update</li>
          <li>Hide update</li>
          <li>Restore update</li>
          <li>Flag media</li>
          <li>Audit-log all actions</li>
        </ul>
      </div>
    </div>
  );
}

