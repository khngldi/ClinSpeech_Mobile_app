import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Animated, Easing, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, safeJson } from '../api';

const MINT = '#2ec4b6';
const MINT_LIGHT = '#5eead4';
const MINT_DARK = '#14b8a6';
const PURPLE = '#a78bfa';
const { width: SW } = Dimensions.get('window');

/* ── Animated floating blob ── */
function FloatingBlob({ color, size, startX, startY, delay }) {
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: 80, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: -60, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1.2, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: -50, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: 90, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 0.85, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: 60, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: 40, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1.1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ]),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={{
            position: 'absolute', left: startX, top: startY,
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color, opacity: 0.25,
            transform: [{ translateX }, { translateY }, { scale }],
        }} />
    );
}

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
            {/* Animated gradient blobs */}
            <View style={styles.blobLayer} pointerEvents="none">
                <FloatingBlob color={MINT} size={280} startX={-60} startY={40} delay={0} />
                <FloatingBlob color={MINT_LIGHT} size={220} startX={SW - 130} startY={180} delay={2000} />
                <FloatingBlob color={PURPLE} size={200} startX={20} startY={400} delay={4500} />
                <FloatingBlob color={MINT_DARK} size={240} startX={SW - 180} startY={480} delay={7000} />
            </View>

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
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    blobLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
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