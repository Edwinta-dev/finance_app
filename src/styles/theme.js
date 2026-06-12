// src/styles/theme.js
import { StyleSheet, Dimensions, Platform } from 'react-native';

export const screenWidth = Dimensions.get('window').width;

const modernFont = Platform.select({
  ios: 'HelveticaNeue-Light',
  android: 'sans-serif-light',
  default: 'System',
});

export const theme = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' }, 
  header: { padding: 20, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155', paddingTop: 40 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#f8fafc', fontFamily: modernFont, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, fontFamily: modernFont },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#38bdf8' }, 
  tabText: { fontWeight: '600', color: '#94a3b8', fontFamily: modernFont, fontSize: 14 },
  activeTabText: { color: '#38bdf8' },
  content: { flex: 1, padding: 15 },
  
  // Base Card Mechanics
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 16, fontFamily: modernFont, letterSpacing: 0.3 },
  
  // Interactive Direction Highlight States
  cardInflow: { borderWidth: 1.5, borderColor: '#4ade80' },
  cardOutflow: { borderWidth: 1.5, borderColor: '#f87171' },
  
  // Inline Title Positioning Matrices
  cardHeaderTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, width: '100%' },
  cardInlineTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', fontFamily: modernFont },
  
  // High-Contrast Mode Toggle Actions
  directionToggleBtn: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1 },
  directionToggleInflow: { backgroundColor: 'rgba(74, 222, 128, 0.15)', borderColor: '#4ade80' },
  directionToggleOutflow: { backgroundColor: 'rgba(248, 113, 113, 0.15)', borderColor: '#f87171' },
  directionToggleText: { fontSize: 13, fontWeight: '700', fontFamily: modernFont },

  accountRowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  bodyText: { color: '#cbd5e1', fontSize: 14, fontFamily: modernFont },
  boldText: { fontWeight: '700', color: '#f8fafc', fontSize: 15, fontFamily: modernFont },
  mutedText: { color: '#64748b', fontSize: 12, fontFamily: modernFont },
  centeredMuted: { textAlign: 'center', color: '#64748b', marginTop: 40, fontFamily: modernFont },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#94a3b8', marginVertical: 12, marginLeft: 5, fontFamily: modernFont, letterSpacing: 0.8, textTransform: 'uppercase' },
  input: { backgroundColor: '#334155', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 12, color: '#f8fafc', fontFamily: modernFont },
  primaryButton: { backgroundColor: '#38bdf8', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#0f172a', fontWeight: '700', fontSize: 15, fontFamily: modernFont },
  secondaryButton: { borderWidth: 1, borderColor: '#38bdf8', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#38bdf8', fontWeight: '600', fontSize: 13, fontFamily: modernFont },
  pillContainer: { flexDirection: 'row', marginBottom: 15, paddingVertical: 5 },
  pill: { backgroundColor: '#334155', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, borderWidth: 1, borderColor: '#475569' },
  activePill: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  pillText: { color: '#94a3b8', fontWeight: '600', fontSize: 13, fontFamily: modernFont },
  activePillText: { color: '#0f172a' },
  accountCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 8 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#475569' },
  adjustmentNote: { fontSize: 12, color: '#fb923c', fontWeight: '600', marginTop: 2, fontFamily: modernFont },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24 },
  modalActions: { flexDirection: 'row', marginTop: 20 },
  
  // Custom Pagination Dot System Styles
  dotWrapper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  activeDot: { backgroundColor: '#000000' },
  inactiveDot: { backgroundColor: '#ffffff' },

  graphScrollView: { marginHorizontal: -15 },
  graphCardPage: { width: screenWidth, paddingHorizontal: 15 },
  graphValueLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 4, fontWeight: '600', fontFamily: modernFont },
  xAxisRow: { flexDirection: 'row', width: '100%', marginTop: 10 },
  xAxisLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: '#64748b', lineHeight: 14, fontFamily: modernFont },
  activeXAxisLabel: { color: '#38bdf8', fontWeight: '700' },

  // Accordion Component Design Framework Styles
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#334155', borderRadius: 10, padding: 14, marginTop: 10 },
  accordionHeaderText: { color: '#f8fafc', fontWeight: '700', fontSize: 14, fontFamily: modernFont },
  accordionContentContainer: { backgroundColor: '#24324d', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 12, borderTopWidth: 1, borderBottomColor: '#334155' },
  recurringRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' }
});