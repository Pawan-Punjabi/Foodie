import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, RefreshControl, TouchableOpacity, Image, StatusBar } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import ChatBot from './components/ChatBot';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface FoodItem {
  id: number;
  name: string;
  price: number;
  rating: number;
  veg: string;
  calories: number;
  image_url: string;
}

const formatText = (text: string) => {
  // Replace **text** with styled bold text
  return text.split('**').map((part, index) => {
    // Every odd index (1, 3, 5, etc.) should be bold
    return index % 2 === 1 ? (
      <Text key={index} style={[styles.foodName, styles.boldText]}>{part}</Text>
    ) : (
      <Text key={index} style={styles.foodName}>{part}</Text>
    );
  });
};

const Page = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFoodItems = async () => {
    try {
      console.log('Fetching food items...');
      
      // First, check if we can connect to the table
      const { data: tableCheck, error: tableError } = await supabase
        .from('Food')
        .select('count');

      if (tableError) {
        console.error('Table check error:', tableError);
        throw new Error(`Database table error: ${tableError.message}`);
      }

      // Now fetch the actual data
      const { data, error } = await supabase
        .from('Food')
        .select('*')
        .order('id');

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Data fetch error:', error);
        throw error;
      }

      if (data) {
        console.log('Received food items:', data);
        // Log the structure of the first item to help with debugging
        if (data.length > 0) {
          console.log('First item structure:', Object.keys(data[0]));
        }
        setFoodItems(data);
      } else {
        console.log('No data received from the database');
        setFoodItems([]);
      }
    } catch (err) {
      console.error('Error in fetchFoodItems:', err);
      setError(
        err instanceof Error 
          ? `Error: ${err.message}` 
          : 'Failed to load food items. Please check your database connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchFoodItems();
  }, []);

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity style={styles.foodItem}>
      <Image source={{ uri: item.image_url }} style={styles.foodImage} />
      <View style={styles.foodDetails}>
        <View style={styles.nameContainer}>
          {formatText(item.name)}
        </View>
        <Text style={styles.foodPrice}>₹{item.price.toFixed(2)}</Text>
        <Text style={styles.foodInfo}>
          {item.veg === 'Yes' ? '🥗 Veg' : '🍖 Non-Veg'} | {item.calories} kcal
        </Text>
        <Text style={styles.foodRating}>⭐ {item.rating.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#3498db" barStyle="light-content" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#3498db" barStyle="light-content" />
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFoodItems}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#3498db" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../assets/images/foodie-logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
        {foodItems.length > 0 ? (
          <FlatList
            data={foodItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFoodItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No food items found</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchFoodItems}>
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
        <ChatBot foodItems={foodItems} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 10,
  },
  foodItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginVertical: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  foodImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  foodDetails: {
    flex: 1,
    justifyContent: 'space-around',
  },
  foodName: {
    fontSize: 20,
    color: '#2c3e50',
  },
  foodPrice: {
    fontSize: 18,
    color: '#27ae60',
    fontWeight: '600',
  },
  foodInfo: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  foodRating: {
    fontSize: 16,
    color: '#f39c12',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    margin: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    height: 120,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e3f2fd',
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: 0,
  },
  headerLogo: {
    width: 250,
    height: 100,
  },
  nameContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default Page;
