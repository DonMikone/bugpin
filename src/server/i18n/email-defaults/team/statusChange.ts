import type { TeamTemplateDefaults } from '@shared/types';
import { emailChange, emailHeading, emailLayout, emailParagraph } from '../layout.js';

export const statusChange: TeamTemplateDefaults = {
  en: {
    subject: '[{{project.name}}] Report Status Changed: {{report.title}}',
    html: emailLayout({
      lang: 'en',
      eyebrow: 'Report Status Updated',
      contentHtml: [
        emailHeading('{{report.title}}'),
        emailParagraph(
          'The status of this report in <strong>{{project.name}}</strong> has been updated.'
        ),
        emailChange('{{oldStatusFormatted}}', '{{newStatusFormatted}}'),
      ].join('\n'),
      cta: { label: 'View Report', href: '{{report.url}}', when: 'report.url' },
    }),
  },
};
