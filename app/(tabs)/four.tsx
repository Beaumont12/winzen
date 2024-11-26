import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Linking, StyleSheet, Pressable, Image, Alert, ScrollView, ImageBackground, TextInput, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // Image picker for selecting an image
import { getStorage, ref, uploadBytes, getDownloadURL, } from 'firebase/storage'; // Firebase storage methods
import { Ionicons } from '@expo/vector-icons'; // Icon library for edit
import { View } from '@/components/Themed';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { Text } from '@/components/StyledText';
import { getDatabase, set, ref as dbRef } from 'firebase/database';
import { firebase_app } from '../../FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StaffInfo {
  id: string;
  email: string;
  phone: string;
  age: string;
  birthday: {
    Date: string;
    Month: string;
    Year: string;
  };
  imageUrl: string | null;
  role: string;
  name: string;
  password: string;
}

export default function TabFourScreen() {
  const [imagePicked, setImagePicked] = useState(false);
  const router = useRouter();
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState('AccountInfo');
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    email: '',
    phone: '',
    age: '',
    birthday: { Date: '', Month: '', Year: '' },
    password: '',
  });
  const [image, setImage] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Load staff info from AsyncStorage
  useEffect(() => {
    const loadStaffInfo = async () => {
      try {
        const staffData = await AsyncStorage.getItem('staffInfo');
        if (staffData !== null) {
          const staff = JSON.parse(staffData);
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
            password: staff.password,
          });
          setImage(staff.imageUrl || null);
        }
      } catch (error) {
        console.error('Error loading staff info:', error);
      }
    };
    loadStaffInfo();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('staffInfo');
      Alert.alert('Success', 'Successfully Logged Out');
      router.replace('/login'); // Redirect to the login screen
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Toggle editing mode
  const toggleEdit = () => {
    if (isEditing) {
      confirmEdit(); // Call confirmEdit when saving
    } else {
      setIsEditing(true); // Enable editing mode
    }
  };

  // Confirm and save edited profile
  const confirmEdit = () => {
    Alert.alert(
      'Confirm Edit',
      'Are you sure you want to update your profile?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Edit canceled'),
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // Prevent further submissions while processing
              setIsEditing(false); // Disable editing mode temporarily
  
              if (imagePicked) {
                await uploadImage(); // Upload image if picked
              }
  
              // Ensure that staffInfo.id is valid
              if (!staffInfo?.id) {
                console.error("Error: staffId is undefined");
                return; // Exit if staffId is undefined
              }
  
              // Prepare data to send to Firebase
              const dataToSend = {
                Email: editedInfo.email,
                Phone: editedInfo.phone,
                Age: Number(editedInfo.age), // Convert age to a number
                Birthday: {
                  Date: Number(editedInfo.birthday.Date), // Convert Date to a number
                  Month: Number(editedInfo.birthday.Month), // Convert Month to a number
                  Year: Number(editedInfo.birthday.Year), // Convert Year to a number
                },
                ImageUrl: image || staffInfo.imageUrl, // Use new image if available
                Role: staffInfo.role, // Keep the existing role
                Name: staffInfo.name, // Keep the existing name
                Password: staffInfo.password,
              };
  
              // Log the data being sent to the database
              console.log('Data being sent to DB:', dataToSend);
  
              // Update staff information in Firebase Realtime DB
              const db = getDatabase(firebase_app);
              const staffRef = dbRef(db, `staffs/${staffInfo.id}`); // Use staffId correctly
              await set(staffRef, dataToSend);
  
              // Update local staffInfo with new values
              setStaffInfo((prev: StaffInfo | null) => 
                prev ? {
                  ...prev,
                  email: editedInfo.email,
                  phone: editedInfo.phone,
                  age: editedInfo.age,
                  birthday: editedInfo.birthday,
                  imageUrl: image || staffInfo.imageUrl,
                } : null
              );

              Alert.alert('Success', 'Profile updated successfully');
            } catch (error) {
              console.error('Error updating profile:', error);
              Alert.alert('Error', 'Failed to update profile');
            } finally {
              // Re-enable editing mode
              setIsEditing(true);
            }
          },
        },
      ]
    );
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
      const storage = getStorage(firebase_app);
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();

      // Ensure that staffInfo.name is not undefined
      if (!staffInfo.name) {
        console.error("Error: staff name is undefined");
        return; // Exit if staffInfo.name is undefined
      }

      // File path in Firebase Storage
      const storageRef = ref(storage, `images/${staffInfo.name}.png`); // Ensure staffInfo.name is used correctly

      // Upload file
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Update the image state and staff info with the new image URL
      setImage(downloadURL);
      setImagePicked(true); // Mark that an image has been updated
    }
  };

  const developers = [
    {
      name: "Relgin Paloma",
      role: "Lead Developer",
      linkedin: "https://www.linkedin.com/in/imrelgin/",
      github: 'https://github.com/Beaumont12',
      image: require('@/assets/images/dev1.png'), // Developer image
    },
    {
      name: "Sheena Basiga",
      role: "Project Manager",
      linkedin: "https://www.linkedin.com/in/sheena-mechaela-basiga-a31336296/",
      github: 'https://github.com/sheenabasiga',
      image: require('@/assets/images/dev3.jpg'),
    },
    {
      name: "Flynn Rigonan",
      role: "UI/UX Designer",
      linkedin: "https://www.linkedin.com/in/flynn-y-rigonan-3515542a8/",
      github: 'https://github.com/06flynn',
      image: require('@/assets/images/dev2.png'),
    },
  ];

  const renderSectionContent = () => {
    switch (selectedSection) {
      case 'AccountInfo':
        return (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
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

              <View style={styles.inputWithIcon}>
                <Ionicons name="lock-closed-outline" size={24} color="gray" style={styles.iconStyle} />
                <TextInput
                  style={[styles.input, !isEditing && styles.disabledInput]}
                  editable={isEditing}
                  value={editedInfo.password}
                  onChangeText={(text) => setEditedInfo({ ...editedInfo, password: text })}
                  placeholder="Password"
                  secureTextEntry={!isPasswordVisible} // Toggle password visibility
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <Ionicons
                    name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                    size={24}
                    color="gray"
                    style={styles.iconStyle}
                  />
                </TouchableOpacity>
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
                <Pressable 
                  style={styles.buttonedit} 
                  onPress={isEditing ? confirmEdit : toggleEdit}
                >
                  <Text style={styles.editButtonText}>
                    {isEditing ? 'SAVE ACCOUNT INFORMATION' : 'EDIT ACCOUNT INFORMATION'}
                  </Text>
                </Pressable>
                
                {isEditing && (
                  <Pressable 
                    style={styles.cancelButton} 
                    onPress={() => {
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
                        password: staffInfo.password,
                      });
                    }}
                  >
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </ScrollView>
        );
      case 'About':
        return (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.profcontainer}>
              <Text style={styles.sectionTitle2}>About</Text>
              <View style={styles.imageWrapper}>
                <ImageBackground 
                  source={require('../../assets/images/page1.jpg')} // Replace with your background image
                  style={styles.background} // Ensure this style covers the entire screen
                  resizeMode="cover" // Make sure the image scales properly
                >
                  <View style={styles.headerAbout}>
                    <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
                    <Text style={styles.pageTitle}>Winzen's Cafe History</Text>
                  </View>
                </ImageBackground>
              </View>
              
              <Text style={styles.detailText2}>It humbly began with an idea of establishing a warehouse,
                given that the place is really spacious. Later on, the owner
                thought of making it a coffee shop. Being a businessman,
                many of his associates had a penchant for coffee, and since
                his family also shared a love for it, he saw the opportunity to
                create his own coffee establishment.</Text>
              <Text style={styles.detailText2}>
              “If you are a coffee lover who has been drinking coffee in Cebu City unya mahal, pero og makatilaw mo sa among coffee diri, maka-ingon gyud mo nga equally at par ra gyud ang quality but mas affordable ang among coffee diri,” says Wince. (If you are a coffee lover who has been drinking coffee in Cebu City that are expensive, and if you have tried our coffee here, you would say that quality is equally at par yet it’s so affordable.)
              </Text>
            </View>
          </ScrollView>
        );
      case 'Developers':
        return (
          <View style={styles.profcontainer3}>
            <Text style={styles.sectionTitle2}>Winzen App Developers</Text>
            <FlatList
            contentContainerStyle={styles.scrollContainer}
            data={developers}
            renderItem={({ item }) => (
              <View style={styles.polaroid}>
                <Image source={item.image} style={styles.profileImage3} />
                <View style={styles.detailsContainer}>
                  <Text style={styles.nameText}>{item.name}</Text>
                  <Text style={styles.roleText}>{item.role}</Text>
                  <View style={styles.iconContainer}>
                    <TouchableOpacity onPress={() => Linking.openURL(item.linkedin)}>
                      <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openURL(item.github)}>
                      <Ionicons name="logo-github" size={24} color="#0077B5" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.name}
            numColumns={3} // Set number of columns to 3
          />
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              We are grateful to our talented developers who brought Winzen's Cafe app to life. A big thank you to our talented developers for their hard work and dedication. If you have any questions or want to collaborate, feel free to reach out to them on LinkedIn or GitHub!
            </Text>
          </View>
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
        <View style={styles.detailsSection}>
        {renderSectionContent()}
      </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9', // Or whatever color suits the design
  },
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
    marginBottom: 40,
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
  background: {
    flex: 1,  // Ensures the background covers the entire screen
    justifyContent: 'center', // Aligns the content
    alignItems: 'center',
    resizeMode: 'cover',
    borderRadius: 8,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginRight: 10,
  },
  headerAbout: {
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 60,
    borderColor: '#DDB04B',
    borderWidth: 2,
  },
  pageTitle: {
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DDB04B',
    marginBottom: 10,
    marginRight: 5,
  },
  imageWrapper: {
    width: '100%', 
    height: 121, 
    borderRadius: 10, 
    overflow: 'hidden',
  },
  sectionTitle2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#203B36',
    marginBottom:20,
  },
  detailText2: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'justify',
  },
  profcontainer3: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle3: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#203B36',
    marginBottom:20,
  },
  polaroid: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    margin: 10, 
    flex: 1, 
    maxWidth: '30%', 
    borderColor: '#DDB04B',
    borderWidth: 1,
  },
  profileImage3: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderColor: '#DDB04B',
    borderWidth: 1,
  },
  detailsContainer: {
    alignItems: 'center',
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#203B36',
  },
  roleText: {
    fontSize: 16,
    color: '#555555',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  footerContainer: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  footerText: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
  },
});
