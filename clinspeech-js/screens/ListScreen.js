import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // Чтобы обновлять список при возврате
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export default function ListScreen() {
    const [recordings, setRecordings] = useState([]);
    const [sound, setSound] = useState();
    const [playingId, setPlayingId] = useState(null);

    // Функция загрузки списка
    const loadRecordings = async () => {
        try {
            const data = await AsyncStorage.getItem('my_recordings');
            if (data) {
                setRecordings(JSON.parse(data));
            }
        } catch (e) {
            console.log(e);
        }
    };

    // Обновляем список каждый раз, когда открываем этот экран
    useFocusEffect(
        useCallback(() => {
            loadRecordings();
            return () => {
                if (sound) sound.unloadAsync(); // Останавливаем звук при уходе
            };
        }, [])
    );

    // Проигрывание звука из списка
    async function playRecording(uri, id) {
        if (playingId === id && sound) {
            // Если нажали на тот же трек - пауза/стоп
            await sound.stopAsync();
            setPlayingId(null);
            return;
        }

        // Если играет другой трек - выгружаем
        if (sound) {
            await sound.unloadAsync();
        }

        const { sound: newSound } = await Audio.Sound.createAsync({ uri });
        setSound(newSound);
        setPlayingId(id);
        await newSound.playAsync();

        // Когда трек закончится
        newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
                setPlayingId(null);
            }
        });
    }

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
            </View>
            <TouchableOpacity onPress={() => playRecording(item.uri, item.id)}>
                <Ionicons
                    name={playingId === item.id ? "pause-circle" : "play-circle"}
                    size={48}
                    color="#0088A4"
                />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#AFF1FF', '#00C0E8']} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Мои Записи</Text>
            </View>

            <FlatList
                data={recordings}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Пока нет записей</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    listContent: { padding: 20 },
    card: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 18, color: '#005864', fontWeight: 'bold' },
    cardDate: { fontSize: 14, color: '#666', marginTop: 4 },
    emptyText: { textAlign: 'center', color: 'white', marginTop: 50, fontSize: 18 }
});