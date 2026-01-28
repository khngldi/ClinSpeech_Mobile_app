import React, { useState } from 'react'; // Добавили useState
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { homeStyles as styles } from '../styles/HomeStyles';

export default function HomeScreen({ navigation }) {
    const [language, setLanguage] = useState('RUS');

    return (
        <LinearGradient
            colors={['#AFF1FF', '#00C0E8']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>

                <View style={styles.header}>
                    {/* Переход в настройки */}
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Image
                            source={require('../assets/settings.png')}
                            style={styles.settingsIcon}
                        />
                    </TouchableOpacity>

                    <View style={styles.langSwitch}>
                        <TouchableOpacity
                            style={[styles.langButton, language === 'RUS' && styles.activeLangButton]}
                            onPress={() => setLanguage('RUS')}
                        >
                            <Text style={[styles.langText, language === 'RUS' && styles.activeLangText]}>RUS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.langButton, language === 'KZ' && styles.activeLangButton]}
                            onPress={() => setLanguage('KZ')}
                        >
                            <Text style={[styles.langText, language === 'KZ' && styles.activeLangText]}>KZ</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>Добро пожаловать,{'\n'}Доктор [Имя]!</Text>
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
        </LinearGradient>
    );
}