import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, FlatList, Image, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { Text } from '@/components/StyledText';
import { getDatabase, ref, onValue } from 'firebase/database';
import { firebase_app } from '../../FirebaseConfig'

interface Transaction {
  orderNo: string;
  cashier: string;
  date: string;
  quantity: number;
  total: string;
}

export default function TabThreeScreen() {
  const [date, setDate] = useState(new Date());
  const [data, setData] = useState<Transaction[]>([]);
  const [filteredData, setFilteredData] = useState<Transaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const onChange = (_: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    setShowPicker(false);
    filterByDate(currentDate);
  };

  const showDatePicker = () => {
    setShowPicker(true);
  };

  const showAllData = () => {
    setFilteredData(data); // Reset the filtered data to show all transactions
  };

  useEffect(() => {
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      const filtered = data.filter(item =>
        item.orderNo.toLowerCase().includes(lowercasedSearchTerm) ||
        item.cashier.toLowerCase().includes(lowercasedSearchTerm) ||
        item.date.toLowerCase().includes(lowercasedSearchTerm)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchTerm, data]);

  useEffect(() => {
    const fetchHistoryFromFirebase = async () => {
      const db = getDatabase(firebase_app);
      const historyRef = ref(db, 'history'); // Adjust the path to match your Firebase structure

      onValue(historyRef, (snapshot) => {
        const result = snapshot.val();
        const mappedData = Object.keys(result || {}).map((key) => {
          const item = result[key];
          return {
            orderNo: item.orderNumber,
            cashier: item.staffName,
            date: formatOrderDate(item.orderDateTime),
            quantity: Object.keys(item.orderItems).reduce((acc, key) => acc + item.orderItems[key].quantity, 0),
            total: `$${item.total}`,
          };
        });
        setData(mappedData);
        setFilteredData(mappedData);
      }, (error) => {
        console.error('Error fetching history:', error);
      });
    };

    fetchHistoryFromFirebase();
  }, []);

  const formatOrderDate = (orderDateTime: string) => {
    const parts = orderDateTime.split(' ');
    const formattedDate = `${parts[1]} ${parseInt(parts[2], 10)} ${parts[5]}`; // "Mar 7 2024"
    return formattedDate;
  };
  
  const formatSelectedDate = (selectedDate: Date) => {
    const day = selectedDate.getDate();
    const month = selectedDate.toLocaleString('default', { month: 'short' }); // Use abbreviated month
    const year = selectedDate.getFullYear();
    const formattedDate = `${month} ${day} ${year}`; // "Mar 7 2024"
    return formattedDate;
  };
  
  const filterByDate = (selectedDate: Date) => {
    const formattedSelectedDate = formatSelectedDate(selectedDate);
    const filtered = data.filter(item => item.date === formattedSelectedDate);
    setFilteredData(filtered);
  };

  const closeTransaction = async () => {
    const formattedSelectedDate = formatSelectedDate(date);
    const transactionsForToday = data.filter(item => item.date === formattedSelectedDate);
  
    if (transactionsForToday.length > 0) {
      let totalQuantity = 0;
      let grandTotal = 0;
  
      const printLines = transactionsForToday.map(item => {
        totalQuantity += item.quantity;
        grandTotal += parseFloat(item.total.replace('$', '')); // Remove $ and parse to number
        return `<tr>
                  <td>${item.orderNo}</td>
                  <td>${item.date}</td>
                  <td>${item.quantity}</td>
                  <td>${item.total}</td>
                </tr>`;
      }).join('');
  
      const cashierForToday = transactionsForToday[0].cashier; // Get cashier name from the first transaction
  
      const receipt = `
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .center { text-align: center; }
            .left { text-align: left; }
            table { width: 100%; border-collapse: collapse; }
            table, th, td { border: 1px solid black; }
            th, td { padding: 8px; }
          </style>
        </head>
        <body>
          <h2 class="center">Winzen's Cafe</h2>
          <p class="center">South Poblacion, Naga, Philippines</p>
          <p class="center">${formattedSelectedDate}</p>
          <table>
            <thead>
              <tr>
                <th>Order No.</th>
                <th>Date</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${printLines}
            </tbody>
          </table>
          <p class="left">Cashier: ${cashierForToday}</p>
          <p class="left">Quantity Total: ${totalQuantity}    Grand Total: $${grandTotal.toFixed(2)}</p>
        </body>
        </html>
      `;
  
      try {
        await Print.printAsync({ html: receipt });
        console.log('PDF sent to print.');
      } catch (error) {
        console.error('Error printing PDF:', error);
      }
    } else {
      console.log('No transactions found for the selected date.');
    }
  };
  
  const renderRow = ({ item }: { item: Transaction }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.orderNo}</Text>
      <Text style={styles.tableCell}>{item.cashier}</Text>
      <Text style={styles.tableCell}>{item.date}</Text> 
      <Text style={styles.tableCell}>{item.quantity}</Text>
      <Text style={styles.tableCell}>{item.total}</Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Header with logo on the left, title and search bar on the right */}
      <View style={styles.headerContainer}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <View style={styles.titleSearchContainer}>
          <Text style={styles.pageTitle}>Transaction History</Text>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={24} color="#DDB04B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchBar}
              placeholder="Search history..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#DDB04B"
            />
          </View>
        </View>
      </View>

      <View style={styles.datePickerContainer}>
        <Pressable onPress={showDatePicker} style={styles.datePickerButton}>
          <FontAwesome name="calendar" size={20} color="#DDB04B" />
          <Text style={styles.datePickerText}>{`${date.toLocaleString('default', { month: 'long' })} ${date.getDate()} ${date.getFullYear()}`}</Text>
        </Pressable>    
        <Pressable onPress={showAllData} style={styles.showAllButton}>
          <Text style={styles.showAllButtonText}>Show All</Text>
        </Pressable>  
        <Pressable style={styles.closeButton} onPress={closeTransaction}>
          <Text style={styles.closeButtonText}>Close Transaction</Text>
        </Pressable>
      </View>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode='date'
          display="default"
          onChange={onChange}
          onTouchCancel={() => setShowPicker(false)} // Hide the picker on cancel
        />
      )}

      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, styles.headerCell]}>Order #</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Cashier</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Date</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Quantity</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Total</Text>
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderRow}
        keyExtractor={(item) => item.orderNo}
        style={styles.table}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    marginRight: 0,
  },
  titleSearchContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
  closeButton: {
    backgroundColor: '#ff6347',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 'auto',
  },
  closeButtonText: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold'
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#203B36',
    marginRight: 10,
  },
  datePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: 'white',
  },
  showAllButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#203B36',
    width: 100,
    marginRight: 10,
  },
  showAllButtonText: {
    color: 'white',
    fontSize: 16,
    alignSelf: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#DDB04B',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  headerCell: {
    fontWeight: 'bold',
    fontFamily: 'Poppins-Regular'
  },
  table: {
    marginTop: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
});