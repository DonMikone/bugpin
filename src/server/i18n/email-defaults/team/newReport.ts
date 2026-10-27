import type { TeamTemplateDefaults } from '@shared/types';
import { emailBadge, emailDetails, emailHeading, emailLayout, emailParagraph } from '../layout.js';

export const newReport: TeamTemplateDefaults = {
  en: {
    subject: '[{{project.name}}] New Bug Report: {{report.title}}',
    html: emailLayout({
      lang: 'en',
      eyebrow: 'New Report',
      contentHtml: [
        emailHeading('{{report.title}}'),
        `{{#if report.description}}${emailParagraph('{{report.description}}')}{{/if}}`,
        emailDetails([
          { label: 'Project', valueHtml: '{{project.name}}' },
          { label: 'Status', valueHtml: emailBadge('{{report.statusFormatted}}') },
          { label: 'Priority', valueHtml: emailBadge('{{report.priorityFormatted}}') },
          {
            label: 'Page URL',
            valueHtml: '<span style="word-break:break-all;">{{report.pageUrl}}</span>',
            when: 'report.pageUrl',
          },
          { label: 'Reported', valueHtml: '{{report.createdAt}}' },
        ]),
      ].join('\n'),
      cta: { label: 'View Report', href: '{{report.url}}', when: 'report.url' },
    }),
  },
};
