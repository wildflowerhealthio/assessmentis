const config = {
  config: {
    default: true,
    'line-length': false,
    'relative-links': {
      root_path: '.',
    },
    'no-trailing-punctuation': {
      punctuation: '.',
    },
    'no-duplicate-heading': {
      siblings_only: true,
    },
    'ol-prefix': {
      style: 'one_or_ordered',
    },
  },
  globs: ['**/*.md'],
  ignores: ['**/node_modules', 'docs-html/**'],
}

export default config
