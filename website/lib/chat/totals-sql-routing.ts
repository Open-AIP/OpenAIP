import type { ChatIntent } from "@/lib/chat/intent";

export type SqlFirstRouteResult<TTotals, TNormal> =
  | { path: "totals"; value: TTotals | null }
  | { path: "normal"; value: TNormal };

export async function routeSqlFirstTotals<TTotals, TNormal>(input: {
  intent: ChatIntent;
  resolveTotals: () => Promise<TTotals | null>;
  resolveNormal: () => Promise<TNormal>;
}): Promise<SqlFirstRouteResult<TTotals, TNormal>> {
  if (input.intent === "total_investment_program") {
    const value = await input.resolveTotals();
    return { path: "totals", value };
  }
  const value = await input.resolveNormal();
  return { path: "normal", value };
}

export function buildTotalsMissingMessage(input: {
  fiscalYear: number | null;
  scopeLabel: string | null;
}): string {
  const yearText = input.fiscalYear ? `FY ${input.fiscalYear}` : "the selected fiscal year";
  const scopeText = input.scopeLabel ? ` (${input.scopeLabel})` : "";
  return (
    `I can\u2019t find a 'Total Investment Program' total line extracted for ${yearText}${scopeText}. ` +
    "This usually means the totals line wasn't captured during extraction. " +
    "Please re-run extraction or check the PDF summary page."
  );
}
