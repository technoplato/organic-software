import { color } from 'bun';
import { StyleSheet, useColorScheme } from 'react-native';

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceAlt1: string;
  surfaceAlt2: string;
  surfaceAlt3: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  statusBg: string;
  statusText: string;
  accent: string;
  disabled: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export const useStyles = () => {
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';

  const palette: ColorPalette = {
    background: isDark ? '#121212' : '#F9FAFB',
    surface: isDark ? '#1E1E1E' : '#FFFFFF',
    surfaceAlt1: isDark ? '#23201D' : '#FFF0E6',
    surfaceAlt2: isDark ? '#201F23' : '#F3E5F5',
    surfaceAlt3: isDark ? '#23221C' : '#FFF3CD',
    textPrimary: isDark ? '#EDEDED' : '#111827',
    textSecondary: isDark ? '#B0B0B0' : '#6B7280',
    textTertiary: isDark ? '#9A9A9A' : '#9CA3AF',
    border: isDark ? '#2A2A2A' : '#E5E7EB',
    statusBg: isDark ? '#26211E' : '#FFF0E6',
    statusText: '#FF6B35',
    accent: '#3B82F6',
    disabled: isDark ? '#555555' : '#CCCCCC',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
  };

  const styles = StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scrollContent: {
      padding: 20,
    },
    keyboardAvoid: {
      flex: 1,
      padding: 16,
    },

    // Loading states
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: palette.textSecondary,
    },

    // Error states
    errorText: {
      color: palette.error,
      textAlign: 'center',
      margin: 20,
      fontSize: 16,
    },
    errorCard: {
      backgroundColor: isDark ? '#2D1B1B' : '#FEE2E2',
      borderRadius: 12,
      padding: 15,
      borderWidth: 1,
      borderColor: isDark ? '#5B2C2C' : '#FCA5A5',
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    errorIcon: {
      fontSize: 20,
      marginRight: 12,
    },

    // Typography
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: palette.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: palette.textSecondary,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: palette.textPrimary,
      marginBottom: 16,
    },
    sectionSubtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.textPrimary,
      marginBottom: 12,
    },

    // Cards and surfaces
    card: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderColor: isDark ? palette.border : 'transparent',
      borderWidth: isDark ? 1 : 0,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: palette.textPrimary,
      flex: 1,
    },
    cardSubtitle: {
      fontSize: 14,
      color: palette.textSecondary,
      fontWeight: '600',
      marginBottom: 8,
    },
    cardDescription: {
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },

    // Buttons
    button: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPrimary: {
      backgroundColor: palette.accent,
    },
    buttonSuccess: {
      backgroundColor: palette.success,
    },
    buttonWarning: {
      backgroundColor: palette.warning,
    },
    buttonError: {
      backgroundColor: palette.error,
    },
    buttonInfo: {
      backgroundColor: palette.info,
    },
    buttonSecondary: {
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    buttonDisabled: {
      backgroundColor: palette.disabled,
      opacity: 0.6,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    buttonTextSecondary: {
      color: palette.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },

    // Input fields
    textInput: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      padding: 16,
      backgroundColor: palette.surface,
      fontSize: 16,
      color: palette.textPrimary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    textInputFocused: {
      borderColor: palette.accent,
      borderWidth: 2,
    },

    // Status indicators
    statusCard: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      padding: 15,
      borderWidth: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.textPrimary,
    },
    statusEmoji: {
      fontSize: 24,
      marginRight: 8,
    },

    // Navigation
    navigation: {
      flexDirection: 'row',
      backgroundColor: palette.surface,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    navButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      marginHorizontal: 5,
    },
    navButtonActive: {
      backgroundColor: isDark ? palette.surfaceAlt1 : '#EBF8FF',
    },
    navButtonText: {
      fontSize: 24,
    },

    // Grids and layouts
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    gridItem: {
      flex: 1,
      minWidth: '45%',
    },
    gridItemFull: {
      width: '100%',
    },
    gridItemHalf: {
      width: '48%',
    },
    gridItemThird: {
      width: '31%',
    },

    // Messages
    messageCard: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 2,
      elevation: 2,
      marginBottom: 12,
    },
    messageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    messageRole: {
      fontSize: 14,
      fontWeight: '600',
    },
    messageTime: {
      fontSize: 12,
      color: palette.textSecondary,
    },
    messageContent: {
      fontSize: 16,
      color: palette.textPrimary,
      lineHeight: 24,
    },

    // Empty states
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyStateIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.textPrimary,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 14,
      color: palette.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },

    // Sections
    section: {
      marginBottom: 25,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },

    // Utility classes
    flexRow: {
      flexDirection: 'row',
    },
    flexColumn: {
      flexDirection: 'column',
    },
    alignCenter: {
      alignItems: 'center',
    },
    justifyCenter: {
      justifyContent: 'center',
    },
    justifyBetween: {
      justifyContent: 'space-between',
    },
    flex1: {
      flex: 1,
    },
    textCenter: {
      textAlign: 'center',
    },
    textRight: {
      textAlign: 'right',
    },
    marginBottom: {
      marginBottom: 16,
    },
    marginTop: {
      marginTop: 16,
    },
    padding: {
      padding: 16,
    },
    paddingHorizontal: {
      paddingHorizontal: 16,
    },
    paddingVertical: {
      paddingVertical: 16,
    },
  });

  return {
    styles,
    palette,
    isDark,
    colorScheme,
  };
};

export default useStyles;