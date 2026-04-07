import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { apiFetch, safeJson } from '../api';

const MINT = '#2ec4b6';

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
            <AnimatedGradientBackground />

            <Text style={styles.title}>Обработать?</Text>

            {/* Иконка файла / Проигрыватель */}
            <View style={styles.playerContainer}>
                <Ionicons name="musical-note" size={80} color={MINT} />
                <TouchableOpacity style={styles.playButton} onPress={playSound}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={40} color={MINT} />
                </TouchableOpacity>
            </View>

            <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelBtnText}>Отмена</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isUploading}>
                    {isUploading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.btnText}>Отправить</Text>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 32, color: '#1a1a2e', fontWeight: 'bold', marginBottom: 50, position: 'relative', zIndex: 1 },
    playerContainer: {
        width: 200, height: 200, backgroundColor: 'rgba(46,196,182,0.1)',
        borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 50,
        borderWidth: 1, borderColor: 'rgba(46,196,182,0.2)', position: 'relative', zIndex: 1,
    },
    playButton: {
        marginTop: 20, backgroundColor: 'white', padding: 15, borderRadius: 50,
        shadowColor: MINT, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
    },
    buttonsRow: { flexDirection: 'row', gap: 20, position: 'relative', zIndex: 1 },
    saveBtn: { backgroundColor: MINT, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
    cancelBtn: { backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, borderWidth: 1, borderColor: '#e2e8f0' },
    cancelBtnText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});