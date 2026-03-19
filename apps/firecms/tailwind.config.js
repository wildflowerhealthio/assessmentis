import fireCMSConfig from '@firecms/ui/tailwind.config.js'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@firecms/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [fireCMSConfig],
}
