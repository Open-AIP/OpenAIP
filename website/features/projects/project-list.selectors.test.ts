import { describe, expect, it } from "vitest";
import {
  filterProjectsByScopeOption,
  filterProjectsByYearAndQuery,
  getProjectLguOptions,
  getProjectYearsDescending,
  prefixProjectTitles,
} from "@/lib/selectors/projects/project-list";

type TestProject = {
  id: string;
  year: number;
  title: string;
  lguLabel: string;
  description?: string;
  implementingOffice?: string;
  contractorName?: string;
  fundingSource?: string;
};

const PROJECTS: TestProject[] = [
  {
    id: "p1",
    year: 2026,
    title: "Road Improvement",
    lguLabel: "Brgy. Uno",
    description: "Drainage and pavement",
    implementingOffice: "Engineering Office",
    contractorName: "BuildRight",
    fundingSource: "General Fund",
  },
  {
    id: "p2",
    year: 2025,
    title: "Community Health Program",
    lguLabel: "Brgy. Dos",
    description: "Vaccination campaign",
    implementingOffice: "Health Office",
    fundingSource: "Health Fund",
  },
];

describe("project list selectors", () => {
  it("returns unique years descending", () => {
    expect(getProjectYearsDescending(PROJECTS)).toEqual([2026, 2025]);
  });

  it("prefixes titles with LGU label", () => {
    const prefixed = prefixProjectTitles(PROJECTS, "Brgy. Uno");
    expect(prefixed[0]?.title).toBe("Brgy. Uno - Road Improvement");
    expect(prefixed[1]?.title).toBe("Brgy. Uno - Community Health Program");
  });

  it("filters by scope option", () => {
    expect(filterProjectsByScopeOption(PROJECTS, "All LGUs")).toHaveLength(2);
    expect(filterProjectsByScopeOption(PROJECTS, "Brgy. Uno")).toHaveLength(1);
    expect(filterProjectsByScopeOption(PROJECTS, "Brgy. Dos")).toHaveLength(1);
    expect(filterProjectsByScopeOption(PROJECTS, "Brgy. Tres")).toHaveLength(0);
  });

  it("derives sorted LGU options with all first", () => {
    expect(getProjectLguOptions(PROJECTS)).toEqual([
      "All LGUs",
      "Brgy. Dos",
      "Brgy. Uno",
    ]);
  });

  it("filters by year and query across searchable fields", () => {
    const byYear = filterProjectsByYearAndQuery(PROJECTS, {
      yearFilter: "2026",
      query: "",
    });
    expect(byYear.map((item) => item.id)).toEqual(["p1"]);

    const byQueryContractor = filterProjectsByYearAndQuery(PROJECTS, {
      yearFilter: "all",
      query: "buildright",
    });
    expect(byQueryContractor.map((item) => item.id)).toEqual(["p1"]);

    const byQueryFunding = filterProjectsByYearAndQuery(PROJECTS, {
      yearFilter: "all",
      query: "health fund",
    });
    expect(byQueryFunding.map((item) => item.id)).toEqual(["p2"]);
  });
});

