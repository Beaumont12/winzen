import React, { useState, useEffect, useCallback } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/components/useColorScheme';
import { Stack, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';

// Prevent splash screen from hiding automatically until we decide to hide it
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // Use null to handle initial state
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Load custom fonts
  const [fontsLoadedStatus, fontError] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
    'Poppins-Black': require('../assets/fonts/Poppins-Black.ttf'),
    ...FontAwesome.font,
  });

  // Callback to hide the splash screen when everything is ready
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && isLoggedIn !== null) {
      await SplashScreen.hideAsync(); // Hide the splash screen after both fonts and login state are ready
    }
  }, [fontsLoaded, isLoggedIn]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setIsLoggedIn(!!token); // Set login status based on token presence
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    if (fontsLoadedStatus) {
      setFontsLoaded(true); // Update state when fonts are loaded
      checkLoginStatus(); // Check login status after fonts have been loaded
    }
  }, [fontsLoadedStatus]);

  useEffect(() => {
    if (isLoggedIn !== null) {
      if (isLoggedIn) {
        router.replace('/(tabs)'); // If logged in, navigate to the main tabs screen
      } else {
        router.replace('/login'); // If not logged in, navigate to the login screen
      }
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (fontError) {
      throw fontError; // Throw error if fonts failed to load
    }
  }, [fontError]);

  // If fonts haven't loaded or login state is not determined yet, return null to show splash screen
  if (!fontsLoaded || isLoggedIn === null) {
    return null; // Keep the splash screen visible
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Use a View to handle the onLayout event for hiding splash screen */}
      <View style={styles.container} onLayout={onLayoutRootView}>
        <Stack screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <Stack.Screen name="(tabs)" /> // Load the main tabs if logged in
          ) : (
            <Stack.Screen name="login" /> // Load the login screen if not logged in
          )}
        </Stack>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});