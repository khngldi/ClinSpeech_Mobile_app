import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiFetch, safeJson } from '../api';

const PRIMARY_COLOR = '#2ec4b6';
const { height: windowHeight } = Dimensions.get('window');

const Accordion = ({ title, children, isOpenDefault = false }) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);

    return (
        <View style={styles.accordionContainer}>
            <TouchableOpacity
                style={[styles.accordionHeader, !isOpen && styles.accordionHeaderClosed]}
                onPress={() => setIsOpen(!isOpen)}
                activeOpacity={0.8}
            >
                <Text style={styles.accordionTitle}>{title}</Text>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#FFF" />
            </TouchableOpacity>
            {isOpen && (
                <View style={styles.accordionBody}>
                    {children}
                </View>
            )}
        </View>
    );
};

export default function DetailScreen({ navigation, route }) {
    const statusLabel = { created: 'Создано', processing: 'Обработка', generating: 'Генерация', ready: 'Готово', error: 'Ошибка' };
    const statusColor = { created: '#B0B0B0', processing: '#F1C40F', generating: '#F39C12', ready: '#32CD32', error: '#E74C3C' };
    const waveHeights = [10, 20, 15, 30, 40, 25, 50, 70, 45, 80, 50, 90, 60, 40, 75, 50, 30, 45, 20, 15, 10];

    const consultationId = route?.params?.consultation?.id;
    const [data, setData] = useState(route?.params?.consultation || null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    const load = useCallback(async () => {
        if (!consultationId) { setLoading(false); return; }
        try {
            const res = await apiFetch(`/consultations/${consultationId}/`);
            const json = await safeJson(res);
            if (res.ok) setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [consultationId]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (data?.final_report) {
            try { setEditForm(JSON.parse(data.final_report)); } catch {}
        }
    }, [data?.final_report]);

    // Polling while processing/generating
    useEffect(() => {
        if (!data || !['processing', 'generating'].includes(data.status)) return;
        const interval = setInterval(async () => {
            try {
                const res = await apiFetch(`/consultations/${consultationId}/`);
                const json = await safeJson(res);
                if (res.ok) {
                    setData(json);
                    if (!['processing', 'generating'].includes(json.status)) clearInterval(interval);
                }
            } catch {}
        }, 3000);
        return () => clearInterval(interval);
    }, [data?.status, consultationId]);

    const handleStartProcessing = async () => {
        try {
            const res = await apiFetch(`/consultations/${consultationId}/start_processing/`, { method: 'POST' });
            const json = await safeJson(res);
            if (!res.ok) { Alert.alert('Ошибка', json.error || 'Ошибка запуска'); return; }
            await load();
        } catch (err) { Alert.alert('Ошибка', 'Ошибка запуска обработки'); }
    };

    const handleRegenerate = async () => {
        Alert.alert('Перегенерация', 'Перегенерировать отчёт? Текущий будет сохранён в истории.', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Да', onPress: async () => {
                try {
                    await apiFetch(`/consultations/${consultationId}/regenerate/`, { method: 'POST' });
                    await load();
                } catch { Alert.alert('Ошибка', 'Ошибка перегенерации'); }
            }},
        ]);
    };

    const handleSaveReport = async () => {
        try {
            const res = await apiFetch(`/consultations/${consultationId}/edit_report/`, {
                method: 'POST',
                body: JSON.stringify(editForm),
            });
            if (!res.ok) { Alert.alert('Ошибка', 'Ошибка сохранения'); return; }
            await load();
            setEditing(false);
        } catch { Alert.alert('Ошибка', 'Ошибка сохранения'); }
    };

    const handleDownloadPDF = async () => {
        try {
            const res = await apiFetch(`/consultations/${consultationId}/download_pdf/`);
            if (!res.ok) { Alert.alert('Ошибка', 'Ошибка скачивания PDF'); return; }
            Alert.alert('PDF', 'PDF-отчёт готов к скачиванию');
        } catch { Alert.alert('Ошибка', 'Ошибка скачивания PDF'); }
    };

    if (loading) {
        return (
            <View style={[styles.mainWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            </View>
        );
    }

    if (!data) {
        return (
            <View style={[styles.mainWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 16, color: '#999' }}>Консультация не найдена</Text>
            </View>
        );
    }

    const patient = data.patient_info || {};
    const patientName = patient.last_name
        ? `${patient.last_name} ${patient.first_name || ''} ${patient.middle_name || ''}`
        : 'Пациент не указан';
    const status = data.status || 'ready';
    const formattedDate = data.created_at
        ? new Date(data.created_at).toLocaleString('ru-RU')
        : '—';
    const isProcessing = ['processing', 'generating'].includes(status);

    let report = {};
    try { report = JSON.parse(data.final_report || '{}'); } catch {}

    return (
        <View style={styles.mainWrapper}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    scrollEnabled={true}
                >
                    {/* --- HEADER --- */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation?.goBack()}>
                            <Ionicons name="chevron-back" size={28} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} numberOfLines={1}>{patientName}</Text>
                        <View style={styles.headerIcons}>
                            {status === 'ready' && (
                                <TouchableOpacity style={styles.iconButton} onPress={() => setEditing(!editing)}>
                                    <Ionicons name={editing ? "close-outline" : "create-outline"} size={24} color={PRIMARY_COLOR} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* --- STATUS & PLAYER --- */}
                    <View style={styles.playerSection}>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor[status] || '#32CD32' }]} />
                            <Text style={[styles.statusText, { color: statusColor[status] || '#32CD32' }]}>{statusLabel[status] || status}</Text>
                        </View>
                    </View>

                    {/* --- PROCESSING INDICATOR --- */}
                    {isProcessing && (
                        <View style={styles.processingCard}>
                            <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginBottom: 12 }} />
                            <Text style={styles.processingTitle}>
                                {status === 'processing' ? 'Транскрибация аудио...' : 'Генерация ИИ-отчёта...'}
                            </Text>
                            <Text style={styles.processingSubtitle}>Пожалуйста, подождите. Обновление происходит автоматически.</Text>
                        </View>
                    )}

                    {/* --- ACCORDIONS --- */}
                    <Accordion title="Общие данные" isOpenDefault={true}>
                        <Text style={styles.bodyText}>ФИО: {patientName}</Text>
                        <Text style={styles.bodyText}>ИИН: {patient.iin || '—'}</Text>
                        <Text style={styles.bodyText}>Дата: {formattedDate}</Text>
                        <Text style={styles.bodyText}>Врач: {data.doctor_name || '—'}</Text>
                        <Text style={styles.bodyText}>Снимков: {data.images_count || 0}</Text>
                    </Accordion>

                    <Accordion title="Транскрипция">
                        <Text style={styles.bodyText}>{data.raw_transcription || 'Транскрипция пока отсутствует'}</Text>
                    </Accordion>

                    <Accordion title="Жалобы пациента">
                        {editing ? (
                            <TextInput style={styles.editInput} value={editForm.complaints || ''} onChangeText={(t) => setEditForm({...editForm, complaints: t})} multiline placeholder="Жалобы пациента" />
                        ) : (
                            <Text style={styles.bodyText}>{report.complaints || '—'}</Text>
                        )}
                    </Accordion>

                    <Accordion title="Анамнез заболевания">
                        {editing ? (
                            <TextInput style={styles.editInput} value={editForm.anamnesis || ''} onChangeText={(t) => setEditForm({...editForm, anamnesis: t})} multiline placeholder="Анамнез заболевания" />
                        ) : (
                            <Text style={styles.bodyText}>{report.anamnesis || '—'}</Text>
                        )}
                    </Accordion>

                    <Accordion title="Предварительный диагноз">
                        {editing ? (
                            <TextInput style={styles.editInput} value={editForm.diagnosis || ''} onChangeText={(t) => setEditForm({...editForm, diagnosis: t})} multiline placeholder="Предварительный диагноз" />
                        ) : (
                            <Text style={styles.bodyText}>{report.diagnosis || '—'}</Text>
                        )}
                    </Accordion>

                    <Accordion title="Назначения и рекомендации">
                        {editing ? (
                            <TextInput style={styles.editInput} value={editForm.recommendations || ''} onChangeText={(t) => setEditForm({...editForm, recommendations: t})} multiline placeholder="Назначения и рекомендации" />
                        ) : (
                            <Text style={styles.bodyText}>{report.recommendations || '—'}</Text>
                        )}
                    </Accordion>

                    <Accordion title={`Снимки (${data.images_count || 0})`}>
                        {(!data.analysis_images || data.analysis_images.length === 0) ? (
                            <Text style={styles.bodyText}>Нет снимков</Text>
                        ) : (
                            data.analysis_images.map((img) => (
                                <Text key={img.id} style={styles.bodyText}>• {img.description || 'Снимок'}</Text>
                            ))
                        )}
                    </Accordion>

                    {/* --- EDIT SAVE/CANCEL --- */}
                    {editing && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#32CD32' }]} onPress={handleSaveReport}>
                                <Text style={styles.actionButtonText}>СОХРАНИТЬ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#999' }]} onPress={() => setEditing(false)}>
                                <Text style={styles.actionButtonText}>ОТМЕНА</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* --- BOTTOM ACTIONS --- */}
                    <View style={styles.actionRow}>
                        {status === 'created' && (
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#32CD32' }]} onPress={handleStartProcessing}>
                                <Text style={styles.actionButtonText}>▶ ЗАПУСТИТЬ</Text>
                            </TouchableOpacity>
                        )}
                        {status === 'ready' && (
                            <>
                                <TouchableOpacity style={styles.actionButton} onPress={handleDownloadPDF}>
                                    <Text style={styles.actionButtonText}>СКАЧАТЬ PDF</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F39C12' }]} onPress={handleRegenerate}>
                                    <Text style={styles.actionButtonText}>ПЕРЕГЕНЕРИРОВАТЬ</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {status === 'error' && (
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F39C12' }]} onPress={handleStartProcessing}>
                                <Text style={styles.actionButtonText}>ПОВТОРИТЬ</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
        height: '100%',
        backgroundColor: '#FFFFFF',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        flex: 1,
        marginLeft: 10,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        marginLeft: 15,
    },
    playerSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#32CD32',
        marginRight: 8,
    },
    statusText: {
        fontSize: 18,
        color: '#32CD32',
        fontWeight: '500',
    },
    timeText: {
        fontSize: 32,
        color: PRIMARY_COLOR,
        fontWeight: '300',
        marginBottom: 15,
    },
    waveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
        marginBottom: 10,
    },
    waveBar: {
        width: 4,
        backgroundColor: PRIMARY_COLOR,
        borderRadius: 2,
        marginHorizontal: 3,
    },
    fileName: {
        fontSize: 12,
        color: PRIMARY_COLOR,
        marginBottom: 15,
    },
    progressBarBackground: {
        width: '100%',
        height: 4,
        backgroundColor: '#E0F7FA',
        borderRadius: 2,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    progressBarFill: {
        width: '30%',
        height: '100%',
        backgroundColor: PRIMARY_COLOR,
        borderRadius: 2,
    },
    progressThumb: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: PRIMARY_COLOR,
        position: 'absolute',
        left: '30%',
        transform: [{ translateX: -5 }],
    },
    playerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 120,
    },
    accordionContainer: {
        marginBottom: 15,
        borderRadius: 8,
        overflow: 'hidden',
    },
    accordionHeader: {
        backgroundColor: PRIMARY_COLOR,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    accordionHeaderClosed: {
        borderRadius: 8,
    },
    accordionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    accordionBody: {
        backgroundColor: '#FFF',
        padding: 15,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: PRIMARY_COLOR,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    bodyText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 6,
        lineHeight: 20,
    },
    boldText: {
        fontWeight: 'bold',
    },
    processingCard: {
        backgroundColor: '#F0F9FF',
        borderRadius: 8,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0F7FA',
    },
    processingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    processingSubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
    },
    editInput: {
        fontSize: 14,
        color: '#333',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 6,
        padding: 10,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actionButton: {
        backgroundColor: PRIMARY_COLOR,
        flex: 0.48,
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    fabContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        paddingBottom: 20,
    },
    fabOuterRing: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(0, 191, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabInnerRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(0, 191, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: PRIMARY_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
    },
});