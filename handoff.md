# Handoff: Create GitHub Issues + PR for Test Quality Epic

## Step 1: Create the PR

```bash
gh pr create \
  --head claude/add-fast-check-skill-BJqJq \
  --title "Add javascript-testing-expert skill and test quality epic handoff" \
  --body "$(cat <<'PREOF'
## Summary
- Adds a new \`javascript-testing-expert\` Claude Code skill with comprehensive guidance on property-based testing (fast-check), test structure, and indeterminism prevention
- Includes \`handoff.md\` with 18 test quality tickets and a \`gh\` CLI script for creating GitHub issues (to be removed before merge)

## Details
The skill covers:
- Property-based testing with fast-check (arbitraries, shrinking, strategies)
- Test structure conventions (Arrange/Act/Assert, naming, helpers placement)
- Indeterminism guards (time pinning, mock cleanup, fake timers)
- Effect-ts testing patterns

The handoff contains a prioritized epic of 18 tickets identified from a comprehensive test suite audit. An agent with \`gh\` access will run the script to create issues, then remove \`handoff.md\` before merging.

## Test plan
- [ ] Verify skill loads correctly via \`/javascript-testing-expert\`
- [ ] Run \`handoff.md\` script on a machine with \`gh\` CLI to create the 18 issues
- [ ] Remove \`handoff.md\` before merging
PREOF
)"
```

## Step 2: Create GitHub Issues

A comprehensive audit of the test suite was performed. 18 actionable tickets were identified (ticket 13 was subsumed by 17). These need to be created as GitHub issues.

## Instructions

Run the script below from the repo root. It requires `gh` CLI authenticated with repo access.

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
LABEL="test-quality"

# Create label if it doesn't exist
gh label create "$LABEL" --description "Test quality improvements" --color "1d76db" 2>/dev/null || true

create_issue() {
  local title="$1"
  local body="$2"
  echo "Creating: $title"
  gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$LABEL"
  sleep 1
}

create_issue "Pin time-dependent tests" "$(cat <<'EOF'
## Problem
Tests that depend on real time (e.g. `Date.now()`, `new Date()`) are flaky across time zones and clock skew.

## Scope
Audit all test files for uncontrolled time dependencies. Pin them using `vi.useFakeTimers()` or inject a clock.

## Effort: Tiny | Value: High | Dependencies: None
EOF
)"

create_issue "Add mock cleanup to google-fhir-node tests" "$(cat <<'EOF'
## Problem
`infrastructure/google-fhir-node-infrastructure` tests don't clean up mocks between runs, risking cross-test contamination.

## Work
Add `afterEach(() => vi.restoreAllMocks())` or use `vi.mock` auto-cleanup patterns.

## Effort: Tiny | Value: High | Dependencies: None
EOF
)"

create_issue "Remove placeholder/no-op tests" "$(cat <<'EOF'
## Problem
3 files contain empty or placeholder tests that provide no value:

- `apps/aws_infra/test/daily-cloudfront-hls-example.test.ts` — empty test body `test('SQS Queue Created', () => {})`
- `global/util/src/types/deep-readonly.test.ts` — test named `'should exist'`
- `infrastructure/document-template-instances/src/index.test.ts` — test named `'exists'`

## Work
Confirm these are not intentional canary tests, then either delete or replace with real assertions.

## Effort: Tiny | Value: Medium | Dependencies: None
EOF
)"

create_issue "Replace inefficient .filter() on fast-check arbitraries" "$(cat <<'EOF'
## Problem
Several property tests use `.filter()` on arbitraries, which causes fast-check to discard generated values and retry. This slows tests and can cause "too many skips" failures.

## Work
Replace `.filter()` calls with custom arbitraries that generate valid values directly.

## Effort: Small | Value: High | Dependencies: None
EOF
)"

create_issue "Extract squashToError helper for error-handling tests" "$(cat <<'EOF'
## Problem
Multiple test files duplicate error-squashing logic (catching Effect failures and normalizing them for assertion).

## Work
Extract a shared `squashToError` test helper. Place in a test-utils location.

## Effort: Small | Value: High | Dependencies: None
EOF
)"

create_issue "Remove unnecessary maxLength constraints on arbitraries" "$(cat <<'EOF'
## Problem
Some property tests add `maxLength` constraints on string/array arbitraries that aren't necessary for the property being tested. This reduces the search space without benefit.

## Work
Audit and remove `maxLength` where the constraint isn't load-bearing for the test's correctness.

## Effort: Small | Value: Medium | Dependencies: None
EOF
)"

create_issue "Install user-event and fix direct DOM manipulation in React tests" "$(cat <<'EOF'
## Problem
React tests use `fireEvent` or direct DOM manipulation instead of `@testing-library/user-event`, which better simulates real user interactions (focus, blur, input events).

## Work
1. Install `@testing-library/user-event` if not present
2. Replace `fireEvent.click/change/etc` with `userEvent` equivalents

## Effort: Small | Value: Medium | Dependencies: None
EOF
)"

create_issue "Add property tests to pure utility functions" "$(cat <<'EOF'
## Problem
Pure utility functions (string helpers, formatters, parsers, validators) in `global/util` and domain packages lack property-based tests.

## Work
Identify pure functions without property tests and add fast-check property tests covering round-trip, idempotency, and invariant properties.

## Effort: Small-Medium | Value: High | Dependencies: None
EOF
)"

create_issue "Add property tests to encode/decode schemas" "$(cat <<'EOF'
## Problem
Schema encode/decode pairs across domain packages should have round-trip property tests ensuring `decode(encode(x)) === x`.

## Work
Add fast-check round-trip property tests for all Schema encode/decode pairs that lack them, particularly in `clinical-domain` and `platform-domain`.

## Effort: Medium | Value: High | Dependencies: None
EOF
)"

create_issue "Replace getByTestId with accessible queries in React tests" "$(cat <<'EOF'
## Problem
React tests use `getByTestId` which doesn't verify accessibility. Testing Library recommends accessible queries (`getByRole`, `getByLabelText`, etc.).

## Work
Replace `getByTestId` calls with semantic queries where possible. This improves test quality and accessibility coverage.

## Effort: Small-Medium | Value: Medium | Dependencies: #7 (user-event install)
EOF
)"

create_issue "Split monolithic tests (>40 lines) across 8 files" "$(cat <<'EOF'
## Problem
15 test blocks exceed 40 lines across 8 files, making them hard to read and debug:

| File | Tests | Max Lines |
|------|-------|-----------|
| `global/effectful-store/src/hub-state-stream.test.ts` | 3 | 62 |
| `global/react-util/src/hooks/use-stream.test.tsx` | 2 | 58 |
| `domain/clinical-domain/src/resources/Media/media.test.ts` | 2 | 54 |
| `infrastructure/firebase-server-infrastructure/src/layers/firebase-admin-document-store-layer.test.ts` | 2 | 49 |
| `global/react-util/src/hooks/use-effect-ts.test.tsx` | 2 | 46 |
| `apps/frontend/app/modules/forms/Patient/patient-form-data.test.ts` | 2 | 45 |
| `domain/platform-domain/src/services/hub-state-updater.test.ts` | 1 | 44 |
| `domain/questionnaire-entities/src/gad7/observation-creators.test.ts` | 1 | 52 |

## Work
Split each long test into multiple focused tests, each asserting one thing.

## Effort: Medium | Value: Medium | Dependencies: None
EOF
)"

create_issue "Extract shared setup code into helpers in 6 files" "$(cat <<'EOF'
## Problem
6 test files have significant copy-paste setup blocks:

| File | Repeated Lines | Pairs |
|------|---------------|-------|
| `firebase-admin-document-store-layer.test.ts` | 10 | 6 |
| `hub-state-stream.test.ts` | 8 | 3 |
| `hub-state-updater.test.ts` | 8 | 2 |
| `readonly-url.test.ts` | 7 | 9 |
| `stream-either.test.ts` | 6 | 10 |
| `loaded-user.test.ts` | 7 | 2 |

## Work
Extract shared setup into named helper functions at the bottom of each file with a `// Helpers` marker.

## Effort: Medium | Value: Medium | Dependencies: None
EOF
)"

create_issue "Add documentation tests to domain files" "$(cat <<'EOF'
## Problem
Domain package files with public APIs lack doc-comment example tests.

## Work
Add `@example` doc-comment tests to public functions/types in domain packages, following the project's doc comments reference.

## Effort: Medium | Value: Medium | Dependencies: None
EOF
)"

create_issue "Replace setTimeout waits with fake timers in tests" "$(cat <<'EOF'
## Problem
Some tests use real `setTimeout` / `await delay()` to wait for async operations. This makes tests slow and flaky.

## Work
Replace real timer waits with `vi.useFakeTimers()` + `vi.advanceTimersByTime()` or `vi.runAllTimers()`.

## Effort: Medium | Value: High | Dependencies: None
EOF
)"

create_issue "Reduce remaining as-any casts in test files" "$(cat <<'EOF'
## Problem
Test files contain `as any` casts that bypass type checking, reducing confidence in test correctness.

## Work
Audit test files for `as any` and replace with proper typing. Where casts are truly unavoidable, document why.

## Effort: Medium | Value: Medium | Dependencies: #5 (squashToError helper)
EOF
)"

create_issue "Standardize test() to it() across all test files" "$(cat <<'EOF'
## Problem
The codebase mixes `test()` and `it()`. Convention should be `it()` throughout.

## Work
Mechanical find-and-replace of `test(` → `it(` in all `.test.ts` / `.test.tsx` files (excluding `test.each`).

## Effort: Large (mechanical) | Value: Low | Dependencies: None

Note: Low priority. Do when there's nothing more impactful.
EOF
)"

create_issue "Prefix test names with 'should'" "$(cat <<'EOF'
## Problem
Test names are inconsistent — some use `should`, some use bare verbs, some are noun phrases.

## Work
Standardize all `it()` descriptions to start with `should` for consistency.

## Effort: Large (mechanical) | Value: Low | Dependencies: #16 (standardize to it())
EOF
)"

create_issue "Move test helpers below test blocks with // Helpers marker" "$(cat <<'EOF'
## Problem
Some test files define helper functions above the test blocks, making it harder to read tests top-down.

## Work
Move helper functions to the bottom of each test file, below all `describe`/`it` blocks, with a `// Helpers` section comment.

## Effort: Large (mechanical) | Value: Low | Dependencies: None

Note: Low priority. Do when there's nothing more impactful.
EOF
)"

echo ""
echo "Done! All issues created."
```

## Running the script

```bash
# Save as create-issues.sh, make executable, and run:
chmod +x create-issues.sh
./create-issues.sh
```

## Priority order (suggested)

**Quick wins (do first):**
1. Pin time-dependent tests
2. Add mock cleanup to google-fhir-node
3. Remove placeholder/no-op tests

**High-value smalls:**
4. Replace inefficient .filter() on arbitraries
5. Extract squashToError helper
6. Remove unnecessary maxLength constraints

**Medium effort, high value:**
7. Add property tests to pure utilities
8. Add property tests to encode/decode schemas
9. Replace setTimeout with fake timers

**Medium effort, medium value:**
10. Install user-event + fix DOM manipulation
11. Replace getByTestId with accessible queries
12. Split monolithic tests
13. Extract shared setup into helpers
14. Add documentation tests
15. Reduce as-any casts

**Low priority mechanical sweeps:**
16. Standardize test() → it()
17. Prefix test names with "should"
18. Move helpers below tests

## Step 3: Clean up

After creating the PR and issues, remove `handoff.md` from the branch and push:

```bash
git rm handoff.md
git commit -m "Remove handoff.md after creating issues"
git push origin claude/add-fast-check-skill-BJqJq
```
