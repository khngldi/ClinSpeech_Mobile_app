import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';

const MINT = '#2ec4b6';

export default function WelcomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <AnimatedGradientBackground />

            <View style={styles.content}>
                <Text style={styles.title}>
                    Добро пожаловать в{'\n'}
                    <Text style={styles.titleAccent}>ClinSpeech</Text>
                </Text>

                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/App_logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionText}>
                        Интеллектуальная система преобразования{'\n'}
                        медицинской речи в структурированные{'\n'}
                        протоколы и отчеты.
                    </Text>
                </View>

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
        width: 220,
        height: 220,
    },
    logo: {
        width: '100%',
        height: '100%',
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
