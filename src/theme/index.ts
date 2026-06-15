import { type PartialTheme } from '@pandacss/types';

export const theme: PartialTheme = {
  textStyles: {
    display: {
      value: {
        fontFamily: "'Zen Maru Gothic', 'Outfit', sans-serif",
        fontWeight: '900',
        letterSpacing: '0.02em'
      }
    }
  },
  tokens: {
    fonts: {
      body: { value: "'Zen Maru Gothic', 'Hiragino Sans', 'Noto Sans JP', sans-serif" },
      heading: { value: "'Zen Maru Gothic', 'Hiragino Sans', 'Noto Sans JP', sans-serif" }
    }
  },
  semanticTokens: {
    colors: {
      board: {
        canvas: {
          value: { base: '#fff7fb', _dark: '#16101a' }
        },
        panel: {
          value: { base: '#ffffffcc', _dark: '#241c2add' }
        },
        panelSolid: {
          value: { base: '#ffffff', _dark: '#241c2a' }
        },
        tile: {
          value: { base: '#fdfaff', _dark: '#2c2333' }
        },
        owned: {
          value: { base: '#fde7f1', _dark: '#3a1f31' }
        },
        ownedBorder: {
          value: { base: '#f5a8cb', _dark: '#cf5f97' }
        },
        missing: {
          value: { base: '#f4eef2', _dark: '#201a26' }
        },
        dup: {
          value: { base: '#fff2da', _dark: '#3a2f17' }
        },
        dupBorder: {
          value: { base: '#f0c674', _dark: '#caa14a' }
        },
        border: {
          value: { base: '#eddbe7', _dark: '#4a3b48' }
        }
      }
    }
  },
  keyframes: {
    pop: {
      '0%': { transform: 'scale(0.85)', opacity: '0.4' },
      '60%': { transform: 'scale(1.06)' },
      '100%': { transform: 'scale(1)', opacity: '1' }
    }
  },
  recipes: {}
};
