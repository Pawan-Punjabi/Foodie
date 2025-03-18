import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function Layout() {
  return (
    <>
      <StatusBar backgroundColor="#3498db" barStyle="light-content" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f0f0f0' },
        }}
      />
    </>
  );
}
