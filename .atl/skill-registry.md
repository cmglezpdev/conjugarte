# Skill Registry — ConjugArte

Generated: 2026-05-03

## User Skills

| Skill | Trigger |
|-------|---------|
| `branch-pr` | When creating a pull request, opening a PR, or preparing changes for review |
| `find-skills` | When user wants to discover or find skills |
| `go-testing` | When writing Go tests, using teatest, or adding test coverage |
| `issue-creation` | When creating a GitHub issue, reporting a bug, or requesting a feature |
| `judgment-day` | When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" |
| `skill-creator` | When user asks to create a new skill, add agent instructions, or document patterns for AI |

## SDD Skills (auto-loaded by orchestrator)

| Skill | Phase |
|-------|-------|
| `sdd-explore` | Exploration of ideas and codebase |
| `sdd-propose` | Create change proposal |
| `sdd-spec` | Write specifications |
| `sdd-design` | Technical design |
| `sdd-tasks` | Task breakdown |
| `sdd-apply` | Implementation |
| `sdd-verify` | Verification against specs |
| `sdd-archive` | Archive completed change |

## Project Conventions

No project-level CLAUDE.md found. Using global conventions from `~/.claude/CLAUDE.md`.

### Key Conventions (from global CLAUDE.md)
- Conventional commits only (no AI attribution in commits)
- Never build after changes
- Biome for linting and formatting (tabs, double quotes)
- TypeScript strict mode enabled

## Compact Rules

```
COMMITS: conventional commits only; no "Co-Authored-By" AI attribution
FORMAT: Biome — tabs, double quotes in JS/TS
IMPORTS: path alias `#/*` → `./src/*`, `@/*` → `./src/*`
TYPES: TypeScript strict; noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch
SCHEMAS: use Zod 4 for runtime validation (content schemas in src/content/schema.ts)
CONTENT: JSON content files in content/ — validate with `pnpm validate:content`
TESTING: Vitest 4.x; @testing-library/react + jsdom; no test files exist yet — TDD required
```
