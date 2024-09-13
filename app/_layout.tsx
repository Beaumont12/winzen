import React, { useState, useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/components/useColorScheme';
import { Stack, useRouter } from 'expo-router';

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // Use null to handle initial state
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Load custom fonts
  const [fontsLoadedStatus, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (fontsLoadedStatus) {
      setFontsLoaded(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoadedStatus]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setIsLoggedIn(!!token); // Set login status based on token presence
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    if (fontsLoaded) {
      checkLoginStatus();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (isLoggedIn !== null) {
      if (isLoggedIn) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (fontError) {
      throw fontError;
    }
  }, [fontError]);

  if (!fontsLoaded || isLoggedIn === null) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false}}>
        {isLoggedIn ? (
          <>
            <Stack.Screen
              name="(tabs)"
            />
          </>
        ) : (
          <Stack.Screen
            name="login"
          />
        )}
      </Stack>
    </ThemeProvider>
  );
}