import { StyleSheet, Image, TextInput, ScrollView, TouchableOpacity, View, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Text } from '@/components/StyledText';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { getDatabase, ref, onValue, set, remove, push, get } from 'firebase/database';
import { firebase_app } from '../../FirebaseConfig';

interface OrderItem {
  Price: number;
  ProductName: string;
  Quantity: number;
  Size: string;
  Variation: string;
}

interface Order {
  CustomerName: string;
  Discount: number;
  OrderDateTime: string;
  Preference: string;
  StaffName: string;
  Subtotal: number;
  Total: number;
  OrderItems: { [key: string]: OrderItem };
}

export default function TabTwoScreen() {
  const [orders, setOrders] = useState<{ orderNumber: string; order: Order }[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<{ orderNumber: string; order: Order }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'Dine In' | 'Take Out' | 'All'>('All');

  useEffect(() => {
    const db = getDatabase(firebase_app);
    const ordersRef = ref(db, 'orders'); // Adjust the path if needed

    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedOrders = Object.keys(data).map(orderNumber => {
          const order = data[orderNumber];
          return {
            orderNumber,
            order: {
              CustomerName: order.CustomerName || '',
              Discount: order.Discount || 0,
              OrderDateTime: order.OrderDateTime || '',
              Preference: order.Preference || '',
              StaffName: order.StaffName || '',
              Subtotal: order.Subtotal || 0,
              Total: order.Total || 0,
              OrderItems: Object.keys(order).filter(k => k.startsWith('Order_')).reduce((acc, key) => {
                acc[key] = order[key];
                return acc;
              }, {} as { [key: string]: OrderItem })
            }
          };
        });
        setOrders(formattedOrders);
        setFilteredOrders(formattedOrders);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(({ order }) => {
      const matchesSearchTerm = order.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.OrderDateTime && order.OrderDateTime.includes(searchTerm));

      const matchesFilter = filterType === 'All' || order.Preference === filterType;

      return matchesSearchTerm && matchesFilter;
    });
    setFilteredOrders(filtered);
  }, [searchTerm, filterType, orders]);

  const markAsDone = (orderNumber: string) => {
    Alert.alert(
        "Confirm",
        "Are you sure you want to mark this order as done?",
        [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "OK",
                onPress: () => {
                    const db = getDatabase(firebase_app);
                    const orderRef = ref(db, `orders/${orderNumber}`);
                    const historyRef = ref(db, 'history');

                    get(orderRef).then((snapshot) => {
                        const orderData = snapshot.val();
                        console.log('Order data retrieved from database:', orderData);

                        if (orderData) {
                            const newHistoryRef = push(historyRef);
                            const newHistoryKey = newHistoryRef.key; // Get the unique key generated by push

                            console.log('New history reference key:', newHistoryKey);

                            if (newHistoryKey) {
                                // Ensure orderItems is defined and correctly formatted
                                const orderItems: { [key: string]: { price: number; productName: string; quantity: number; size: string; variation: string } } = Object.keys(orderData)
                                  .filter(key => key.startsWith('Order_'))
                                  .reduce((acc, key) => {
                                    const item = orderData[key] as OrderItem;
                                    acc[key.toLowerCase()] = {
                                      price: item.Price,
                                      productName: item.ProductName,
                                      quantity: item.Quantity,
                                      size: item.Size,
                                      variation: item.Variation,
                                    };
                                    return acc;
                                  }, {} as { [key: string]: { price: number; productName: string; quantity: number; size: string; variation: string } });

                                set(newHistoryRef, {
                                    customerName: orderData.CustomerName,
                                    discount: orderData.Discount,
                                    orderDateTime: orderData.OrderDateTime,
                                    orderItems, // Set the formatted orderItems
                                    orderNumber: orderData.orderNumber || orderNumber,
                                    preference: orderData.Preference,
                                    staffName: orderData.StaffName,
                                    subtotal: orderData.Subtotal,
                                    total: orderData.Total
                                })
                                .then(() => {
                                    console.log('Order data successfully written to history.');
                                    return remove(orderRef); // Return the promise to chain `.catch`
                                })
                                .then(() => {
                                    console.log('Order successfully removed from orders.');
                                })
                                .catch((error) => {
                                    console.error("Error during Firebase operations:", error);
                                    if (error && typeof error === 'object') {
                                        console.error('Error details:', error.message || 'No error message');
                                    } else {
                                        console.error('Error details: Unknown error');
                                    }
                                });
                            } else {
                                console.error('Error: newHistoryKey is null or undefined.');
                            }
                        } else {
                            console.error('Error: Order data is null or undefined.');
                        }
                    }).catch((error) => {
                        console.error('Error reading order data:', error);
                        if (error && typeof error === 'object') {
                            console.error('Error details:', error.message || 'No error message');
                        } else {
                            console.error('Error details: Unknown error');
                        }
                    });
                },
            },
        ],
        { cancelable: false }
    );
};

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <View style={styles.titleSearchContainer}>
          <Text style={styles.pageTitle}>Ongoing Orders</Text>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={24} color="#DDB04B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchBar}
              placeholder="Search orders..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#DDB04B"
            />
          </View>
        </View>
      </View>

      {/* Filter buttons */}
      <View style={styles.filterButtonContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'All' && styles.activeButton]}
          onPress={() => setFilterType('All')}
        >
          <Text style={styles.filterButtonText}>All</Text>
        </TouchableOpacity>
        <View style={styles.lastTwoButtonsContainer}>
          <TouchableOpacity
          style={[styles.filterButton, filterType === 'Dine In' && styles.activeButton]}
          onPress={() => setFilterType('Dine In')}
        >
          <Text style={styles.filterButtonText}>Dine In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'Take Out' && styles.activeButton]}
          onPress={() => setFilterType('Take Out')}
        >
          <Text style={styles.filterButtonText}>Take Out</Text>
        </TouchableOpacity>
        </View>
        
      </View>

      {/* ScrollView for displaying orders */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.orderGrid}>
          {filteredOrders.map(({ orderNumber, order }) => (
            <View key={orderNumber} style={styles.orderContainer}>
              <Text style={styles.orderNumber}>Order# {orderNumber}</Text>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#203B36" />
                <Text style={styles.customerName}>{order.CustomerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#203B36" />
                <Text style={styles.orderDate}>{order.OrderDateTime}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={16} color="#203B36" />
                <Text style={styles.total}>₱{order.Total}</Text>
              </View>
            
              <View style={styles.orderItemsContainer}>
                {Object.keys(order.OrderItems || {}).map((key, itemIndex) => {
                  const item = order.OrderItems[key];
                  return (
                    <View key={itemIndex} style={styles.orderItem}>
                      <View style={styles.infoRow}>
                        <Ionicons name="pricetag-outline" size={18} color="#DDB04B" />
                        <Text style={styles.productName}>{item.ProductName}</Text>
                      </View>
                      <View style={styles.mainRow}>
                        <View style={styles.infoRow}>
                          <Ionicons name="cafe-outline" size={16} color="#DDB04B" />
                          <Text style={styles.itemDetails}>{item.Size || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="layers-outline" size={16} color="#DDB04B" />
                          <Text style={styles.itemDetails}>{item.Quantity || 0}</Text>
                        </View>
                      </View>
                      <View style={styles.mainRow}>
                        <View style={styles.infoRow}>
                          <Ionicons name="cash-outline" size={16} color="#DDB04B" />
                          <Text style={styles.itemDetails}>₱{item.Price || 0}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          {item.Variation === 'Hot' ? (
                            <Ionicons name="flame-outline" size={16} color="#FF4500" />
                          ) : item.Variation === 'Iced' ? (
                            <FontAwesome name="snowflake-o" size={16} color="#00BFFF" />
                          ) : (
                            <Ionicons name="swap-horizontal-outline" size={16} color="#DDB04B" />
                          )}
                          <Text style={styles.itemDetails}>{item.Variation || 'N/A'}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => markAsDone(orderNumber)}
              >
                <Text style={styles.doneButtonText}>DONE</Text>
              </TouchableOpacity>
            </View>          
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#f9f9f9',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginRight: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: '#f9f9f9',
  },
  titleSearchContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 26,
    color: '#203B36',
    fontWeight: 'bold',
    marginBottom: 14,
    marginTop: 20,
    fontFamily: 'Poppins-Black',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderColor: '#DDB04B',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    shadowColor: '#203B36',
    elevation: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    height: 40,
    color: '#DDB04B',
  },
  filterButtonContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'flex-start',
    width: '100%',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDB04B',
    marginHorizontal: 2,
    alignItems: 'center',
    backgroundColor: '#fff',
    maxWidth: 100,
    minWidth: 100,
  },
  lastTwoButtonsContainer: {
    flexDirection: 'row',
    marginLeft: 'auto'
  },
  activeButton: {
    backgroundColor: '#DDB04B',
  },
  filterButtonText: {
    color: '#203B36',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  orderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  orderContainer: {
    width: '31%', // Set the width for 4-column layout
    padding: 10,
    marginBottom: 10,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#203B36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 4,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DDB04B',
  },
  customerName: {
    fontSize: 14,
    marginVertical: 4,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    marginVertical: 2,
    marginLeft: 8,
  },
  total: {
    fontSize: 14,
    marginVertical: 4,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  orderItemsContainer: {
    marginTop: 10,
  },
  orderItem: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  itemDetails: {
    fontSize: 13,
    marginLeft: 8,
  },
  doneButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#203B36',
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});