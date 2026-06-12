// src/styles/theme.js
import { StyleSheet, Dimensions, Platform } from 'react-native'

export const { width: screenWidth , height: screenHeight } = Dimensions.get('window');
export const theme = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Deep corporate slate canvas
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 15 : 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  
  // FIXED UI: Replaced heavy card borders with borderless negative space layouts
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardInflow: {
    backgroundColor: '#1e293b',
    borderLeftWidth: 4,
    borderColor: '#4ade80',
  },
  cardOutflow: {
    backgroundColor: '#1e293b',
    borderLeftWidth: 4,
    borderColor: '#f87171',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  cardInlineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  // INPUT FIELDS & TEXT ACTIONS
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bodyText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  boldText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  mutedText: {
    fontSize: 13,
    color: '#64748b',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },

  // MODERN FIXED BOTTOM TAB BAR NAVIGATION ELEMENTS
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 115 : 72, // FIXED: Increased height for Android to accommodate system keys
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'android' ? 45 : 10, // FIXED: Added clearance padding for Android on-screen navigation
    borderTopWidth: 0.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 90,
  },
  bottomTabTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  bottomTabIconPlaceholder: {
    fontSize: 16,
    marginBottom: 2,
  },
  bottomTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  activeBottomTabText: {
    color: '#38bdf8',
    fontWeight: '700',
  },

  // SPINNING FLOATING ACTION BUTTON BUTTONS
  fabButton: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 125 : 88, // FIXED: Pushed higher on Android to sit perfectly flush above the updated bar height
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },

  // PILLS & OPTION TOGGLES
  pillContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 6,
  },
  activePill: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activePillText: {
    color: '#0f172a',
    fontWeight: '700',
  },

  // BUTTON INTERFACES
  primaryButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  secondaryButtonText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },

  // ACCORDIONS, AUDITS & OVERLAYS
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  accountRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#334155',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.82)', // Translucent corporate mask
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: screenWidth - 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 15,
  },
  directionToggleBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  directionToggleInflow: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.06)',
  },
  directionToggleOutflow: {
    borderColor: '#f87171',
    backgroundColor: 'rgba(248, 113, 113, 0.06)',
  },
  directionToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  accordionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  accordionContentContainer: {
    marginTop: 10,
  },
  recurringRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#334155',
  },
  dotWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: '#38bdf8',
    width: 14,
  },
  inactiveDot: {
    backgroundColor: '#475569',
  },
});