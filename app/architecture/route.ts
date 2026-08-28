import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-static";

export async function GET() {
  const path = join(process.cwd(), "docs/architecture/atlas.html");
  const html = await readFile(path, "utf8");
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
