import { dedupeByKey, findDuplicateKeys } from "../dedupe";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runFeedbackDedupeTests() {
  const items = [
    { id: "a", value: 1 },
    { id: "b", value: 2 },
    { id: "a", value: 3 },
    { id: "c", value: 4 },
    { id: "b", value: 5 },
  ];

  const duplicates = findDuplicateKeys(items, (item) => item.id);
  assert(
    duplicates.length === 2 && duplicates.includes("a") && duplicates.includes("b"),
    "Expected a and b duplicates"
  );

  const unique = dedupeByKey(items, (item) => item.id);
  assert(unique.length === 3, "Expected 3 unique items");
  assert(unique.map((i) => i.id).join(",") === "a,b,c", "Expected stable first-seen ordering");
}

