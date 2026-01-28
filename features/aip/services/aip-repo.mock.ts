import { listAips, getAipDetailView } from "@/lib/mockdb";

export function createMockAipRepo() {
  return {
    async list(scope: "barangay" | "city" = "barangay") {
      return listAips(scope);
    },
    async getDetail(aipId: string) {
      return getAipDetailView(aipId);
    },
  };
}
