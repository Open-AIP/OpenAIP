export function PulseKpis({
  newThisWeek,
  awaitingReply,
  lguNotesPosted,
}: {
  newThisWeek: number;
  awaitingReply: number;
  lguNotesPosted: number;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">New This Week</div><div className="text-2xl font-semibold text-slate-900">{newThisWeek}</div></div>
      <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">Awaiting Reply</div><div className="text-2xl font-semibold text-amber-600">{awaitingReply}</div></div>
      <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">LGU Notes Posted</div><div className="text-2xl font-semibold text-slate-900">{lguNotesPosted}</div></div>
    </div>
  );
}
