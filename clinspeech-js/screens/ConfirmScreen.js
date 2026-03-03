import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, safeJson } from '../api';

export default function ConfirmScreen({ route, navigation }) {
    const { audioUri } = route.params;
    const [sound, setSound] = useState();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Подгружаем аудио при открытии
    useEffect(() => {
        loadSound();
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    async function loadSound() {
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        setSound(sound);
    }

    async function playSound() {
        if (!sound) return;
        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            await sound.playAsync();
        }
        setIsPlaying(!isPlaying);
    }

    const handleSave = async () => {
        try {
            setIsUploading(true);

            const formData = new FormData();
            formData.append('audio_file', {
                uri: audioUri,
                type: 'audio/m4a',
                name: `consultation_${Date.now()}.m4a`,
            });

            const response = await apiFetch('/consultations/', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await safeJson(response);
                throw new Error(err.detail || 'Ошибка при отправке');
            }

            navigation.navigate('MainTabs', {
                screen: 'Главная',
                params: { screen: 'HomeList' },
            });
        } catch (e) {
            Alert.alert('Ошибка', e.message || 'Не удалось отправить запись');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#AFF1FF', '#00C0E8']} style={StyleSheet.absoluteFill} />

            <Text style={styles.title}>Обработать?</Text>

            {/* Иконка файла / Проигрыватель */}
            <View style={styles.playerContainer}>
                <Ionicons name="musical-note" size={80} color="white" />
                <TouchableOpacity style={styles.playButton} onPress={playSound}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#00C0E8" />
                </TouchableOpacity>
            </View>

            <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.btnText}>Отмена</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isUploading}>
                    {isUploading
                        ? <ActivityIndicator color="#005864" />
                        : <Text style={styles.btnText}>Отправить</Text>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 32, color: 'white', fontWeight: 'bold', marginBottom: 50 },
    playerContainer: {
        width: 200, height: 200, backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 50
    },
    playButton: {
        marginTop: 20, backgroundColor: 'white', padding: 15, borderRadius: 50
    },
    buttonsRow: { flexDirection: 'row', gap: 20 },
    saveBtn: { backgroundColor: 'white', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
    cancelBtn: { backgroundColor: 'rgba(255,255,255,0.3)', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
    btnText: { color: '#005864', fontWeight: 'bold', fontSize: 16 }
});