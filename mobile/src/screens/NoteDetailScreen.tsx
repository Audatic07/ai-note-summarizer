/**
 * Note Detail Screen - Dark Mode
 * 
 * View note content and generate summaries with customizable options.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { 
  COLORS, 
  SPACING, 
  TYPOGRAPHY, 
  BORDER_RADIUS,
  SUMMARY_LINE_MIN,
  SUMMARY_LINE_MAX,
  SUMMARY_STYLES,
} from '../constants';
import { Button, Card, Loading, SummaryCard } from '../components';
import { useNote, useSummary } from '../hooks';
import { SummaryStyle, RootStackParamList } from '../types';

type NoteDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NoteDetail'>;
  route: RouteProp<RootStackParamList, 'NoteDetail'>;
};

export const NoteDetailScreen: React.FC<NoteDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { noteId } = route.params;
  const { note, isLoading: noteLoading, error: noteError } = useNote(noteId);
  const {
    summaries,
    currentSummary,
    isGenerating,
    progressMessage,
    error: summaryError,
    generateSummary,
  } = useSummary(noteId);

  // New summary options state
  const [lineCountInput, setLineCountInput] = useState(''); // Empty = auto
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>('best_fit');
  const [showFullContent, setShowFullContent] = useState(false);
  const [showPreviousSummaries, setShowPreviousSummaries] = useState(false);
  const [fullScreenSummary, setFullScreenSummary] = useState(false);
  const [fullScreenSummaryContent, setFullScreenSummaryContent] = useState<string | null>(null);

  const openFullScreenSummary = (content: string) => {
    setFullScreenSummaryContent(content);
    setFullScreenSummary(true);
  };

  const getLineCount = (): number | null => {
    if (!lineCountInput.trim()) return null; // Auto
    const parsed = parseInt(lineCountInput, 10);
    if (isNaN(parsed) || parsed < SUMMARY_LINE_MIN || parsed > SUMMARY_LINE_MAX) {
      return null;
    }
    return parsed;
  };

  const handleGenerateSummary = async () => {
    await generateSummary({
      line_count: getLineCount(),
      summary_style: summaryStyle,
      summary_type: 'summary',
      force_regenerate: false,
    });
  };

  const handleRegenerateSummary = async () => {
    await generateSummary({
      line_count: getLineCount(),
      summary_style: summaryStyle,
      summary_type: 'summary',
      force_regenerate: true,
    });
  };

  const handleEdit = () => {
    navigation.navigate('NoteEditor', { noteId });
  };

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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getSourceIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!note) return 'document-text';
    switch (note.source_type) {
      case 'pdf': return 'document-text';
      case 'upload': return 'cloud-upload';
      default: return 'create';
    }
  };

  if (noteLoading) {
    return <Loading fullScreen message="Loading note..." />;
  }

  if (noteError || !note) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>Note Not Found</Text>
          <Text style={styles.errorMessage}>
            {noteError || 'The note you are looking for does not exist.'}
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="primary"
            icon={<Ionicons name="arrow-back" size={20} color="#FFFFFF" />}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.sourceIcon, { backgroundColor: COLORS.primary + '20' }]}>
            <Ionicons name={getSourceIcon()} size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{note.title}</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
          <Ionicons name="create-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Note Metadata */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{formatDate(note.created_at)}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="text" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>
              {note.char_count > 1000 
                ? `${(note.char_count / 1000).toFixed(1)}k chars` 
                : `${note.char_count} chars`}
            </Text>
          </View>
          {summaries.length > 0 && (
            <View style={[styles.metaChip, styles.accentChip]}>
              <Ionicons name="sparkles" size={14} color={COLORS.accent} />
              <Text style={[styles.metaText, { color: COLORS.accent }]}>
                {`${summaries.length} summary${summaries.length > 1 ? 's' : ''}`}
              </Text>
            </View>
          )}
        </View>

        {/* Note Content */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setShowFullContent(!showFullContent)}
          >
            <Text style={styles.sectionTitle}>Original Content</Text>
            <View style={styles.toggleButton}>
              <Text style={styles.toggleText}>
                {showFullContent ? 'Less' : 'More'}
              </Text>
              <Ionicons 
                name={showFullContent ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={COLORS.primary} 
              />
            </View>
          </TouchableOpacity>
          <View style={styles.contentContainer}>
            <Text
              style={styles.content}
              numberOfLines={showFullContent ? undefined : 4}
            >
              {note.content}
            </Text>
          </View>
        </View>

        {/* Summary Generation Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryTitleRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="sparkles" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.summaryTitle}>Generate Summary</Text>
          </View>

          <View style={styles.optionsContainer}>
            {/* Length Option */}
            <View style={styles.optionGroup}>
              <Text style={styles.optionLabel}>Length</Text>
              <View style={styles.compactInputRow}>
                <TextInput
                  style={styles.compactInput}
                  placeholder="Auto"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  value={lineCountInput}
                  onChangeText={setLineCountInput}
                  maxLength={3}
                />
                <Text style={styles.unitText}>lines</Text>
              </View>
            </View>

            {/* Style Option */}
            <View style={[styles.optionGroup, { flex: 1 }]}>
              <Text style={styles.optionLabel}>Style</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.styleScroll}>
                {SUMMARY_STYLES.map((style) => (
                  <TouchableOpacity
                    key={style.value}
                    style={[
                      styles.compactStyleButton,
                      summaryStyle === style.value && styles.compactStyleButtonActive,
                    ]}
                    onPress={() => setSummaryStyle(style.value)}
                  >
                    <Ionicons 
                      name={
                        style.value === 'technical' ? 'code' : 
                        style.value === 'casual' ? 'chatbubble' : 
                        'bulb'
                      } 
                      size={16} 
                      color={summaryStyle === style.value ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text style={[
                      styles.compactStyleText,
                      summaryStyle === style.value && styles.styleTextActive,
                    ]}>
                      {style.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Generate Button */}
          <Button
            title={currentSummary ? 'Regenerate' : 'Generate Summary'}
            onPress={currentSummary ? handleRegenerateSummary : handleGenerateSummary}
            variant="primary"
            fullWidth
            loading={isGenerating}
            icon={<Ionicons name="sparkles" size={20} color="#FFFFFF" />}
            style={styles.generateButton}
          />

          {/* Progress Message */}
          {isGenerating && progressMessage && (
            <View style={styles.progressContainer}>
              <View style={styles.progressDot} />
              <Text style={styles.progressText}>{progressMessage}</Text>
            </View>
          )}

          {/* Error Message */}
          {summaryError && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{summaryError}</Text>
            </View>
          )}
        </View>

        {/* Current Summary */}
        {currentSummary && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Summary</Text>
              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => openFullScreenSummary(currentSummary.content)}
              >
                <Ionicons name="expand" size={16} color={COLORS.primary} />
                <Text style={styles.expandText}>Full Screen</Text>
              </TouchableOpacity>
            </View>
            <SummaryCard 
              summary={currentSummary} 
              showFullContent={false} 
              onPress={() => openFullScreenSummary(currentSummary.content)}
            />
          </View>
        )}

        {/* Previous Summaries */}
        {summaries.length > 1 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setShowPreviousSummaries(!showPreviousSummaries)}
            >
              <Text style={styles.sectionTitle}>
                {`Previous (${summaries.length - 1})`}
              </Text>
              <Ionicons 
                name={showPreviousSummaries ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={COLORS.textMuted} 
              />
            </TouchableOpacity>
            {showPreviousSummaries && summaries.slice(1).map((summary) => (
              <SummaryCard 
                key={summary.id} 
                summary={summary} 
                onPress={() => openFullScreenSummary(summary.content)}
              />
            ))}
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Full Screen Summary Modal */}
      <Modal
        visible={fullScreenSummary}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFullScreenSummary(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Summary</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setFullScreenSummary(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
            {fullScreenSummaryContent && (
              <Text style={styles.fullScreenText} selectable={true}>{fullScreenSummaryContent}</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  sourceIcon: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accentChip: {
    backgroundColor: COLORS.accent + '15',
    borderColor: COLORS.accent + '30',
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  contentContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  summarySection: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  optionGroup: {
    gap: SPACING.xs,
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingRight: SPACING.sm,
    height: 40,
  },
  compactInput: {
    width: 50,
    height: '100%',
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.text,
    textAlign: 'center',
    padding: 0, // Fix for Android text input padding
  },
  unitText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
  },
  styleScroll: {
    gap: SPACING.xs,
  },
  compactStyleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compactStyleButtonActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  compactStyleText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  styleTextActive: {
    color: COLORS.primary,
  },
  generateButton: {
    marginTop: SPACING.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.error + '15',
    borderRadius: BORDER_RADIUS.md,
  },
  errorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.error,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '10',
    borderRadius: BORDER_RADIUS.full,
  },
  expandText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  fullScreenText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.text,
    lineHeight: 24,
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
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
});
