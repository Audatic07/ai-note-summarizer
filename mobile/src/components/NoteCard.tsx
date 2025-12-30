/**
 * NoteCard Component - Dark Mode
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { NoteListItem } from '../types';

interface NoteCardProps {
  note: NoteListItem;
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  selectionMode?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onLongPress, selected, selectionMode }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getSourceIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (note.source_type) {
      case 'pdf':
        return 'document-text';
      case 'upload':
        return 'cloud-upload';
      default:
        return 'create';
    }
  };

  const getSourceColor = () => {
    switch (note.source_type) {
      case 'pdf':
        return COLORS.error;
      case 'upload':
        return COLORS.info;
      default:
        return COLORS.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: getSourceColor() }]} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: getSourceColor() + '20' }]}>
              <Ionicons name={getSourceIcon()} size={16} color={getSourceColor()} />
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {note.title}
            </Text>
          </View>
          {selected && (
            <View style={styles.checkbox}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
            </View>
          )}
        </View>
        
        {/* Preview */}
        <Text style={styles.preview} numberOfLines={2}>
          {note.content_preview}
        </Text>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.date}>{formatDate(note.created_at)}</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="text" size={12} color={COLORS.textMuted} />
              <Text style={styles.statText}>
                {note.char_count > 1000 ? `${(note.char_count / 1000).toFixed(1)}k` : String(note.char_count)}
              </Text>
            </View>
            {note.summary_count > 0 && (
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={12} color={COLORS.accent} />
                <Text style={styles.badgeText}>{String(note.summary_count)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceLight,
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    flex: 1,
  },
  checkbox: {
    marginLeft: SPACING.sm,
  },
  preview: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
});

