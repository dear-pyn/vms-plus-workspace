# VMS+ Workspace
- Follow docs/WORKFLOW.md for staged work: scoped brief → prototype confirmation → final flows → verified Figma → detailed AC/FigJam. Keep short acceptance notes during prototyping; record approval scope/evidence per revision. Explicit user instructions may change this sequence.
- Read README.md, content/catalog.json, packages/rules/policy.json and design/current-library.json first.
- Before designing or changing any screen, check real-screen captures first: read tools/capture/captures/INDEX.md (screen → images), then that set's steps.md, then open only the images you need. Captures are observed evidence from the old web / UAT, not confirmed requirements; Figma + confirmed requirements win on conflict (record the conflict). They contain real personal data: never copy names, employee IDs or record data into repo files, mocks, docs or Figma. New captures: tools/capture/capture.command (local only, gitignored).
- Edge cases live in domains/<domain>/edge-cases.md (one register per domain, codes EC-xx never reused). Every senior review reads it first and appends new cases there; scene review files link to codes instead of copying.
- Before building a prototype, Figma screen or AC, run both reviews in .claude/skills/senior-ux-review/SKILL.md and .claude/skills/senior-dev-review/SKILL.md, and set UI copy (titles, subtitles, buttons, messages) with .claude/skills/senior-ux-writing/SKILL.md (Codex: read those files directly). Output one risk table; ask the owner on pending items instead of deciding.
- Before reading or writing FLO (product MTD), follow docs/FLO-AGENT-INSTRUCTIONS.md (card IDs, titles, status block, sections, gates); full templates in docs/FLO-TEMPLATES.md.
- A JO is a delivery scope; a domain is a business area; a case is a reviewable revision. Do not guess JO assignments.
- Use packages/ui and shared tokens. Verify component + UI reference against the latest supplied Figma dump before claiming design fidelity.
- All money display uses packages/rules/currency.mjs. Do not duplicate a formatter in a feature or generated plugin.
- Every case must have explicit status, revision, source evidence and ruleVersion. Never label a template/reference as customer-approved.
- New drafts are safe to edit. Preserve prior reviewed revisions and their links when revising a customer case.
- AC from screens/dumps must distinguish confirmed, observed and pending. Never infer hidden backend behavior as confirmed.
- Keep mock services outside reusable feature components. No localStorage dependencies inside packages/ui.
- Change plugin source, then npm run plugins:build; generated code.js is not an authoring source.
- Run npm test, npm run check, npm run typecheck and npm run build for relevant changes.
- This workspace is local until the user requests publication. Do not publish, send invitations or create a remote repository without instruction.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
