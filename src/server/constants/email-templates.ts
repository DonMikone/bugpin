import { EMAIL_TEMPLATE_MARKERS, type AppSettings, type EmailTemplateType } from '@shared/types';
import { defaultEmailTemplates as defaultsByLocale } from '../i18n/email-defaults/index.js';
import { EMAIL_FONT } from '../i18n/email-defaults/layout.js';
import { escapeHtml, templateService } from '../services/template.service.js';

export { defaultsByLocale as defaultEmailTemplates };

export const DEFAULT_BRAND_COLOR = '#02658D';

const LIGHT_TEXT = '#ffffff';
const DARK_TEXT = '#111827';

function darkenColor(hex: string, percent: number = 15): string {
  const color = hex.replace('#', '');
  const num = parseInt(color, 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * (percent / 100)));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * (percent / 100)));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * (percent / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function relativeLuminance(hex: string): number | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const num = parseInt(match[1], 16);
  const [r, g, b] = [num >> 16, (num >> 8) & 0xff, num & 0xff].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * Text color (white or near-black) with the higher WCAG contrast against the given background.
 * Ties and invalid input resolve to white.
 */
export function getContrastTextColor(hex: string): typeof LIGHT_TEXT | typeof DARK_TEXT {
  const background = relativeLuminance(hex);
  if (background === null) return LIGHT_TEXT;
  const dark = relativeLuminance(DARK_TEXT) as number;
  return contrastRatio(background, dark) > contrastRatio(background, 1) ? DARK_TEXT : LIGHT_TEXT;
}

export function applyBrandColor(html: string, primaryColor: string): string {
  const hoverColor = darkenColor(primaryColor);
  return html
    .replace(/__BRAND_COLOR__/g, primaryColor)
    .replace(/__BRAND_COLOR_HOVER__/g, hoverColor)
    .replace(/__BRAND_TEXT_COLOR__/g, getContrastTextColor(primaryColor));
}

function getFooterInnerHtml(templateType: EmailTemplateType): string {
  const small = `font-family:${EMAIL_FONT};font-size:12px;line-height:18px;`;
  const base = `<p style="margin:0;${small}color:#9ca3af;">&copy; ${new Date().getFullYear()} <a href="https://bugpin.io" style="color:#6b7280;text-decoration:underline;">BugPin</a> &middot; <a href="https://github.com/aranticlabs/bugpin" style="color:#6b7280;text-decoration:underline;">GitHub</a></p>`;
  if (templateType !== 'invitation') return base;
  return (
    `<p style="margin:0 0 4px 0;${small}color:#6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>` +
    `<p style="margin:0 0 16px 0;${small}color:#6b7280;word-break:break-all;"><a href="{{invite.url}}" style="color:#374151;text-decoration:underline;">{{invite.url}}</a></p>` +
    base
  );
}

/**
 * Insert the footer. Templates with the footer marker get the footer at the marker; legacy
 * custom templates (div layout) get a `.footer` div before the closing container div.
 * When `data` is given, footer variables (e.g. `{{invite.url}}`) are compiled.
 */
export function appendFooterToHtml(
  html: string,
  templateType: EmailTemplateType,
  data?: Record<string, unknown>
): string {
  const raw = getFooterInnerHtml(templateType);
  const footer = data ? templateService.compileTemplate(raw, data) : raw;
  if (html.includes(EMAIL_TEMPLATE_MARKERS.footer)) {
    return html.replace(EMAIL_TEMPLATE_MARKERS.footer, () => footer);
  }
  return html.replace(
    /(\s*<\/div>\s*<\/body>\s*<\/html>\s*)$/i,
    (closing: string) => `<div class="footer">${footer}</div>${closing}`
  );
}

/**
 * Absolute logo URL usable in emails, or null. Only raster formats are allowed because SVG and
 * WebP are unreliable in Gmail/Outlook. Relative URLs need an app URL to be resolved.
 */
export function resolveEmailLogoUrl(
  logoUrl: string | null | undefined,
  appUrl: string | null | undefined
): string | null {
  if (!logoUrl) return null;
  const path = logoUrl.split(/[?#]/)[0];
  if (!/\.(png|jpe?g|gif)$/i.test(path)) return null;
  if (/^https?:\/\//i.test(logoUrl)) return logoUrl;
  if (!appUrl) return null;
  return `${appUrl.replace(/\/+$/, '')}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
}

export interface EmailBranding {
  primaryColor: string;
  appName: string;
  logoUrl: string | null;
}

/** Replace the app name between the brand markers with the logo image, if a logo is set. */
export function applyBrandMark(
  html: string,
  branding: Pick<EmailBranding, 'appName' | 'logoUrl'>
): string {
  if (!branding.logoUrl) return html;
  const { brandStart, brandEnd } = EMAIL_TEMPLATE_MARKERS;
  const start = html.indexOf(brandStart);
  const end = start === -1 ? -1 : html.indexOf(brandEnd, start + brandStart.length);
  if (start === -1 || end === -1) return html;
  const img = `<img src="${escapeHtml(branding.logoUrl)}" alt="${escapeHtml(branding.appName)}" height="32" style="display:block;height:32px;width:auto;max-width:200px;border:0;outline:none;text-decoration:none;">`;
  return `${html.slice(0, start + brandStart.length)}${img}${html.slice(end)}`;
}

export function getEmailBranding(
  settings: Pick<AppSettings, 'appName' | 'appUrl' | 'branding'>
): EmailBranding {
  return {
    primaryColor: settings.branding?.primaryColor || DEFAULT_BRAND_COLOR,
    appName: settings.appName || 'BugPin',
    logoUrl: resolveEmailLogoUrl(settings.branding?.logoLightUrl, settings.appUrl),
  };
}

/** Final rendering step for every outgoing email: footer, logo, brand colors. */
export function finalizeEmailHtml(
  compiledHtml: string,
  templateType: EmailTemplateType,
  branding: EmailBranding,
  data?: Record<string, unknown>
): string {
  return applyBrandColor(
    applyBrandMark(appendFooterToHtml(compiledHtml, templateType, data), branding),
    branding.primaryColor
  );
}

export function getSampleDataForTemplate(
  templateType: EmailTemplateType,
  appName: string = 'BugPin',
  appUrl: string = 'https://example.com'
): Record<string, unknown> {
  const baseData = {
    app: {
      name: appName,
      url: appUrl,
    },
  };

  switch (templateType) {
    case 'newReport':
    case 'statusChange':
    case 'priorityChange':
    case 'assignment':
    case 'reportDeleted':
      return {
        ...baseData,
        project: {
          name: 'Sample Project',
        },
        report: {
          title: 'Button not working on checkout page',
          description:
            'When clicking the "Complete Purchase" button, nothing happens. The page stays the same and no error is shown.',
          status: 'open',
          statusFormatted: 'Open',
          priority: 'high',
          priorityFormatted: 'High',
          url: `${appUrl}/admin/reports/sample-123`,
          pageUrl: 'https://example.com/checkout',
          createdAt: new Date().toLocaleString(),
        },
        ...(templateType === 'statusChange' && {
          oldStatus: 'open',
          oldStatusFormatted: 'Open',
          newStatus: 'in_progress',
          newStatusFormatted: 'In Progress',
        }),
        ...(templateType === 'priorityChange' && {
          oldPriority: 'medium',
          oldPriorityFormatted: 'Medium',
          newPriority: 'high',
          newPriorityFormatted: 'High',
        }),
        ...(templateType === 'assignment' && {
          assignee: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        }),
      };

    case 'invitation':
      return {
        ...baseData,
        inviter: {
          name: 'Jane Smith',
        },
        invite: {
          url: `${appUrl}/admin/accept-invitation?token=sample-token-123`,
          expiresInDays: 7,
        },
      };

    case 'reporterConfirmation':
      return {
        ...baseData,
        project: {
          name: 'Sample Project',
        },
        report: {
          title: 'Button not working on checkout page',
          description:
            'When clicking the "Complete Purchase" button, nothing happens. The page stays the same and no error is shown.',
          status: 'open',
          statusFormatted: 'Open',
          priority: 'high',
          priorityFormatted: 'High',
          createdAt: new Date().toLocaleString(),
        },
      };

    case 'reporterStatusChange':
      return {
        ...baseData,
        project: {
          name: 'Sample Project',
        },
        report: {
          title: 'Button not working on checkout page',
          description:
            'When clicking the "Complete Purchase" button, nothing happens. The page stays the same and no error is shown.',
          status: 'in_progress',
          statusFormatted: 'In Progress',
        },
        oldStatus: 'open',
        oldStatusFormatted: 'Open',
        newStatus: 'in_progress',
        newStatusFormatted: 'In Progress',
        reporterMessage:
          'We have identified the issue and are working on a fix. Expect a resolution within the next 24 hours.',
        reporterMessageDisplay: 'block',
      };

    case 'reporterPriorityChange':
      return {
        ...baseData,
        project: {
          name: 'Sample Project',
        },
        report: {
          title: 'Button not working on checkout page',
          description:
            'When clicking the "Complete Purchase" button, nothing happens. The page stays the same and no error is shown.',
          priority: 'high',
          priorityFormatted: 'High',
        },
        oldPriority: 'medium',
        oldPriorityFormatted: 'Medium',
        newPriority: 'high',
        newPriorityFormatted: 'High',
      };

    case 'reporterAssignment':
      return {
        ...baseData,
        project: {
          name: 'Sample Project',
        },
        report: {
          title: 'Button not working on checkout page',
          description:
            'When clicking the "Complete Purchase" button, nothing happens. The page stays the same and no error is shown.',
          status: 'in_progress',
          statusFormatted: 'In Progress',
          url: `${appUrl}/admin/reports/sample-123`,
        },
        assignee: {
          name: 'John Doe',
        },
        previousAssigneeName: 'Jane Smith',
        previousAssigneeDisplay: 'block',
        noPreviousAssigneeDisplay: 'none',
      };

    case 'reporterMessage':
      return {
        ...baseData,
        project: {
          name: 'Sample Project',
        },
        report: {
          title: 'Button not working on checkout page',
          status: 'in_progress',
          statusFormatted: 'In Progress',
        },
        sender: {
          name: 'John Doe',
        },
        message:
          'Thank you for reporting this issue. Could you please provide more details about which browser you were using?',
      };

    case 'testEmail':
      return baseData;

    default:
      return baseData;
  }
}
