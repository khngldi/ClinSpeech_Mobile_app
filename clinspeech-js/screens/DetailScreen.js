import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    Linking,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { apiFetch, safeJson, BASE_URL, getFreshToken } from '../api';
import { useLocale } from '../i18n/LocaleContext';
import StatusChip from '../components/StatusChip';
import { getFriendlyApiError } from '../utils/apiErrors';

const PRIMARY = '#2ec4b6';
const CARD_BG = 'rgba(255,255,255,0.94)';

const parseReport = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const getImageUrl = (img) => {
    if (!img?.image) return '';
    return img.image.startsWith('http') ? img.image : `${BASE_URL}${img.image}`;
};

function EmptyBlock({ icon = 'document-text-outline', title, text }) {
    return (
        <View style={styles.emptyBlock}>
            <Ionicons name={icon} size={34} color="#94a3b8" />
            <Text style={styles.emptyTitle}>{title}</Text>
            {text ? <Text style={styles.emptyText}>{text}</Text> : null}
        </View>
    );
}

function SectionCard({ icon, title, subtitle, children, defaultOpen = true, right }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <View style={styles.sectionCard}>
            <TouchableOpacity style={styles.sectionHeader} activeOpacity={0.8} onPress={() => setOpen(!open)}>
                <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIcon}>
                        <Ionicons name={icon} size={18} color={PRIMARY} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
                    </View>
                    {right}
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
                </View>
            </TouchableOpacity>
            {open ? <View style={styles.sectionBody}>{children}</View> : null}
        </View>
    );
}

export default function DetailScreen({ navigation, route }) {
    const { t, formatDate, formatDateTime } = useLocale();
    const consultationId =
        route?.params?.consultationId ||
        route?.params?.consultation?.id ||
        route?.params?.id;

    const [data, setData] = useState(route?.params?.consultation || null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [savingReport, setSavingReport] = useState(false);
    const [user, setUser] = useState(null);
    const [galleryVisible, setGalleryVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const [templateModalVisible, setTemplateModalVisible] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [templatesError, setTemplatesError] = useState('');
    const [templateActionId, setTemplateActionId] = useState(null);
    const [regenerating, setRegenerating] = useState(false);

    const report = useMemo(() => parseReport(data?.final_report), [data?.final_report]);
    const status = data?.status || 'created';
    const isProcessing = ['processing', 'generating'].includes(status);
    const isPatient = user?.role === 'patient';
    const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

    const patient = data?.patient_info || {};
    const patientName = patient.last_name
        ? `${patient.last_name} ${patient.first_name || ''} ${patient.middle_name || ''}`.trim()
        : t('Пациент не указан');
    const images = Array.isArray(data?.analysis_images) ? data.analysis_images : [];

    const reportFields = useMemo(() => ([
        { key: 'complaints', title: t('Жалобы пациента'), icon: 'chatbubble-ellipses-outline' },
        { key: 'anamnesis', title: t('Анамнез заболевания'), icon: 'book-outline' },
        { key: 'diagnosis', title: t('Предварительный диагноз'), icon: 'medkit-outline' },
        { key: 'recommendations', title: t('Назначения и рекомендации'), icon: 'checkmark-done-outline' },
    ]), [t]);

    const load = useCallback(async ({ silent = false } = {}) => {
        if (!consultationId) {
            setLoading(false);
            setLoadError(t('Консультация не найдена'));
            return;
        }

        if (!silent) setLoading(true);
        setLoadError('');
        try {
            const res = await apiFetch(`/consultations/${consultationId}/`);
            if (!res.ok) {
                const payload = await safeJson(res);
                throw { status: res.status, payload };
            }
            const json = await safeJson(res);
            setData(json);
            setEditForm(parseReport(json.final_report));
        } catch (error) {
            console.error('Consultation load failed:', error);
            setLoadError(getFriendlyApiError(error, t, 'Не удалось загрузить консультацию'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [consultationId, t]);

    const loadUser = useCallback(async () => {
        try {
            const res = await apiFetch('/me/');
            const json = await safeJson(res);
            setUser(json);
        } catch (error) {
            console.error('User load failed:', error);
        }
    }, []);

    const loadTemplates = useCallback(async () => {
        if (!isDoctor) return;
        setTemplatesLoading(true);
        setTemplatesError('');
        try {
            const res = await apiFetch('/templates/');
            if (!res.ok) {
                const payload = await safeJson(res);
                throw { status: res.status, payload };
            }
            const json = await safeJson(res);
            setTemplates(Array.isArray(json) ? json : (json?.results || []));
        } catch (error) {
            console.error('Templates load failed:', error);
            setTemplates([]);
            setTemplatesError(getFriendlyApiError(error, t, 'Не удалось загрузить шаблоны'));
        } finally {
            setTemplatesLoading(false);
        }
    }, [isDoctor, t]);

    useEffect(() => {
        load();
        loadUser();
    }, [load, loadUser]);

    useEffect(() => {
        setEditForm(parseReport(data?.final_report));
    }, [data?.final_report]);

    useEffect(() => {
        if (!consultationId || !isProcessing) return undefined;
        const interval = setInterval(() => {
            load({ silent: true });
        }, 3000);
        return () => clearInterval(interval);
    }, [consultationId, isProcessing, load]);

    const onRefresh = () => {
        setRefreshing(true);
        load({ silent: true });
    };

    const handleStartProcessing = async () => {
        try {
            const res = await apiFetch(`/consultations/${consultationId}/start_processing/`, { method: 'POST' });
            if (!res.ok) {
                const payload = await safeJson(res);
                throw { status: res.status, payload };
            }
            setData((prev) => prev ? { ...prev, status: 'processing' } : prev);
            await load({ silent: true });
        } catch (error) {
            console.error('Start processing failed:', error);
            Alert.alert(t('Ошибка'), getFriendlyApiError(error, t, 'Не удалось запустить обработку'));
        }
    };

    const openRegenerateModal = () => {
        setTemplateModalVisible(true);
        loadTemplates();
    };

    const handleStandardRegenerate = async () => {
        setRegenerating(true);
        try {
            const res = await apiFetch(`/consultations/${consultationId}/regenerate/`, { method: 'POST' });
            if (!res.ok) {
                const payload = await safeJson(res);
                throw { status: res.status, payload };
            }
            setTemplateModalVisible(false);
            setData((prev) => prev ? { ...prev, status: 'processing' } : prev);
            await load({ silent: true });
        } catch (error) {
            console.error('Regenerate failed:', error);
            Alert.alert(t('Ошибка'), getFriendlyApiError(error, t, 'Не удалось запустить повторную генерацию'));
        } finally {
            setRegenerating(false);
        }
    };

    const handleApplyTemplate = async (template) => {
        setTemplateActionId(template.id);
        try {
            const res = await apiFetch(`/templates/${template.id}/apply/`, {
                method: 'POST',
                body: JSON.stringify({ consultation_id: consultationId }),
            });
            if (!res.ok) {
                const payload = await safeJson(res);
                throw { status: res.status, payload };
            }
            setTemplateModalVisible(false);
            await load({ silent: true });
        } catch (error) {
            console.error('Template apply failed:', error);
            Alert.alert(t('Ошибка'), getFriendlyApiError(error, t, 'Ошибка применения шаблона'));
        } finally {
            setTemplateActionId(null);
        }
    };

    const handleSaveReport = async () => {
        setSavingReport(true);
        try {
            const res = await apiFetch(`/consultations/${consultationId}/edit_report/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    complaints: editForm.complaints || '',
                    anamnesis: editForm.anamnesis || '',
                    diagnosis: editForm.diagnosis || '',
                    recommendations: editForm.recommendations || '',
                }),
            });
            if (!res.ok) {
                const payload = await safeJson(res);
                throw { status: res.status, payload };
            }
            await load({ silent: true });
            setEditing(false);
        } catch (error) {
            console.error('Report save failed:', error);
            Alert.alert(t('Ошибка'), getFriendlyApiError(error, t, 'Не удалось сохранить отчет'));
        } finally {
            setSavingReport(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const token = await getFreshToken();
            const response = await fetch(`${BASE_URL}/consultations/${consultationId}/download_pdf/`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw { status: response.status };
            }

            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64data = reader.result.split(',')[1];
                    if (!base64data) throw new Error('Empty PDF payload');

                    const fileUri = `${FileSystem.documentDirectory}consultation_${consultationId}.pdf`;
                    await FileSystem.writeAsStringAsync(fileUri, base64data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    if (Platform.OS === 'android') {
                        const contentUri = await FileSystem.getContentUriAsync(fileUri);
                        await Linking.openURL(contentUri);
                    } else {
                        await Linking.openURL(fileUri);
                    }
                } catch (error) {
                    console.error('PDF write/open failed:', error);
                    Alert.alert(t('Ошибка'), t('Не удалось скачать PDF'));
                }
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('PDF download failed:', error);
            Alert.alert(t('Ошибка'), getFriendlyApiError(error, t, 'Не удалось скачать PDF'));
        }
    };

    const handleSaveImage = async (imageUrl) => {
        try {
            const token = await getFreshToken();
            const response = await fetch(imageUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw { status: response.status };
            }

            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64data = reader.result.split(',')[1];
                    const fileUri = `${FileSystem.documentDirectory}image_${Date.now()}.jpg`;
                    await FileSystem.writeAsStringAsync(fileUri, base64data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    const uri = Platform.OS === 'android'
                        ? await FileSystem.getContentUriAsync(fileUri)
                        : fileUri;
                    await Linking.openURL(uri);
                } catch (error) {
                    console.error('Image write/open failed:', error);
                    Alert.alert(t('Ошибка'), t('Не удалось сохранить изображение'));
                }
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Image download failed:', error);
            Alert.alert(t('Ошибка'), getFriendlyApiError(error, t, 'Не удалось скачать изображение'));
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <AnimatedGradientBackground />
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={styles.loadingText}>{t('Загрузка')}...</Text>
            </View>
        );
    }

    if (loadError || !data) {
        return (
            <View style={styles.mainWrapper}>
                <AnimatedGradientBackground />
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.roundIcon} onPress={() => navigation?.goBack()}>
                            <Ionicons name="chevron-back" size={22} color="#1f2937" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.errorState}>
                        <EmptyBlock
                            icon="alert-circle-outline"
                            title={loadError || t('Консультация не найдена')}
                            text={t('Проверьте подключение или попробуйте обновить экран')}
                        />
                        <TouchableOpacity style={styles.primaryButton} onPress={() => load()}>
                            <Text style={styles.primaryButtonText}>{t('Попробовать снова')}</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    const hasReport = reportFields.some((field) => Boolean(report[field.key]));
    const icdValue =
        report.icd10 ||
        report.icd_10 ||
        report.icd10_code ||
        data.diagnosis_code ||
        data.icd10 ||
        '';

    return (
        <View style={styles.mainWrapper}>
            <AnimatedGradientBackground />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
                >
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.roundIcon} onPress={() => navigation?.goBack()}>
                            <Ionicons name="chevron-back" size={22} color="#1f2937" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} numberOfLines={1}>{t('Детали консультации')}</Text>
                        {status === 'ready' && isDoctor ? (
                            <TouchableOpacity style={styles.roundIcon} onPress={() => setEditing((value) => !value)}>
                                <Ionicons name={editing ? 'close-outline' : 'create-outline'} size={22} color={PRIMARY} />
                            </TouchableOpacity>
                        ) : <View style={{ width: 42 }} />}
                    </View>

                    <View style={styles.heroCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.patientName}>{patientName}</Text>
                            <Text style={styles.heroMeta}>{formatDateTime(data.created_at)}</Text>
                        </View>
                        <StatusChip status={status} />
                    </View>

                    <View style={styles.metaGrid}>
                        <View style={styles.metaCard}>
                            <Text style={styles.metaLabel}>{t('Врач')}</Text>
                            <Text style={styles.metaValue} numberOfLines={1}>{data.doctor_name || '—'}</Text>
                        </View>
                        <View style={styles.metaCard}>
                            <Text style={styles.metaLabel}>{t('ИИН')}</Text>
                            <Text style={styles.metaValue} numberOfLines={1}>{patient.iin || '—'}</Text>
                        </View>
                        <View style={styles.metaCard}>
                            <Text style={styles.metaLabel}>{t('Снимков')}</Text>
                            <Text style={styles.metaValue}>{data.images_count || images.length || 0}</Text>
                        </View>
                    </View>

                    {isProcessing ? (
                        <View style={styles.processingCard}>
                            <ActivityIndicator size="large" color={PRIMARY} />
                            <Text style={styles.processingTitle}>
                                {status === 'processing' ? t('Транскрибация аудио...') : t('Генерация ИИ-отчёта...')}
                            </Text>
                            <Text style={styles.processingSubtitle}>{t('Пожалуйста, подождите. Обновление происходит автоматически.')}</Text>
                        </View>
                    ) : null}

                    <SectionCard icon="clipboard-outline" title={t('Отчёт')} subtitle={editing ? t('Редактирование отчёта') : undefined}>
                        {!hasReport && !editing ? (
                            <EmptyBlock title={t('Отчёт пока пуст')} text={t('Запустите обработку или повторную генерацию')} />
                        ) : (
                            reportFields.map((field) => (
                                <View key={field.key} style={styles.reportField}>
                                    <View style={styles.reportFieldHeader}>
                                        <Ionicons name={field.icon} size={18} color={PRIMARY} />
                                        <Text style={styles.reportFieldTitle}>{field.title}</Text>
                                    </View>
                                    {editing ? (
                                        <TextInput
                                            style={styles.editInput}
                                            value={editForm[field.key] || ''}
                                            onChangeText={(text) => setEditForm({ ...editForm, [field.key]: text })}
                                            placeholder={field.title}
                                            placeholderTextColor="#94a3b8"
                                            multiline
                                        />
                                    ) : (
                                        <Text style={styles.reportText}>{report[field.key] || '—'}</Text>
                                    )}
                                </View>
                            ))
                        )}

                        {editing && isDoctor ? (
                            <View style={styles.editActions}>
                                <TouchableOpacity style={[styles.primaryButton, savingReport && styles.disabled]} onPress={handleSaveReport} disabled={savingReport}>
                                    {savingReport ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t('Сохранить')}</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.secondaryButton} onPress={() => { setEditing(false); setEditForm(report); }}>
                                    <Text style={styles.secondaryButtonText}>{t('Отмена')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </SectionCard>

                    <SectionCard icon="barcode-outline" title={t('ICD-10')} defaultOpen={Boolean(icdValue)}>
                        {icdValue ? (
                            <Text style={styles.bodyText}>{icdValue}</Text>
                        ) : (
                            <EmptyBlock icon="search-outline" title={t('МКБ-10 не указан')} text={t('Код можно добавить при редактировании отчёта')} />
                        )}
                    </SectionCard>

                    <SectionCard icon="mic-outline" title={t('Транскрипция')} defaultOpen={false}>
                        {data.raw_transcription ? (
                            <Text style={styles.transcriptionText}>{data.raw_transcription}</Text>
                        ) : (
                            <EmptyBlock icon="mic-off-outline" title={t('Транскрипция пока отсутствует')} />
                        )}
                    </SectionCard>

                    <SectionCard icon="images-outline" title={`${t('Снимки')} (${images.length})`} defaultOpen={images.length > 0}>
                        {images.length === 0 ? (
                            <EmptyBlock icon="image-outline" title={t('Нет снимков')} text={isPatient ? t('Снимки отсутствуют') : t('Загрузите снимки анализов в web-версии или backend')} />
                        ) : (
                            <View style={styles.imageGrid}>
                                {images.map((img) => (
                                    <TouchableOpacity key={img.id} style={styles.imageThumb} onPress={() => { setSelectedImage(img); setGalleryVisible(true); }}>
                                        <Image source={{ uri: getImageUrl(img) }} style={styles.thumbImage} resizeMode="cover" />
                                        <Text style={styles.imageDescription} numberOfLines={1}>{img.description || t('Снимок')}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </SectionCard>

                    <SectionCard icon="flash-outline" title={t('Действия')} defaultOpen>
                        <View style={styles.actionsGrid}>
                            {status === 'created' && isDoctor ? (
                                <TouchableOpacity style={styles.primaryAction} onPress={handleStartProcessing}>
                                    <Ionicons name="play-outline" size={18} color="#fff" />
                                    <Text style={styles.actionTextLight}>{t('Запустить обработку')}</Text>
                                </TouchableOpacity>
                            ) : null}
                            {status === 'ready' ? (
                                <TouchableOpacity style={styles.secondaryAction} onPress={handleDownloadPDF}>
                                    <Ionicons name="download-outline" size={18} color={PRIMARY} />
                                    <Text style={styles.actionText}>{t('Скачать PDF')}</Text>
                                </TouchableOpacity>
                            ) : null}
                            {status === 'ready' && isDoctor ? (
                                <TouchableOpacity style={styles.warningAction} onPress={openRegenerateModal}>
                                    <Ionicons name="refresh-outline" size={18} color="#92400e" />
                                    <Text style={styles.warningActionText}>{t('Повторная генерация')}</Text>
                                </TouchableOpacity>
                            ) : null}
                            {status === 'error' && isDoctor ? (
                                <TouchableOpacity style={styles.warningAction} onPress={handleStartProcessing}>
                                    <Ionicons name="refresh-outline" size={18} color="#92400e" />
                                    <Text style={styles.warningActionText}>{t('Повторить')}</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </SectionCard>
                </ScrollView>
            </SafeAreaView>

            <Modal visible={templateModalVisible} animationType="slide" transparent onRequestClose={() => setTemplateModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>{t('Выберите шаблон')}</Text>
                                <Text style={styles.modalSubtitle}>{t('Текущий отчёт будет сохранён в истории')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setTemplateModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#334155" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.templateItem} onPress={handleStandardRegenerate} disabled={regenerating}>
                            <View style={styles.templateIcon}>
                                <Ionicons name="sparkles-outline" size={20} color={PRIMARY} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.templateName}>{t('Стандартная генерация')}</Text>
                                <Text style={styles.templateMeta}>{t('ИИ сформирует отчёт без шаблона')}</Text>
                            </View>
                            {regenerating ? <ActivityIndicator color={PRIMARY} /> : <Ionicons name="chevron-forward" size={20} color="#94a3b8" />}
                        </TouchableOpacity>

                        {templatesLoading ? (
                            <ActivityIndicator color={PRIMARY} style={{ marginVertical: 20 }} />
                        ) : templatesError ? (
                            <Text style={styles.modalError}>{templatesError}</Text>
                        ) : templates.length === 0 ? (
                            <EmptyBlock title={t('Нет шаблонов')} text={t('Откройте раздел шаблонов, чтобы создать или включить публичные заготовки.')} />
                        ) : (
                            <ScrollView style={styles.templateList} showsVerticalScrollIndicator={false}>
                                {templates.map((template) => (
                                    <TouchableOpacity
                                        key={template.id}
                                        style={styles.templateItem}
                                        onPress={() => handleApplyTemplate(template)}
                                        disabled={templateActionId === template.id}
                                    >
                                        <View style={styles.templateIcon}>
                                            <Ionicons name="document-text-outline" size={20} color={PRIMARY} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.templateName}>{template.name}</Text>
                                            <Text style={styles.templateMeta} numberOfLines={2}>
                                                {template.description || template.specialty || t('Шаблон отчёта')}
                                            </Text>
                                        </View>
                                        {templateActionId === template.id ? (
                                            <ActivityIndicator color={PRIMARY} />
                                        ) : (
                                            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal visible={galleryVisible} transparent animationType="fade" onRequestClose={() => setGalleryVisible(false)}>
                <View style={styles.galleryOverlay}>
                    <View style={styles.galleryContent}>
                        <View style={styles.galleryHeader}>
                            <Text style={styles.galleryTitle}>{selectedImage?.description || t('Снимок')}</Text>
                            <TouchableOpacity onPress={() => setGalleryVisible(false)}>
                                <Ionicons name="close" size={28} color="#334155" />
                            </TouchableOpacity>
                        </View>
                        {selectedImage ? (
                            <Image source={{ uri: getImageUrl(selectedImage) }} style={styles.fullImage} resizeMode="contain" />
                        ) : null}
                        <TouchableOpacity style={styles.downloadButton} onPress={() => handleSaveImage(getImageUrl(selectedImage))}>
                            <Ionicons name="download-outline" size={20} color="#fff" />
                            <Text style={styles.downloadButtonText}>{t('Сохранить в галерею')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: { flex: 1 },
    safeArea: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 10, color: '#64748b', fontSize: 14 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 36 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
    roundIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: '#e2e8f0' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#102a43' },
    heroCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
    patientName: { fontSize: 20, fontWeight: '800', color: '#102a43', marginBottom: 5 },
    heroMeta: { fontSize: 13, color: '#64748b' },
    metaGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    metaCard: { flex: 1, backgroundColor: CARD_BG, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    metaLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 },
    metaValue: { fontSize: 14, color: '#1f2937', fontWeight: '700' },
    processingCard: { alignItems: 'center', backgroundColor: '#ecfeff', borderRadius: 18, padding: 22, borderWidth: 1, borderColor: '#bae6fd', marginBottom: 12 },
    processingTitle: { marginTop: 12, fontSize: 16, fontWeight: '800', color: '#0f172a' },
    processingSubtitle: { marginTop: 6, color: '#64748b', textAlign: 'center', lineHeight: 20 },
    sectionCard: { backgroundColor: CARD_BG, borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, overflow: 'hidden' },
    sectionHeader: { padding: 14 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(46,196,182,0.12)', alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#102a43' },
    sectionSubtitle: { marginTop: 2, fontSize: 12, color: '#64748b' },
    sectionBody: { paddingHorizontal: 14, paddingBottom: 14 },
    reportField: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    reportFieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    reportFieldTitle: { fontSize: 14, fontWeight: '800', color: '#1f2937' },
    reportText: { fontSize: 14, color: '#334155', lineHeight: 21 },
    bodyText: { fontSize: 14, color: '#334155', lineHeight: 22 },
    transcriptionText: { fontSize: 14, color: '#334155', lineHeight: 23 },
    editInput: { minHeight: 92, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, backgroundColor: '#fff', padding: 12, fontSize: 14, color: '#1f2937', textAlignVertical: 'top' },
    editActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
    primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    secondaryButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
    secondaryButtonText: { color: '#475569', fontWeight: '800', fontSize: 14 },
    disabled: { opacity: 0.6 },
    emptyBlock: { alignItems: 'center', paddingVertical: 26, paddingHorizontal: 16, backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
    emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: '800', color: '#334155', textAlign: 'center' },
    emptyText: { marginTop: 5, fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 19 },
    errorState: { flex: 1, padding: 16, justifyContent: 'center', gap: 12 },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    imageThumb: { width: '31%', aspectRatio: 0.82, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    thumbImage: { width: '100%', height: '76%' },
    imageDescription: { fontSize: 10, color: '#475569', paddingHorizontal: 6, paddingVertical: 5, backgroundColor: '#fff' },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    primaryAction: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
    secondaryAction: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ecfeff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#99f6e4' },
    warningAction: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#fde68a' },
    actionTextLight: { color: '#fff', fontWeight: '800', fontSize: 13 },
    actionText: { color: PRIMARY, fontWeight: '800', fontSize: 13 },
    warningActionText: { color: '#92400e', fontWeight: '800', fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
    bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 20, maxHeight: '86%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#102a43' },
    modalSubtitle: { marginTop: 3, fontSize: 12, color: '#64748b' },
    modalError: { margin: 16, color: '#dc2626', backgroundColor: '#fef2f2', padding: 12, borderRadius: 12 },
    templateList: { maxHeight: 380 },
    templateItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
    templateIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(46,196,182,0.12)', alignItems: 'center', justifyContent: 'center' },
    templateName: { fontSize: 14, color: '#1f2937', fontWeight: '800' },
    templateMeta: { marginTop: 3, fontSize: 12, color: '#64748b', lineHeight: 17 },
    galleryOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.88)', justifyContent: 'center', alignItems: 'center', padding: 18 },
    galleryContent: { width: '100%', maxHeight: '86%', backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
    galleryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    galleryTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1f2937' },
    fullImage: { width: '100%', height: 320, backgroundColor: '#f8fafc' },
    downloadButton: { margin: 14, paddingVertical: 13, borderRadius: 12, backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    downloadButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
