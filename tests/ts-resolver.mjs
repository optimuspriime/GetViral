import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const rootDir = process.cwd();

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return {
      url: "data:text/javascript,export default {};",
      shortCircuit: true,
      format: "module",
    };
  }

  let target = specifier;

  if (target.startsWith("@/")) {
    const rel = target.slice(2);
    target = pathToFileURL(path.join(rootDir, rel)).href;
  }

  try {
    return await nextResolve(target, context);
  } catch (err) {
    if (target.startsWith("file://") || target.startsWith(".")) {
      const filePath = target.startsWith("file://")
        ? fileURLToPath(target)
        : path.resolve(path.dirname(fileURLToPath(context.parentURL)), target);

      if (existsSync(filePath + ".ts")) {
        return nextResolve(pathToFileURL(filePath + ".ts").href, context);
      }
      if (existsSync(path.join(filePath, "index.ts"))) {
        return nextResolve(pathToFileURL(path.join(filePath, "index.ts")).href, context);
      }
    }
    throw err;
  }
}
