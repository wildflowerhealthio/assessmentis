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
  },
  globs: ['**/*.md'],
  ignores: ['**/node_modules'],
}

export default config
