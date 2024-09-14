import { View as DefaultView, Text as DefaultText, TextProps as RNTextProps, ViewProps as RNViewProps } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import React from 'react';

// Define additional theme props for color
type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

// Extend TextProps and ViewProps with ThemeProps
export type TextProps = ThemeProps & RNTextProps;
export type ViewProps = ThemeProps & RNViewProps;

// Hook to get the color based on the theme
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];
  return colorFromProps ?? Colors[theme][colorName];
}

// Text component with theming and Poppins font applied
export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color, fontFamily: 'Poppins-Regular' }, style]} {...otherProps} />;
}

// View component with theming
export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}