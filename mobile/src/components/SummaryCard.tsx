/**
 * SummaryCard Component - Dark Mode
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { Card } from './Card';
import { Summary } from '../types';

interface SummaryCardProps {
  summary: Summary;
  showFullContent?: boolean;
  onPress?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  showFullContent = false,
  onPress,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLengthLabel = () => {
    if (summary.summary_length === 'auto') return 'Auto';
    const lines = parseInt(summary.summary_length);
    if (!isNaN(lines)) return `${lines} lines`;
    return summary.summary_length;
  };

  const getTypeIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (summary.summary_type) {
      case 'key_points':
        return 'list';
      case 'flashcards':
        return 'albums';
      default:
        return 'document-text';
    }
  };

  const getProviderColor = () => {
    if (summary.ai_provider === 'groq') return COLORS.success;
    if (summary.ai_provider === 'openai') return COLORS.info;
    return COLORS.warning;
  };

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
      <Card variant="elevated" style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badges}>
            <View style={[styles.badge, styles.typeBadge]}>
              <Ionicons name={getTypeIcon()} size={13} color={COLORS.primary} />
              <Text style={styles.typeBadgeText}>
                {summary.summary_type.replace('_', ' ')}
              </Text>
            </View>
            <View style={[styles.badge, styles.lengthBadge]}>
              <Ionicons name="resize" size={12} color={COLORS.textSecondary} />
              <Text style={styles.lengthBadgeText}>{getLengthLabel()}</Text>
            </View>
          </View>
          <Text style={styles.date}>{formatDate(summary.created_at)}</Text>
        </View>

        {/* Content */}
        {showFullContent ? (
          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.content} selectable={true}>{summary.content}</Text>
          </ScrollView>
        ) : (
          <Text style={styles.content} numberOfLines={4} selectable={true}>
            {summary.content}
          </Text>
        )}

        {/* Metadata */}
        <View style={styles.metadata}>
          <View style={styles.metaRow}>
            <View style={[styles.providerBadge, { backgroundColor: getProviderColor() + '20' }]}>
              <Ionicons name="flash" size={12} color={getProviderColor()} />
              <Text style={[styles.providerText, { color: getProviderColor() }]}>
                {summary.ai_provider || 'unknown'}
              </Text>
            </View>
            <Text style={styles.modelText}>{summary.ai_model || 'unknown'}</Text>
          </View>
          
          <View style={styles.statsRow}>
            {summary.generation_time_ms != null && summary.generation_time_ms > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.metaText}>
                  {summary.generation_time_ms > 1000 
                    ? `${(summary.generation_time_ms / 1000).toFixed(1)}s`
                    : `${summary.generation_time_ms}ms`
                  }
                </Text>
              </View>
            )}
            {summary.token_count != null && summary.token_count > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="code-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.metaText}>
                  {summary.token_count.toLocaleString()} tokens
                </Text>
              </View>
            )}
            {summary.compression_ratio != null && summary.compression_ratio > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="contract-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.metaText}>
                  {summary.compression_ratio.toFixed(1)}x
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  typeBadge: {
    backgroundColor: COLORS.primary + '20',
  },
  typeBadgeText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    textTransform: 'capitalize',
  },
  lengthBadge: {
    backgroundColor: COLORS.surfaceLight,
  },
  lengthBadgeText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  date: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
  },
  contentScroll: {
    maxHeight: 300,
  },
  content: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.text,
    lineHeight: 24,
  },
  metadata: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  providerText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    textTransform: 'uppercase',
  },
  modelText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
  },
});

