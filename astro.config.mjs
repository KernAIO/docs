// @ts-check
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

const base = process.env.DOCS_BASE ?? '/'

export default defineConfig({
  site: 'https://docs.kernaio.com',
  base,
  integrations: [
    starlight({
      title: 'Kern Docs',
      description: 'Documentation for Kern — the open-source all-in-one work platform.',
      logo: { light: './src/assets/kern-mark.svg', dark: './src/assets/kern-mark-dark.svg', alt: '' },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/KernAIO' }],
      customCss: ['./src/styles/fonts.css', './src/styles/kern.css'],
      head: [
        // The fonts are served from this origin (public/fonts). Nothing renders behind a
        // third-party stylesheet, and no reader's IP reaches Google.
        {
          tag: 'link',
          attrs: {
            rel: 'preload',
            href: `${base}fonts/instrument-sans-400-700-latin.woff2`,
            as: 'font',
            type: 'font/woff2',
            crossorigin: true,
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preload',
            href: `${base}fonts/dm-mono-400-latin.woff2`,
            as: 'font',
            type: 'font/woff2',
            crossorigin: true,
          },
        },
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#FBFAF7', media: '(prefers-color-scheme: light)' },
        },
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#1C1A17', media: '(prefers-color-scheme: dark)' },
        },
      ],
      // Code blocks wear the Ink/Paper surfaces. Only the metrics belong here — the
      // colours are set in kern.css, because Expressive Code parses these values as
      // colours at build time and silently drops anything it cannot read, var() included.
      expressiveCode: {
        themes: ['github-dark-default', 'github-light'],
        styleOverrides: {
          borderRadius: '10px',
          borderWidth: '1px',
          codeFontFamily: 'var(--sl-font-mono)',
          codeFontSize: '0.8125rem',
          codeLineHeight: '1.7',
          codePaddingBlock: '0.875rem',
          codePaddingInline: '1rem',
          frames: {
            frameBoxShadowCssValue: 'none',
          },
        },
      },
      editLink: { baseUrl: 'https://github.com/KernAIO/docs/edit/main/' },
      lastUpdated: false,
      sidebar: [
        {
          label: 'Introduction',
          items: [
            { label: 'What is Kern?', slug: 'introduction/what-is-kern' },
            { label: 'Core concepts', slug: 'introduction/concepts' },
            { label: 'Feature overview', slug: 'introduction/feature-overview' },
          ],
        },
        {
          label: 'Self-hosting',
          items: [
            { label: 'Install', slug: 'self-hosting/install' },
            { label: 'Install on Coolify', slug: 'self-hosting/coolify' },
            { label: 'Compose profiles', slug: 'self-hosting/compose-profiles' },
            { label: 'Reverse proxy & TLS', slug: 'self-hosting/reverse-proxy-tls' },
            { label: 'Upgrading', slug: 'self-hosting/upgrading' },
            { label: 'Backups', slug: 'self-hosting/backups' },
            { label: 'Selling seats', slug: 'self-hosting/billing' },
            { label: 'Environment reference', slug: 'self-hosting/env-reference' },
          ],
        },
        {
          label: 'Administration',
          items: [
            { label: 'Instance admin', slug: 'administration/instance-admin' },
            { label: 'Workspaces', slug: 'administration/workspaces' },
            { label: 'Roles & permissions', slug: 'administration/roles-permissions' },
            { label: 'Modules', slug: 'administration/modules' },
          ],
        },
        {
          label: 'Modules',
          items: [
            { label: 'Tracker', slug: 'modules/tracker' },
            { label: 'Chat', slug: 'modules/chat' },
            { label: 'Docs, Drive & Calendar', slug: 'modules/docs-drive' },
            { label: 'HR', slug: 'modules/hr' },
            { label: 'Recruiting', slug: 'modules/recruiting' },
            { label: 'CRM', slug: 'modules/crm' },
            { label: 'Automation', slug: 'modules/automation' },
            { label: 'Mail', slug: 'modules/mail' },
            { label: 'Calls', slug: 'modules/calls' },
            { label: 'AI assistant', slug: 'modules/ai' },
          ],
        },
        {
          label: 'Developers',
          items: [
            { label: 'Architecture', slug: 'developers/architecture' },
            { label: 'Repositories', slug: 'developers/repositories' },
            { label: 'Dev workspace', slug: 'developers/dev-workspace' },
            { label: 'Module development', slug: 'developers/module-development' },
            { label: 'Releases and migrations', slug: 'developers/releases-and-migrations' },
            { label: 'API & OpenAPI', slug: 'developers/api-openapi' },
            { label: 'Realtime protocol', slug: 'developers/realtime-protocol' },
            { label: 'Collab protocol', slug: 'developers/collab-protocol' },
          ],
        },
        {
          label: 'Contributing',
          items: [
            { label: 'Conventions', slug: 'contributing/conventions' },
            { label: 'Translating Kern', slug: 'contributing/translating' },
            { label: 'Contributor License Agreement', slug: 'contributing/cla' },
            { label: 'Code of Conduct', slug: 'contributing/code-of-conduct' },
          ],
        },
      ],
    }),
  ],
})
