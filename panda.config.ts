import { defineConfig } from '@pandacss/dev';
import { createPreset } from '@park-ui/panda-preset';
import { theme } from './src/theme';
import blue from '@park-ui/panda-preset/colors/blue';
import slate from '@park-ui/panda-preset/colors/slate';

const config = defineConfig({
  preflight: true,

  hash: {
    className: true,
    cssVar: false
  },

  presets: [
    '@pandacss/preset-base',
    createPreset({
      accentColor: blue,
      grayColor: slate,
      radius: 'xl'
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

  globalCss: {
    '*:focus-visible': {
      outline: '2px solid token(colors.accent.default)',
      outlineOffset: '2px',
      borderRadius: '2px'
    }
  },

  lightningcss: true
});

export default config;
