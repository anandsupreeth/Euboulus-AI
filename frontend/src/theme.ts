import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = { initialColorMode: 'light', useSystemColorMode: false }

// "teal" is remapped to an indigo/violet scale so every existing colorScheme="teal" picks up the brand color.
const brand = {
  50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7', 400: '#34D399',
  500: '#047857', 600: '#065F46', 700: '#064E3B', 800: '#053F31', 900: '#04332A'
}

export const theme = extendTheme({
  config,
  fonts: {
    heading: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, Menlo, monospace"
  },
  colors: {
    brand,
    teal: brand,
    purple: { ...brand },
    ink: { 950: '#F7FAF8', 900: '#FFFFFF', 800: '#FFFFFF', 700: '#D1FAE5' }
  },
  semanticTokens: {
    colors: {
      surface: { default: '#FFFFFF' },
      line: { default: '#DCE8E2' },
      muted: { default: '#587068' },
      accent: { default: '#065F46' }
    }
  },
  styles: {
    global: {
      'html, body': { bg: '#F7FAF8', color: '#142D26' },
      body: {
        backgroundImage:
          'radial-gradient(900px 500px at 85% -10%, rgba(4,120,87,0.10), transparent 60%)',
        backgroundAttachment: 'fixed'
      },
      '::selection': { bg: 'brand.500', color: 'white' },
      '*::-webkit-scrollbar': { width: '10px' },
      '*::-webkit-scrollbar-thumb': { background: 'rgba(4,120,87,0.25)', borderRadius: '8px' }
    }
  },
  components: {
    Heading: { baseStyle: { letterSpacing: '-0.02em', fontWeight: 700, color: '#142D26' } },
    Button: {
      baseStyle: { borderRadius: 'lg', fontWeight: 600 },
      variants: {
        solid: (p: any) =>
          p.colorScheme === 'teal' || p.colorScheme === 'purple'
            ? {
                bg: 'brand.500',
                color: 'white',
                boxShadow: '0 6px 18px rgba(4,120,87,0.30)',
                _hover: { bg: 'brand.600', transform: 'translateY(-1px)', _disabled: { filter: 'none' } },
                _active: { transform: 'translateY(0)' }
              }
            : {},
        ghost: { color: 'brand.600', _hover: { bg: 'brand.100' } }
      }
    },
    Input: {
      variants: {
        outline: {
          field: {
            bg: 'white', borderColor: 'line', borderRadius: 'lg',
            _hover: { borderColor: 'brand.400' },
            _focusVisible: { borderColor: 'brand.500', boxShadow: '0 0 0 1px #047857' }
          }
        }
      }
    },
    Select: {
      variants: {
        outline: {
          field: {
            bg: 'white', borderColor: 'line', borderRadius: 'lg',
            _hover: { borderColor: 'brand.400' },
            _focusVisible: { borderColor: 'brand.500', boxShadow: '0 0 0 1px #047857' }
          }
        }
      }
    },
    FormLabel: { baseStyle: { fontSize: 'sm', color: 'muted', fontWeight: 500 } },
    Modal: {
      baseStyle: {
        overlay: { bg: 'rgba(20,45,38,0.45)', backdropFilter: 'blur(6px)' },
        dialog: { bg: 'white', border: '1px solid', borderColor: 'line', borderRadius: '2xl' }
      }
    },
    Table: {
      variants: {
        simple: {
          th: { color: 'muted', borderColor: 'line', letterSpacing: '0.08em', fontSize: 'xs' },
          td: { borderColor: 'line' },
          tbody: { tr: { _hover: { bg: 'brand.50' } } }
        }
      }
    },
    Badge: { baseStyle: { borderRadius: 'full', px: 2.5, py: 0.5, textTransform: 'none', letterSpacing: '0.02em' } },
    Progress: { baseStyle: { track: { bg: 'brand.100', borderRadius: 'full' }, filledTrack: { bgGradient: 'linear(to-r, brand.500, brand.400)' } } }
  }
})
