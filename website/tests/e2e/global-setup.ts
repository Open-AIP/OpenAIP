import fs from "node:fs/promises";
import { chromium } from "@playwright/test";
import { loginAsRole } from "./helpers/auth";
import {
  getStorageStateDir,
  getStorageStatePath,
  type RoleKey,
} from "./helpers/env";

const AUTH_ROLES: RoleKey[] = ["citizen", "barangay", "city", "admin"];

async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(getStorageStateDir(), { recursive: true });
}

export default async function globalSetup(): Promise<void> {
  await ensureStorageDir();

  const browser = await chromium.launch();
  try {
    for (const role of AUTH_ROLES) {
      const context = await browser.newContext();
      const page = await context.newPage();

      await loginAsRole(page, role);
      await context.storageState({ path: getStorageStatePath(role) });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
