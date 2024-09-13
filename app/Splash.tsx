import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router'; // Use expo-router's router hook

const Splash: React.FC = () => {
  const coffeeHeight = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    // Animate coffee filling the cup
    Animated.timing(coffeeHeight, {
      toValue: 200, // Adjust to fit your design
      duration: 2000, // Adjust the speed of filling
      useNativeDriver: false,
    }).start(() => {
      router.replace('/login'); // Navigate to login after animation
    });
  }, [coffeeHeight, router]);

  return (
    <View style={styles.container}>
      <View style={styles.cup}>
        <Animated.View style={[styles.coffee, { height: coffeeHeight }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#203B36', // Korainando for background
  },
  cup: {
    width: 150,
    height: 200,
    borderWidth: 5,
    borderColor: '#DDB04B', // Honey Grove for cup border
    borderRadius: 20,
    overflow: 'hidden', // Ensures coffee stays inside cup
  },
  coffee: {
    width: '100%',
    backgroundColor: '#DDB04B', // Honey Grove for coffee
    position: 'absolute',
    bottom: 0, // Start filling from bottom
  },
});

export default Splash;