/**
 * MyMedQuestions color system.
 *
 * Derived from the brand palette (Coolors export). Every color has a semantic
 * role so the UI never picks hues ad hoc. Raw palette values live in `palette`;
 * everything else should consume `colors`.
 */

export const palette = {
  balticBlue: '#2660A4',
  azureMist: '#EDF7F6',
  sandyBrown: '#F19953',
  copper: '#C47335',
  deepWalnut: '#56351E',
} as const;

export const colors = {
  // Brand / actions
  primary: palette.balticBlue,
  primaryPressed: '#1E4E85',

  // Surfaces
  background: palette.azureMist,
  surface: '#FFFFFF',
  surfaceMuted: '#E2EFEE',

  // Accent / energy (the capture button, highlights, CTAs)
  accent: palette.sandyBrown,
  accentPressed: palette.copper,

  // Badges, streaks, secondary accent
  copper: palette.copper,

  // Text
  ink: palette.deepWalnut,
  inkSoft: '#7A6452',
  inkFaint: '#A8978A',
  onPrimary: '#FFFFFF',
  onAccent: '#3A2410',

  // Lines & states
  border: '#D6E6E5',
  borderStrong: '#B9D2D0',
  success: '#3C8C6E',
  danger: '#C0492F',
} as const;

export type ColorName = keyof typeof colors;
