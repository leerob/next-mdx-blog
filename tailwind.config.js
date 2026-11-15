const { spacing, fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./pages/**/*.tsx', './components/**/*.tsx', './layouts/**/*.tsx'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'blue-opaque': 'rgb(13 42 148 / 18%)',
        surface: 'var(--surface)',
        fill: {
          1: 'var(--fill-1)',
          2: 'var(--fill-2)',
          3: 'var(--fill-3)'
        },
        ink: 'var(--text)',
        'ink-2': 'var(--text-2)',
        muted: 'var(--muted)',
        'muted-2': 'var(--muted-2)',
        inverse: 'var(--inverse)',
        'on-inverse': 'var(--on-inverse)',
        mint: 'var(--green)',
        'on-mint': 'var(--on-green)',
        gray: {
          0: '#fff',
          100: '#fafafa',
          200: '#eaeaea',
          300: '#999999',
          400: '#888888',
          500: '#666666',
          600: '#444444',
          700: '#333333',
          800: '#222222',
          900: '#111111'
        }
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans]
      },
      // Markdown pages: the typography plugin's own colour variables, pointed
      // at the site's tokens so light and dark follow the theme by
      // themselves, plus a few Notion-like touches.
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--text-2)',
            '--tw-prose-headings': 'var(--text)',
            '--tw-prose-lead': 'var(--text-2)',
            '--tw-prose-links': 'var(--text)',
            '--tw-prose-bold': 'var(--text)',
            '--tw-prose-counters': 'var(--muted)',
            '--tw-prose-bullets': 'var(--muted-2)',
            '--tw-prose-hr': 'var(--fill-3)',
            '--tw-prose-quotes': 'var(--text)',
            '--tw-prose-quote-borders': 'var(--text)',
            '--tw-prose-captions': 'var(--muted)',
            '--tw-prose-code': 'var(--red)',
            '--tw-prose-pre-code': 'var(--text)',
            '--tw-prose-pre-bg': 'var(--fill-1)',
            '--tw-prose-th-borders': 'var(--fill-3)',
            '--tw-prose-td-borders': 'var(--fill-3)',
            // links: the text's own colour over a soft underline
            a: {
              fontWeight: '500',
              textDecorationColor:
                'color-mix(in srgb, currentColor 35%, transparent)',
              textDecorationThickness: '1px',
              textUnderlineOffset: '3px',
              transition: 'text-decoration-color .15s'
            },
            'a:hover': { textDecorationColor: 'currentColor' },
            // inline code: a quiet pill, no backticks
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            code: {
              fontWeight: '400',
              fontSize: '0.85em',
              padding: '0.2em 0.4em',
              borderRadius: '6px',
              backgroundColor: 'var(--fill-2)'
            },
            pre: { borderRadius: '16px' },
            'pre code': {
              padding: '0',
              borderRadius: '0',
              backgroundColor: 'transparent',
              fontSize: 'inherit'
            },
            // quotes: a plain bar, no italics
            blockquote: {
              fontStyle: 'normal',
              fontWeight: '400',
              borderLeftWidth: '3px'
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:last-of-type::after': { content: 'none' },
            // tables: a light full grid
            table: { borderCollapse: 'collapse' },
            'thead th': { backgroundColor: 'var(--fill-1)' },
            'th, td': {
              border: '1px solid var(--fill-3)',
              padding: '0.5em 0.75em !important'
            },
            'h2,h3,h4': { scrollMarginTop: spacing[32] }
          }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};
