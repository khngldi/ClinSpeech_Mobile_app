import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, safeJson } from '../api';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';

const MINT = '#2ec4b6';

const TAB_HEIGHT = 65;

const statusMap = {
    pending:    { text: 'Ожидание',  color: '#B0B0B0' },
    processing: { text: 'Обработка', color: '#F1C40F' },
    done:       { text: 'Готово',    color: '#2ECC71' },
    error:      { text: 'Ошибка',    color: '#E74C3C' },
};

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ListScreen({ navigation }) {
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/consultations/')
            .then(safeJson)
            .then(data => setConsultations(Array.isArray(data) ? data : data.results || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const renderItem = ({ item }) => {
        const status = statusMap[item.status] || { text: item.status, color: '#B0B0B0' };
        const patient = item.patient_info;
        const patientName = patient
            ? `${patient.last_name || ''} ${(patient.first_name || '')[0] || ''}.`
            : 'Пациент не указан';

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Detail', { consultation: item })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.nameText}>{patientName}</Text>
                        <Text style={styles.infoText}>{item.diagnosis_code || '—'}</Text>
                        <Text style={styles.infoText}>{item.doctor_name || ''}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={26} color="#000" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <AnimatedGradientBackground />
            <Text style={styles.title}>Последние записи</Text>

            {loading ? (
                <ActivityIndicator size="large" color={MINT} style={{ marginTop: 40 }} />
            ) : (
                <View style={styles.scrollContainer}>
                    <FlatList
                        data={consultations}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator
                        ListEmptyComponent={<Text style={styles.emptyText}>Консультаций пока нет</Text>}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    title: {
        marginTop: 60,
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '500',
        color: '#000',
    },
    scrollContainer: {
        flex: 1,
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: TAB_HEIGHT + 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    dateText: {
        fontSize: 13,
        color: '#333',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    infoText: {
        fontSize: 14,
        color: '#333',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: '#fff',
        marginTop: 40,
        fontSize: 16,
    },
});
