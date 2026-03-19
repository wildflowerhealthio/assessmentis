#!/bin/bash
set -euo pipefail

# Rename all PascalCase/camelCase .ts/.tsx files to kebab-case
# Handles case-insensitive filesystems by using a temp name for case-only changes

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

to_kebab() {
  # Convert PascalCase/camelCase to kebab-case
  # Insert hyphen before each uppercase letter, then lowercase everything
  echo "$1" | sed 's/\([A-Z]\)/-\1/g' | sed 's/^-//' | tr '[:upper:]' '[:lower:]'
}

# Phase 1: Rename files (not directories)
echo "=== Phase 1: Renaming files ==="

find apps domain global infrastructure -name '*.ts' -o -name '*.tsx' | \
  grep -v node_modules | grep -v dist | grep -v '.react-router' | grep -v '.storybook' | \
  grep -v 'apps/frontend/app/routes/' | \
  sort | while read -r filepath; do

  base=$(basename "$filepath")

  # Skip if no uppercase letters
  if ! echo "$base" | grep -q '[A-Z]'; then
    continue
  fi

  # Split extension handling: preserve .test.tsx, .stories.ts, .test.ts, etc.
  # Extract the "stem" and all extensions
  # e.g., "FooBar.test.tsx" -> stem="FooBar", ext=".test.tsx"
  name="$base"
  ext=""

  # Peel off extensions from the right
  if echo "$name" | grep -qE '\.tsx$'; then
    ext=".tsx"
    name="${name%.tsx}"
  elif echo "$name" | grep -qE '\.ts$'; then
    ext=".ts"
    name="${name%.ts}"
  elif echo "$name" | grep -qE '\.mts$'; then
    ext=".mts"
    name="${name%.mts}"
  elif echo "$name" | grep -qE '\.cts$'; then
    ext=".cts"
    name="${name%.cts}"
  fi

  # Check for compound extensions (.test, .stories, .e2e, .unit, .interface)
  for suffix in ".test" ".stories" ".e2e" ".unit" ".interface"; do
    if echo "$name" | grep -qE "\\${suffix}\$"; then
      ext="${suffix}${ext}"
      name="${name%$suffix}"
    fi
  done

  # Skip if the stem has no uppercase (e.g., index.ts)
  if ! echo "$name" | grep -q '[A-Z]'; then
    continue
  fi

  newname="$(to_kebab "$name")${ext}"
  dir=$(dirname "$filepath")
  newpath="${dir}/${newname}"

  if [ "$filepath" = "$newpath" ]; then
    continue
  fi

  # Check if it's a case-only change (case-insensitive FS issue)
  lowold=$(echo "$base" | tr '[:upper:]' '[:lower:]')
  lownew=$(echo "$newname" | tr '[:upper:]' '[:lower:]')

  if [ "$lowold" = "$lownew" ]; then
    # Case-only change: two-step rename via temp name
    tmppath="${dir}/__tmp_rename_${newname}"
    git mv "$filepath" "$tmppath"
    git mv "$tmppath" "$newpath"
  else
    git mv "$filepath" "$newpath"
  fi

  echo "  $filepath -> $newpath"
done

echo ""
echo "=== Phase 1 complete ==="
echo ""
echo "Now run: npm run typecheck to verify imports"
