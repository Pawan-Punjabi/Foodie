import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

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

const FoodList = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFoodItems = async () => {
    try {
      console.log('Fetching food items...');
      
      const { data, error } = await supabase
        .from('Food')
        .select('id, name, price, rating, veg, calories, image_url')
        .order('id');

      console.log('Supabase response:', { data, error });

      if (error) {
        throw error;
      }

      if (data) {
        console.log('Setting food items:', data);
        setFoodItems(data);
      }
    } catch (err) {
      console.error('Error fetching food items:', err);
      setError('Failed to load food items. Please try again later.');
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
        <Text style={styles.foodName}>{item.name}</Text>
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
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFoodItems}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    fontWeight: 'bold',
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
});

export default FoodList;
