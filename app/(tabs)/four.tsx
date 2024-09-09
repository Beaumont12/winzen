import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { Image, Pressable } from 'react-native';
import EditScreenInfo from '@/components/EditScreenInfo';

export default function TabFourScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      {/* Profile Image */}
      <Image
        source={{ uri: 'https://placekitten.com/200/200' }} // Example profile image URL
        style={styles.profileImage}
      />

      {/* Username */}
      <Text style={styles.username}>John Doe</Text>

      {/* Email */}
      <Text style={styles.email}>john.doe@example.com</Text>

      {/* Settings Button */}
      <Pressable style={styles.settingsButton}>
        <FontAwesome name="cog" size={24} color="white" />
        <Text style={styles.settingsText}>Settings</Text>
      </Pressable>
      <EditScreenInfo path="app/(tabs)/four.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  settingsText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 18,
  },
});
