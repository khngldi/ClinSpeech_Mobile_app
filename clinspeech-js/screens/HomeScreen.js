import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch, safeJson } from '../api';

import { homeStyles as styles } from '../styles/HomeStyles';

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
        <LinearGradient
            colors={['#f0fdfa', '#5eead4', '#2ec4b6']}
            style={styles.container}
        >
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
        </LinearGradient>
    );
}