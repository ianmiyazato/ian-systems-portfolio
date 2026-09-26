export const themes = {
  portfolio: { ground: '#EDF0F4', ink: '#0D1B2A', accent: '#2F5BFF', risk: '#E8622C', success: '#1D7A45', ai: '#5B4BD6' },
  balcao: { ground: '#F2F2EE', ink: '#121212', accent: '#FFD23F', risk: '#C8331F', success: '#1D7A45', ai: '#5B4BD6' },
  'product-hub': { ground: '#F7F8FA', ink: '#151A26', accent: '#3A4BE0', risk: '#C0362C', success: '#1B7F4E', ai: '#5B4BD6' },
  pay: { ground: '#F4F5F9', ink: '#0F1E45', accent: '#C9A24A', risk: '#B3261E', success: '#1C7A52', ai: '#5B4BD6' },
  circle: { ground: '#FFF6FA', ink: '#2A1033', accent: '#C2185B', risk: '#C2185B', success: '#5A47E0', ai: '#5B4BD6' },
  mesh: { ground: '#0B0F14', ink: '#F3F7FB', accent: '#4C9AFF', risk: '#F2555A', success: '#3CCB7F', ai: '#A78BFA' },
  consumer: { ground: '#F7F4F0', ink: '#0E1F24', accent: '#9FB7BF', risk: '#B3261E', success: '#1D7A45', ai: '#5B4BD6' },
  atlas: { ground: '#0A0C10', ink: '#F4F7F9', accent: '#3DDC97', risk: '#F5B454', success: '#3DDC97', ai: '#8B9CFF' },
  pulse: { ground: '#110D1C', ink: '#F9F5FF', accent: '#FF4F9A', risk: '#FFC857', success: '#45D6F5', ai: '#45D6F5' }
} as const;

export type ThemeName = keyof typeof themes;

