import type { ThemeConfig } from 'antd';
import { theme as antTheme } from 'antd';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { baseTokens } from './base';
import { lightComponents, darkComponents } from './components';

export const lightTheme: ThemeConfig = {
  token: {
    ...baseTokens,
    ...typography,
    ...lightColors,
  },
  components: lightComponents,
  algorithm: antTheme.defaultAlgorithm,
};

export const darkTheme: ThemeConfig = {
  token: {
    ...baseTokens,
    ...typography,
    ...darkColors,
  },
  components: darkComponents,
  algorithm: antTheme.darkAlgorithm,
};
