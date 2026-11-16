import type { Service } from './types';

/** The three service pillars (PRD D-8), anchors used by the homepage cards (D-13 §3). */
export const services: Service[] = [
  {
    id: 'full',
    anchor: 'full-decoration',
    titleKey: 'services.full.title',
    introKey: 'services.full.intro',
    stepKeys: ['services.full.steps.meeting', 'services.full.steps.quote', 'services.full.steps.visit', 'services.full.steps.floral'],
    checklistKeys: [
      'services.full.checklist.bridal',
      'services.full.checklist.toss',
      'services.full.checklist.parents',
      'services.full.checklist.boutonniere',
      'services.full.checklist.bridesmaid',
      'services.full.checklist.headTable',
      'services.full.checklist.tables',
      'services.full.checklist.car',
      'services.full.checklist.church',
      'services.full.checklist.installations',
      'services.full.checklist.hair',
      'services.full.checklist.petals',
    ],
    ctaPage: 'contact',
    ctaKey: 'services.cta.button',
  },
  {
    id: 'floristry',
    anchor: 'floristry',
    titleKey: 'services.floristry.title',
    introKey: 'services.floristry.intro',
    ctaPage: 'contact',
    ctaKey: 'services.floristry.cta',
  },
  {
    id: 'rental',
    anchor: 'rental',
    titleKey: 'services.rental.title',
    introKey: 'services.rental.intro',
    ctaPage: 'rental',
    ctaKey: 'services.rental.cta',
  },
];
