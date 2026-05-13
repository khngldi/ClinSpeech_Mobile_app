export function flattenApiPayload(payload) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload)) return payload.map(flattenApiPayload).filter(Boolean).join('; ');
  if (typeof payload === 'object') {
    return Object.values(payload).map(flattenApiPayload).filter(Boolean).join('; ');
  }
  return String(payload);
}

export function getFriendlyApiError(error, t, fallback = 'Произошла ошибка') {
  const status = error?.status || error?.response?.status;
  const payload = error?.payload || error?.data || error?.response?.data;
  const serverMessage = flattenApiPayload(payload?.detail || payload?.error || payload?.message);

  if (status === 401) return t('api.sessionExpired', 'Сессия истекла. Войдите снова.');
  if (status === 403) return t('api.forbidden', 'Недостаточно прав');
  if (status === 404) return t('api.notFound', 'Данные не найдены');
  if (status >= 500) return t('api.serverError', 'Ошибка сервера');
  if (status >= 400) return serverMessage || t('api.badRequest', 'Проверьте данные и попробуйте снова');

  const message = error?.message || '';
  if (/network|failed to fetch|request failed|подключ/i.test(message)) {
    return t('api.networkError', 'Проверьте подключение');
  }

  return serverMessage || t('api.genericError', fallback);
}

export async function getResponseError(response, t, fallback) {
  let payload = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('API error parse failed:', error);
  }
  return getFriendlyApiError({ status: response.status, payload }, t, fallback);
}
