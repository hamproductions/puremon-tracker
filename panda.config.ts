import { defineConfig } from '@pandacss/dev';
import { createPreset } from '@park-ui/panda-preset';
import { theme } from './src/theme';
import pink from '@park-ui/panda-preset/colors/pink';
import mauve from '@park-ui/panda-preset/colors/mauve';

const config = defineConfig({
  preflight: true,

  hash: {
    className: true,
    cssVar: false
  },

  presets: [
    '@pandacss/preset-base',
    createPreset({
      accentColor: pink,
      grayColor: mauve,
      radius: 'lg'
    })
  ],

  include: ['./src/**/*.{js,jsx,ts,tsx,astro}'],

  exclude: [],

  theme: {
    extend: theme
  },

  jsxFramework: 'react',

  outdir: './styled-system',

  importMap: {
    css: 'styled-system/css',
    recipes: 'styled-system/recipes',
    patterns: 'styled-system/patterns',
    jsx: 'styled-system/jsx'
  },

  conditions: {
    extend: {
      dark: ['&.dark, .dark &'],
      light: ['&.light, .light &']
    }
  },

  lightningcss: true
});

export default config;
