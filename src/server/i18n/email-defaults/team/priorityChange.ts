import type { TeamTemplateDefaults } from '@shared/types';
import { emailChange, emailHeading, emailLayout, emailParagraph } from '../layout.js';

export const priorityChange: TeamTemplateDefaults = {
  en: {
    subject: '[{{project.name}}] Report Priority Changed: {{report.title}}',
    html: emailLayout({
      lang: 'en',
      eyebrow: 'Report Priority Updated',
      contentHtml: [
        emailHeading('{{report.title}}'),
        emailParagraph(
          'The priority of this report in <strong>{{project.name}}</strong> has been changed.'
        ),
        emailChange('{{oldPriorityFormatted}}', '{{newPriorityFormatted}}'),
      ].join('\n'),
      cta: { label: 'View Report', href: '{{report.url}}', when: 'report.url' },
    }),
  },
};
