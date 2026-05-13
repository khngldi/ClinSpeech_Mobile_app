export const CONSULTATION_STATUSES = ['created', 'processing', 'generating', 'ready', 'error'];

export const CONSULTATION_STATUS_THEME = {
  created: {
    labelKey: 'status.created',
    fallback: 'Создано',
    color: '#475569',
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
    icon: 'ellipse-outline',
  },
  processing: {
    labelKey: 'status.processing',
    fallback: 'Обработка',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    borderColor: '#bfdbfe',
    icon: 'sync-outline',
  },
  generating: {
    labelKey: 'status.generating',
    fallback: 'Генерация',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    icon: 'sparkles-outline',
  },
  ready: {
    labelKey: 'status.ready',
    fallback: 'Готово',
    color: '#15803d',
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
    icon: 'checkmark-circle-outline',
  },
  error: {
    labelKey: 'status.error',
    fallback: 'Ошибка',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    icon: 'alert-circle-outline',
  },
};

export function getConsultationStatusMeta(status, t) {
  const meta = CONSULTATION_STATUS_THEME[status] || CONSULTATION_STATUS_THEME.created;
  return {
    ...meta,
    status,
    label: t ? t(meta.labelKey, meta.fallback) : meta.fallback,
  };
}
