export default defineAppConfig({
  ui: {
    colors: {
      primary: 'lime',
      warning: 'purple',
      neutral: 'zinc'
    },
    button: {
      slots: {
        base: 'font-semibold transition-all duration-200'
      },
      variants: {
        size: {
          xs: { base: 'px-3' },
          sm: { base: 'px-4' },
          md: { base: 'px-4' },
          lg: { base: 'px-5' },
          xl: { base: 'px-6' }
        }
      },
      compoundVariants: [{
        color: 'primary' as const,
        variant: 'solid' as const,
        class: 'hover:bg-primary active:bg-primary shadow-[0_0_20px_var(--btn-glow)] hover:shadow-[0_0_30px_var(--btn-glow-hover)] hover:-translate-y-px active:translate-y-0 [--btn-glow:color-mix(in_oklch,var(--ui-primary)_25%,transparent)] [--btn-glow-hover:color-mix(in_oklch,var(--ui-primary)_35%,transparent)]'
      }]
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted'
      }
    }
  },
  seo: {
    siteName: 'Resizable Columns for Filament'
  },
  header: {
    title: 'Resizable Columns',
    to: '/',
    logo: {
      alt: '',
      light: '',
      dark: ''
    },
    search: true,
    colorMode: true,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/AsmitNepali/resized-column',
      'target': '_blank',
      'aria-label': 'GitHub'
    }]
  },
  footer: {
    credits: `MIT Licensed • © ${new Date().getFullYear()} Asmit Nepal`,
    colorMode: false,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/AsmitNepali/resized-column',
      'target': '_blank',
      'aria-label': 'Resized Column on GitHub'
    }, {
      'icon': 'i-simple-icons-packagist',
      'to': 'https://packagist.org/packages/asmit/resized-column',
      'target': '_blank',
      'aria-label': 'Resized Column on Packagist'
    }]
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/AsmitNepali/resized-column/edit/main/docs/content',
      links: [{
        icon: 'i-lucide-star',
        label: 'Star on GitHub',
        to: 'https://github.com/AsmitNepali/resized-column',
        target: '_blank'
      }, {
        icon: 'i-lucide-package',
        label: 'View on Packagist',
        to: 'https://packagist.org/packages/asmit/resized-column',
        target: '_blank'
      }]
    }
  }
})
