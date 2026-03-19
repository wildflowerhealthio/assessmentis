import * as esbuild from 'esbuild'

// Bundle workspace packages (@assessmentis/*) since they're TypeScript source
// And won't be available as separate packages in Cloud Functions.
// Externalize everything else (including transitive deps like express)
// So CJS packages don't break in the ESM output.
const bundleWorkspacePackages = {
  name: 'bundle-workspace-packages',
  setup(build) {
    // Intercept all bare package imports (not relative paths)
    build.onResolve({ filter: /^[^./]/ }, (args) => {
      if (args.path.startsWith('@assessmentis/')) {
        return null // Let esbuild resolve and bundle normally
      }
      return { external: true, path: args.path }
    })
  },
}

await esbuild.build({
  bundle: true,
  entryPoints: ['src/index.ts'],
  format: 'esm',
  outfile: 'dist/index.js',
  platform: 'node',
  plugins: [bundleWorkspacePackages],
})
