# VS Code Configuration

This directory contains VS Code workspace settings and extension recommendations for this monorepo.

## Required Extensions

When you open this workspace in VS Code, you'll be prompted to install the recommended extensions:

1. **ESLint** (`dbaeumer.vscode-eslint`) - Integrates ESLint into VS Code
2. **Prettier** (`esbenp.prettier-vscode`) - Code formatter using Prettier

## Features Enabled

- **Format on Save**: Files are automatically formatted when you save
- **ESLint Auto-fix on Save**: ESLint errors are automatically fixed when you save
- **Per-Project Configuration**: ESLint and Prettier use each workspace's configuration
- **Inline Error Annotations**: ESLint errors and warnings appear inline in the editor

## How It Works

### ESLint

- ESLint is configured using the new flat config format (`eslint.config.js`)
- Each project/package has its own `eslint.config.js` that extends the shared config from `@assessmentis/eslint-config`
- The VS Code ESLint extension automatically detects workspace folders and uses the appropriate config

### Prettier

- Prettier configuration is shared via `@assessmentis/prettier-config`
- Each project references it in their `package.json` with: `"prettier": "@assessmentis/prettier-config"`
- The VS Code Prettier extension automatically picks up this configuration

## Troubleshooting

If format-on-save or ESLint annotations aren't working:

1. **Install the recommended extensions**: Accept the prompt when opening the workspace, or manually install from the Extensions view
2. **Reload VS Code**: Sometimes a reload is needed after installing extensions (Cmd/Ctrl + Shift + P → "Developer: Reload Window")
3. **Check the Output panel**:
   - View → Output → Select "ESLint" or "Prettier" from the dropdown to see any errors
4. **Verify workspace detection**: Open a file in a project and check the status bar - you should see ESLint and Prettier indicators

## Running Linters Manually

You can also run linting from the command line:

```bash
# From an individual project folder
npm run lint
npm run lint:fix

# Lint all projects
turbo run lint

# Fix all auto-fixable issues
turbo run lint:fix
```
