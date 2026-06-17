// src/screens/Vault/components/YieldOptimizerView.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../../../styles/theme';

export function YieldOptimizerView({
  hysaCapital, setHysaCapital, lockAwayCapital, setLockAwayCapital, lockDuration, setLockDuration,
  salaryInput, setSalaryInput, allowInvestment, setAllowInvestment, allowInsurance, setAllowInsurance,
  isOptimizationRendered, setIsOptimizationResultVisible, simulatedResults, netAnnualEarnings, onOptimize
}) {
  if (!isOptimizationRendered) {
    return (
      <View style={theme.card}>
        <Text style={[theme.cardTitle, { color: '#38bdf8', marginBottom: 4 }]}>Yield Matrix Profiler Parameters</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16 }}>Set allocation constraints to process against cloud-scraped rates registries.</Text>
        
        <Text style={{ fontSize: 11, color: '#cbd5e1', fontWeight: '600', marginBottom: 4 }}>High-Yield Instant Capital Allocation ($)</Text>
        <TextInput style={[theme.input, { backgroundColor: '#0f172a' }]} keyboardType="numeric" value={hysaCapital} onChangeText={setHysaCapital} />

        <Text style={{ fontSize: 11, color: '#cbd5e1', fontWeight: '600', marginBottom: 4 }}>Cold Capital to Lock Completely Away ($)</Text>
        <TextInput style={[theme.input, { backgroundColor: '#0f172a' }]} keyboardType="numeric" value={lockAwayCapital} onChangeText={setLockAwayCapital} />

        <Text style={{ fontSize: 11, color: '#cbd5e1', fontWeight: '600', marginBottom: 4 }}>Lock Duration Horizon Interval</Text>
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
          {[1, 3, 6, 12].map(m => (
            <TouchableOpacity key={m} style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, borderWidth: 1, borderColor: lockDuration === m ? '#38bdf8' : '#334155', backgroundColor: lockDuration === m ? 'rgba(56, 189, 248, 0.08)' : '#0f172a' }} onPress={() => setLockDuration(m)}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: lockDuration === m ? '#38bdf8' : '#94a3b8' }}>{m} Mo</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 11, color: '#cbd5e1', fontWeight: '600', marginBottom: 4 }}>Corporate Monthly Nett Inflow/Salary ($)</Text>
        <TextInput style={[theme.input, { backgroundColor: '#0f172a' }]} keyboardType="numeric" value={salaryInput} onChangeText={setSalaryInput} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#334155' }}>
          <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>Authorize Bank Wealth Transactions?</Text>
          <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: allowInvestment ? '#34d399' : '#475569' }} onPress={() => setAllowInvestment(!allowInvestment)}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#0f172a' }}>{allowInvestment ? 'ALLOWED' : 'MUTED'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, marginBottom: 15 }}>
          <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>Authorize Insurance Underwriting Plans?</Text>
          <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: allowInsurance ? '#34d399' : '#475569' }} onPress={() => setAllowInsurance(!allowInsurance)}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#0f172a' }}>{allowInsurance ? 'ALLOWED' : 'MUTED'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={{ backgroundColor: '#38bdf8', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} onPress={onOptimize}>
          <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14 }}>⚡ Run Structural Allocator Engine</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 14, color: '#38bdf8', fontWeight: '700' }}>🏆 Optimized Financial Matrix Roadmap</Text>
        <TouchableOpacity onPress={() => setIsOptimizationResultVisible(false)}>
          <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700' }}>← Edit Inputs</Text>
        </TouchableOpacity>
      </View>

      {simulatedResults.map(res => (
        <View key={res.id} style={[theme.card, { flexDirection: 'row', padding: 12, gap: 12, borderLeftWidth: 4, borderLeftColor: '#38bdf8' }]}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' }}>
            <Text style={{ color: '#38bdf8', fontWeight: '800', fontSize: 12 }}>{res.bank}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#f8fafc', fontWeight: '700', fontSize: 14 }}>{res.product}</Text>
            <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '700', marginTop: 1, marginBottom: 6 }}>Effective Yield: {res.rate.toFixed(2)}% P.A. Target</Text>
            {res.bullets.map((bullet, idx) => (
              <Text key={idx} style={{ color: bullet.startsWith('✓') ? '#a7f3d0' : bullet.startsWith('✕') ? '#fca5a5' : '#94a3b8', fontSize: 11, marginVertical: 1.5, lineHeight: 14 }}>{bullet}</Text>
            ))}
          </View>
        </View>
      ))}

      <View style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#34d399', shadowColor: '#34d399', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 }}>
        <Text style={{ color: '#34d399', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>1-Year Total Compounding Yield Forecast</Text>
        <Text style={{ color: '#f8fafc', fontSize: 32, fontWeight: '800', marginTop: 4 }}>+${netAnnualEarnings.toFixed(2)}</Text>
        <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, lineHeight: 15 }}>Net interest payout generated purely from on-device water-filling matrix calculations.</Text>
      </View>
    </View>
  );
}