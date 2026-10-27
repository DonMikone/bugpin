import { EMAIL_TEMPLATE_MARKERS, type LocaleCode } from '@shared/types';

/**
 * Table-based, inline-styled building blocks for default email templates.
 * Built for Outlook (Word engine), Gmail and Apple Mail: no class CSS for layout, no flexbox,
 * no display toggles. All text arguments are trusted HTML.
 */

export const BRAND_COLOR_PLACEHOLDER = '__BRAND_COLOR__';
export const BRAND_TEXT_COLOR_PLACEHOLDER = '__BRAND_TEXT_COLOR__';

export const EMAIL_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const COLORS = {
  canvas: '#f4f5f7',
  card: '#ffffff',
  border: '#e4e7ec',
  divider: '#eef0f3',
  surface: '#f5f6f8',
  strong: '#111827',
  body: '#374151',
  muted: '#6b7280',
  subtle: '#9ca3af',
} as const;

const TABLE_ATTRS = 'role="presentation" cellpadding="0" cellspacing="0" border="0"';

export function emailHeading(text: string): string {
  return `<h1 class="bp-title" style="margin:0 0 16px 0;font-family:${EMAIL_FONT};font-size:24px;line-height:32px;font-weight:700;color:${COLORS.strong};">${text}</h1>`;
}

export function emailParagraph(html: string, tone: 'default' | 'muted' = 'default'): string {
  const toneStyle =
    tone === 'muted'
      ? `font-size:14px;line-height:22px;color:${COLORS.muted};`
      : `font-size:15px;line-height:24px;color:${COLORS.body};`;
  return `<p style="margin:0 0 16px 0;font-family:${EMAIL_FONT};${toneStyle}">${html}</p>`;
}

export function emailBadge(text: string): string {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background-color:#f3f4f6;border:1px solid #e5e7eb;font-size:12px;line-height:18px;font-weight:600;color:${COLORS.body};">${text}</span>`;
}

export interface EmailDetailRow {
  label: string;
  valueHtml: string;
  /** Template variable path; the row is only rendered when it is truthy. */
  when?: string;
}

export function emailDetails(rows: EmailDetailRow[]): string {
  const cell = `border-bottom:1px solid ${COLORS.divider};font-family:${EMAIL_FONT};`;
  const body = rows
    .map(({ label, valueHtml, when }) => {
      const row = `<tr><td class="bp-label" width="140" valign="top" style="width:140px;padding:12px 16px 12px 0;${cell}font-size:13px;line-height:20px;font-weight:600;color:${COLORS.muted};">${label}</td>
<td valign="top" style="padding:12px 0;${cell}font-size:14px;line-height:20px;color:${COLORS.strong};">${valueHtml}</td></tr>`;
      return when ? `{{#if ${when}}}${row}{{/if}}` : row;
    })
    .join('\n');
  return `<table ${TABLE_ATTRS} width="100%" style="margin:8px 0 24px 0;border-top:1px solid ${COLORS.divider};">
${body}
</table>`;
}

export function emailChange(fromHtml: string, toHtml: string): string {
  return `<table ${TABLE_ATTRS} width="100%" style="margin:8px 0 24px 0;"><tr><td align="center" bgcolor="${COLORS.surface}" style="padding:16px 20px;background-color:${COLORS.surface};border-radius:8px;font-family:${EMAIL_FONT};font-size:15px;line-height:24px;"><span style="color:${COLORS.muted};">${fromHtml}</span>&nbsp;&nbsp;<span style="color:${COLORS.subtle};">&rarr;</span>&nbsp;&nbsp;<strong style="color:${COLORS.strong};">${toHtml}</strong></td></tr></table>`;
}

export function emailNote(bodyHtml: string, label?: string): string {
  const labelHtml = label
    ? `<p style="margin:0 0 6px 0;font-size:13px;line-height:20px;font-weight:600;color:${COLORS.strong};">${label}</p>`
    : '';
  return `<table ${TABLE_ATTRS} width="100%" style="margin:8px 0 24px 0;"><tr><td bgcolor="${COLORS.surface}" style="padding:16px 20px;background-color:${COLORS.surface};border-left:4px solid ${BRAND_COLOR_PLACEHOLDER};font-family:${EMAIL_FONT};font-size:15px;line-height:24px;color:${COLORS.body};">${labelHtml}<p style="margin:0;">${bodyHtml}</p></td></tr></table>`;
}

export interface EmailLayoutOptions {
  lang: LocaleCode;
  /** Small uppercase label above the content; also the document title. */
  eyebrow: string;
  /** Editable content, wrapped in the content markers. */
  contentHtml: string;
  cta?: { label: string; href: string; when?: string };
  afterCtaHtml?: string;
}

export function emailLayout({
  lang,
  eyebrow,
  contentHtml,
  cta,
  afterCtaHtml,
}: EmailLayoutOptions): string {
  const { brandStart, brandEnd, contentStart, contentEnd, footer } = EMAIL_TEMPLATE_MARKERS;
  // Padding sits on the td, not the a: Outlook ignores padding on links.
  const button = cta
    ? `<table ${TABLE_ATTRS} style="margin:8px 0 0 0;"><tr><td align="center" bgcolor="${BRAND_COLOR_PLACEHOLDER}" style="border-radius:8px;background-color:${BRAND_COLOR_PLACEHOLDER};padding:12px 24px;"><a href="${cta.href}" target="_blank" style="display:inline-block;font-family:${EMAIL_FONT};font-size:15px;line-height:20px;font-weight:600;color:${BRAND_TEXT_COLOR_PLACEHOLDER};text-decoration:none;">${cta.label}</a></td></tr></table>`
    : '';
  const ctaHtml = cta?.when ? `{{#if ${cta.when}}}${button}{{/if}}` : button;

  return `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${eyebrow}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
:root { color-scheme: light; supported-color-schemes: light; }
body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
@media only screen and (max-width: 620px) {
  .bp-card { padding: 28px 20px !important; }
  .bp-title { font-size: 21px !important; line-height: 28px !important; }
}
</style>
<!--[if mso]><style>body, table, td, p, a, h1, span { font-family: Arial, sans-serif !important; }</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${COLORS.canvas};">
<table ${TABLE_ATTRS} width="100%" bgcolor="${COLORS.canvas}" style="background-color:${COLORS.canvas};"><tr><td align="center" style="padding:32px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
<table ${TABLE_ATTRS} width="100%" style="max-width:600px;">
<tr><td style="padding:0 4px 16px 4px;font-family:${EMAIL_FONT};font-size:16px;line-height:24px;font-weight:700;color:${COLORS.strong};">${brandStart}{{app.name}}${brandEnd}</td></tr>
<tr><td bgcolor="${COLORS.card}" style="background-color:${COLORS.card};border:1px solid ${COLORS.border};border-top:4px solid ${BRAND_COLOR_PLACEHOLDER};border-radius:12px;">
<table ${TABLE_ATTRS} width="100%"><tr><td class="bp-card" style="padding:36px 40px;font-family:${EMAIL_FONT};font-size:15px;line-height:24px;color:${COLORS.body};">
<p style="margin:0 0 8px 0;font-family:${EMAIL_FONT};font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.muted};">${eyebrow}</p>
${contentStart}
${contentHtml.trim()}
${contentEnd}
${ctaHtml}
${afterCtaHtml ? `<div style="padding-top:24px;">${afterCtaHtml}</div>` : ''}
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:24px 16px 0 16px;">${footer}</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;
}
