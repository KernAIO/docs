// @ts-check
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

const base = process.env.DOCS_BASE ?? '/'

export default defineConfig({
  site: 'https://kernaio.github.io',
  base,
  integrations: [
    starlight({
      title: 'Kern Docs',
      description: 'Documentation for Kern — the open-source all-in-one work platform.',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/KernAIO' }],
      customCss: ['./src/styles/kern.css'],
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400&family=DM+Mono:wght@400;500&display=swap',
          },
        },
      ],
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
            { label: 'Compose profiles', slug: 'self-hosting/compose-profiles' },
            { label: 'Reverse proxy & TLS', slug: 'self-hosting/reverse-proxy-tls' },
            { label: 'Upgrading', slug: 'self-hosting/upgrading' },
            { label: 'Backups', slug: 'self-hosting/backups' },
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
            { label: 'API & OpenAPI', slug: 'developers/api-openapi' },
            { label: 'Realtime protocol', slug: 'developers/realtime-protocol' },
            { label: 'Collab protocol', slug: 'developers/collab-protocol' },
          ],
        },
        {
          label: 'Contributing',
          items: [
            { label: 'Conventions', slug: 'contributing/conventions' },
            { label: 'Contributor License Agreement', slug: 'contributing/cla' },
            { label: 'Code of Conduct', slug: 'contributing/code-of-conduct' },
          ],
        },
      ],
    }),
  ],
})
