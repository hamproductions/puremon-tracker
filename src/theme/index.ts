import { type PartialTheme } from '@pandacss/types';

export const theme: PartialTheme = {
  textStyles: {
    display: {
      value: {
        fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
        fontWeight: '800',
        letterSpacing: '0'
      }
    }
  },
  tokens: {
    fonts: {
      body: { value: "'Noto Sans JP', 'Hiragino Sans', sans-serif" },
      heading: { value: "'Noto Sans JP', 'Hiragino Sans', sans-serif" }
    },
    colors: {
      candy: {
        pink: { value: '#ff5fa2' },
        sky: { value: '#2196f3' },
        mint: { value: '#5ad1b0' },
        lemon: { value: '#ffd23f' },
        grape: { value: '#9b8cff' }
      }
    }
  },
  semanticTokens: {
    colors: {
      brand: {
        pink: { value: { base: '#ff4f99', _dark: '#ff79b0' } },
        sky: { value: { base: '#22b8e6', _dark: '#56ccf0' } }
      },
      board: {
        canvas: {
          value: { base: '#f3f9ff', _dark: '#0e1622' }
        },
        panel: {
          value: { base: '#ffffffd9', _dark: '#172230dd' }
        },
        panelSolid: {
          value: { base: '#ffffff', _dark: '#172230' }
        },
        tile: {
          value: { base: '#eef6ff', _dark: '#1c2939' }
        },
        owned: {
          value: { base: '#e4f4ff', _dark: '#143049' }
        },
        ownedBorder: {
          value: { base: '#7fd1f5', _dark: '#3f9fce' }
        },
        missing: {
          value: { base: '#eef2f7', _dark: '#141c27' }
        },
        dup: {
          value: { base: '#fff3dc', _dark: '#3a2f17' }
        },
        dupBorder: {
          value: { base: '#f3c969', _dark: '#caa14a' }
        },
        border: {
          value: { base: '#dcebf7', _dark: '#3a4a5e' }
        }
      }
    }
  },
  keyframes: {
    pop: {
      '0%': { transform: 'scale(0.85)', opacity: '0.4' },
      '60%': { transform: 'scale(1.06)' },
      '100%': { transform: 'scale(1)', opacity: '1' }
    },
    floaty: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-5px)' }
    }
  },
  recipes: {}
};
