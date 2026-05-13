import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { z } from "zod";
import {
  ExerciseSet,
  Landing,
  TheoryDoc,
} from "../src/content/schema.ts";

const ROOT = resolve(import.meta.dirname, "..");
const CONTENT = join(ROOT, "src", "content", "data");

type Issue = { file: string; message: string };

const issues: Issue[] = [];

function expectedSchema(rel: string): z.ZodTypeAny | null {
  const segs = rel.split(/[\\/]/);
  if (segs.length === 1 && segs[0] === "landing.json") return Landing;
  if (segs.length !== 2) return null;
  const [lang, file] = segs;
  if (lang !== "fr" && lang !== "it") return null;
  if (file === "theory.json") return TheoryDoc;
  if (/^(basic|intermediate|advanced)(-control)?\.json$/.test(file)) {
    return ExerciseSet;
  }
  return null;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".json")) out.push(full);
  }
  return out;
}

function checkExerciseSetIntegrity(file: string, data: unknown) {
  const parsed = ExerciseSet.safeParse(data);
  if (!parsed.success) return;
  const set = parsed.data;
  const seenIds = new Set<string>();
  const seenNumbers = new Map<number, string>();
  // Hybrid splits share a `number` across two consecutive exercises whose IDs
  // follow the convention `{base}a` / `{base}b` (e.g. it-intermediate-3a + 3b).
  // We allow exactly that pattern; any other number collision is still an error.
  const isHybridSibling = (idA: string, idB: string): boolean => {
    const stripA = idA.replace(/[ab]$/, "");
    const stripB = idB.replace(/[ab]$/, "");
    if (stripA !== stripB || stripA === idA || stripB === idB) return false;
    const suffixA = idA.slice(-1);
    const suffixB = idB.slice(-1);
    return (
      (suffixA === "a" && suffixB === "b") ||
      (suffixA === "b" && suffixB === "a")
    );
  };
  for (const ex of set.exercises) {
    if (seenIds.has(ex.id)) {
      issues.push({ file, message: `duplicate exercise id "${ex.id}"` });
    }
    seenIds.add(ex.id);
    const prevId = seenNumbers.get(ex.number);
    if (prevId !== undefined && !isHybridSibling(prevId, ex.id)) {
      issues.push({
        file,
        message: `duplicate exercise number ${ex.number} (id=${ex.id})`,
      });
    }
    seenNumbers.set(ex.number, ex.id);

    if (ex.kind === "categorize") {
      const cats = new Set(ex.categories);
      for (const it of ex.items) {
        if (!cats.has(it.category)) {
          issues.push({
            file,
            message: `exercise ${ex.id}: item "${it.word}" has unknown category "${it.category}"`,
          });
        }
      }
    }
    if (ex.kind === "inline-choice") {
      for (const it of ex.items) {
        const expectedBlanks = (it.sentence.match(/\{\{\d+\}\}/g) ?? []).length;
        if (expectedBlanks !== it.choices.length) {
          issues.push({
            file,
            message: `exercise ${ex.id}: sentence has ${expectedBlanks} placeholders but ${it.choices.length} choice groups`,
          });
        }
        for (let i = 0; i < it.choices.length; i++) {
          const c = it.choices[i];
          if (c.correct >= c.options.length) {
            issues.push({
              file,
              message: `exercise ${ex.id}: choice ${i} correct index ${c.correct} out of bounds`,
            });
          }
        }
      }
    }
    if (ex.kind === "fill-blank" || ex.kind === "audio-fill") {
      for (const it of ex.items) {
        const expectedBlanks = (it.sentence.match(/\{\{\d+\}\}/g) ?? []).length;
        if (expectedBlanks !== it.blanks.length) {
          issues.push({
            file,
            message: `exercise ${ex.id}: sentence has ${expectedBlanks} placeholders but ${it.blanks.length} blank specs`,
          });
        }
      }
    }
    if (ex.kind === "choice") {
      for (let i = 0; i < ex.items.length; i++) {
        const it = ex.items[i];
        const correctIdxs = Array.isArray(it.correct) ? it.correct : [it.correct];
        for (const idx of correctIdxs) {
          if (idx >= it.options.length) {
            issues.push({
              file,
              message: `exercise ${ex.id} item ${i}: correct index ${idx} out of bounds (${it.options.length} options)`,
            });
          }
        }
        if (!ex.multiple && Array.isArray(it.correct)) {
          issues.push({
            file,
            message: `exercise ${ex.id} item ${i}: multiple=false but correct is an array`,
          });
        }
      }
    }
  }
}

const files = walk(CONTENT);

if (files.length === 0) {
  console.log("No JSON files in content/.");
  process.exit(0);
}

for (const full of files) {
  const rel = relative(CONTENT, full).replaceAll("\\", "/");
  const schema = expectedSchema(rel);
  if (!schema) {
    issues.push({ file: rel, message: "no schema mapped for this path" });
    continue;
  }
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(full, "utf8"));
  } catch (e) {
    issues.push({ file: rel, message: `invalid JSON: ${(e as Error).message}` });
    continue;
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        file: rel,
        message: `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      });
    }
    continue;
  }
  if (schema === ExerciseSet) checkExerciseSetIntegrity(rel, data);
}

if (issues.length === 0) {
  console.log(`OK — ${files.length} file(s) validated.`);
  process.exit(0);
}

console.error(`FAIL — ${issues.length} issue(s) across ${files.length} file(s):\n`);
for (const i of issues) {
  console.error(`  [${i.file}] ${i.message}`);
}
process.exit(1);
