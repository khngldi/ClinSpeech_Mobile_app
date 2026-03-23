import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch, safeJson } from '../api';

import { homeStyles as styles } from '../styles/HomeStyles';

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

export default function HomeScreen({ navigation }) {
    const [doctorName, setDoctorName] = useState('');

    useEffect(() => {
        apiFetch('/me/')
            .then(safeJson)
            .then(data => {
                const name = data.first_name
                    ? `${data.last_name} ${data.first_name}`
                    : data.username || '';
                setDoctorName(name);
            })
            .catch(() => {});
    }, []);

    return (
        <View style={styles.container}>
            {/* Animated gradient blobs */}
            <View style={blobStyles.layer} pointerEvents="none">
                <FloatingBlob color={MINT} size={300} startX={-70} startY={30} delay={0} />
                <FloatingBlob color={MINT_LIGHT} size={240} startX={SW - 130} startY={160} delay={2000} />
                <FloatingBlob color={PURPLE} size={200} startX={10} startY={380} delay={4500} />
                <FloatingBlob color={MINT_DARK} size={260} startX={SW - 180} startY={480} delay={7000} />
            </View>

            <SafeAreaView style={styles.safeArea}>

                <View style={styles.content}>
                    <Text style={styles.title}>Добро пожаловать,{'\n'}{doctorName ? `Др. ${doctorName}!` : 'Доктор!'}</Text>
                    <Text style={styles.subtitle}>
                        Начните свой первый{'\n'}прием, чтобы создать отчет
                    </Text>

                    <View style={styles.micContainer}>
                        <TouchableOpacity
                            style={styles.micButton}
                            onPress={() => navigation.navigate('RecordPage')}
                        >
                            <Image
                                source={require('../assets/Main_Button.png')}
                                style={styles.micImage}
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.hintText}>Нажмите, чтобы{'\n'}начать новый прием!</Text>
                </View>

            </SafeAreaView>
        </View>
    );
}

const blobStyles = StyleSheet.create({
    layer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
});