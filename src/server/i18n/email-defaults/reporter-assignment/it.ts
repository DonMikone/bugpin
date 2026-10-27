import type { EmailTemplate } from '@shared/types';
import { reporterAssignmentHtml } from '../styles.js';

const it: EmailTemplate = {
  subject: '[{{project.name}}] Assegnazione della segnalazione aggiornata: {{report.title}}',
  html: reporterAssignmentHtml(
    {
      headerTitle: 'Assegnazione aggiornata',
      introWithPrevious:
        'La tua segnalazione è stata riassegnata da <strong>{{previousAssigneeName}}</strong> a <strong>{{assignee.name}}</strong>.',
      introWithoutPrevious:
        'La tua segnalazione è stata assegnata a <strong>{{assignee.name}}</strong>.',
      labelProject: 'Progetto',
      labelStatus: 'Stato',
      outro:
        'Grazie per la tua segnalazione. Continueremo a tenerti aggiornato su eventuali cambiamenti.',
    },
    'it'
  ),
};

export default it;
