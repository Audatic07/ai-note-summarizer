/**
 * Main Application Entry Point
 * 
 * Sets up navigation and provides the app shell.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  HomeScreen,
  NotesScreen,
  NoteEditorScreen,
  NoteDetailScreen,
} from './src/screens';
import { RootStackParamList } from './src/types';
import { COLORS } from './src/constants';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Custom Dark Theme
const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.primary,
  },
};

// Error boundary to catch any errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  safeArea: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider style={styles.safeArea}>
        <NavigationContainer theme={AppTheme}>
          <StatusBar style="light" backgroundColor={COLORS.background} />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: COLORS.background },
              animationTypeForReplace: 'push',
              navigationBarColor: COLORS.background,
              statusBarColor: COLORS.background,
              statusBarStyle: 'light',
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Notes" component={NotesScreen} />
            <Stack.Screen 
              name="NoteEditor" 
              component={NoteEditorScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
