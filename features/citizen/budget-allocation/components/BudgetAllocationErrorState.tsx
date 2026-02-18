type BudgetAllocationErrorStateProps = {
  message: string;
};

export default function BudgetAllocationErrorState({ message }: BudgetAllocationErrorStateProps) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{message}</div>
  );
}
