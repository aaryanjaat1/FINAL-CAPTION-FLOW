
export interface User {
  id: string;
  email: string;
  isSubscribed: boolean;
  videosProcessed: number;
  isAdmin: boolean;
  lastActive?: string;
  signupSource?: string;
  accountStatus: 'active' | 'banned' | 'suspended';
  planType: 'free' | 'pro' | 'enterprise';
}

export interface Caption {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface CustomFont {
  name: string;
  url: string;
}

export interface VideoStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  highlightColor: string;
  highlightStyle: 'background' | 'underline' | 'glow' | 'outline' | 'none';
  backgroundColor: string;
  bgPadding: number;
  textTransform: 'uppercase' | 'none' | 'lowercase';
  position: 'top' | 'middle' | 'bottom' | 'custom';
  layout: 'single' | 'double' | 'word' | 'phrase';
  animation: 'pop' | 'fade' | 'slide' | 'bounce' | 'zoomIn' | 'zoomOut' | 'shake' | 'none';
  shadow: boolean;
  stroke: boolean;
  strokeColor: string;
  strokeWidth: number;
  letterSpacing: number;
  lineHeight: number;
  template: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  captions: Caption[];
  style: VideoStyle;
  customFonts?: CustomFont[];
  thumbnail_url?: string;
  created_at: string;
}

export enum AppRoute {
  LANDING = 'landing',
  DASHBOARD = 'dashboard',
  EDITOR = 'editor',
  AUTH = 'auth',
  ADMIN = 'admin'
}

export type AIModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export interface TranscriptionSettings {
  language: string;
  model: AIModel;
}

export interface SystemStats {
  totalUsers: number;
  activeNow: number;
  mrr: number;
  totalExports: number;
  conversionRate: number;
  apiHealth: Record<string, 'healthy' | 'degraded' | 'down'>;
}
