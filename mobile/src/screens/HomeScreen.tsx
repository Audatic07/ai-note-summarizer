/**
 * Home/Login Screen - Dark Mode
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants';
import { Button, Input, Loading } from '../components';
import { useUser, useApiHealth } from '../hooks';
import { RootStackParamList } from '../types';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, isLoading: userLoading, initializeUser } = useUser();
  const { isConnected, isChecking, checkHealth } = useApiHealth();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!userLoading && !isChecking && user) {
      navigation.replace('Notes');
    }
  }, [user, userLoading, isChecking, navigation]);

  const handleContinue = async () => {
    await initializeUser();
    navigation.replace('Notes');
  };

  if (userLoading || isChecking) {
    return <Loading fullScreen message="Connecting..." />;
  }

  if (user) {
    return <Loading fullScreen />;
  }

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="cloud-offline" size={48} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>
            Unable to connect to the server.{'\n'}Make sure the backend is running.
          </Text>
          <Button
            title="Try Again"
            onPress={checkHealth}
            variant="primary"
            style={styles.retryButton}
            icon={<Ionicons name="refresh" size={20} color="#FFFFFF" />}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo & Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoInner}>
              <Ionicons name="sparkles" size={40} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.title}>AI Note Summarizer</Text>
          <Text style={styles.subtitle}>
            Transform your notes into concise summaries powered by AI
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            icon="document-text"
            title="Smart Notes"
            description="Write notes or upload PDFs"
            color={COLORS.primary}
          />
          <FeatureItem
            icon="flash"
            title="AI Powered"
            description="Get instant summaries"
            color={COLORS.accent}
          />
          <FeatureItem
            icon="options"
            title="Customizable"
            description="Choose length & style"
            color={COLORS.success}
          />
        </View>

        {/* Name Input */}
        <Input
          label="Your Name (optional)"
          placeholder="Enter your name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          containerStyle={styles.input}
        />

        {/* CTA */}
        <Button
          title="Get Started"
          onPress={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
          iconPosition="right"
        />

        <Text style={styles.disclaimer}>
          No account needed • Notes stored locally & on server
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const FeatureItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}> = ({ icon, title, description, color }) => (
  <View style={styles.featureItem}>
    <View style={[styles.featureIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.glow,
  },
  logoInner: {
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    lineHeight: 22,
  },
  features: {
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  input: {
    marginBottom: SPACING.lg,
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: SPACING.lg,
  },
});

