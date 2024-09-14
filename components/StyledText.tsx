// StyledText.tsx
import React from 'react';
import { Text as DefaultText, TextProps as RNTextProps } from 'react-native';

export type TextProps = RNTextProps & {
  lightColor?: string;
  darkColor?: string;
};

export function Text(props: TextProps) {
  return <DefaultText {...props} style={[props.style, { fontFamily: 'Poppins-Regular' }]} />;
}

export default Text;