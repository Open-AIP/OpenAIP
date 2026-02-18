type DashboardErrorStateProps = {
  message: string;
};

export default function DashboardErrorState({ message }: DashboardErrorStateProps) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{message}</div>
  );
}
