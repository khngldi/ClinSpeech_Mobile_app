import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocaleProvider } from './i18n/LocaleContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import WelcomeScreen from './auth/WelcomeScreen';
import TabNavigator from './navigation/TabNavigator';
import RecordPage from './screens/RecordPage';
import ConfirmScreen from "./screens/ConfirmScreen";
import DetailScreen from './screens/DetailScreen';
import RegisterScreen from './auth/RegisterScreen';
import LoginScreen from "./auth/LoginScreen";
import PasswordForgotScreen from "./auth/PasswordForgotScreen";
import ChatBotScreen from './screens/ChatBotScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import AppointmentsScreen from './screens/AppointmentsScreen';
import TemplatesScreen from './screens/TemplatesScreen';
import UsersScreen from './screens/admin/UsersScreen';
import AuditLogScreen from './screens/admin/AuditLogScreen';
import IntroSplash from './components/IntroSplash';

const Stack = createStackNavigator();
const INTRO_MIN_DURATION_MS = 18000;

function RootNavigator() {
    const [booting, setBooting] = useState(true);
    const [initialRoute, setInitialRoute] = useState('Welcome');

    useEffect(() => {
        let mounted = true;
        const startedAt = Date.now();

        const boot = async () => {
            try {
                const token = await AsyncStorage.getItem('access_token');
                if (mounted && token) {
                    setInitialRoute('MainTabs');
                }
            } catch (error) {
                console.error('Auth bootstrap failed:', error);
            } finally {
                const elapsed = Date.now() - startedAt;
                const delay = Math.max(0, INTRO_MIN_DURATION_MS - elapsed);
                setTimeout(() => {
                    if (mounted) setBooting(false);
                }, delay);
            }
        };

        boot();
        return () => {
            mounted = false;
        };
    }, []);

    if (booting) {
        return <IntroSplash durationMs={INTRO_MIN_DURATION_MS} />;
    }

    return (
        <NavigationContainer>
            <StatusBar style="light" />

            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                    headerShown: false,
                    animationEnabled: true,
                    gestureEnabled: true,
                    cardStyleInterpolator: ({ current, layouts }) => ({
                        cardStyle: {
                            opacity: current.progress,
                            transform: [
                                {
                                    translateX: current.progress.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [layouts.screen.width * 0.08, 0],
                                    }),
                                },
                            ],
                        },
                    }),
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="PasswordForgot" component={PasswordForgotScreen} />
                <Stack.Screen name="MainTabs" component={TabNavigator} options={{ gestureEnabled: false }} />
                <Stack.Screen name="RecordPage" component={RecordPage} />
                <Stack.Screen name="ConfirmScreen" component={ConfirmScreen} />
                <Stack.Screen name="Detail" component={DetailScreen} />
                <Stack.Screen name="ChatBot" component={ChatBotScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="Appointments" component={AppointmentsScreen} />
                <Stack.Screen name="Templates" component={TemplatesScreen} />
                <Stack.Screen name="Users" component={UsersScreen} />
                <Stack.Screen name="AuditLog" component={AuditLogScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <LocaleProvider>
                <RootNavigator />
            </LocaleProvider>
        </SafeAreaProvider>
    );
}
