# fix-github-issue

Complete TDD workflow to fix a GitHub issue with property-based testing.

**Issue number:** $ARGUMENTS

## Steps

1. Fetch issue details: `gh issue view $ARGUMENTS`
2. Read issue description and identify affected code areas
3. Explore relevant code paths using Glob and Grep tools
4. **Write failing property-based tests FIRST**
   - Identify invariants that should hold
   - Create property tests using fast-check
   - Verify tests fail with: `npm run test`
5. **Commit failing tests:**
   - `git add` test files
   - `git commit -m "Add failing tests for issue #$ARGUMENTS"`
6. **Implement fix to make tests pass**
   - Modify code to satisfy test properties
   - Follow existing code patterns
   - Keep changes minimal and focused
7. **Verify fix:**
   - Run `npm run test` - all tests should pass
   - Run `npm run typecheck` - no type errors
   - Run `npm run lint:fix` - fix any linting issues
8. **Commit working implementation:**
   - `git add` modified files
   - `git commit -m "Fix issue #$ARGUMENTS: [brief description]"`
9. **Create pull request:**
   - `gh pr create --title "Fix #$ARGUMENTS: [brief description]"`
   - Reference issue in PR description
   - Verify CI checks pass

## TDD Workflow Example

```bash
# 1. Fetch issue
gh issue view 42

# 2. Write failing test
# (Create test file with property-based tests)

# 3. Verify test fails
npm run test

# 4. Commit failing tests
git add domain/clinical-domain/src/Patient.test.ts
git commit -m "Add failing tests for issue #42"

# 5. Implement fix
# (Modify source code)

# 6. Verify tests pass
npm run test
npm run typecheck

# 7. Commit fix
git add domain/clinical-domain/src/Patient.ts
git commit -m "Fix issue #42: Validate patient age range"

# 8. Create PR
gh pr create --title "Fix #42: Validate patient age range" --body "Closes #42"
```

## Property-Based Test Example

```typescript
// For a bug where age calculation was incorrect
import { fc } from 'fast-check'

it('should calculate age correctly for all birth dates', () => {
  fc.assert(
    fc.property(fc.date({ min: new Date('1900-01-01'), max: new Date() }), (birthDate) => {
      const patient = { birthDate }
      const age = calculateAge(patient)

      // Properties that should ALWAYS hold
      expect(age).toBeGreaterThanOrEqual(0)
      expect(age).toBeLessThan(150)

      // Age should match manual calculation
      const expectedAge = new Date().getFullYear() - birthDate.getFullYear()
      expect(age).toBe(expectedAge)
    })
  )
})
```

## Critical Rules

✅ Write tests FIRST before implementing fix
✅ Use property-based testing with fast-check
✅ Commit failing tests separately from implementation
✅ Verify all checks pass before creating PR
✅ Reference issue number in commits and PR

## See Also

- [TESTING.md](../../../TESTING.md) - Testing philosophy and patterns
- [CONTRIBUTING.md](../../../CONTRIBUTING.md) - Git workflow guidelines
