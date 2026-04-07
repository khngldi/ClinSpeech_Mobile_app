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
    Alert,
    Image,
    Modal,
    Platform,
    Linking,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { apiFetch, safeJson, BASE_URL, getFreshToken } from '../api';
import { useLocale } from '../i18n/LocaleContext';

const PRIMARY_COLOR = '#2ec4b6';
const { width: SW, height: windowHeight } = Dimensions.get('window');

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
    const { t } = useLocale();
    const statusLabel = { created: t('Создано'), processing: t('Обработка'), generating: t('Генерация'), ready: t('Готово'), error: t('Ошибка') };
    const statusColor = { created: '#B0B0B0', processing: '#F1C40F', generating: '#F39C12', ready: '#32CD32', error: '#E74C3C' };
    const waveHeights = [10, 20, 15, 30, 40, 25, 50, 70, 45, 80, 50, 90, 60, 40, 75, 50, 30, 45, 20, 15, 10];

    const consultationId = route?.params?.consultation?.id;
    const [data, setData] = useState(route?.params?.consultation || null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [user, setUser] = useState(null);
    
    // Gallery modal
    const [galleryVisible, setGalleryVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Load user role
    useEffect(() => {
        apiFetch('/me/').then(safeJson).then(setUser).catch(() => {});
    }, []);

    const isPatient = user?.role === 'patient';
    const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

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
            if (!res.ok) { Alert.alert(t('Ошибка'), json.error || t('Ошибка')); return; }
            await load();
        } catch (err) { Alert.alert(t('Ошибка'), t('Ошибка')); }
    };

    const handleRegenerate = async () => {
        Alert.alert(t('Регенерировать'), t('Регенерировать') + '?', [
            { text: t('Отмена'), style: 'cancel' },
            { text: t('Да'), onPress: async () => {
                try {
                    await apiFetch(`/consultations/${consultationId}/regenerate/`, { method: 'POST' });
                    await load();
                } catch { Alert.alert(t('Ошибка'), t('Ошибка')); }
            }},
        ]);
    };

    const handleSaveReport = async () => {
        try {
            const res = await apiFetch(`/consultations/${consultationId}/edit_report/`, {
                method: 'POST',
                body: JSON.stringify(editForm),
            });
            if (!res.ok) { Alert.alert(t('Ошибка'), t('Ошибка')); return; }
            await load();
            setEditing(false);
        } catch { Alert.alert(t('Ошибка'), t('Ошибка')); }
    };

    const handleDownloadPDF = async () => {
        try {
            // Get fresh token (auto-refresh if expired)
            const token = await getFreshToken();
            const pdfUrl = `${BASE_URL}/consultations/${consultationId}/download_pdf/`;
            
            Alert.alert(t('PDF скачивается...'), t('Пожалуйста, подождите'));
            
            const response = await fetch(pdfUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            console.log('PDF response status:', response.status);
            
            if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                
                reader.onloadend = async () => {
                    try {
                        const base64data = reader.result.split(',')[1];
                        const filename = `consultation_${consultationId}.pdf`;
                        const fileUri = FileSystem.documentDirectory + filename;
                        
                        await FileSystem.writeAsStringAsync(fileUri, base64data, {
                            encoding: FileSystem.EncodingType.Base64,
                        });
                        
                        // Open PDF with system viewer
                        if (Platform.OS === 'android') {
                            const contentUri = await FileSystem.getContentUriAsync(fileUri);
                            await Linking.openURL(contentUri);
                        } else {
                            await Linking.openURL(fileUri);
                        }
                        Alert.alert(t('Успешно'), t('PDF открыт'));
                    } catch (writeError) {
                        console.error('Write error:', writeError);
                        Alert.alert(t('Ошибка'), writeError.message);
                    }
                };
                
                reader.readAsDataURL(blob);
            } else {
                const errorText = await response.text();
                console.error('PDF error:', response.status, errorText);
                Alert.alert(t('Ошибка'), `${t('Не удалось скачать PDF')} (${response.status})`);
            }
        } catch (error) {
            console.error('PDF download error:', error);
            Alert.alert(t('Ошибка'), error.message || t('Не удалось скачать PDF'));
        }
    };

    const handleSaveImage = async (imageUrl) => {
        try {
            const token = await getFreshToken();
            const filename = `image_${Date.now()}.jpg`;
            const fileUri = FileSystem.documentDirectory + filename;
            
            Alert.alert(t('Скачивание...'), t('Пожалуйста, подождите'));
            
            // Fetch image
            const response = await fetch(imageUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                
                reader.onloadend = async () => {
                    try {
                        const base64data = reader.result.split(',')[1];
                        await FileSystem.writeAsStringAsync(fileUri, base64data, {
                            encoding: FileSystem.EncodingType.Base64,
                        });
                        
                        // Open image with system viewer
                        if (Platform.OS === 'android') {
                            const contentUri = await FileSystem.getContentUriAsync(fileUri);
                            await Linking.openURL(contentUri);
                        } else {
                            await Linking.openURL(fileUri);
                        }
                        Alert.alert(t('Успешно'), t('Изображение открыто'));
                    } catch (writeError) {
                        console.error('Write error:', writeError);
                        Alert.alert(t('Ошибка'), writeError.message);
                    }
                };
                
                reader.readAsDataURL(blob);
            } else {
                Alert.alert(t('Ошибка'), t('Не удалось скачать изображение'));
            }
        } catch (error) {
            console.error('Save image error:', error);
            Alert.alert(t('Ошибка'), t('Не удалось сохранить изображение'));
        }
    };

    const openGallery = (img) => {
        setSelectedImage(img);
        setGalleryVisible(true);
    };

    if (loading) {
        return (
            <View style={[styles.mainWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                <AnimatedGradientBackground />
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            </View>
        );
    }

    if (!data) {
        return (
            <View style={[styles.mainWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                <AnimatedGradientBackground />
                <Text style={{ fontSize: 16, color: '#999' }}>{t('Нет консультаций')}</Text>
            </View>
        );
    }

    const patient = data.patient_info || {};
    const patientName = patient.last_name
        ? `${patient.last_name} ${patient.first_name || ''} ${patient.middle_name || ''}`
        : t('Пациент не указан');
    const status = data.status || 'ready';
    const formattedDate = data.created_at
        ? new Date(data.created_at).toLocaleString('ru-RU')
        : '—';
    const isProcessing = ['processing', 'generating'].includes(status);

    let report = {};
    try { report = JSON.parse(data.final_report || '{}'); } catch {}

    return (
        <View style={styles.mainWrapper}>
            <AnimatedGradientBackground />
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
                            {/* Only doctors can edit reports */}
                            {status === 'ready' && isDoctor && (
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
                                {status === 'processing' ? t('Транскрибация аудио...') : t('Генерация ИИ-отчёта...')}
                            </Text>
                            <Text style={styles.processingSubtitle}>{t('Пожалуйста, подождите. Обновление происходит автоматически.')}</Text>
                        </View>
                    )}

                    {/* --- ACCORDIONS --- */}
                    <Accordion title={t('Общие данные')} isOpenDefault={true}>
                        <Text style={styles.bodyText}>{t('ФИО')}: {patientName}</Text>
                        <Text style={styles.bodyText}>{t('ИИН')}: {patient.iin || '—'}</Text>
                        <Text style={styles.bodyText}>{t('Дата')}: {formattedDate}</Text>
                        <Text style={styles.bodyText}>{t('Врач')}: {data.doctor_name || '—'}</Text>
                        <Text style={styles.bodyText}>{t('Снимков')}: {data.images_count || 0}</Text>
                    </Accordion>

                    <Accordion title={t('Транскрипция')}>
                        <Text style={styles.bodyText}>{data.raw_transcription || t('Транскрипция пока отсутствует')}</Text>
                    </Accordion>

                    <Accordion title={t('Жалобы пациента')}>
                        {editing ? (
                            <TextInput style={styles.editInput} value={editForm.complaints || ''} onChangeText={(txt) => setEditForm({...editForm, complaints: txt})} multiline placeholder={t('Жалобы пациента')} />
                        ) : (
                            <Text style={styles.bodyText}>{report.complaints || '—'}</Text>
                        )}
                    </Accordion>

                    <Accordion title={t('Анамнез заболевания')}>
                        {editing ? (
                            <TextInput style={styles.editInput} value={editForm.anamnesis || ''} onChangeText={(txt) => setEditForm({...editForm, anamnesis: txt})} multiline placeholder={t('Анамнез заболевания')} />
                        ) : (
                            <Text style={styles.bodyText}>{report.anamnesis || '—'}</Text>
                        )}
                    </Accordion>

                    <Accordion title={t('Предварительный диагноз')}>
                        {editing ? (
                            <TextInput style={styles.editInput} value={editForm.diagnosis || ''} onChangeText={(txt) => setEditForm({...editForm, diagnosis: txt})} multiline placeholder={t('Предварительный диагноз')} />
                        ) : (
                            <Text style={styles.bodyText}>{report.diagnosis || '—'}</Text>
                        )}
                    </Accordion>

                    <Accordion title={t('Назначения и рекомендации')}>
                        {editing ? (
                            <TextInput style={styles.editInput} value={editForm.recommendations || ''} onChangeText={(txt) => setEditForm({...editForm, recommendations: txt})} multiline placeholder={t('Назначения и рекомендации')} />
                        ) : (
                            <Text style={styles.bodyText}>{report.recommendations || '—'}</Text>
                        )}
                    </Accordion>

                    <Accordion title={`${t('Снимки')} (${data.images_count || 0})`}>
                        {(!data.analysis_images || data.analysis_images.length === 0) ? (
                            <Text style={styles.bodyText}>{t('Нет снимков')}</Text>
                        ) : (
                            <View style={styles.imageGallery}>
                                {data.analysis_images.map((img) => {
                                    const imageUrl = img.image?.startsWith('http') 
                                        ? img.image 
                                        : `${BASE_URL}${img.image}`;
                                    return (
                                        <TouchableOpacity 
                                            key={img.id} 
                                            style={styles.imageThumb}
                                            onPress={() => openGallery(img)}
                                        >
                                            <Image 
                                                source={{ uri: imageUrl }} 
                                                style={styles.thumbImage}
                                                resizeMode="cover"
                                            />
                                            <Text style={styles.imageDescription} numberOfLines={1}>
                                                {img.description || t('Снимок')}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </Accordion>

                    {/* --- EDIT SAVE/CANCEL (only doctors) --- */}
                    {editing && isDoctor && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#32CD32' }]} onPress={handleSaveReport}>
                                <Text style={styles.actionButtonText}>{t('СОХРАНИТЬ')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#999' }]} onPress={() => setEditing(false)}>
                                <Text style={styles.actionButtonText}>{t('ОТМЕНА')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* --- BOTTOM ACTIONS --- */}
                    <View style={styles.actionRow}>
                        {/* Start processing - only doctors */}
                        {status === 'created' && isDoctor && (
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#32CD32' }]} onPress={handleStartProcessing}>
                                <Text style={styles.actionButtonText}>▶ {t('ЗАПУСТИТЬ')}</Text>
                            </TouchableOpacity>
                        )}
                        {status === 'ready' && (
                            <>
                                <TouchableOpacity style={styles.actionButton} onPress={handleDownloadPDF}>
                                    <Text style={styles.actionButtonText}>{t('СКАЧАТЬ PDF')}</Text>
                                </TouchableOpacity>
                                {/* Regenerate - only doctors */}
                                {isDoctor && (
                                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F39C12' }]} onPress={handleRegenerate}>
                                        <Text style={styles.actionButtonText}>{t('ПЕРЕГЕНЕРИРОВАТЬ')}</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                        {/* Retry on error - only doctors */}
                        {status === 'error' && isDoctor && (
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F39C12' }]} onPress={handleStartProcessing}>
                                <Text style={styles.actionButtonText}>{t('ПОВТОРИТЬ')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Image Gallery Modal */}
            <Modal
                visible={galleryVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setGalleryVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedImage?.description || t('Снимок')}</Text>
                            <TouchableOpacity onPress={() => setGalleryVisible(false)}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        {selectedImage && (
                            <Image 
                                source={{ 
                                    uri: selectedImage.image?.startsWith('http') 
                                        ? selectedImage.image 
                                        : `${BASE_URL}${selectedImage.image}` 
                                }}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                        )}
                        
                        <TouchableOpacity 
                            style={styles.downloadButton}
                            onPress={() => {
                                const imageUrl = selectedImage?.image?.startsWith('http') 
                                    ? selectedImage.image 
                                    : `${BASE_URL}${selectedImage?.image}`;
                                handleSaveImage(imageUrl);
                            }}
                        >
                            <Ionicons name="download-outline" size={22} color="#fff" />
                            <Text style={styles.downloadButtonText}>{t('Сохранить в галерею')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
        height: '100%',
    },
    safeArea: {
        flex: 1,
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
    // Image Gallery styles
    imageGallery: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    imageThumb: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    thumbImage: {
        width: '100%',
        height: '80%',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    imageDescription: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 4,
        paddingVertical: 2,
        backgroundColor: '#fff',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    fullImage: {
        width: '100%',
        height: 300,
        backgroundColor: '#f5f5f5',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PRIMARY_COLOR,
        margin: 16,
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    downloadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});