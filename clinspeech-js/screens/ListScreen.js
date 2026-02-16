import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Platform,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const TAB_HEIGHT = 65;
const { height: WINDOW_HEIGHT } = Dimensions.get('window');

const DATA = [
    {
        id: '1',
        status: 'ready',
        statusText: 'Готово',
        date: '28.12.2025, 15:31',
        name: 'Аббасов Р. Ш.',
        diagnosis: 'Острый цистит',
        doctor: 'Семейный врач (ВОП)',
    },
    {
        id: '2',
        status: 'sending',
        statusText: 'Отправка',
        date: '28.12.2025, 15:31',
        name: 'Аббасов Р. Ш.',
        diagnosis: 'Острый цистит',
        doctor: 'Семейный врач (ВОП)',
    },
    {
        id: '3',
        status: 'error',
        statusText: 'Ошибка сети',
        date: '27.12.2025, 18:02',
        name: 'Ибраев А. К.',
        diagnosis: 'ОРВИ',
        doctor: 'Терапевт',
    },
];

const statusColors = {
    ready: '#2ECC71',
    sending: '#F1C40F',
    error: '#E74C3C',
    draft: '#B0B0B0',
};

export default function ListScreen({ navigation }) {

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => {
                if (item.id === '1') {
                    navigation.navigate('Detail');
                }
            }}
        >
            <View style={styles.cardHeader}>
                <View style={styles.statusRow}>
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: statusColors[item.status] }
                        ]}
                    />
                    <Text
                        style={[
                            styles.statusText,
                            { color: statusColors[item.status] }
                        ]}
                    >
                        {item.statusText}
                    </Text>
                </View>
                <Text style={styles.dateText}>{item.date}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.nameText}>{item.name}</Text>
                    <Text style={styles.infoText}>{item.diagnosis}</Text>
                    <Text style={styles.infoText}>{item.doctor}</Text>
                </View>

                <Ionicons name="chevron-forward" size={26} color="#000" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#B8F4FF', '#00B4DB']}
                style={StyleSheet.absoluteFill}
            />

            <Text style={styles.title}>Последние записи</Text>

            <View style={styles.scrollContainer}>
                <FlatList
                    data={DATA}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        height:
            Platform.OS === 'web'
                ? WINDOW_HEIGHT - TAB_HEIGHT - 120
                : '100%',
        overflowY: Platform.OS === 'web' ? 'auto' : 'visible',
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
});
