import relativeLinksRule from 'markdownlint-rule-relative-links'

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
  customRules: [relativeLinksRule],
}

export default config
