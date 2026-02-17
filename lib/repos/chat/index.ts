export * from "./repo";
export * from "./repo.mock";
export * from "./types";

import { getChatRepo } from "./repo";

export const createChatRepo = () => getChatRepo();
