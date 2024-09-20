import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, StyleSheet, Pressable, Image, Alert, ScrollView, ImageBackground, TextInput, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // Image picker for selecting an image
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase storage methods
import { Ionicons } from '@expo/vector-icons'; // Icon library for edit
import { View } from '@/components/Themed';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { Text } from '@/components/StyledText';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabFourScreen() {
  const router = useRouter();
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState('AccountInfo');
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    email: '',
    phone: '',
    age: '',
    birthday: { Date: '', Month: '', Year: '' }
  });
  const [image, setImage] = useState<string | null>(null);

  // Load staff info from AsyncStorage
  useEffect(() => {
    const loadStaffInfo = async () => {
      try {
        const staffData = await AsyncStorage.getItem('staffInfo');
        if (staffData !== null) {
          const staff = JSON.parse(staffData);
          console.log('staffs', (staff))
          setStaffInfo(staff);
          setEditedInfo({
            email: staff.email,
            phone: staff.phone.toString(),
            age: staff.age.toString(),
            birthday: {
              Date: staff.birthday.Date.toString(),
              Month: staff.birthday.Month.toString(),
              Year: staff.birthday.Year.toString(),
            },
          });
          setImage(staff.imageUrl || null);
        }
      } catch (error) {
        console.error('Error loading staff info:', error);
      }
    };
    loadStaffInfo();
  }, []);

  const handleLogout = async () => {
    try {
      // Remove staff information from AsyncStorage
      await AsyncStorage.removeItem('staffInfo');
      Alert.alert('Success', 'Successfully Logged Out');
      router.replace('/login'); // Redirect to the login screen after logging out
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      onUpdateStaffInfo({ ...staffInfo, ...editedInfo });
    }
    setIsEditing(!isEditing);
  };

  // Function to update staff info
  const onUpdateStaffInfo = async (updatedInfo: any) => {
    try {
      await AsyncStorage.setItem('staffInfo', JSON.stringify(updatedInfo));
      setStaffInfo(updatedInfo);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating staff info:', error);
    }
  };

  // Function to handle image upload
  const uploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const storage = getStorage();
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();

      // File path in Firebase Storage
      const storageRef = ref(storage, `images/${staffInfo.name}.jpg`);

      // Upload file
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Update the image state and staff info with the new image URL
      setImage(downloadURL);
      onUpdateStaffInfo({ ...staffInfo, profileImage: downloadURL });
    }
  };

  const renderSectionContent = () => {
    switch (selectedSection) {
      case 'AccountInfo':
        return (
          <View style={styles.profcontainer}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.card1}>
            <TouchableOpacity onPress={isEditing ? uploadImage : () => {}} disabled={!isEditing}>
              <Image
                source={image ? { uri: image } : require('@/assets/images/logo.png')}
                style={styles.profileImage1}
              />
              <Ionicons name="camera" size={24} color={isEditing ? "#203B36" : "lightgray"} style={styles.cameraIcon} />
            </TouchableOpacity>
            <View style={styles.card2}>
              <View style={styles.iconTextWrapper}>
                <Ionicons name="person-outline" size={24} color="white" style={styles.iconTextStyle} />
                <Text style={styles.detailtext}>{staffInfo.name.toUpperCase()}</Text>
              </View>

              <View style={styles.iconTextWrapper}>
                <Ionicons name="id-card-outline" size={24} color="white" style={styles.iconTextStyle} />
                <Text style={styles.detailtext}>{staffInfo.id.toUpperCase()}</Text>
              </View>

              <View style={styles.iconTextWrapper}>
                <Ionicons name="briefcase-outline" size={24} color="white" style={styles.iconTextStyle} />
                <Text style={styles.detailtext}>{staffInfo.role.toUpperCase()}</Text>
              </View>
            </View>
            </View>
    
            {/* Editable fields */}
            <View style={styles.inputWithIcon}>
                <Ionicons name="mail-outline" size={24} color="gray" style={styles.iconStyle} />
                <TextInput
                  style={[styles.input, !isEditing && styles.disabledInput]}
                  editable={isEditing}
                  value={editedInfo.email.toUpperCase()}
                  onChangeText={(text) => setEditedInfo({ ...editedInfo, email: text })}
                  placeholder="Email"
                />
              </View>

              <View style={styles.inputWithIcon}>
                <Ionicons name="call-outline" size={24} color="gray" style={styles.iconStyle} />
                <TextInput
                  style={[styles.input, !isEditing && styles.disabledInput]}
                  editable={isEditing}
                  value={editedInfo.phone}
                  onChangeText={(text) => setEditedInfo({ ...editedInfo, phone: text })}
                  placeholder="Phone"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputWithIcon}>
                <FontAwesome5 name="birthday-cake" size={24} color="gray" style={styles.iconStyle} />
                <TextInput
                  style={[styles.input, !isEditing && styles.disabledInput]}
                  editable={isEditing}
                  value={editedInfo.age}
                  onChangeText={(text) => setEditedInfo({ ...editedInfo, age: text })}
                  placeholder="Age"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.birthdayContainer}>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="calendar-outline" size={24} color="gray" style={styles.iconStyle} />
                  <Text style={styles.iconLetter}>M</Text>
                  <TextInput
                    style={[styles.centertext, !isEditing && styles.disabledInput]}
                    editable={isEditing}
                    value={editedInfo.birthday.Month}
                    onChangeText={(text) => setEditedInfo({
                      ...editedInfo,
                      birthday: { ...editedInfo.birthday, Month: text }
                    })}
                    placeholder="MM"
                    keyboardType="numeric"
                  />
                </View>
                <Text>/</Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="calendar-outline" size={24} color="gray" style={styles.iconStyle} />
                  <Text style={styles.iconLetter}>D</Text>
                  <TextInput
                    style={[styles.centertext, !isEditing && styles.disabledInput]}
                    editable={isEditing}
                    value={editedInfo.birthday.Date}
                    onChangeText={(text) => setEditedInfo({
                      ...editedInfo,
                      birthday: { ...editedInfo.birthday, Date: text }
                    })}
                    placeholder="DD"
                    keyboardType="numeric"
                  />
                </View>
                <Text>/</Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="calendar-outline" size={24} color="gray" style={styles.iconStyle} />
                  <Text style={styles.iconLetter}>Y</Text>
                  <TextInput
                    style={[styles.centertext, !isEditing && styles.disabledInput]}
                    editable={isEditing}
                    value={editedInfo.birthday.Year}
                    onChangeText={(text) => setEditedInfo({
                      ...editedInfo,
                      birthday: { ...editedInfo.birthday, Year: text }
                    })}
                    placeholder="YYYY"
                    keyboardType="numeric"
                  />
                </View>
            </View>

            <View style={styles.buttonContainer}>
              <Pressable style={styles.buttonedit} onPress={toggleEdit}>
                <Text style={styles.editButtonText}>{isEditing ? 'SAVE ACCOUNT INFORMATION' : 'EDIT ACCOUNT INFORMATION'}</Text>
              </Pressable>
              
              {isEditing && ( // Only show cancel button when editing
                <Pressable style={styles.cancelButton} onPress={() => {
                  setIsEditing(false);
                  setEditedInfo({
                    email: staffInfo.email,
                    phone: staffInfo.phone.toString(),
                    age: staffInfo.age.toString(),
                    birthday: {
                      Date: staffInfo.birthday.Date.toString(),
                      Month: staffInfo.birthday.Month.toString(),
                      Year: staffInfo.birthday.Year.toString(),
                    },
                  });
                }}>
                  <Text style={styles.cancelButtonText}>CANCEL</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      case 'About':
        return (
          <View>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.detailText}>This app is designed to manage POS systems for businesses.</Text>
          </View>
        );
      case 'Developers':
        return (
          <View>
            <Text style={styles.sectionTitle}>Developers</Text>
            <Text style={styles.detailText}>Developed by Relgin Paloma and team.</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (!staffInfo) {
    return (
      <View style={styles.container}>
        <Text>Loading staff information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainSection}>
        {/* Left Column: Profile Section */}
        <View style={styles.profileSection}>
          
          <ImageBackground
          source={require('@/assets/images/gradient.png')} // Assuming gradient.png is the name of your image in assets/images
          style={styles.profileSectionBackground}
          resizeMode="cover"
          >
          
            <Image
              source={{ uri: staffInfo.imageUrl }}
              style={styles.profileImage}
            />
          </ImageBackground>

          <Text style={styles.staffName}>{staffInfo.name}</Text>
          <Text style={styles.staffRole}>{staffInfo.role}</Text>

          <ScrollView style={styles.profileScroll}>
              {/* Card for buttons */}
            <View style={styles.card}>
              <Pressable style={styles.button} onPress={() => setSelectedSection('AccountInfo')}>
                <FontAwesome name="user" size={20} color="#203B36" />
                <Text style={styles.buttonText}>Account Info</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Pressable style={styles.button} onPress={() => setSelectedSection('About')}>
                <FontAwesome name="info-circle" size={20} color="#203B36" />
                <Text style={styles.buttonText}>About</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Pressable style={styles.button} onPress={() => setSelectedSection('Developers')}>
                <FontAwesome name="code" size={20} color="#203B36" />
                <Text style={styles.buttonText}>Developers</Text>
              </Pressable>
            </View>

            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <FontAwesome name="sign-out" size={20} color="white" />
              <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Right Column: Content Section */}
        <ScrollView style={styles.detailsSection}>
          {renderSectionContent()}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  mainSection: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#f9f9f9',
    marginTop: 20,
  },
  profileSectionBackground: {
    width: '100%',
    height: 150, // Adjust the height of the profile section as needed
    alignSelf: 'center',
    resizeMode: 'cover',
  },
  profileSection: {
    width: '30%',
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#fff',
    shadowColor: '#203B36',
    elevation: 8,
    alignItems: 'center',
    overflow: 'hidden',
    justifyContent: 'center'
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: '#203B36',
    borderWidth: 3,
    position: 'absolute',
    bottom: -50,
    alignSelf: 'center',
  },
  staffName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DDB04B',
    marginTop: 50,
    marginBottom: 5,
    textAlign: 'center',
  },
  staffRole: {
    fontSize: 16,
    color: '#DDB04B',
    marginBottom: 15,
    textAlign: 'center',
  },
  profileScroll: {
    overflow: 'scroll',
    width: '100%',
    paddingTop: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#203B36',
    elevation: 8,
    borderColor: '#DDB04B',
    borderWidth: 1,
    width: '80%',
    alignSelf: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#203B36',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4d4f',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
    marginTop: 20,
    width: '80%',
    borderColor: '#DDB04B',
    borderWidth: 1,
    shadowColor: '#203B36',
    elevation: 8,
    marginBottom: 40,
    alignSelf: 'center',
  },
  logoutText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
  detailsSection: {
    flex: 1,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    shadowColor: '#203B36',
    elevation: 8,
  },
  profcontainer:{
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#203B36',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 10,
  },
  disabledInput: {
    color: 'gray',
  },
  profileImage1: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    marginTop: 10,
    alignSelf: 'flex-end',
    borderColor: '#203B36',
    borderWidth: 2,
    marginRight: 20,
    marginLeft: 20,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 30,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#DDB04B',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginHorizontal:10,
    marginBottom: 10,
    shadowColor: '#203B36',
    elevation: 8, 
  },
  iconStyle: {
    marginRight: 5,
  },
  input: {
    flex: 1, 
    height: 40, 
    paddingLeft: 5,
  },
  birthdayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#f9f9f9',
  }, 
  birthdayInputWrapper: {
    position: 'relative',
    width: '30%', 
    marginBottom: 20,
  },
  iconTextWrapper: {
    flexDirection: 'row',
    backgroundColor: '#203B36',
    alignItems: 'center',
  },
  iconTextStyle: {
    marginRight: 10, 
  },
  detailtext: {
    fontSize: 14, 
    color: '#DDB04B', 
    fontWeight: 'bold',
  },
  centertext: {
    paddingVertical: 5,
  },
  iconLetter: {
    fontSize: 18,
    color: 'gray',
    marginRight: 10,
  },
  card1: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 30,
    backgroundColor: '#DDB04B',
    shadowColor: '#DDB04B',
    elevation: 10,
    borderRadius: 12,
    margin: 10,
    overflow: 'hidden',
  },
  card2: {
    flexDirection: 'column',
    paddingTop: 10,
    paddingLeft: 8, 
    paddingRight: 4,
    backgroundColor: '#203B36',
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row', // Align buttons in a row
    justifyContent: 'space-between', // Space between buttons
    marginTop: 20,
    marginHorizontal: 20,
  },
  buttonedit: {
    flex: 1,
    backgroundColor: '#203B36', // Your button color
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 10, // Space between buttons
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'red', // Change as needed
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF', // Your text color
  },
  cancelButtonText: {
    color: '#FFFFFF', // Change as needed
  },
});