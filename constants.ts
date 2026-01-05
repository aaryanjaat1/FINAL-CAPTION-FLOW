
export const FREE_TRIAL_LIMIT = 5;
export const SUBSCRIPTION_PRICE = 10;

export const FONT_FAMILIES = [
  'Inter',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Playfair Display',
  'Space Grotesk',
  'Plus Jakarta Sans'
];

// Added 'as const' to ensure literal types match the VideoStyle union type requirements
export const CAPTION_TEMPLATES = [
  { 
    id: 'beast', 
    name: 'TITAN BOLD', 
    code: 'TB',
    style: {
      fontFamily: 'Montserrat',
      fontSize: 52,
      fontWeight: '900',
      color: '#ffffff',
      highlightColor: '#facc15',
      highlightStyle: 'outline',
      layout: 'word',
      animation: 'pop',
      shadow: true,
      stroke: true,
      strokeColor: '#000000',
      strokeWidth: 3,
      position: 'middle'
    }
  },
  { 
    id: 'minimal', 
    name: 'CLEAN CREATOR', 
    code: 'CC',
    style: {
      fontFamily: 'Inter',
      fontSize: 32,
      fontWeight: '600',
      color: '#ffffff',
      highlightColor: '#ffffff',
      highlightStyle: 'underline',
      layout: 'double',
      animation: 'fade',
      shadow: false,
      stroke: false,
      position: 'bottom'
    }
  },
  { 
    id: 'podcast', 
    name: 'VOICE OVER', 
    code: 'VO',
    style: {
      fontFamily: 'Space Grotesk',
      fontSize: 40,
      fontWeight: '700',
      color: '#ffffff',
      highlightColor: '#a855f7',
      highlightStyle: 'background',
      layout: 'phrase',
      animation: 'slide',
      shadow: true,
      stroke: false,
      position: 'bottom'
    }
  },
  { 
    id: 'neon', 
    name: 'VIBE GLOW', 
    code: 'VG',
    style: {
      fontFamily: 'Montserrat',
      fontSize: 48,
      fontWeight: '900',
      color: '#ffffff',
      highlightColor: '#ec4899',
      highlightStyle: 'glow',
      layout: 'word',
      animation: 'bounce',
      shadow: false,
      stroke: true,
      strokeColor: '#000000',
      strokeWidth: 1,
      position: 'middle'
    }
  }
] as const;
