import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocale } from '../i18n/LocaleContext';
import { getConsultationStatusMeta } from '../utils/status';

export default function StatusChip({ status, compact = false, style }) {
  const { t } = useLocale();
  const meta = getConsultationStatusMeta(status, t);

  return (
    <View
      style={[
        styles.chip,
        compact && styles.compact,
        {
          backgroundColor: meta.backgroundColor,
          borderColor: meta.borderColor,
        },
        style,
      ]}
    >
      <Ionicons name={meta.icon} size={compact ? 12 : 14} color={meta.color} />
      <Text style={[styles.text, compact && styles.compactText, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  compactText: {
    fontSize: 11,
  },
});
