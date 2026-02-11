import * as esbuild from 'esbuild'

// Bundle workspace packages (@assessmentis/*) since they're TypeScript source
// and won't be available as separate packages in Cloud Functions.
// Externalize everything else (including transitive deps like express)
// so CJS packages don't break in the ESM output.
const bundleWorkspacePackages = {
  name: 'bundle-workspace-packages',
  setup(build) {
    // Intercept all bare package imports (not relative paths)
    build.onResolve({ filter: /^[^./]/ }, (args) => {
      if (args.path.startsWith('@assessmentis/')) {
        return null // let esbuild resolve and bundle normally
      }
      return { path: args.path, external: true }
    })
  },
}

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/index.js',
  format: 'esm',
  plugins: [bundleWorkspacePackages],
})
