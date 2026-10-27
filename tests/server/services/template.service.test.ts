import { describe, it, expect } from 'bun:test';
import { templateService } from '../../../src/server/services/template.service';

const compile = templateService.compileTemplate;

describe('templateService.compileTemplate sections', () => {
  it('keeps the section body when the value is truthy', () => {
    expect(compile('{{#if a}}X{{/if}}', { a: 'y' })).toBe('X');
  });

  it.each([[''], [undefined], [null], [false], [0]])('drops the section for %p', (value) => {
    expect(compile('[{{#if a}}X{{/if}}]', { a: value })).toBe('[]');
  });

  it('renders the else branch when the value is falsy', () => {
    const template = '{{#if a}}yes{{else}}no{{/if}}';
    expect(compile(template, { a: 'set' })).toBe('yes');
    expect(compile(template, { a: '' })).toBe('no');
  });

  it('evaluates multiple sections independently', () => {
    const template = '{{#if a}}A{{/if}}-{{#if b}}B{{else}}b{{/if}}-{{#if c}}C{{/if}}';
    expect(compile(template, { a: 1, b: '', c: true })).toBe('A-b-C');
  });

  it('resolves nested paths', () => {
    const template = '{{#if report.url}}<a href="{{report.url}}">open</a>{{/if}}';
    expect(compile(template, { report: { url: 'https://x.test' } })).toBe(
      '<a href="https://x.test">open</a>'
    );
    expect(compile(template, { report: {} })).toBe('');
  });

  it('escapes variables inside a kept section', () => {
    expect(compile('{{#if a}}{{a}}{{/if}}', { a: '<b>' })).toBe('&lt;b&gt;');
  });

  it('does not evaluate section syntax coming from user values', () => {
    expect(compile('{{msg}}', { msg: '{{#if a}}Z{{/if}}', a: false })).toBe('{{#if a}}Z{{/if}}');
  });
});
