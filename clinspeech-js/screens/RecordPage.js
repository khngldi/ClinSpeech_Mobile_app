import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Easing,
    Platform,
    Image,
    LogBox,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { recordStyles as styles } from '../styles/RecordStyles';

LogBox.ignoreAllLogs(true);

export default function RecordPage({ navigation }) {
    const WAVES = 8;
    const MAX_OFFSET = 40;

    const micLevel = useRef(0);
    const micAnimated = useRef(new Animated.Value(0)).current;

    const waves = useRef(
        [...Array(WAVES)].map(() => ({
            x: new Animated.Value(0),
            y: new Animated.Value(0),
            scale: new Animated.Value(0.4),
            opacity: new Animated.Value(0.6),
        }))
    ).current;

    const recordingRef = useRef(null);

    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const rafRef = useRef(null);

    const SENSITIVITY = Platform.OS === 'web' ? 40 : 1;

    useEffect(() => {
        startWaves();

        if (Platform.OS === 'web') {
            startWebMic();
        } else {
            startMobileMic();
        }

        return () => {
            stopWaves();
            stopMobileMic();
            stopWebMic();
        };
    }, []);

    const startWaves = () => {
        waves.forEach(w => {
            const loop = () => {
                const level = Math.max(0.2, micLevel.current);
                const offsetX = (Math.random() * 2 - 1) * MAX_OFFSET * level;
                const offsetY = (Math.random() * 2 - 1) * MAX_OFFSET * level;

                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(w.x, {
                            toValue: offsetX,
                            duration: 150,
                            easing: Easing.out(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(w.x, {
                            toValue: 0,
                            duration: 150,
                            easing: Easing.in(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(w.y, {
                            toValue: offsetY,
                            duration: 300,
                            easing: Easing.out(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(w.y, {
                            toValue: 0,
                            duration: 300,
                            easing: Easing.in(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.timing(w.scale, {
                        toValue: 0.6 + level * 1.2,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(w.opacity, {
                        toValue: 0.3 + level * 0.7,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(loop);
            };
            loop();
        });
    };

    const stopWaves = () => {
        waves.forEach(w => {
            w.x.stopAnimation();
            w.y.stopAnimation();
            w.scale.stopAnimation();
            w.opacity.stopAnimation();
        });
    };

    const startMobileMic = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) return;

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync({
                ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
                isMeteringEnabled: true,
            });

            recording.setOnRecordingStatusUpdate(status => {
                if (status.metering != null) {
                    let level = Math.max(0, (status.metering + 160) / 160);
                    level = Math.min(1, level * 1.1);
                    micLevel.current = level;
                    micAnimated.setValue(level);
                }
            });

            await recording.startAsync();
            recordingRef.current = recording;
        } catch (e) {
            console.log('Mobile mic error', e);
        }
    };

    const stopMobileMic = async () => {
        if (recordingRef.current) {
            await recordingRef.current.stopAndUnloadAsync();
            recordingRef.current = null;
        }
    };

    const startWebMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            const data = new Uint8Array(analyser.frequencyBinCount);
            const src = ctx.createMediaStreamSource(stream);
            src.connect(analyser);

            audioCtxRef.current = ctx;
            analyserRef.current = analyser;

            const tick = () => {
                analyser.getByteTimeDomainData(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) {
                    const v = (data[i] - 128) / 128;
                    sum += v * v;
                }
                const rms = Math.sqrt(sum / data.length);
                micLevel.current = Math.min(1, rms * SENSITIVITY);
                micAnimated.setValue(micLevel.current);
                rafRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch (e) {
            console.log('Web mic error', e);
        }
    };

    const stopWebMic = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close();
    };

    return (
        <View style={styles.master}>
            <LinearGradient
                colors={['#AFF1FF', '#00C0E8']}
                style={StyleSheet.absoluteFillObject}
            />

            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={32} color="white" />
            </TouchableOpacity>

            <Text style={styles.title}>Слушаю</Text>

            <View style={styles.center}>
                {waves.map((w, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.wave,
                            {
                                opacity: w.opacity,
                                transform: [
                                    { translateX: w.x },
                                    { translateY: w.y },
                                    { scale: w.scale },
                                ],
                            },
                        ]}
                    />
                ))}

                <Image
                    source={require('../assets/Main_Button.png')}
                    style={styles.button}
                />
            </View>
        </View>
    );
}
