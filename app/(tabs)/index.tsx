import React, { useState, useEffect } from 'react';
import { View, FlatList, TextInput, StyleSheet, Image, TouchableOpacity, Dimensions, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { Text } from '@/components/StyledText';
import { Ionicons } from '@expo/vector-icons'; // For search icon
import { MaterialIcons } from '@expo/vector-icons'; // For cup icons
import { Picker } from '@react-native-picker/picker'; // Picker for discount selection
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Size {
  [size: string]: number; // Allow indexing with string and returning a number
}

interface Variation {
  temperature: {
    hot: Size[];
    iced: Size[];
  };
}

interface Product {
  _id: string;
  Category: string;
  Description: string;
  Name: string;
  Variations: Variation;
  imageURL: string;
  stockStatus: string;
}

interface Category {
  _id: string;
  Name: string;
}

const { width } = Dimensions.get('window');

export default function TabOneScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState<Array<{ product: Product; variation: string; size: string; price: number; quantity: number }>>([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState<string | null>('');
  const [dineIn, setDineIn] = useState(true); // Default option for Dine In / Take Out
  const [orderNumber, setOrderNumber] = useState(1);
  const [cashierName, setCashierName] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://winzen-server-1.onrender.com/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await axios.get('https://winzen-server-1.onrender.com/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    const loadCashierInfo = async () => {
      try {
        const storedStaffInfo = await AsyncStorage.getItem('staffInfo');
        
        console.log('Stored Staff Info:', storedStaffInfo);
        
        if (storedStaffInfo) {
          const staffData = JSON.parse(storedStaffInfo);
          const { name } = staffData; // Extract the name field
          setCashierName(name); // Set the name state
        } else {
          console.log('No staff information found.');
        }
      } catch (error) {
        console.error('Error loading staff info:', error);
      }
    };    

    fetchCategories();
    fetchProducts();
    loadCashierInfo(); // Load cashier info on mount
  }, []);

  const clearOrder = () => {
    setOrder([]);
    setCustomerName('');
  };

  useEffect(() => {
    loadOrderNumber();
  }, []);
  
  const handleAddToOrder = (product: Product, variation: string, size: string, price: number) => {
    if (product.stockStatus === 'Out of Stock') {
      Alert.alert('Product not in stock');
      return;
    }
  
    // Update the order by finding if the product with the same variation and size already exists
    setOrder((prevOrder) => {
      const existingProductIndex = prevOrder.findIndex(
        (item) => item.product._id === product._id && item.variation === variation && item.size === size
      );
  
      if (existingProductIndex >= 0) {
        // If the product is found, update the quantity
        return prevOrder.map((item, index) =>
          index === existingProductIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // If the product doesn't exist, add it to the order
        return [...prevOrder, { product, variation, size, price, quantity: 1 }];
      }
    });
  };  

  const filteredProducts = products.filter(
    (product) =>
      (!selectedCategory || product.Category === selectedCategory) &&
      product.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrice = (price: any) => {
    const priceNumber = Number(price);
    if (isNaN(priceNumber)) {
      console.warn('Invalid price:', price);
      return 'N/A';
    }
    return priceNumber.toFixed(2);
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const hotPrices = item.Variations?.temperature?.hot || [];
    const icedPrices = item.Variations?.temperature?.iced || [];

    const renderPrices = (prices: Size[], variation: string) => (
      <View>
        <Text style={styles.variationTitle}>{variation}</Text>
        <View style={styles.priceContainer}>
          {prices.map((priceItem, index) => {
            const sizeKeys = Object.keys(priceItem);
            return sizeKeys.map((size) => {
              const price = priceItem[size];
              return (
                price !== undefined && (
                  <View key={`${item._id}-${variation}-${index}-${size}`} style={styles.priceWrapper}>
                    <TouchableOpacity
                      onPress={() => handleAddToOrder(item, variation, size, Number(price))}
                      style={[styles.priceButton, item.stockStatus === 'Out of Stock' && styles.disabledButton]}
                      disabled={item.stockStatus === 'Out of Stock'}
                    >
                      <MaterialIcons name="coffee" size={16} color="#FFFFFF" style={styles.cupIcon} />
                      <Text style={styles.productPrice}>₱{handlePrice(price)}</Text>
                    </TouchableOpacity>
                    <Text style={styles.sizeLabel}>{size}</Text>
                  </View>
                )
              );
            });
          })}
        </View>
      </View>
    );

    return (
      <View style={styles.product}>
        <Image source={{ uri: item.imageURL }} style={styles.productImage} />
        <Text style={styles.productName}>{item.Name || 'No Name'}</Text>
        <Text style={styles.productCategory}>{item.Category}</Text>
        <Text style={[styles.stockStatus, item.stockStatus === 'In Stock' ? styles.inStock : styles.outOfStock]}>
          {item.stockStatus}
        </Text>
        {hotPrices.length > 0 && renderPrices(hotPrices, 'Hot')}
        {icedPrices.length > 0 && renderPrices(icedPrices, 'Iced')}
      </View>
    );
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity key={item._id} onPress={() => setSelectedCategory(item.Name)} style={styles.categoryButton}>
      <Text style={styles.categoryButtonText}>{item.Name}</Text>
    </TouchableOpacity>
  );

  const calculateTotals = () => {
    const subtotal = order.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
    let discountValue = 0;
    
    if (discount === 'senior' || discount === 'pwd') {
      discountValue = subtotal * 0.2;
    } else if (discount === 'student') {
      discountValue = subtotal * 0.08;
    } else if (discount === 'none') {
      discountValue = 0;
    }
    
    const total = subtotal - discountValue;
    return { subtotal, discountValue, total };
  };     

  const { subtotal, discountValue, total } = calculateTotals();

  const handleConfirmOrder = () => {
    if (!customerName.trim()) {
      Alert.alert('Missing Customer Name', 'Please enter the customer name before confirming the order.');
      return;
    }
  
    if (order.length === 0) {
      Alert.alert('No Products in Order', 'Please add at least one product to the order before confirming.');
      return;
    }
  
    Alert.alert(
      'Confirm Order',
      'Are you sure you want to confirm this order?',
      [
        {
          text: 'Cancel',
          onPress: () => {
            // Order is canceled, don't change the order number
            Alert.alert('Order Canceled');
          },
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            // Proceed with order confirmation and print the bill
            Alert.alert('Order Confirmed');
            const newOrderNumber = orderNumber + 1;
            setOrderNumber(newOrderNumber); // Increment order number
            saveOrderNumber(newOrderNumber); // Save the new order number
            clearOrder(); // Clear the current order after confirming
          },
        },
      ],
      { cancelable: false }
    );
  };

  const saveOrderNumber = async (orderNumber: number) => {
    try {
      await AsyncStorage.setItem('orderNumber', orderNumber.toString());
    } catch (error) {
      console.error('Error saving order number:', error);
    }
  };

  const loadOrderNumber = async () => {
    try {
      const savedOrderNumber = await AsyncStorage.getItem('orderNumber');
      if (savedOrderNumber !== null) {
        setOrderNumber(parseInt(savedOrderNumber, 10)); // Set the order number from storage
      } else {
        setOrderNumber(1); // Default to 1 if no order number is found
      }
    } catch (error) {
      console.error('Error loading order number:', error);
      setOrderNumber(1); // Default to 1 if an error occurs
    }
  };  

    const addProductToOrder = (product: Product, variation: string, size: string, price: number) => {
    setOrder(prevOrder => {
      // Check if the product with the same variation and size already exists in the order
      const existingProductIndex = prevOrder.findIndex(item => 
        item.product.Name === product.Name && item.variation === variation && item.size === size
      );

      if (existingProductIndex !== -1) {
        // If the product exists, create a copy of the order and increment the quantity
        return prevOrder.map((item, index) =>
          index === existingProductIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add a new product entry with initial quantity of 1
        return [...prevOrder, { product, variation, size, price, quantity: 1 }];
      }
    });
  };


  // Function to decrement product quantity
  const decrementProductQuantity = (product: Product, variation: string, size: string) => {
    setOrder(prevOrder => {
      const existingProductIndex = prevOrder.findIndex(item =>
        item.product.Name === product.Name && item.variation === variation && item.size === size
      );

      if (existingProductIndex >= 0) {
        const updatedOrder = [...prevOrder];
        if (updatedOrder[existingProductIndex].quantity > 1) {
          updatedOrder[existingProductIndex].quantity -= 1;
        } else {
          // Remove product if quantity is 0
          updatedOrder.splice(existingProductIndex, 1);
        }
        return updatedOrder;
      }
      return prevOrder;
    });
  };

  return (
    <View style={styles.container}>
      {/* Header with logo on the left, title and search bar on the right */}
      <View style={styles.headerContainer}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <View style={styles.titleSearchContainer}>
          <Text style={styles.pageTitle}>Menu Page</Text>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={24} color="#DDB04B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchBar}
              placeholder="Search products..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#DDB04B"
            />
          </View>
        </View>
      </View>

      {/* Horizontal scroll for categories */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.categoryButton}>
            <Text style={styles.categoryButtonText}>All</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={styles.categoryContainer}
      />

      <View style={styles.mainContent}>
        {/* Product list */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderProductItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productsContainer}
          showsVerticalScrollIndicator={true}
          style={styles.productsFlatList}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
        />

        {/* Order summary */}
        <ScrollView style={styles.orderSummaryContainer}>
          <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Order #{String(orderNumber).padStart(3, '0')}</Text>
            <TouchableOpacity onPress={clearOrder}>
              <Text style={styles.clearAll}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.cashier}>Cashier: {cashierName}</Text>

          <TextInput
            placeholder="Enter Customer Name"
            style={styles.customerNameInput}
            value={customerName}
            onChangeText={setCustomerName}
          />

        <View style={styles.productList}>
          {order.map((item, index) => (
            <View key={index} style={styles.productItem}>
              <Image source={require('../../assets/images/littleorder.png')} style={styles.ordersum} />
              <View style={styles.orderName}>
              <Text style={styles.orderName}>{item.product.Name} </Text>
              <Text style={styles.orderName}>{item.variation} {item.size}</Text>
              </View>
              
              <Text>P{item.price * item.quantity}</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity onPress={() => decrementProductQuantity(item.product, item.variation, item.size)}>
                  <Text style={styles.counterButton}>-</Text>
                </TouchableOpacity>
                <Text>{item.quantity}</Text>
                <TouchableOpacity onPress={() => addProductToOrder(item.product, item.variation, item.size, item.price)}>
                  <Text style={styles.counterButton}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

          <View style={styles.summaryDetails}>
            <View style={styles.productItem}>
              <Text>Subtotal</Text>
              <Text>P{subtotal.toFixed(2)}</Text>
            </View>
            <Picker selectedValue={discount} onValueChange={setDiscount} style={styles.picker}>
              <Picker.Item label="Select Discount" value="none" />
              <Picker.Item label="Senior Citizen" value="senior" />
              <Picker.Item label="PWD" value="pwd" />
              <Picker.Item label="Student" value="student" />
            </Picker>
            <View style={styles.productItem}>
              <Text>Discount</Text>
              <Text>P{discountValue.toFixed(2)}</Text>
            </View>
            <View style={styles.productItem}>
              <Text>Total</Text>
              <Text>P{total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.dineInTakeOut}>
            <TouchableOpacity
              style={[styles.dineOption, dineIn ? styles.selectedOption : null]}
              onPress={() => setDineIn(true)}
            >
              <Text>Dine In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dineOption, !dineIn ? styles.selectedOption : null]}
              onPress={() => setDineIn(false)}
            >
              <Text>Take Out</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.printButton} onPress={handleConfirmOrder}>
            <Text style={styles.printButtonText}>Print Bills</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F7F8',
  },
  ordersum:{
    width: 50,
    height: '100%',
    borderRadius: 4,
    marginRight: 0,
  },
  orderName: {
    flexDirection: 'column',
    fontSize: 12,
    width: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginRight: 10,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginRight: 20,
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
    width: '100%',
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
  categoryContainer: {
    paddingVertical: 10,
  },
  categoryButton: {
    marginHorizontal: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#DDB04B',
    height: 40,
    width: 100,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 40,
    shadowColor: '#DDB04B',
    elevation: 8,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A1D1A',
    fontFamily: 'Poppins-Regular'
  },
  mainContent: {
    flexDirection: 'row',
    flex: 30,
    height: '100%',
  },
  productsContainer: {
    paddingBottom: 4,
  },
  productsFlatList: {
    flex: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  product: {
    flex: 1,
    margin: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    height: width * 0.50,
    shadowColor: '#203B36',
    elevation: 8,
    alignItems: 'center'
  },
  productImage: {
    width: '100%',
    height: '30%',
    borderRadius: 8,
    marginBottom: 5,
  },
  productName: {
    fontSize: 20,
    marginBottom: 2,
    margin: 10,
    fontWeight: 'bold',
    color: '#DDB04B',
    textAlign: 'left',
    fontFamily: 'Poppins-Regular'
  },
  productCategory: {
    fontSize: 14,
    color: '#122D28',
    marginBottom: 8,
  },
  stockStatus: {
    fontSize: 14,
    marginBottom: 4,
  },
  inStock: {
    color: 'green',
  },
  outOfStock: {
    color: 'red',
  },
  disabledButton: {
    backgroundColor: '#888',
  },
  priceContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    margin: 10,
  },
  priceWrapper: {
    alignItems: 'center',
    margin: 4,
  },
  priceButton: {
    width: '100%',
    backgroundColor: '#DDB04B',
    padding: 8,
    borderRadius: 5,
    flexDirection: 'column',
    alignItems: 'center',
  },
  productPrice: {
    color: '#122D28',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 0,
    fontFamily: 'Poppins-Regular'
  },
  cupIcon: {
    marginRight: 0,
  },
  sizeLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#203B36',
    fontFamily: 'Poppins-Regular'
  },
  variationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DDB04B',
    marginBottom: -2,
    marginTop: -5,
    margin: 10,
    width: '100%',
    fontFamily: 'Poppins-Regular',
    alignItems: 'center',
  },
  orderSummaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '100%', // Example percentage, adjust as needed
    maxWidth: 340, // Maximum width to ensure it doesn’t get too large
    shadowColor: '#203B36',
    elevation: 10,
    margin: 10,
    height: "100%",
    alignSelf: 'center',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 12,
    marginHorizontal: 12,
  },
  orderNumber: {
    color: '#DDB04B',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    marginHorizontal: 10,
  },
  clearAll: {
    color: '#FF0000',
    fontFamily: 'Poppins-Bold',
    marginHorizontal: 10,
  },
  customerNameInput: {
    backgroundColor: '#fff',
    color: '#DDB04B',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
    shadowColor: '#203B36',
    elevation: 10,
    marginHorizontal: 12,
  },
  productList: {
    marginBottom: 10,
    marginHorizontal: 12,
    width: '100%',
    height: 200,
    overflow: 'scroll'
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    marginHorizontal: 8,
    fontWeight: '800',
    fontFamily: 'Poppins-ExtraBold',
  },
  summaryDetails: {
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
    justifyContent: 'space-between',
    marginHorizontal: 12,
  },
  dineInTakeOut: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: 12,
    marginTop: 10,
  },
  dineOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#A9A9A9',
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#E8B86D',
    borderColor: '#DDB04B',
    borderWidth: 2,
  },
  printButton: {
    backgroundColor: '#203B36',
    borderRadius: 5,
    paddingVertical: 10,
    marginHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#203B36',
    elevation: 8,
  },
  printButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  picker: {
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 8,
    height: 30,
    marginTop: 6,
  },
  cashier: {
    marginBottom: 8,
    fontSize: 12,
    opacity: 40,
    marginHorizontal: 22,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginEnd: 12,
  },
  counterButton: {
    backgroundColor: '#006400', // A dark green color for the buttons
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 20, // Rounded buttons
    marginHorizontal: 10, // Space between buttons and text
    textAlign: 'center',
    minWidth: 40, // Ensure the button has a consistent size
  }
});