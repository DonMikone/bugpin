import type { TeamTemplateDefaults } from '@shared/types';
import { emailHeading, emailLayout, emailParagraph } from '../layout.js';

export const invitation: TeamTemplateDefaults = {
  en: {
    subject: "You've been invited to {{app.name}}",
    html: emailLayout({
      lang: 'en',
      eyebrow: "You're Invited",
      contentHtml: [
        emailHeading('Join {{app.name}}'),
        emailParagraph(
          '<strong>{{inviter.name}}</strong> has invited you to join {{app.name}} as a team member.'
        ),
        emailParagraph('Click the button below to accept the invitation and set up your account.'),
      ].join('\n'),
      cta: { label: 'Accept Invitation', href: '{{invite.url}}' },
      afterCtaHtml: [
        emailParagraph('This invitation will expire in {{invite.expiresInDays}} days.', 'muted'),
        emailParagraph(
          "If you didn't expect this invitation, you can safely ignore this email.",
          'muted'
        ),
      ].join('\n'),
    }),
  },
};
