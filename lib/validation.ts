import { z } from "zod";

const httpUrl = z.string().url().refine((value) => {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}, "URL deve usar http ou https");

export const requiredHttpUrl = httpUrl;
export const optionalHttpUrl = httpUrl.optional().or(z.literal(""));
