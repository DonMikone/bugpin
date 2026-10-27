import type { TeamTemplateDefaults } from '@shared/types';
import { emailHeading, emailLayout, emailParagraph } from '../layout.js';

export const testEmail: TeamTemplateDefaults = {
  en: {
    subject: 'Test Email from {{app.name}}',
    html: emailLayout({
      lang: 'en',
      eyebrow: 'Test Email',
      contentHtml: [
        emailHeading('SMTP configuration successful'),
        emailParagraph(
          'Your email server is configured correctly and able to send emails. You can now receive notifications for bug reports.'
        ),
        emailParagraph(
          'This is a test email sent from {{app.name}} to verify your SMTP settings.',
          'muted'
        ),
      ].join('\n'),
    }),
  },
};
