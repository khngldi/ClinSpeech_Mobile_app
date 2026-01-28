import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { settingsStyles as styles } from '../styles/SettingsStyles';

export default function SettingsScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>

                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={30} color="#000" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Настройки</Text>

                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>
                    <Text style={styles.placeholderText}>Раздел настроек в разработке...</Text>
                </View>

            </SafeAreaView>
        </View>
    );
}