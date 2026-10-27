import { describe, it, expect } from 'vitest';
import { EMAIL_TEMPLATE_MARKERS } from '@shared/types';
import {
  extractEditableContent,
  wrapContentInTemplate,
} from '../../../components/email/template-content';

const { contentStart, contentEnd } = EMAIL_TEMPLATE_MARKERS;

const markerTemplate = `<!DOCTYPE html>
<html lang="en">
<head><style>.bp-card { padding: 0; }</style></head>
<body>
<table role="presentation"><tr><td>
<p class="eyebrow">New Report</p>
${contentStart}
<h1>{{report.title}}</h1>
{{#if previousAssigneeName}}<p>from <strong>{{previousAssigneeName}}</strong></p>{{else}}<p>new</p>{{/if}}
<p>Cost: $1 and $& stay literal</p>
${contentEnd}
<table><tr><td><a href="{{report.url}}" style="color:__BRAND_TEXT_COLOR__;">View Report</a></td></tr></table>
</td></tr></table>
</body>
</html>`;

describe('extractEditableContent with content markers', () => {
  it('round-trips the template exactly', () => {
    const { content, wrapper } = extractEditableContent(markerTemplate);
    expect(wrapContentInTemplate(content, wrapper)).toBe(markerTemplate);
  });

  it('exposes only the content between the markers', () => {
    const { content, wrapper } = extractEditableContent(markerTemplate);
    expect(content).toContain('data-variable="report.title"');
    expect(content).not.toContain('New Report');
    expect(content).not.toContain('View Report');
    expect(content).not.toContain(contentStart);
    expect(wrapper).toContain('View Report');
    expect(wrapper).toContain('New Report');
  });

  it('keeps edits when re-wrapping', () => {
    const { wrapper } = extractEditableContent(markerTemplate);
    const result = wrapContentInTemplate('<p>Edited {{report.title}}</p>', wrapper);
    expect(result).toContain(`${contentStart}\n<p>Edited {{report.title}}</p>\n${contentEnd}`);
    expect(result).toContain('View Report');
  });
});

describe('extractEditableContent legacy fallbacks', () => {
  it('keeps the legacy button in the wrapper', () => {
    const legacy =
      '<!DOCTYPE html><html><body><div class="container"><div class="content"><p>A</p><a href="x" class="button">B</a></div></div></body></html>';
    const { content, wrapper } = extractEditableContent(legacy);
    expect(content).toBe('<p>A</p>');
    expect(wrapper).toContain('<a href="x" class="button">B</a>');
    expect(wrapContentInTemplate(content, wrapper)).toBe(legacy);
  });

  it('passes non-document HTML through without a wrapper', () => {
    const { content, wrapper } = extractEditableContent('<p>Hello</p>');
    expect(content).toBe('<p>Hello</p>');
    expect(wrapper).toBe('');
  });
});
