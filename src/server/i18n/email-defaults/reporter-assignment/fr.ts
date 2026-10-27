import type { EmailTemplate } from '@shared/types';
import { reporterAssignmentHtml } from '../styles.js';

const fr: EmailTemplate = {
  subject: '[{{project.name}}] Attribution du rapport mise à jour : {{report.title}}',
  html: reporterAssignmentHtml(
    {
      headerTitle: 'Attribution mise à jour',
      introWithPrevious:
        'Ton rapport a été réattribué de <strong>{{previousAssigneeName}}</strong> à <strong>{{assignee.name}}</strong>.',
      introWithoutPrevious: 'Ton rapport a été attribué à <strong>{{assignee.name}}</strong>.',
      labelProject: 'Projet',
      labelStatus: 'Statut',
      outro: 'Merci pour ton rapport. Nous continuerons à te tenir au courant de toute évolution.',
    },
    'fr'
  ),
};

export default fr;
