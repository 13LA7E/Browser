import { Theme } from '../types';

export const themes: Record<string, Theme> = {
  dark: {
    id: 'dark',
    name: 'Dark (Default)',
    colors: {
      background: '#1a1a1a',
      foreground: '#1c1c1c',
      accent: '#fb542b',
      tabBarBg: '#1c1c1c',
      toolbarBg: '#2c2c2c',
      addressBarBg: '#1c1c1c',
      addressBarBorder: '#3a3a3a',
      buttonHover: '#3a3a3a',
      textPrimary: '#ffffff',
      textSecondary: '#8a8a8a'
    }
  },
  light: {
    id: 'light',
    name: 'Light',
    colors: {
      background: '#ffffff',
      foreground: '#f5f5f5',
      accent: '#fb542b',
      tabBarBg: '#f5f5f5',
      toolbarBg: '#e8e8e8',
      addressBarBg: '#ffffff',
      addressBarBorder: '#d0d0d0',
      buttonHover: '#d0d0d0',
      textPrimary: '#000000',
      textSecondary: '#666666'
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    colors: {
      background: '#0a1929',
      foreground: '#132f4c',
      accent: '#3399ff',
      tabBarBg: '#132f4c',
      toolbarBg: '#1e3a5f',
      addressBarBg: '#0a1929',
      addressBarBorder: '#2d5a88',
      buttonHover: '#2d5a88',
      textPrimary: '#e3f2fd',
      textSecondary: '#90caf9'
    }
  },
  forest: {
    id: 'forest',
    name: 'Forest Green',
    colors: {
      background: '#1a2f1a',
      foreground: '#243324',
      accent: '#4caf50',
      tabBarBg: '#243324',
      toolbarBg: '#2d4a2d',
      addressBarBg: '#1a2f1a',
      addressBarBorder: '#3d5a3d',
      buttonHover: '#3d5a3d',
      textPrimary: '#e8f5e9',
      textSecondary: '#81c784'
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Orange',
    colors: {
      background: '#2d1810',
      foreground: '#3d2418',
      accent: '#ff6b35',
      tabBarBg: '#3d2418',
      toolbarBg: '#4d3020',
      addressBarBg: '#2d1810',
      addressBarBorder: '#5d4030',
      buttonHover: '#5d4030',
      textPrimary: '#fff3e0',
      textSecondary: '#ffb74d'
    }
  },
  purple: {
    id: 'purple',
    name: 'Purple Haze',
    colors: {
      background: '#1a0f2e',
      foreground: '#2a1942',
      accent: '#9c27b0',
      tabBarBg: '#2a1942',
      toolbarBg: '#3a2354',
      addressBarBg: '#1a0f2e',
      addressBarBorder: '#4a3364',
      buttonHover: '#4a3364',
      textPrimary: '#f3e5f5',
      textSecondary: '#ce93d8'
    }
  }
};

export function applyTheme(themeId: string) {
  const theme = themes[themeId] || themes.dark;
  const root = document.documentElement;
  
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

export function getTheme(themeId: string): Theme {
  return themes[themeId] || themes.dark;
}

export function getAllThemes(): Theme[] {
  return Object.values(themes);
}
