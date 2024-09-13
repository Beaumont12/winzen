import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; // For search icon
import { MaterialIcons } from '@expo/vector-icons'; // For cup icons

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
  const [order, setOrder] = useState<Array<{ product: Product; variation: string; size: string; price: number }>>([]);

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
        console.log('Products fetched:', response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchCategories();
    fetchProducts();
  }, []);

  const handleAddToOrder = (product: Product, variation: string, size: string, price: number) => {
    setOrder([...order, { product, variation, size, price }]);
  };

  const filteredProducts = products
    .filter(product =>
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
            const size = Object.keys(priceItem)[0]; // Get the size (e.g., '8oz')
            const price = priceItem[size]; // Get the price for that size

            return (
              price !== undefined && (
                <TouchableOpacity
                  key={`${item._id}-${variation}-${index}`}
                  onPress={() => handleAddToOrder(item, variation, size, Number(price))}
                  style={styles.priceButton}
                >
                  <View style={styles.priceContent}>
                    <MaterialIcons name="coffee" size={16} color="#FFFFFF" style={styles.cupIcon} />
                    <Text style={styles.productPrice}>
                      {size}: ₱{handlePrice(price)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            );
          })}
        </View>
      </View>
    );

    return (
      <View style={styles.product}>
        <Image source={{ uri: item.imageURL }} style={styles.productImage} />
        <Text style={styles.productName}>{item.Name || 'No Name'}</Text>
        <Text style={styles.productDescription}>
          {item.Description || 'No description available'}
        </Text>
        {hotPrices.length > 0 && renderPrices(hotPrices, 'Hot')}
        {icedPrices.length > 0 && renderPrices(icedPrices, 'Iced')}
      </View>
    );
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      key={item._id}
      onPress={() => setSelectedCategory(item.Name)}
      style={styles.categoryButton}
    >
      <Text style={styles.categoryButtonText}>{item.Name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Page Title with Logo */}
      <View style={styles.pageHeader}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.pageTitle}>Menu Page</Text>
      </View>

      {/* Search bar with icon */}
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

      {/* Horizontal scroll for categories */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderCategoryItem}
        keyExtractor={item => item._id}
        ListHeaderComponent={
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            style={styles.categoryButton}
          >
            <Text style={styles.categoryButtonText}>All</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={styles.categoryContainer}
      />
      
      <View style={styles.mainContent}>
        {/* Product list */}
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item._id}
          renderItem={renderProductItem}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productsContainer}
          showsVerticalScrollIndicator={true}
          style={styles.productsFlatList}
        />

        {/* Order summary */}
        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>Order Summary:</Text>
          {order.length > 0 ? (
            <FlatList
              data={order}
              keyExtractor={(item, index) => `${item.product._id}-${index}`}
              renderItem={({ item }) => (
                <Text>
                  {item.product.Name} ({item.variation} - {item.size}) - ₱{item.price.toFixed(2)}
                </Text>
              )}
            />
          ) : (
            <Text>No items in the order</Text>
          )}
        </View>
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
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#203B36',
    marginLeft: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderColor: '#DDB04B',
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
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
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A1D1A',
  },
  mainContent: {
    flexDirection: 'row',
    flex: 24,
  },
  productsContainer: {
    paddingBottom: 16,
  },
  productsFlatList: {
    flex: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  product: {
    flex: 1,
    margin: 6,
    backgroundColor: '#203B36',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    height: width * 0.3,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#DDB04B',
    textAlign: 'center',
  },
  productDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  priceContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  priceButton: {
    backgroundColor: '#DDB04B',
    padding: 8,
    margin: 4,
    borderRadius: 5,
    width: '100%', // Adjust width to fit three columns
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    color: '#122D28',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cupIcon: {
    marginRight: 8,
  },
  variationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DDB04B',
    marginBottom: 8,
    width: '100%',
    textAlign: 'center',
  },
  orderSummary: {
    width: width * 0.3,
    backgroundColor: '#203B36',
    padding: 16,
    borderRadius: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DDB04B',
    marginBottom: 8,
  },
});