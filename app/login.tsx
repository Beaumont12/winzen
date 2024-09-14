import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { Text } from '@/components/StyledText';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient'; // Import linear gradient for background effect
import { FontAwesome } from '@expo/vector-icons'; // Import icons from Expo Vector Icons

const LoginScreen: React.FC = () => {
  const [staffId, setStaffId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!staffId || !email || !password) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('https://winzen-server-1.onrender.com/login', {
        staff_id: staffId,
        email: email,
        password: password,
      });

      if (response.data.message === 'Successfully Logged In') {
        Alert.alert('Success', 'Successfully Logged In');
        router.replace('/(tabs)/');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert('Login Failed', error.response?.data?.message || 'An error occurred');
      } else {
        Alert.alert('Login Failed', 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#203B36', '#122D28', '#0A1D1A']} // Adjusted shades for a smooth background transition
        style={styles.background}
      />

      {/* Abstract Elements */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      {/* White Background Rectangle */}
      <View style={styles.rectangle} />

      {/* Login Form */}
      <View style={styles.formContainer}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.cafeName}>Winzen's Cafe</Text>
        <Text style={styles.greeting}>Login to your Account</Text>

        {/* Staff ID Input with Icon */}
        <View style={styles.inputContainer}>
          <FontAwesome name="id-badge" size={20} color="#DDB04B" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Staff ID"
            placeholderTextColor="#DDB04B"
            value={staffId}
            onChangeText={setStaffId}
          />
        </View>

        {/* Email Input with Icon */}
        <View style={styles.inputContainer}>
          <FontAwesome name="envelope" size={20} color="#DDB04B" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#DDB04B"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password Input with Eye Toggle */}
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={20} color="#DDB04B" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#DDB04B"
            secureTextEntry={!showPassword} // Toggle password visibility
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} size={20} color="#DDB04B" />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#DDB04B" />
          ) : (
            <Button
              title="Login"
              color="#203B36"
              onPress={handleLogin}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  // Abstract Circles for Background
  circle1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#DDB04B', // Honey Grove color
    opacity: 0.2,
  },
  circle2: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#DDB04B',
    opacity: 0.3,
  },
  circle3: {
    position: 'absolute',
    top: 200,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#DDB04B',
    opacity: 0.25,
  },
  // Semi-transparent White Rectangle behind the form
  rectangle: {
    position: 'absolute',
    width: '50%',
    height: '85%',
    backgroundColor: '#fff',
    opacity: 0.5,
    borderRadius: 20,
    zIndex: 0, // Behind the form
  },
  formContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    padding: 10,
    zIndex: 1, // To ensure the form stays above the rectangle
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  cafeName: {
    fontSize: 28,
    color: '#DDB04B',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Black'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#DDB04B',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingHorizontal: 10,
    width: '40%',
    color: '#203B36',
  },
  input: {
    flex: 1,
    height: 45,
    color: '#203B36',
    fontFamily: 'Poppins-Regular',
  },
  icon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 5,
  },
  buttonContainer: {
    width: '36%',
    height: 50,
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#203B36',
    borderRadius: 8,
    fontFamily: 'Poppins-ExtraBold',
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 14,
    color: '#DDB04B',
    marginBottom: 15,
    fontFamily: 'Poppins-Regular',
  },
});

export default LoginScreen;