import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Platform, KeyboardAvoidingView, View, FlatList, TextInput, StyleSheet, Image, TouchableOpacity, Dimensions, Alert, ScrollView } from 'react-native';
import { Text } from '@/components/StyledText';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; 
import { Picker } from '@react-native-picker/picker'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, onValue, set, get, push } from "firebase/database";
import { firebase_app } from '../../FirebaseConfig';
import { useRouter } from 'expo-router';
import styles from '../styles/styles'

interface Size { [size: string]: number;}

interface Variation {
  price?: string; 
  temperature?: {
    hot?: Size; 
    iced?: Size; 
  };
}

interface Product { _id: string; Category: string; Description: string; Name: string; Variations: Variation; imageURL: string; stockStatus: string; }

interface Category { _id: string; Name: string; }

const { width } = Dimensions.get('window');

export default function TabOneScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState<Array<{ product: Product; variation: string; size: string; price: number; quantity: number }>>([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState<string | null>('');
  const [dineIn, setDineIn] = useState(true);
  const [orderNumber, setOrderNumber] = useState(1);
  const [cashierName, setCashierName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const db = getDatabase(firebase_app); 

    const fetchCategories = () => {
      const categoriesRef = ref(db, 'categories');
      onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val(); if (data) { const categoriesArray = Object.keys(data).map((key) => ({ _id: key, ...data[key], }));
          setCategories(categoriesArray); } }); };

    const fetchProducts = () => {
      const productsRef = ref(db, 'products');
      onValue(productsRef, (snapshot) => {
        const data = snapshot.val(); if (data) { const productsArray = Object.keys(data).map((key) => ({ _id: key, ...data[key], }));
          setProducts(productsArray); } }); };

    const loadCashierInfo = async () => {
      try {
        const storedStaffInfo = await AsyncStorage.getItem('staffInfo');
        if (storedStaffInfo) { const staffData = JSON.parse(storedStaffInfo);
          if (staffData.name) { setCashierName(staffData.name);
          } else { await AsyncStorage.removeItem('staffInfo'); router.replace('/login'); }
        } else { router.replace('/login'); }
      } catch (error) { console.error('Error loading staff info:', error); router.replace('/login'); } };
    fetchCategories(); fetchProducts(); loadCashierInfo(); }, []);

  const clearOrder = () => { setOrder([]); setCustomerName(''); };

  useEffect(() => { loadOrderNumber(); }, []);
  
  const handleAddToOrder = useCallback((product: Product, variation: string, size: string, price: number) => {
    if (product.stockStatus === 'Out of Stock') { Alert.alert('Product not in stock'); return; }
  
    setOrder(prevOrder => {
      const existingProductIndex = prevOrder.findIndex( item => item.product._id === product._id && item.variation === variation && item.size === size );
  
      if (existingProductIndex >= 0) { return prevOrder.map((item, index) => index === existingProductIndex ? { ...item, quantity: item.quantity + 1 } : item );
      } else { return [...prevOrder, { product, variation, size, price, quantity: 1 }]; } }); }, []); 

  const filteredProducts = products.filter( (product) => (!selectedCategory || product.Category === selectedCategory) && product.Name.toLowerCase().includes(searchTerm.toLowerCase()) );

  const handlePrice = (price: any) => {
    const priceNumber = Number(price);
    if (isNaN(priceNumber)) { console.warn('Invalid price:', price); return 'N/A'; } return priceNumber.toFixed(2); };

    const ProductItem = memo(({ item, handleAddToOrder }: { item: Product; handleAddToOrder: (item: Product, variation: string, size: string, price: number) => void }) => {
      const hotPrices = item.Variations?.temperature?.hot || {};
      const icedPrices = item.Variations?.temperature?.iced || {};
      const basePrice = item.Variations?.price ? { Standard: Number(item.Variations.price) } : {};
    
      // Function to render prices for each size under a variation
      const renderPrices = (prices: Size, variation: string) => (
        <View>
          <Text style={styles.variationTitle}>{variation}</Text>
          <View style={styles.priceContainer}>
            {Object.entries(prices).map(([size, price]) => (
              <View key={`${item._id}-${variation}-${size}`} style={styles.priceWrapper}>
                <TouchableOpacity
                  onPress={() => handleAddToOrder(item, variation, size, Number(price))}
                  style={[styles.priceButton, item.stockStatus === 'Out of Stock' && styles.disabledButton]}
                  disabled={item.stockStatus === 'Out of Stock'}>
                  <MaterialIcons name="coffee" size={16} color="#FFFFFF" style={styles.cupIcon} />
                  <Text style={styles.productPrice}>₱{handlePrice(price)}</Text>
                </TouchableOpacity>
                <Text style={styles.sizeLabel}>{size}</Text>
              </View>
            ))}
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
    
          {/* Render hot variation prices if available */}
          {Object.keys(hotPrices).length > 0 && renderPrices(hotPrices, 'Hot')}
    
          {/* Render iced variation prices if available */}
          {Object.keys(icedPrices).length > 0 && renderPrices(icedPrices, 'Iced')}
    
          {/* Render base price if the product doesn't have temperature variations */}
          {Object.keys(basePrice).length > 0 && (
            <View>
              <Text style={styles.variationTitle}>Price</Text>
              <View style={styles.priceContainer}>
                <View style={styles.priceWrapper}>
                  <TouchableOpacity
                    onPress={() => handleAddToOrder(item, 'Standard', '', Number(basePrice.Standard))}
                    style={[styles.priceButton, item.stockStatus === 'Out of Stock' && styles.disabledButton]}
                    disabled={item.stockStatus === 'Out of Stock'}>
                    <MaterialIcons name="local-dining" size={16} color="#FFFFFF" style={styles.cupIcon} />
                    <Text style={styles.productPrice}>₱{handlePrice(basePrice.Standard)}</Text>
                  </TouchableOpacity>
                  <Text style={styles.sizeLabel}>Standard</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      );
    });
  
  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductItem item={item} handleAddToOrder={handleAddToOrder} />
  );

  const CategoryItem = memo(({ item, setSelectedCategory }: { item: Category; setSelectedCategory: Function }) => (
    <TouchableOpacity key={item._id} onPress={() => setSelectedCategory(item.Name)} style={styles.categoryButton}>
      <Text style={styles.categoryButtonText}>{item.Name}</Text>
    </TouchableOpacity>
  ));  

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <CategoryItem item={item} setSelectedCategory={setSelectedCategory} />
  );

  const { subtotal, discountValue, total } = useMemo(() => {
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
  }, [order, discount]);  

  const handleConfirmOrder = useCallback(async () => {
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
                    Alert.alert('Order Canceled');
                },
                style: 'cancel',
            },
            {
                text: 'Confirm',
                onPress: async () => {
                    try {
                        const formatToTwoDecimalPlaces = (value: number) => value.toFixed(2);
                        const formatDate = () => {
                            const currentDate = new Date();
                            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                            const dayName = days[currentDate.getUTCDay()];
                            const monthName = months[currentDate.getUTCMonth()];
                            const day = currentDate.getUTCDate();
                            const year = currentDate.getUTCFullYear();
                            const hours = String(currentDate.getUTCHours()).padStart(2, '0');
                            const minutes = String(currentDate.getUTCMinutes()).padStart(2, '0');
                            const seconds = String(currentDate.getUTCSeconds()).padStart(2, '0');

                            return `${dayName} ${monthName} ${day} ${hours}:${minutes}:${seconds} GMT ${year}`;
                        };

                        const newOrder: Record<string, any> = {
                            CustomerName: customerName,
                            Discount: formatToTwoDecimalPlaces(discountValue),
                            OrderDateTime: formatDate(),
                            Preference: dineIn ? 'Dine In' : 'Take Out',
                            StaffName: cashierName,
                            Subtotal: formatToTwoDecimalPlaces(subtotal),
                            Total: formatToTwoDecimalPlaces(total),
                        };

                        order.forEach((item, index) => {
                            newOrder[`Order_${index + 1}`] = {
                                Price: formatToTwoDecimalPlaces(item.price),
                                ProductName: item.product.Name,
                                Quantity: item.quantity,
                                Size: item.size,
                                Variation: item.variation,
                            };
                        });

                        console.log('New Order:', newOrder);

                        const db = getDatabase(firebase_app);
                        const ordersRef = ref(db, 'orders');
                        const orderNumberRef = ref(db, 'orderNumber');
                        const currentOrderNumber = orderNumber.toString();
                        console.log('Current Order Number:', currentOrderNumber);

                        await set(ref(db, `orders/${currentOrderNumber}`), newOrder);
                        const nextOrderNumber = orderNumber + 1;
                        console.log('Next Order Number:', nextOrderNumber);
                        await set(orderNumberRef, nextOrderNumber);

                        // Fetch stocks data
                        const utensilsRef = ref(db, 'stocks/Utensils');
                        const utensilsSnapshot = await get(utensilsRef);
                        const utensils = utensilsSnapshot.val();
                        console.log('Utensil Stocks:', utensils);

                        const ingredientsRef = ref(db, 'stocks/Ingredients');
                        const ingredientsSnapshot = await get(ingredientsRef);
                        const ingredients = ingredientsSnapshot.val();
                        console.log('Ingredients Stocks:', ingredients);

                        const updatedIngredients = { ...ingredients };
                        const updatedUtensils = { ...utensils };

                        // Decrement ingredient stocks based on variation
                        for (const item of order) {
                            if (item.variation === 'Standard') {
                                console.log('Processing Standard Variation for Item:', item);
                                let itemProcessed = false;

                                // Process cakes
                                if (updatedIngredients.Cakes && typeof updatedIngredients.Cakes === 'object') {
                                    let cakeItem = null;

                                    // Iterate through Cakes object
                                    for (const cakeKey in updatedIngredients.Cakes) {
                                        if (updatedIngredients.Cakes.hasOwnProperty(cakeKey)) {
                                            const cake = updatedIngredients.Cakes[cakeKey];
                                            if (cake.name === item.product.Name) {
                                                cakeItem = cake;
                                                break;
                                            }
                                        }
                                    }

                                    if (cakeItem) {
                                        console.log('Found Cake Item:', cakeItem);
                                        cakeItem.stocks.slice -= item.quantity; // Subtract slices based on order quantity
                                        console.log(`Updated Slices for ${cakeItem.name}:`, cakeItem.stocks.slice);

                                        // Log the slice decrement
                                        await logStockHistory(cakeItem.name, -item.quantity);  // Log slice decrement

                                        // Handle whole cake decrement if needed
                                        if (cakeItem.stocks.slice < 0) {
                                            const wholeCakesToDecrement = Math.ceil(Math.abs(cakeItem.stocks.slice) / 8);
                                            cakeItem.stocks.whole -= wholeCakesToDecrement; // Decrease whole cakes
                                            cakeItem.stocks.slice = (cakeItem.stocks.slice % 8) + 8; // Adjust remaining slices if negative
                                            console.log(`Updated Whole Cakes for ${cakeItem.name}:`, cakeItem.stocks.whole);

                                            // Log the whole cake decrement
                                            await logStockHistory(cakeItem.name, -wholeCakesToDecrement);  // Log whole cake decrement
                                        }

                                        itemProcessed = true;
                                    }
                                }

                                // Process non-cake standard items
                                if (!itemProcessed) {
                                    for (const category in updatedIngredients) {
                                        console.log('Checking Category:', category);
                                        if (typeof updatedIngredients[category] === 'object') {
                                            for (const productKey in updatedIngredients[category]) {
                                                if (updatedIngredients[category].hasOwnProperty(productKey)) {
                                                    const product = updatedIngredients[category][productKey];
                                                    console.log(`Checking Product: ${product.name}`);

                                                    if (product.name === item.product.Name) {
                                                        console.log('Found Matching Non-Cake Item:', product.name);
                                                        product.stocks -= item.quantity;
                                                        console.log(`Updated Stocks for ${product.name}:`, product.stocks);

                                                        // Log stock change
                                                        await logStockHistory(product.name, -item.quantity);  // Log stock change
                                                        itemProcessed = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        if (itemProcessed) break;
                                    }
                                }

                                if (!itemProcessed) {
                                    console.log(`Item not found in ingredients: ${item.product.Name}`);
                                }
                            }
                        }

                        // Process utensil stocks for Take Out
                        if (newOrder.Preference === 'Take Out') {
                            for (const item of order) {
                                console.log('Processing Utensils for Take Out, Item:', item);

                                if (item.variation === 'Hot' && updatedUtensils.util3.stocks > 0) {
                                    updatedUtensils.util3.stocks -= item.quantity;
                                    console.log('Updated Paper Cups:', updatedUtensils.util3.stocks);
                                    await logStockHistory('Paper Cups', -item.quantity);  // Log stock change
                                } else if (item.variation === 'Iced') {
                                    if (updatedUtensils.util1.stocks > 0) {
                                        updatedUtensils.util1.stocks -= item.quantity;
                                        console.log('Updated Straws:', updatedUtensils.util1.stocks);
                                        await logStockHistory('Straws', -item.quantity);  // Log stock change
                                    }
                                    if (updatedUtensils.util2.stocks > 0) {
                                        updatedUtensils.util2.stocks -= item.quantity;
                                        console.log('Updated Cups:', updatedUtensils.util2.stocks);
                                        await logStockHistory('Cups', -item.quantity);  // Log stock change
                                    }
                                } else if (item.variation === 'Standard') {
                                    if (updatedUtensils.util4.stocks > 0) {
                                        updatedUtensils.util4.stocks -= item.quantity;
                                        console.log('Updated Wooden Sporks:', updatedUtensils.util4.stocks);
                                        await logStockHistory('Wooden Sporks', -item.quantity);  // Log stock change
                                    }
                                    if (updatedUtensils.util5.stocks > 0) {
                                        updatedUtensils.util5.stocks -= item.quantity;
                                        console.log('Updated Takeout Tupperwares:', updatedUtensils.util5.stocks);
                                        await logStockHistory('Takeout Tupperwares', -item.quantity);  // Log stock change
                                    }
                                }
                            }
                        }

                        // Save updated stocks
                        await set(utensilsRef, updatedUtensils);
                        console.log('Utensils updated successfully.');
                        await set(ingredientsRef, updatedIngredients);
                        console.log('Ingredients updated successfully.');

                        Alert.alert('Order Confirmed', 'Your order has been successfully confirmed.');

                        setOrderNumber(nextOrderNumber);
                        await saveOrderNumber(nextOrderNumber);
                        clearOrder();
                    } catch (error) {
                        Alert.alert('Error', 'An error occurred while confirming the order.');
                        console.error(error);
                    }
                },
            },
        ],
        { cancelable: false }
    );
  }, [customerName, order, discountValue, subtotal, total, orderNumber, dineIn, cashierName]);

  // Function to log stock history
  const logStockHistory = async (itemName: string, quantityChange: number) => {
    const db = getDatabase(firebase_app);
    const historyRef = ref(db, 'stocksHistory');

    const currentDate = new Date();
    const localDate = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000);
    const formattedDate = localDate.toISOString().split('T')[0];

    const newEntry = {
      Date: formattedDate, // You can create a function to format the current date
      ItemName: itemName,
      Actions: 'Ordered',
      Quantity: quantityChange,
    };

    // Add the new entry to the stocks history
    await push(historyRef, newEntry);
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
      const db = getDatabase(); // Get the Firebase database instance
      const orderNumberRef = ref(db, 'orderNumber'); // Reference to the 'orderNumber' node
  
      const snapshot = await get(orderNumberRef);
      if (snapshot.exists()) {
        const savedOrderNumber = snapshot.val();
        setOrderNumber(parseInt(savedOrderNumber, 10)); // Set the order number from Firebase
      } else {
        setOrderNumber(1);
      }
    } catch (error) {
      console.error('Error loading order number:', error);
      setOrderNumber(1); // Default to 1 if an error occurs
    }
  };

  const addProductToOrder = useCallback((product: Product, variation: string, size: string, price: number) => {
    setOrder(prevOrder => {
      const existingProductIndex = prevOrder.findIndex(item =>
        item.product.Name === product.Name && item.variation === variation && item.size === size
      );
  
      if (existingProductIndex !== -1) {
        return prevOrder.map((item, index) =>
          index === existingProductIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevOrder, { product, variation, size, price, quantity: 1 }];
      }
    });
  }, []);
  
  const decrementProductQuantity = useCallback((product: Product, variation: string, size: string) => {
    setOrder(prevOrder => {
      const existingProductIndex = prevOrder.findIndex(item =>
        item.product.Name === product.Name && item.variation === variation && item.size === size
      );
  
      if (existingProductIndex >= 0) {
        const updatedOrder = [...prevOrder];
        if (updatedOrder[existingProductIndex].quantity > 1) {
          updatedOrder[existingProductIndex].quantity -= 1;
        } else {
          updatedOrder.splice(existingProductIndex, 1);
        }
        return updatedOrder;
      }
      return prevOrder;
    });
  }, []);  

  const handleCustomerNameChange = useCallback((name: string) => {
    setCustomerName(name);
  }, []);
  
  return (
    <View style={styles.container}>

      <View style={styles.leftcontainer}>
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
      </View>
      </View>
      
      <View style={styles.rightcontainer}>
        <View style={styles.orderSummaryContainer}>
          <TextInput
                  placeholder="Enter Customer Name"
                  style={styles.customerNameInput}
                  value={customerName}
                  onChangeText={handleCustomerNameChange}
                />
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={order} 
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.productList}>
                <View key={index} style={styles.productItem}>
                <Image source={require('../../assets/images/littleorder.png')} style={styles.ordersum} />
                <View style={styles.orderName}>
                  <Text style={styles.orderName}>{item.product.Name}</Text>
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
            </View>
            )}
            ListHeaderComponent={() => (
              <View style={styles.orderSummary}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>Order #{String(orderNumber).padStart(3, '0')}</Text>
                  <TouchableOpacity onPress={clearOrder}>
                    <Text style={styles.clearAll}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cashier}>Cashier: {cashierName}</Text>
              </View>
            )}
            ListFooterComponent={() => (
              <View>
                <View style={styles.summaryDetails}>
                  <View style={styles.productItem}>
                    <Text>Subtotal</Text>
                    <Text>P{subtotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={discount} onValueChange={setDiscount} style={styles.picker}>
                    <Picker.Item label="Select Discount" value="none" />
                    <Picker.Item label="Senior Citizen" value="senior" />
                    <Picker.Item label="PWD" value="pwd" />
                    <Picker.Item label="Student" value="student" />
                  </Picker>
                  </View>
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
              </View>
            )}
          />
        </View> 
      </View>
    </View>
  );
}