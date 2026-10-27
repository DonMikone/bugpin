import type { TeamTemplateDefaults } from '@shared/types';
import { emailHeading, emailLayout, emailParagraph } from '../layout.js';

export const assignment: TeamTemplateDefaults = {
  en: {
    subject: '[{{project.name}}] Report Assigned to You: {{report.title}}',
    html: emailLayout({
      lang: 'en',
      eyebrow: 'Report Assigned to You',
      contentHtml: [
        emailHeading('{{report.title}}'),
        emailParagraph(
          'A report in <strong>{{project.name}}</strong> has been assigned to <strong>{{assignee.name}}</strong>. Please review the details below and take any necessary action.'
        ),
        `{{#if report.description}}${emailParagraph('{{report.description}}', 'muted')}{{/if}}`,
      ].join('\n'),
      cta: { label: 'View Report', href: '{{report.url}}', when: 'report.url' },
    }),
  },
};
