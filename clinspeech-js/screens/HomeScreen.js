import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { apiFetch, safeJson } from '../api';
import { useLocale } from '../i18n/LocaleContext';

import { homeStyles as styles } from '../styles/HomeStyles';

export default function HomeScreen({ navigation }) {
    const { t } = useLocale();
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
            <AnimatedGradientBackground />

            <SafeAreaView style={styles.safeArea}>

                <View style={styles.content}>
                    <Text style={styles.title}>{t('Добро пожаловать,')}{'\n'}{doctorName ? `${t('Врач')} ${doctorName}!` : t('Доктор!')}</Text>
                    <Text style={styles.subtitle}>
                        {t('Начните свой первый')}{'\n'}{t('прием, чтобы создать отчет')}
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

                    <Text style={styles.hintText}>{t('Нажмите, чтобы')}{'\n'}{t('начать новый прием!')}</Text>
                </View>

            </SafeAreaView>
        </View>
    );
}