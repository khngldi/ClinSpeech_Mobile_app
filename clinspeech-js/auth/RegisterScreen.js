import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    Platform,
    ImageBackground,
    SafeAreaView
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BRAND_CYAN = '#00CCFF';

// Проверка на веб/большой экран
const isWeb = Platform.OS === 'web';
const isLargeScreen = SCREEN_WIDTH > 600;

export default function RegisterScreen({ navigation }) {
    return (
        <View style={styles.container}>
            {/* ВЕРХНЯЯ ЧАСТЬ */}
            <View style={styles.headerContainer}>
                <ImageBackground
                    source={require('../assets/Ellipse 4.png')}
                    style={styles.headerBackground}
                    resizeMode="stretch"
                >
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.logoWrapper}>
                            <Image
                                source={require('../assets/App_logo.png')}
                                style={styles.miniLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.headerTitle}>ClinSpeech</Text>
                        </View>
                    </SafeAreaView>
                </ImageBackground>
            </View>

            {/* ОСНОВНОЙ КОНТЕНТ С ГИБКИМ РАСПРЕДЕЛЕНИЕМ */}
            <View style={styles.content}>
                <View style={styles.topSection}>
                    <Text style={styles.selectionTitle}>Выберите роль</Text>
                </View>

                {/* ЦЕНТРАЛЬНОЕ ИЗОБРАЖЕНИЕ */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../assets/photo1.png')}
                        style={styles.mainIllustration}
                        resizeMode="contain"
                    />
                </View>

                {/* КНОПКИ ВЫБОРА */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.roleButton}
                        activeOpacity={0.8}
                        onPress={() => navigation?.navigate('PatientReg')}
                    >
                        <Text style={styles.buttonText}>ПАЦИЕНТ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.roleButton}
                        activeOpacity={0.8}
                        onPress={() => navigation?.navigate('DoctorReg')}
                    >
                        <Text style={styles.buttonText}>ВРАЧ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    headerContainer: {
        width: '100%',
        height: isWeb ? 180 : SCREEN_HEIGHT * 0.22,
        minHeight: 150,
    },
    headerBackground: {
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoWrapper: {
        alignItems: 'center',
        paddingTop: isWeb ? 0 : 20,
    },
    miniLogo: {
        width: isWeb ? 50 : 40,
        height: isWeb ? 50 : 40,
        marginBottom: 5,
    },
    headerTitle: {
        fontSize: isWeb ? 28 : 26,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between', // Распределяет элементы по всей высоте
        paddingVertical: isWeb ? 20 : 30, // Больше отступов на мобилках
    },
    topSection: {
        alignItems: 'center',
    },
    selectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    imageContainer: {
        flex: 1, // Позволяет картинке занимать свободное место, не толкая кнопки
        width: isLargeScreen ? 400 : SCREEN_WIDTH * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    mainIllustration: {
        width: '100%',
        height: '90%', // Оставляем запас
    },
    buttonContainer: {
        width: '85%',
        maxWidth: 400,
        gap: 15,
        marginBottom: isWeb ? 20 : 40, // На мобилках поднимаем кнопки повыше от края
    },
    roleButton: {
        backgroundColor: BRAND_CYAN,
        paddingVertical: 16,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 6,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
});