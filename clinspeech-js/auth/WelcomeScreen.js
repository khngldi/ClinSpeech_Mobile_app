import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Animated,
    Easing,
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const BRAND_CYAN = '#00CCFF';

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
        <FontAwesome5 name="heartbeat" size={22} color="white" />,
        <MaterialCommunityIcons name="pill" size={22} color="white" />,
        <FontAwesome5 name="stethoscope" size={22} color="white" />,
        <MaterialCommunityIcons name="dna" size={24} color="white" />,
        <FontAwesome5 name="briefcase-medical" size={22} color="white" />,
        <MaterialCommunityIcons name="microscope" size={22} color="white" />,
    ];

    return (
        <LinearGradient colors={['#A2EEFF', '#02BDFE']} style={styles.container}>
            <View style={styles.content}>

                {/* ЗАГОЛОВОК */}
                <Text style={styles.title}>Добро пожаловать в{"\n"}ClinSpeech</Text>

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
                        <Text style={styles.buttonText}>РЕГИСТРАЦИЯ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginButton}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('Login')} // Ссылка на экран входа
                    >
                        <Text style={styles.buttonText}>ВХОД</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 50,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
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
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    descriptionContainer: {
        paddingHorizontal: 20,
    },
    descriptionText: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonContainer: {
        width: '85%',
        gap: 15,
    },
    regButton: {
        backgroundColor: BRAND_CYAN,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    loginButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
});