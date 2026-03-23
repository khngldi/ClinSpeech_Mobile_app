import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const MINT = '#2ec4b6';
const MINT_LIGHT = '#5eead4';
const MINT_DARK = '#14b8a6';
const PURPLE = '#a78bfa';
const { width: SW } = Dimensions.get('window');

/* ── Animated floating blob (like .animated-bg .blob) ── */
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

// Компонент анимированной фигуры
const FloatingShape = ({ icon, index }) => {
    const moveAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startLoop = () => {
            moveAnim.setValue(0);
            Animated.sequence([
                Animated.delay(index * 1000),
                Animated.timing(moveAnim, {
                    toValue: 1,
                    duration: 4500,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start(() => startLoop());
        };
        startLoop();
    }, [index]);

    const angle = (index * 60) * (Math.PI / 180);
    const distance = 160;

    const translateX = moveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(angle) * distance]
    });

    const translateY = moveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(angle) * distance]
    });

    const opacity = moveAnim.interpolate({
        inputRange: [0, 0.2, 0.7, 1],
        outputRange: [0, 0.7, 0.7, 0]
    });

    const scale = moveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1.2]
    });

    return (
        <Animated.View style={[
            styles.shape,
            {
                opacity,
                transform: [{ translateX }, { translateY }, { scale }]
            }
        ]}>
            {icon}
        </Animated.View>
    );
};

export default function WelcomeScreen({ navigation }) {
    const shapes = [
        <FontAwesome5 name="heartbeat" size={22} color={MINT} />,
        <MaterialCommunityIcons name="pill" size={22} color={MINT_LIGHT} />,
        <FontAwesome5 name="stethoscope" size={22} color={MINT_DARK} />,
        <MaterialCommunityIcons name="dna" size={24} color={PURPLE} />,
        <FontAwesome5 name="briefcase-medical" size={22} color={MINT} />,
        <MaterialCommunityIcons name="microscope" size={22} color={MINT_LIGHT} />,
    ];

    return (
        <View style={styles.container}>
            {/* Animated gradient blobs */}
            <View style={styles.blobLayer} pointerEvents="none">
                <FloatingBlob color={MINT} size={300} startX={-80} startY={40} delay={0} />
                <FloatingBlob color={MINT_LIGHT} size={260} startX={SW - 120} startY={180} delay={2000} />
                <FloatingBlob color={PURPLE} size={220} startX={20} startY={450} delay={4500} />
                <FloatingBlob color={MINT_DARK} size={280} startX={SW - 200} startY={550} delay={7000} />
            </View>

            <View style={styles.content}>

                {/* ЗАГОЛОВОК */}
                <Text style={styles.title}>Добро пожаловать в{"\n"}<Text style={styles.titleAccent}>ClinSpeech</Text></Text>

                {/* ЦЕНТРАЛЬНЫЙ БЛОК */}
                <View style={styles.logoContainer}>
                    {shapes.map((shape, index) => (
                        <FloatingShape key={index} icon={shape} index={index} />
                    ))}

                    <View style={styles.imageWrapper}>
                        <Image
                            source={require('../assets/App_logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* ОПИСАНИЕ */}
                <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionText}>
                        Интеллектуальная система преобразования{"\n"}
                        медицинской речи в структурированные{"\n"}
                        протоколы и отчеты.
                    </Text>
                </View>

                {/* КНОПКИ */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.regButton}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.regButtonText}>РЕГИСТРАЦИЯ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginButton}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginButtonText}>ВХОД</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    blobLayer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 50,
        position: 'relative',
        zIndex: 1,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#1a1a2e',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    titleAccent: {
        color: MINT,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 250,
        height: 250,
    },
    imageWrapper: {
        width: 200,
        height: 200,
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    shape: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(46, 196, 182, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    descriptionContainer: {
        paddingHorizontal: 20,
    },
    descriptionText: {
        fontSize: 18,
        color: '#64748b',
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonContainer: {
        width: '85%',
        gap: 15,
    },
    regButton: {
        backgroundColor: MINT,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: MINT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    regButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
    loginButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    loginButtonText: {
        color: '#1a1a2e',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
});