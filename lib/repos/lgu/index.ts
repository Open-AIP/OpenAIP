export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getLguRepo } from "./repo";

export const createLguRepo = () => getLguRepo();
