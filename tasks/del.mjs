#! /usr/bin/env node

import { rm, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";

/* ───────────────────────────── helpers ───────────────────────────── */

const getFilenamePattern = (path) => path.split("/").pop();

const getDirectory = (path) =>
  path.slice(0, path.length - getFilenamePattern(path).length);

const endsWithGlobstar = (path) => path.endsWith("**/");

const removeGlobstar = (path) => path.replace(/\*\*\/$/, "");

const convertGlobToRegex = (pattern) =>
  new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");

const matchesPattern = (filename, pattern) =>
  convertGlobToRegex(pattern).test(filename);

/* ───────────────────── recursive directory discovery ───────────────────── */

const getSubDirectories = async (path) => {
  let result = [];

  if (!existsSync(path)) return result;

  try {
    result.push(path);

    const items = await readdir(path, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const subPath = `${path}${item.name}/`;
        result.push(...(await getSubDirectories(subPath)));
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  return result;
};

/* ───────────────────────────── main ───────────────────────────── */

export const del = async (inputs) => {
  for (const signature of inputs) {
    const pattern = getFilenamePattern(signature);
    const directory = getDirectory(signature);

    if (endsWithGlobstar(directory)) {
      const basePath = removeGlobstar(directory);
      const directories = await getSubDirectories(basePath);

      const expanded = directories.map((dir) => `${dir}${pattern}`);

      await del(expanded);
      continue;
    }

    if (!existsSync(directory)) continue;

    const items = await readdir(directory, { withFileTypes: true });

    for (const item of items) {
      if (item.isFile() && matchesPattern(item.name, pattern)) {
        await rm(`${directory}${item.name}`);
      }
    }
  }
};
