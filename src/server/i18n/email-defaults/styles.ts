import type { LocaleCode } from '@shared/types';
import {
  emailBadge,
  emailChange,
  emailDetails,
  emailHeading,
  emailLayout,
  emailNote,
  emailParagraph,
} from './layout.js';

export interface ReporterConfirmationCopy {
  headerTitle: string;
  intro: string;
  labelStatus: string;
  labelPriority: string;
  labelSubmitted: string;
  outro: string;
}

export interface ReporterStatusChangeCopy {
  headerTitle: string;
  intro: string;
  teamMessageLabel: string;
  outro: string;
}

export interface ReporterPriorityChangeCopy {
  headerTitle: string;
  intro: string;
  outro: string;
}

export interface ReporterMessageCopy {
  headerTitle: string;
  intro: string;
}

export interface ReporterAssignmentCopy {
  headerTitle: string;
  introWithPrevious: string;
  introWithoutPrevious: string;
  labelProject: string;
  labelStatus: string;
  outro: string;
}

export function reporterConfirmationHtml(copy: ReporterConfirmationCopy, lang: LocaleCode): string {
  return emailLayout({
    lang,
    eyebrow: copy.headerTitle,
    contentHtml: [
      emailHeading('{{report.title}}'),
      emailParagraph(copy.intro),
      `{{#if report.description}}${emailParagraph('{{report.description}}')}{{/if}}`,
      emailDetails([
        { label: copy.labelStatus, valueHtml: emailBadge('{{report.statusFormatted}}') },
        { label: copy.labelPriority, valueHtml: emailBadge('{{report.priorityFormatted}}') },
        { label: copy.labelSubmitted, valueHtml: '{{report.createdAt}}' },
      ]),
      emailParagraph(copy.outro, 'muted'),
    ].join('\n'),
  });
}

export function reporterStatusChangeHtml(copy: ReporterStatusChangeCopy, lang: LocaleCode): string {
  return emailLayout({
    lang,
    eyebrow: copy.headerTitle,
    contentHtml: [
      emailHeading('{{report.title}}'),
      emailParagraph(copy.intro),
      emailChange('{{oldStatusFormatted}}', '{{newStatusFormatted}}'),
      `{{#if reporterMessage}}${emailNote('{{reporterMessage}}', copy.teamMessageLabel)}{{/if}}`,
      emailParagraph(copy.outro, 'muted'),
    ].join('\n'),
  });
}

export function reporterPriorityChangeHtml(
  copy: ReporterPriorityChangeCopy,
  lang: LocaleCode
): string {
  return emailLayout({
    lang,
    eyebrow: copy.headerTitle,
    contentHtml: [
      emailHeading('{{report.title}}'),
      emailParagraph(copy.intro),
      emailChange('{{oldPriorityFormatted}}', '{{newPriorityFormatted}}'),
      emailParagraph(copy.outro, 'muted'),
    ].join('\n'),
  });
}

export function reporterAssignmentHtml(copy: ReporterAssignmentCopy, lang: LocaleCode): string {
  return emailLayout({
    lang,
    eyebrow: copy.headerTitle,
    contentHtml: [
      emailHeading('{{report.title}}'),
      `{{#if previousAssigneeName}}${emailParagraph(copy.introWithPrevious)}{{else}}${emailParagraph(copy.introWithoutPrevious)}{{/if}}`,
      emailDetails([
        { label: copy.labelProject, valueHtml: '{{project.name}}' },
        { label: copy.labelStatus, valueHtml: emailBadge('{{report.statusFormatted}}') },
      ]),
      emailParagraph(copy.outro, 'muted'),
    ].join('\n'),
  });
}

export function reporterMessageHtml(copy: ReporterMessageCopy, lang: LocaleCode): string {
  return emailLayout({
    lang,
    eyebrow: copy.headerTitle,
    contentHtml: [
      emailHeading('{{report.title}}'),
      emailParagraph(copy.intro),
      emailNote('{{message}}'),
    ].join('\n'),
  });
}
