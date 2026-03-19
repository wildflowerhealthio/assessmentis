#!/bin/bash
set -euo pipefail

# After running rename-to-kebab.sh, this script updates all import paths
# to reference the new kebab-case filenames.
#
# It finds all .ts/.tsx files and rewrites import/export statements
# that reference old PascalCase/camelCase filenames.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

to_kebab() {
  echo "$1" | sed 's/\([A-Z]\)/-\1/g' | sed 's/^-//' | tr '[:upper:]' '[:lower:]'
}

echo "=== Updating import paths ==="

# Build a sed script from the git mv history
# We look at staged renames to build old->new mappings
git diff --cached --name-status -M | grep '^R' | while read -r status old new; do
  oldbase=$(basename "$old" | sed 's/\.\(tsx\?\|mts\|cts\)$//')
  newbase=$(basename "$new" | sed 's/\.\(tsx\?\|mts\|cts\)$//')

  if [ "$oldbase" != "$newbase" ]; then
    # Remove compound extensions for matching (.test, .stories, etc.)
    oldimport=$(echo "$oldbase" | sed 's/\.test$//' | sed 's/\.stories$//' | sed 's/\.e2e$//' | sed 's/\.unit$//' | sed 's/\.interface$//')
    newimport=$(echo "$newbase" | sed 's/\.test$//' | sed 's/\.stories$//' | sed 's/\.e2e$//' | sed 's/\.unit$//' | sed 's/\.interface$//')

    if [ "$oldimport" != "$newimport" ]; then
      echo "$oldimport|$newimport"
    fi
  fi
done | sort -u > /tmp/rename-mappings.txt

echo "Found $(wc -l < /tmp/rename-mappings.txt) unique import mappings"

# Apply each mapping across all source files
find apps domain global infrastructure -name '*.ts' -o -name '*.tsx' | \
  grep -v node_modules | grep -v dist | grep -v '.react-router' | while read -r filepath; do

  while IFS='|' read -r oldname newname; do
    # Replace in import/export from statements
    # Match: from './OldName' or from '../OldName' or from '../../dir/OldName'
    sed -i '' "s|/\(${oldname}\)'|/${newname}'|g" "$filepath" 2>/dev/null || true
    sed -i '' "s|/\(${oldname}\)\"|/${newname}\"|g" "$filepath" 2>/dev/null || true
  done < /tmp/rename-mappings.txt

done

echo "=== Import update complete ==="
echo "Run: npm run typecheck to verify"
