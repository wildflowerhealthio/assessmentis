# done

Task wrap-up checklist — run health checks, surface next steps, and execute before ending a session.

## Steps

1. **Health Check** — Assess the current codebase state by running these in parallel where possible:
   - `git status` to see changed, staged, and untracked files
   - `git diff` (staged and unstaged) to review uncommitted changes
   - `npm run typecheck` to check for type errors
   - `npm run lint` to check for lint violations
   - `npm run test` — only if you judge it relevant based on what changed (e.g., skip if only docs or config were touched)
   - Scan files touched in this session for TODO/FIXME/HACK comments added during the work

2. **If anything is broken** (type errors, lint violations, test failures, half-applied changes), use `AskUserQuestion` with a multiple-choice list explaining each problem found. Options should include:
   - Fix [specific issue] before wrapping up
   - Skip — leave it as-is
   - Revert uncommitted changes related to this issue

   Do NOT proceed to step 3 until all issues are resolved or explicitly skipped by the user.

3. **Build a context-aware next-steps checklist.** You're running at the end of a session — you have deep context about what was done, what was tricky, and what's still loose. Use that accumulated judgment here. Examine the actual diff, commit history, and repo state, but also draw on everything you learned during the session. Use `AskUserQuestion` with `multiSelect: true`. Only include items that are genuinely worth doing based on your understanding of the work — never pad with generic filler. Each item should reference specific files or changes. Possible items (include only when warranted):
   - Update docs that describe changed behavior (list specific file paths)
   - Add or update tests for new or changed code (list specific files lacking coverage)
   - Commit uncommitted changes (summarize what would be committed)
   - Open a pull request (suggest branch name and base branch)
   - Run `npm run format` and/or `npm run lint:fix`
   - Clean up temporary or debug code (list specific locations)
   - Update AGENTS.md or a reference doc if new patterns were established

   The **last option must always be**:
   - "Update Learnings Inbox"

4. **Execute** the items the user selected, in logical order:
   - Formatting/linting before commits
   - Commits before PRs
   - Doc updates and learnings inbox entries last

5. **Learnings Inbox entries** use this format and are appended below the `<!-- Append new entries below this line -->` marker in `docs/Agents/Learnings Inbox.md`. Never edit or delete existing entries.

   ```
   ### [short title]
   **Discovered during**: [task or branch name]
   **Learning**: [the actionable insight]
   **Suggested destination**: Strategies | [path to a specific reference doc] | unsure
   ```

## Guidelines

- **Be specific, not generic.** Every checklist item should reference concrete files, functions, or changes from the session.
- **Never git push.** The user's SSH key requires a password. If a push or PR is selected, stop and ask the user to run the git command manually.
- **Nothing to do is fine.** If the working tree is clean, tests pass, and there are no TODOs, say so and end.
- **Keep output concise.** Summarize health check results rather than dumping raw command output.
- **Trust your session context.** You've been working in this codebase all session. Use your judgment about what matters — you know what was hard, what's fragile, and what the user cares about. The examples in step 3 are just a menu of possibilities, not a template to fill in.
