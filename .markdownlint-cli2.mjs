import baseConfig from './.base.markdownlint-cli2.mjs'
import relativeLinksRule from 'markdownlint-rule-relative-links'

const config = {
  ...baseConfig,
  outputFormatters: [
    ['markdownlint-cli2-formatter-pretty', { appendLink: true }],
  ],
  customRules: [relativeLinksRule],
}

export default config
