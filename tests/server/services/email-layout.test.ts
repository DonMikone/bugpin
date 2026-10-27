import { describe, it, expect } from 'bun:test';
import {
  appendFooterToHtml,
  applyBrandColor,
  applyBrandMark,
  defaultEmailTemplates,
  finalizeEmailHtml,
  getContrastTextColor,
  getSampleDataForTemplate,
  resolveEmailLogoUrl,
} from '../../../src/server/constants/email-templates';
import { templateService } from '../../../src/server/services/template.service';
import { EMAIL_TEMPLATE_MARKERS } from '../../../src/shared/types';
import type { EmailTemplate, EmailTemplateType } from '../../../src/shared/types';

const { brandStart, brandEnd, contentStart, contentEnd, footer } = EMAIL_TEMPLATE_MARKERS;

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('appendFooterToHtml', () => {
  it('replaces the footer marker with the footer', () => {
    const html = appendFooterToHtml(`<table><tr><td>${footer}</td></tr></table>`, 'newReport');
    expect(html).not.toContain(footer);
    expect(html).toMatch(/<td><p [^>]*>&copy; \d{4} <a href="https:\/\/bugpin\.io"/);
  });

  it('inserts a footer div before the last closing div of legacy templates', () => {
    const legacy = '<html><body><div class="container"><p>x</p>\n</div>\n</body>\n</html>';
    const html = appendFooterToHtml(legacy, 'newReport');
    expect(html).toMatch(
      /<p>x<\/p><div class="footer">.*https:\/\/bugpin\.io.*<\/div>\n<\/div>\n<\/body>\n<\/html>$/s
    );
  });

  it('leaves HTML without marker or legacy ending unchanged', () => {
    const html = '<p>plain</p>';
    expect(appendFooterToHtml(html, 'newReport')).toBe(html);
  });

  it('compiles invitation footer variables only when data is given', () => {
    const html = `<div>${footer}</div>`;
    const compiled = appendFooterToHtml(html, 'invitation', {
      invite: { url: 'https://x.test/?a=1&b=2' },
    });
    expect(compiled).toContain('https://x.test/?a=1&amp;b=2');
    expect(compiled).not.toContain('{{invite.url}}');
    expect(appendFooterToHtml(html, 'invitation')).toContain('{{invite.url}}');
  });
});

describe('resolveEmailLogoUrl', () => {
  it('resolves relative raster logos against the app URL', () => {
    expect(resolveEmailLogoUrl('/branding/light/logo.png', 'https://a.test/')).toBe(
      'https://a.test/branding/light/logo.png'
    );
    expect(resolveEmailLogoUrl('branding/logo.jpg', 'https://a.test')).toBe(
      'https://a.test/branding/logo.jpg'
    );
  });

  it('keeps absolute raster URLs, ignoring query strings for the format check', () => {
    expect(resolveEmailLogoUrl('https://cdn.test/l.PNG?v=3', null)).toBe(
      'https://cdn.test/l.PNG?v=3'
    );
  });

  it('rejects formats that mail clients render unreliably', () => {
    expect(resolveEmailLogoUrl('/x.svg', 'https://a.test')).toBeNull();
    expect(resolveEmailLogoUrl('https://cdn.test/x.webp', 'https://a.test')).toBeNull();
  });

  it('returns null without a logo or without an app URL for relative logos', () => {
    expect(resolveEmailLogoUrl('/logo.png', '')).toBeNull();
    expect(resolveEmailLogoUrl(null, 'https://a.test')).toBeNull();
    expect(resolveEmailLogoUrl(undefined, 'https://a.test')).toBeNull();
  });
});

describe('applyBrandMark', () => {
  const html = `<td>${brandStart}{{app.name}}${brandEnd}</td>`;

  it('replaces the brand text with an escaped logo image', () => {
    const result = applyBrandMark(html, { appName: 'A&B', logoUrl: 'https://cdn.test/l.png' });
    expect(result).toBe(
      `<td>${brandStart}<img src="https://cdn.test/l.png" alt="A&amp;B" height="32" style="display:block;height:32px;width:auto;max-width:200px;border:0;outline:none;text-decoration:none;">${brandEnd}</td>`
    );
  });

  it('leaves HTML unchanged without a logo', () => {
    expect(applyBrandMark(html, { appName: 'A', logoUrl: null })).toBe(html);
  });

  it('leaves HTML unchanged without brand markers', () => {
    const legacy = '<h1>{{app.name}}</h1>';
    expect(applyBrandMark(legacy, { appName: 'A', logoUrl: 'https://cdn.test/l.png' })).toBe(
      legacy
    );
  });
});

describe('getContrastTextColor', () => {
  it.each<[string, string]>([
    ['#02658D', '#ffffff'],
    ['#FFE600', '#111827'],
    ['#ffffff', '#111827'],
    ['#000000', '#ffffff'],
    ['blue', '#ffffff'],
  ])('%s -> %s', (input, expected) => {
    expect(getContrastTextColor(input)).toBe(expected);
  });

  it('is applied to the brand text color placeholder', () => {
    const html = applyBrandColor('<a style="color:__BRAND_TEXT_COLOR__;">x</a>', '#FFE600');
    expect(html).toContain('color:#111827;');
  });
});

describe('default templates render cleanly', () => {
  const branding = { primaryColor: '#02658D', appName: 'BugPin', logoUrl: null };
  const cases = Object.entries(defaultEmailTemplates).flatMap(([type, byLocale]) =>
    Object.entries(byLocale as Record<string, EmailTemplate>).map(
      ([locale, template]) => [type as EmailTemplateType, locale, template] as const
    )
  );

  it.each(cases)('%s (%s)', (type, locale, template) => {
    const data = getSampleDataForTemplate(type);
    const compiled = templateService.compileTemplate(template.html, data);
    const html = finalizeEmailHtml(compiled, type, branding, data);

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain(`<html lang="${locale}"`);
    expect(html).not.toContain('{{');
    expect(html).not.toContain('__BRAND_');
    expect(count(html, contentStart)).toBe(1);
    expect(count(html, contentEnd)).toBe(1);
    expect(html).toContain('https://bugpin.io');
    expect(html).not.toMatch(/display:\s*flex/);
    expect(html).not.toContain('class="button"');
  });
});
