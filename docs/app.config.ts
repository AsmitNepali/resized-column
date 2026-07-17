export default defineAppConfig({
    docus: {
        title: 'Resizable Columns',
        description: 'Resize, reorder, and pin Filament table columns with per-user persistence.',
    },
    header: {
        title: 'Resizable Columns',
        logo: {
            light: '/logo.svg',
            dark: '/logo.svg',
            alt: 'Resizable Columns Logo',
        }
    },
    seo: {
        title: 'Resizable Columns',
        description: 'Resize, reorder, and pin Filament table columns with per-user persistence.',
    },
    github: {
        repo: 'resized-column',
        owner: 'AsmitNepali',
        edit: true,
        rootDir: 'docs'
    },
    socials: {},
    ui: {
        colors: {
            primary: 'amber',
            neutral: 'slate'
        }
    },
    uiPro: {
        pageHero: {
            slots: {
                container: 'flex flex-col lg:grid py-16 sm:py-20 lg:py-24 gap-16 sm:gap-y-2'
            }
        }
    },
    toc: {
        title: 'On this page',
        bottom: {
            title: 'Links',
            edit: 'https://github.com/AsmitNepali/resized-column',
            links: [
                {
                    icon: 'i-simple-icons-packagist',
                    label: 'Packagist',
                    to: 'https://packagist.org/packages/asmit/resized-column',
                    target: '_blank'
                },
                {
                    icon: 'i-simple-icons-github',
                    label: 'GitHub',
                    to: 'https://github.com/AsmitNepali/resized-column',
                    target: '_blank'
                }
            ]
        }
    }
})
