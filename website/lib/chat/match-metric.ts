type MatchMetricInput = {
  distance?: number | null;
  matchScore?: number | null;
  similarity?: number | null;
};

type MatchMetricOutput = {
  label: "DIST" | "MATCH" | null;
  value: string | null;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatMatchMetric(input: MatchMetricInput): MatchMetricOutput {
  if (isFiniteNumber(input.distance)) {
    return {
      label: "DIST",
      value: input.distance.toFixed(3),
    };
  }

  if (isFiniteNumber(input.matchScore)) {
    return {
      label: "MATCH",
      value: `${Math.round(input.matchScore * 100)}%`,
    };
  }

  if (isFiniteNumber(input.similarity)) {
    return {
      label: "MATCH",
      value: `${Math.round(input.similarity * 100)}%`,
    };
  }

  return {
    label: null,
    value: null,
  };
}
