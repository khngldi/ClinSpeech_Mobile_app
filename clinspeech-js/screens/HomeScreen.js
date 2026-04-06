import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch, safeJson } from '../api';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';

import { homeStyles as styles } from '../styles/HomeStyles';

export default function HomeScreen({ navigation }) {
    const [doctorName, setDoctorName] = useState('');
    const [userRole, setUserRole] = useState('doctor');
    const isPatient = userRole === 'patient';

    useEffect(() => {
        apiFetch('/me/')
            .then(safeJson)
            .then(data => {
                const name = data.first_name
                    ? `${data.last_name} ${data.first_name}`
                    : data.username || '';
                setDoctorName(name);
                setUserRole(data?.role || 'doctor');
            })
            .catch(() => {});
    }, []);

    const titleText = useMemo(() => {
        if (isPatient) return `Добро пожаловать,\n${doctorName || 'Пациент'}!`;
        return `Добро пожаловать,\n${doctorName ? `Др. ${doctorName}!` : 'Доктор!'}`;
    }, [doctorName, isPatient]);

    const subtitleText = isPatient
        ? 'Откройте дэшборд, чтобы\nпосмотреть консультации'
        : 'Начните свой первый\nприем, чтобы создать отчет';

    const hintText = isPatient
        ? 'Нажмите, чтобы открыть\nдашборд пациента'
        : 'Нажмите, чтобы\nначать новый прием!';

    const targetScreen = isPatient ? 'HomeDashboard' : 'RecordPage';

    return (
        <View style={styles.container}>
            <AnimatedGradientBackground />

            <SafeAreaView style={styles.safeArea}>

                <View style={styles.content}>
                    <Text style={styles.title}>{titleText}</Text>
                    <Text style={styles.subtitle}>{subtitleText}</Text>

                    <View style={styles.micContainer}>
                        <TouchableOpacity
                            style={styles.micButton}
                            onPress={() => navigation.navigate(targetScreen)}
                        >
                            <Image
                                source={require('../assets/Main_Button.png')}
                                style={styles.micImage}
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.hintText}>{hintText}</Text>
                </View>

            </SafeAreaView>
        </View>
    );
}
