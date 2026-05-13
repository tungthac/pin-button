#! /usr/bin/env node
/**
 * Bundle demo + dist + importmap + base library into ./public/ so Vercel
 * can serve a self-contained static site.
 *
 * Output structure:
 *   public/
 *     demo/                                          ← entry HTML/JS/CSS
 *     importmap/                                     ← module resolution
 *     dist/                                          ← built component
 *     node_modules/@scalable.software/component/dist/ ← base library
 */

import { cp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

if (existsSync("./public")) {
  await rm("./public", { recursive: true, force: true });
}

await cp("./demo", "./public/demo", { recursive: true });
await cp("./importmap", "./public/importmap", { recursive: true });
await cp("./dist", "./public/dist", { recursive: true });
await cp(
  "./node_modules/@scalable.software/component/dist",
  "./public/node_modules/@scalable.software/component/dist",
  { recursive: true }
);

console.log("Deploy artifacts prepared in ./public/");
