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
            source={require('../assets/images/wood_back.png')}
            style={styles.headerBackground}
            resizeMode="cover"
          />
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
    backgroundColor: '#f8f9fa',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  foodItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  foodImage: {
    width: 110,
    height: 110,
    borderRadius: 8,
    marginRight: 12,
  },
  foodDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  foodName: {
    fontSize: 18,
    color: '#2d3436',
    lineHeight: 24,
  },
  foodPrice: {
    fontSize: 16,
    color: '#00b894',
    fontWeight: '700',
    marginTop: 4,
  },
  foodInfo: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 4,
  },
  foodRating: {
    fontSize: 14,
    color: '#fdcb6e',
    fontWeight: '600',
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
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
    fontSize: 16,
    color: '#636e72',
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    height: 100,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    paddingTop: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  headerLogo: {
    width: 200,
    height: 80,
    zIndex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '700',
  },
});

export default Page;
