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

const isWeb = Platform.OS === 'web';
const isLargeScreen = SCREEN_WIDTH > 600;

export default function LoginScreen({ navigation }) {
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
});