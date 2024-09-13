// navigation.ts or types.ts
import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  login: undefined;
  '(tabs)': undefined;
  modal: undefined;
  splash: undefined; // Ensure 'splash' is included if you are using it
};

export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'login'>;