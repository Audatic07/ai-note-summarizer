/**
 * Note Editor Screen - Dark Mode
 * 
 * Create and edit notes with text input or PDF upload.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { Button, Input, Loading } from '../components';
import { useNote, useUser } from '../hooks';
import { api } from '../services/api';
import { RootStackParamList } from '../types';

type NoteEditorScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NoteEditor'>;
  route: RouteProp<RootStackParamList, 'NoteEditor'>;
};

export const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({
  navigation,
  route,
}) => {
  const { noteId } = route.params || {};
  const isEditing = !!noteId;
  
  const { user } = useUser();
  const { note, isLoading: noteLoading, updateNote } = useNote(noteId);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  // Load existing note data
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const validate = (): boolean => {
    const newErrors: { title?: string; content?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.length > 100000) {
      newErrors.content = 'Content exceeds maximum length (100,000 characters)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    
    try {
      if (isEditing) {
        const success = await updateNote({ title, content });
        if (success) {
          navigation.goBack();
        } else {
          Alert.alert('Error', 'Failed to update note');
        }
      } else {
        const newNote = await api.notes.create(
          { title, content, source_type: 'text' },
          user?.id
        );
        navigation.replace('NoteDetail', { noteId: newNote.id });
      }
    } catch (error: any) {
      Alert.alert('Error', error.detail || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePdfUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      
      setIsUploading(true);
      
      const note = await api.notes.uploadPdf(
        {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
        },
        undefined,
        user?.id
      );
      
      navigation.replace('NoteDetail', { noteId: note.id });
    } catch (error: any) {
      Alert.alert(
        'Upload Failed',
        error.detail || 'Failed to upload PDF. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (noteLoading && isEditing) {
    return <Loading fullScreen message="Loading note..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Note' : 'New Note'}
          </Text>
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (!title.trim() || !content.trim()) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!title.trim() || !content.trim() || isSaving}
          >
            {isSaving ? (
              <Ionicons name="hourglass" size={20} color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* PDF Upload Option (only for new notes) */}
          {!isEditing && (
            <TouchableOpacity 
              style={styles.uploadCard}
              onPress={handlePdfUpload}
              disabled={isUploading}
            >
              <View style={styles.uploadIcon}>
                <Ionicons name="document-text" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.uploadText}>
                <Text style={styles.uploadTitle}>Upload PDF</Text>
                <Text style={styles.uploadDescription}>
                  Extract text from document
                </Text>
              </View>
              {isUploading ? (
                <Ionicons name="hourglass" size={20} color={COLORS.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>
          )}

          {/* Divider */}
          {!isEditing && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or write manually</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {/* Title Input */}
          <Input
            label="Title"
            placeholder="Enter note title"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
            autoCapitalize="sentences"
          />

          {/* Content Input */}
          <Input
            label="Content"
            placeholder="Write your note content here..."
            value={content}
            onChangeText={setContent}
            error={errors.content}
            multiline
            style={styles.contentInput}
          />

          {/* Character Count */}
          <View style={styles.charCountRow}>
            <Ionicons name="text" size={12} color={COLORS.textMuted} />
            <Text style={styles.charCount}>
              {content.length.toLocaleString()} / 100,000
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.primary + '40',
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  uploadText: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  uploadDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
  },
  contentInput: {
    minHeight: 200,
  },
  charCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: SPACING.xs,
  },
  charCount: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
  },
});
