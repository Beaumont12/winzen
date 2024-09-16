import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
    screenOptions={{
      tabBarActiveTintColor: '#DDB04B',  // Highlight color for the active tab
      tabBarInactiveTintColor: '#FFFFFF', // Color for inactive tabs
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#203B36',  // Tab bar background color
      },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'MENU',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="bars" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'ORDERS',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
        }}
      />
      {/* New Tab Three */}
      <Tabs.Screen
        name="three"
        options={{
          title: 'TRANSACTIONS',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
        }}
      />
      {/* New Tab Four */}
      <Tabs.Screen
        name="four"
        options={{
          title: 'PROFILE',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}