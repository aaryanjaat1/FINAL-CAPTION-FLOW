
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
      backgroundColor: 'transparent',
      bgPadding: 0,
      textTransform: 'uppercase',
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
    id: 'strip', 
    name: 'VIBRANT STRIP', 
    code: 'VS',
    style: {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 40,
      fontWeight: '800',
      color: '#ffffff',
      highlightColor: '#ffffff',
      highlightStyle: 'none',
      backgroundColor: '#7c3aed',
      bgPadding: 24,
      textTransform: 'uppercase',
      layout: 'phrase',
      animation: 'slide',
      shadow: false,
      stroke: false,
      position: 'middle'
    }
  },
  { 
    id: 'lemon-box', 
    name: 'LEMON PUNCH', 
    code: 'LP',
    style: {
      fontFamily: 'Montserrat',
      fontSize: 42,
      fontWeight: '900',
      color: '#000000',
      highlightColor: '#000000',
      highlightStyle: 'none',
      backgroundColor: '#fbbf24',
      bgPadding: 20,
      textTransform: 'uppercase',
      layout: 'word',
      animation: 'bounce',
      shadow: false,
      stroke: false,
      position: 'middle'
    }
  },
  { 
    id: 'neon-v2', 
    name: 'NEON PULSE', 
    code: 'NP',
    style: {
      fontFamily: 'Space Grotesk',
      fontSize: 44,
      fontWeight: '700',
      color: '#00ffff',
      highlightColor: '#ff00ff',
      highlightStyle: 'glow',
      backgroundColor: 'rgba(0,0,0,0.8)',
      bgPadding: 12,
      textTransform: 'uppercase',
      layout: 'word',
      animation: 'bounce',
      shadow: false,
      stroke: true,
      strokeColor: '#000000',
      strokeWidth: 1,
      position: 'bottom'
    }
  },
  { 
    id: 'danger', 
    name: 'RED ALERT', 
    code: 'RA',
    style: {
      fontFamily: 'Montserrat',
      fontSize: 48,
      fontWeight: '900',
      color: '#ffffff',
      highlightColor: '#ffffff',
      highlightStyle: 'none',
      backgroundColor: '#dc2626',
      bgPadding: 30,
      textTransform: 'uppercase',
      layout: 'phrase',
      animation: 'shake',
      shadow: true,
      stroke: false,
      position: 'middle'
    }
  },
  { 
    id: 'cyber', 
    name: 'CYBER TOXIC', 
    code: 'CT',
    style: {
      fontFamily: 'Space Grotesk',
      fontSize: 46,
      fontWeight: '800',
      color: '#4ade80',
      highlightColor: '#f472b6',
      highlightStyle: 'glow',
      backgroundColor: 'transparent',
      bgPadding: 0,
      textTransform: 'uppercase',
      layout: 'word',
      animation: 'zoomIn',
      shadow: false,
      stroke: true,
      strokeColor: '#000000',
      strokeWidth: 2,
      position: 'middle'
    }
  },
  { 
    id: 'comic', 
    name: 'COMIC POP', 
    code: 'CP',
    style: {
      fontFamily: 'Montserrat',
      fontSize: 55,
      fontWeight: '900',
      color: '#fde047',
      highlightColor: '#ffffff',
      highlightStyle: 'outline',
      backgroundColor: 'transparent',
      bgPadding: 0,
      textTransform: 'uppercase',
      layout: 'word',
      animation: 'bounce',
      shadow: true,
      stroke: true,
      strokeColor: '#000000',
      strokeWidth: 4,
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
      backgroundColor: 'transparent',
      bgPadding: 0,
      textTransform: 'none',
      layout: 'double',
      animation: 'fade',
      shadow: false,
      stroke: false,
      position: 'bottom'
    }
  },
  { 
    id: 'modern-sub', 
    name: 'DOC STYLE', 
    code: 'DS',
    style: {
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: '500',
      color: '#ffffff',
      highlightColor: '#ffffff',
      highlightStyle: 'none',
      backgroundColor: 'rgba(0,0,0,0.6)',
      bgPadding: 16,
      textTransform: 'none',
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
      backgroundColor: 'transparent',
      bgPadding: 0,
      textTransform: 'none',
      layout: 'phrase',
      animation: 'slide',
      shadow: true,
      stroke: false,
      position: 'bottom'
    }
  }
] as const;
