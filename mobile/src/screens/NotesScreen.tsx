/**
 * Notes List Screen - Dark Mode
 * 
 * Displays all notes with search, multi-select, and bulk actions.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants';
import { NoteCard, Loading, EmptyState } from '../components';
import { useNotes, useUser } from '../hooks';
import { NoteListItem, RootStackParamList } from '../types';

type NotesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Notes'>;
};

type SortOption = 'newest' | 'oldest' | 'title';

export const NotesScreen: React.FC<NotesScreenProps> = ({ navigation }) => {
  const { user } = useUser();
  const { notes, isLoading, error, refresh, deleteNote } = useNotes(user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      refresh();
      // Exit selection mode when navigating back
      setIsSelectionMode(false);
      setSelectedNotes(new Set());
    }, [refresh])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleNotePress = (note: NoteListItem) => {
    if (isSelectionMode) {
      toggleNoteSelection(note.id);
    } else {
      navigation.navigate('NoteDetail', { noteId: note.id });
    }
  };

  const handleNoteLongPress = (noteId: number) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedNotes(new Set([noteId]));
    }
  };

  const toggleNoteSelection = (noteId: number) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      // Exit selection mode if nothing selected
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedNotes.size === filteredNotes.length) {
      setSelectedNotes(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedNotes(new Set(filteredNotes.map(n => n.id)));
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedNotes(new Set());
  };

  const handleBulkDelete = () => {
    const count = selectedNotes.size;
    Alert.alert(
      'Delete Notes',
      `Are you sure you want to delete ${count} note${count > 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            for (const noteId of selectedNotes) {
              await deleteNote(noteId);
            }
            setSelectedNotes(new Set());
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleCreateNote = () => {
    navigation.navigate('NoteEditor', {});
  };

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = notes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content_preview.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    switch (sortBy) {
      case 'oldest':
        result = [...result].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'title':
        result = [...result].sort((a, b) => 
          a.title.localeCompare(b.title)
        );
        break;
      case 'newest':
      default:
        result = [...result].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return result;
  }, [notes, searchQuery, sortBy]);

  const noteCount = notes.length;
  const filteredCount = filteredNotes.length;

  if (isLoading && notes.length === 0) {
    return <Loading fullScreen message="Loading notes..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      {isSelectionMode ? (
        <View style={styles.selectionHeader}>
          <TouchableOpacity onPress={handleCancelSelection} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.selectionCount}>
            {selectedNotes.size} selected
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={handleSelectAll} style={styles.headerButton}>
              <Ionicons 
                name={selectedNotes.size === filteredNotes.length ? "checkbox" : "square-outline"} 
                size={24} 
                color={COLORS.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleBulkDelete} 
              style={[styles.headerButton, styles.deleteButton]}
            >
              <Ionicons name="trash" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Notes</Text>
            <Text style={styles.subtitle}>
              {noteCount} note{noteCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateNote}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search & Sort Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Ionicons name="swap-vertical" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {[
            { value: 'newest', label: 'Newest First', icon: 'time' },
            { value: 'oldest', label: 'Oldest First', icon: 'time-outline' },
            { value: 'title', label: 'By Title', icon: 'text' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortBy(option.value as SortOption);
                setShowSortMenu(false);
              }}
            >
              <Ionicons 
                name={option.icon as any} 
                size={18} 
                color={sortBy === option.value ? COLORS.primary : COLORS.textSecondary} 
              />
              <Text style={[
                styles.sortOptionText,
                sortBy === option.value && styles.sortOptionTextActive,
              ]}>
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={18} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search Results Count */}
      {searchQuery && (
        <Text style={styles.resultsCount}>
          {filteredCount} result{filteredCount !== 1 ? 's' : ''} found
        </Text>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={20} color={COLORS.warning} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={() => handleNotePress(item)}
            onLongPress={() => handleNoteLongPress(item.id)}
            selected={selectedNotes.has(item.id)}
            selectionMode={isSelectionMode}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          filteredNotes.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title={searchQuery ? 'No Results' : 'No Notes Yet'}
            message={
              searchQuery
                ? 'Try a different search term'
                : 'Create your first note to get started'
            }
            icon={searchQuery ? 'search' : 'document-text'}
            actionLabel={searchQuery ? undefined : 'Create Note'}
            onAction={searchQuery ? undefined : handleCreateNote}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectionCount: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: COLORS.error + '20',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortMenu: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  sortOptionActive: {
    backgroundColor: COLORS.primary + '15',
  },
  sortOptionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textSecondary,
  },
  sortOptionTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  resultsCount: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  emptyList: {
    flex: 1,
  },
});
