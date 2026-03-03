import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    TextInput, ActivityIndicator, Alert, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { apiFetch, safeJson } from '../api';

const PRIMARY = '#00C0E8';

export default function RecordPage({ navigation }) {
    // Steps: 1=patient, 2=record, 3=confirm
    const [step, setStep] = useState(1);

    // Step 1: Patient selection
    const [patients, setPatients] = useState([]);
    const [patientsLoading, setPatientsLoading] = useState(true);
    const [patientSearch, setPatientSearch] = useState('');
    const [patientId, setPatientId] = useState(null);

    // Step 2: Recording
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioUri, setAudioUri] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [micError, setMicError] = useState('');
    const timerRef = useRef(null);

    // Waveform animation
    const WAVES = 6;
    const waveAnims = useRef(
        [...Array(WAVES)].map(() => new Animated.Value(0.3))
    ).current;

    // Step 3: Upload
    const [uploading, setUploading] = useState(false);
    const [autoProcess, setAutoProcess] = useState(true);
    const [error, setError] = useState('');

    // Load patients
    useEffect(() => {
        apiFetch('/patients/')
            .then(safeJson)
            .then(data => setPatients(Array.isArray(data) ? data : (data?.results || [])))
            .catch(() => {})
            .finally(() => setPatientsLoading(false));
    }, []);

    // Check mic permissions on mount
    useEffect(() => {
        checkPermissions();
        return () => {
            clearInterval(timerRef.current);
            stopWaveAnimation();
        };
    }, []);

    const checkPermissions = async () => {
        try {
            const { status } = await Audio.getPermissionsAsync();
            setPermissionGranted(status === 'granted');
        } catch {}
    };

    const requestPermissions = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status === 'granted') {
                setPermissionGranted(true);
                setMicError('');
                return true;
            } else {
                setMicError('Разрешение на микрофон не предоставлено. Проверьте настройки.');
                return false;
            }
        } catch (e) {
            setMicError('Не удалось запросить разрешение на микрофон');
            return false;
        }
    };

    // Wave animation
    const startWaveAnimation = () => {
        waveAnims.forEach((anim, i) => {
            const loop = () => {
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 0.3 + Math.random() * 0.7,
                        duration: 200 + Math.random() * 300,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(anim, {
                        toValue: 0.2 + Math.random() * 0.3,
                        duration: 200 + Math.random() * 300,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ]).start(loop);
            };
            setTimeout(loop, i * 80);
        });
    };

    const stopWaveAnimation = () => {
        waveAnims.forEach(anim => {
            anim.stopAnimation();
            anim.setValue(0.3);
        });
    };

    // Recording
    const startRecording = async () => {
        setMicError('');
        setError('');

        if (!permissionGranted) {
            const granted = await requestPermissions();
            if (!granted) return;
        }

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const rec = new Audio.Recording();
            await rec.prepareToRecordAsync({
                ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
                isMeteringEnabled: true,
            });
            await rec.startAsync();

            setRecording(rec);
            setIsRecording(true);
            setIsPaused(false);
            setDuration(0);
            setAudioUri(null);

            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);

            startWaveAnimation();
        } catch (e) {
            setMicError('Не удалось запустить запись. Проверьте доступность микрофона.');
            console.log('Recording error:', e);
        }
    };

    const pauseRecording = async () => {
        if (!recording) return;
        try {
            await recording.pauseAsync();
            setIsPaused(true);
            clearInterval(timerRef.current);
            stopWaveAnimation();
        } catch (e) {
            setMicError('Ошибка при паузе записи');
        }
    };

    const resumeRecording = async () => {
        if (!recording) return;
        try {
            await recording.startAsync();
            setIsPaused(false);
            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
            startWaveAnimation();
        } catch (e) {
            setMicError('Ошибка при возобновлении записи');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        try {
            clearInterval(timerRef.current);
            stopWaveAnimation();
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setAudioUri(uri);
            setIsRecording(false);
            setIsPaused(false);
            setRecording(null);
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        } catch (e) {
            setMicError('Ошибка при остановке записи');
        }
    };

    const resetRecording = () => {
        setAudioUri(null);
        setDuration(0);
        setIsRecording(false);
        setIsPaused(false);
        setRecording(null);
        setMicError('');
    };

    // Format timer
    const formatTime = (s) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    // Upload
    const handleSubmit = async () => {
        if (!audioUri || !patientId) return;
        setUploading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('audio_file', {
                uri: audioUri,
                type: 'audio/m4a',
                name: `consultation_${Date.now()}.m4a`,
            });
            formData.append('patient', String(patientId));

            const res = await apiFetch('/consultations/', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const d = await safeJson(res);
                throw new Error(typeof d === 'object' ? JSON.stringify(d) : 'Ошибка создания консультации');
            }

            const data = await safeJson(res);

            if (autoProcess && data.id) {
                try {
                    await apiFetch(`/consultations/${data.id}/start_processing/`, { method: 'POST' });
                } catch {}
            }

            Alert.alert('Успешно', 'Консультация создана', [
                { text: 'OK', onPress: () => {
                    navigation.navigate('MainTabs', { screen: 'Главная', params: { screen: 'HomeList' } });
                }}
            ]);
        } catch (err) {
            setError(err.message || 'Ошибка отправки');
        } finally { setUploading(false); }
    };

    // Filtered patients
    const filtered = patients.filter(p =>
        `${p.last_name} ${p.first_name} ${p.middle_name || ''}`.toLowerCase().includes(patientSearch.toLowerCase())
    );

    const selectedPatient = patients.find(p => p.id === patientId);

    return (
        <View style={st.container}>
            <LinearGradient colors={['#AFF1FF', '#00C0E8']} style={StyleSheet.absoluteFillObject} />
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={st.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={st.headerTitle}>Новая запись</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Steps indicator */}
                <View style={st.steps}>
                    {[1, 2, 3].map(s => (
                        <View key={s} style={st.stepRow}>
                            <View style={[st.stepCircle, step >= s && st.stepActive]}>
                                <Text style={[st.stepNum, step >= s && { color: '#fff' }]}>{s}</Text>
                            </View>
                            <Text style={[st.stepLabel, step >= s && { color: '#fff' }]}>
                                {{ 1: 'Пациент', 2: 'Запись', 3: 'Отправка' }[s]}
                            </Text>
                            {s < 3 && <View style={[st.stepLine, step > s && st.stepLineActive]} />}
                        </View>
                    ))}
                </View>

                {(error || micError) ? (
                    <View style={st.errorBanner}>
                        <Ionicons name="warning" size={16} color="#E74C3C" />
                        <Text style={st.errorText}>{error || micError}</Text>
                    </View>
                ) : null}

                {/* Step 1: Patient */}
                {step === 1 && (
                    <View style={st.stepContent}>
                        <View style={st.card}>
                            <Text style={st.cardTitle}>Выберите пациента</Text>
                            <View style={st.searchBar}>
                                <Ionicons name="search" size={16} color="#999" />
                                <TextInput
                                    style={st.searchInput}
                                    placeholder="Поиск по ФИО..."
                                    placeholderTextColor="#999"
                                    value={patientSearch}
                                    onChangeText={setPatientSearch}
                                />
                            </View>

                            {patientsLoading ? (
                                <ActivityIndicator color={PRIMARY} style={{ marginTop: 20 }} />
                            ) : (
                                <FlatList
                                    data={filtered}
                                    keyExtractor={item => String(item.id)}
                                    style={{ maxHeight: 300 }}
                                    showsVerticalScrollIndicator={false}
                                    ListEmptyComponent={
                                        <Text style={st.emptyText}>Пациенты не найдены</Text>
                                    }
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[st.patientItem, patientId === item.id && st.patientSelected]}
                                            onPress={() => setPatientId(item.id)}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={st.patientName}>
                                                    {item.last_name} {item.first_name} {item.middle_name || ''}
                                                </Text>
                                                <Text style={st.patientMeta}>
                                                    Дата рождения: {item.birth_date || '—'}
                                                </Text>
                                            </View>
                                            {patientId === item.id && (
                                                <Ionicons name="checkmark-circle" size={22} color={PRIMARY} />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </View>
                        <TouchableOpacity
                            style={[st.nextBtn, !patientId && { opacity: 0.5 }]}
                            disabled={!patientId}
                            onPress={() => setStep(2)}
                        >
                            <Text style={st.nextBtnText}>Далее →</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Step 2: Recording */}
                {step === 2 && (
                    <View style={st.stepContent}>
                        <View style={[st.card, { alignItems: 'center', paddingVertical: 32 }]}>
                            <Text style={st.cardTitle}>Запись приёма</Text>

                            {/* Waveform */}
                            <View style={st.waveContainer}>
                                {waveAnims.map((anim, i) => (
                                    <Animated.View
                                        key={i}
                                        style={[st.waveBar, {
                                            height: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [10, 80],
                                            }),
                                            backgroundColor: isRecording && !isPaused ? PRIMARY : '#ccc',
                                        }]}
                                    />
                                ))}
                            </View>

                            {/* Timer */}
                            <Text style={[st.timer, isRecording && !isPaused && { color: '#E74C3C' }]}>
                                {formatTime(duration)}
                            </Text>

                            {/* Controls */}
                            {!audioUri ? (
                                <View style={st.controls}>
                                    {!isRecording ? (
                                        <TouchableOpacity style={st.recBtn} onPress={startRecording}>
                                            <Ionicons name="mic" size={36} color="#fff" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={st.controlsRow}>
                                            {/* Pause/Resume */}
                                            <TouchableOpacity
                                                style={st.controlBtn}
                                                onPress={isPaused ? resumeRecording : pauseRecording}
                                            >
                                                <Ionicons
                                                    name={isPaused ? 'play' : 'pause'}
                                                    size={28}
                                                    color={PRIMARY}
                                                />
                                                <Text style={st.controlLabel}>
                                                    {isPaused ? 'Продолжить' : 'Пауза'}
                                                </Text>
                                            </TouchableOpacity>
                                            {/* Stop */}
                                            <TouchableOpacity style={st.stopBtn} onPress={stopRecording}>
                                                <Ionicons name="stop" size={28} color="#fff" />
                                                <Text style={st.stopLabel}>Стоп</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center', width: '100%' }}>
                                    <View style={st.recordedBadge}>
                                        <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                                        <Text style={st.recordedText}>Запись готова · {formatTime(duration)}</Text>
                                    </View>
                                    <View style={st.controlsRow}>
                                        <TouchableOpacity style={st.controlBtn} onPress={resetRecording}>
                                            <Ionicons name="refresh" size={24} color={PRIMARY} />
                                            <Text style={st.controlLabel}>Перезаписать</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={st.stopBtn} onPress={() => setStep(3)}>
                                            <Text style={st.stopLabel}>Далее →</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity style={st.backBtn} onPress={() => setStep(1)}>
                            <Text style={st.backBtnText}>← Назад</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Step 3: Confirm & Submit */}
                {step === 3 && (
                    <View style={st.stepContent}>
                        <View style={[st.card, { paddingVertical: 24 }]}>
                            <Text style={st.cardTitle}>Подтверждение</Text>

                            <View style={st.confirmItem}>
                                <Text style={st.confirmLabel}>Пациент</Text>
                                <Text style={st.confirmValue}>
                                    {selectedPatient ? `${selectedPatient.last_name} ${selectedPatient.first_name}` : '—'}
                                </Text>
                            </View>

                            <View style={st.confirmItem}>
                                <Text style={st.confirmLabel}>Длительность записи</Text>
                                <Text style={st.confirmValue}>{formatTime(duration)}</Text>
                            </View>

                            <TouchableOpacity
                                style={st.checkboxRow}
                                onPress={() => setAutoProcess(!autoProcess)}
                            >
                                <Ionicons
                                    name={autoProcess ? 'checkbox' : 'square-outline'}
                                    size={22}
                                    color={PRIMARY}
                                />
                                <Text style={st.checkboxText}>Автоматически запустить ИИ-обработку</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[st.submitBtn, uploading && { opacity: 0.6 }]}
                                onPress={handleSubmit}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={st.submitText}>🚀 Создать консультацию</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={st.backBtn} onPress={() => setStep(2)}>
                            <Text style={st.backBtnText}>← Назад</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, marginBottom: 20 },
    stepRow: { flexDirection: 'row', alignItems: 'center' },
    stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    stepActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
    stepNum: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
    stepLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginLeft: 4, fontWeight: '500' },
    stepLine: { width: 20, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
    stepLineActive: { backgroundColor: 'rgba(255,255,255,0.8)' },
    stepContent: { flex: 1, paddingHorizontal: 16 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', marginHorizontal: 16, padding: 12, borderRadius: 10, marginBottom: 10, gap: 8 },
    errorText: { color: '#E74C3C', fontSize: 13, flex: 1 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#333' },
    emptyText: { textAlign: 'center', color: '#bbb', paddingVertical: 24, fontSize: 14 },
    patientItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 6 },
    patientSelected: { borderColor: PRIMARY, backgroundColor: PRIMARY + '08' },
    patientName: { fontSize: 14, fontWeight: '600', color: '#333' },
    patientMeta: { fontSize: 12, color: '#888', marginTop: 2 },
    nextBtn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
    nextBtnText: { color: PRIMARY, fontSize: 16, fontWeight: '700' },
    backBtn: { alignItems: 'center', paddingVertical: 14 },
    backBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
    // Recording
    waveContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 90, gap: 8, marginVertical: 20 },
    waveBar: { width: 8, borderRadius: 4 },
    timer: { fontSize: 48, fontWeight: '200', fontFamily: 'monospace', color: '#333', marginBottom: 24 },
    controls: { alignItems: 'center' },
    recBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E74C3C', justifyContent: 'center', alignItems: 'center', shadowColor: '#E74C3C', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
    controlsRow: { flexDirection: 'row', gap: 20, alignItems: 'center' },
    controlBtn: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
    controlLabel: { fontSize: 12, color: PRIMARY, marginTop: 4, fontWeight: '500' },
    stopBtn: { backgroundColor: '#E74C3C', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center' },
    stopLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
    recordedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginBottom: 20 },
    recordedText: { color: '#22C55E', fontWeight: '600', fontSize: 14 },
    // Confirm
    confirmItem: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 14, marginBottom: 10 },
    confirmLabel: { fontSize: 12, color: '#888' },
    confirmValue: { fontSize: 15, fontWeight: '600', color: '#333', marginTop: 2 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16 },
    checkboxText: { fontSize: 14, color: '#555' },
    submitBtn: { backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
