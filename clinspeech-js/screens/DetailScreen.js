import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY_COLOR = '#00BFFF';
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
    const consultation = route?.params?.consultation || {};
    const patient = consultation.patient_info || {};
    const patientName = patient.last_name
        ? `${patient.last_name} ${patient.first_name || ''} ${patient.middle_name || ''}`
        : 'Пациент не указан';
    const statusLabel = { pending: 'Ожидание', processing: 'Обработка', done: 'Готово', error: 'Ошибка' };
    const statusColor = { pending: '#B0B0B0', processing: '#F1C40F', done: '#32CD32', error: '#E74C3C' };
    const status = consultation.status || 'done';
    const formattedDate = consultation.created_at
        ? new Date(consultation.created_at).toLocaleString('ru-RU')
        : '—';
    const report = consultation.final_report || consultation.generated_report || '';
    const waveHeights = [10, 20, 15, 30, 40, 25, 50, 70, 45, 80, 50, 90, 60, 40, 75, 50, 30, 45, 20, 15, 10];

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
                            <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="star-outline" size={24} color="#FFD700" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="trash-outline" size={24} color="#FF4D4D" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* --- STATUS & PLAYER --- */}
                    <View style={styles.playerSection}>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor[status] || '#32CD32' }]} />
                            <Text style={[styles.statusText, { color: statusColor[status] || '#32CD32' }]}>{statusLabel[status] || status}</Text>
                        </View>

                        <Text style={styles.timeText}>10:15:25</Text>

                        <View style={styles.waveContainer}>
                            {waveHeights.map((h, i) => (
                                <View key={i} style={[styles.waveBar, { height: h }]} />
                            ))}
                        </View>

                        <Text style={styles.fileName}>Консультация #{consultation.id || '—'} • {formattedDate}</Text>

                        <View style={styles.progressBarBackground}>
                            <View style={styles.progressBarFill} />
                            <View style={styles.progressThumb} />
                        </View>

                        <View style={styles.playerControls}>
                            <TouchableOpacity>
                                <Ionicons name="play-skip-back" size={24} color={PRIMARY_COLOR} />
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Ionicons name="play-circle" size={40} color={PRIMARY_COLOR} />
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Ionicons name="play-skip-forward" size={24} color={PRIMARY_COLOR} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* --- ACCORDIONS --- */}
                    <Accordion title="Общие данные" isOpenDefault={true}>
                        <Text style={styles.bodyText}>ФИО: {patientName}</Text>
                        <Text style={styles.bodyText}>ИИН: {patient.iin || '—'}</Text>
                        <Text style={styles.bodyText}>Дата: {formattedDate}</Text>
                        <Text style={styles.bodyText}>Врач: {consultation.doctor_name || '—'}</Text>
                    </Accordion>

                    <Accordion title="Транскрипция">
                        <Text style={styles.bodyText}>{consultation.raw_transcription || 'Нет данных'}</Text>
                    </Accordion>

                    <Accordion title="Диагноз (МКБ-10)">
                        <Text style={styles.bodyText}>Код: {consultation.diagnosis_code || '—'}</Text>
                    </Accordion>

                    <Accordion title="Отчёт">
                        <Text style={styles.bodyText}>{report || (status === 'processing' ? 'Отчёт генерируется...' : 'Нет данных')}</Text>
                    </Accordion>

                    {/* --- BOTTOM ACTIONS --- */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>ПОДРОБНЕЕ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>ЭКСПОРТ PDF</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.createNewButton}>
                        <Text style={styles.createNewText}>Создать новый на основе этого</Text>
                    </TouchableOpacity>

                    <View style={styles.fabContainer}>
                        <View style={styles.fabOuterRing}>
                            <View style={styles.fabInnerRing}>
                                <TouchableOpacity style={styles.fabButton} activeOpacity={0.8}>
                                    <MaterialCommunityIcons name="microphone" size={45} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
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
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
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
    createNewButton: {
        alignItems: 'center',
        marginBottom: 30,
    },
    createNewText: {
        color: PRIMARY_COLOR,
        fontSize: 18,
        fontWeight: '500',
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