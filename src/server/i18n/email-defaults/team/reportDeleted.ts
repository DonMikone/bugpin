import type { TeamTemplateDefaults } from '@shared/types';
import { emailBadge, emailDetails, emailHeading, emailLayout, emailParagraph } from '../layout.js';

export const reportDeleted: TeamTemplateDefaults = {
  en: {
    subject: '[{{project.name}}] Report Deleted: {{report.title}}',
    html: emailLayout({
      lang: 'en',
      eyebrow: 'Report Deleted',
      contentHtml: [
        emailHeading('{{report.title}}'),
        emailParagraph(
          'A report in <strong>{{project.name}}</strong> has been permanently deleted. The report and all associated data are no longer available. Below is a summary of the report at the time of deletion.'
        ),
        emailDetails([
          { label: 'Status', valueHtml: emailBadge('{{report.statusFormatted}}') },
          { label: 'Priority', valueHtml: emailBadge('{{report.priorityFormatted}}') },
        ]),
      ].join('\n'),
    }),
  },
};
