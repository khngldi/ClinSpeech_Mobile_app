import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocaleProvider } from './i18n/LocaleContext';

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

const Stack = createStackNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <LocaleProvider>
                <NavigationContainer>
                    <StatusBar style="light" />

                    <Stack.Navigator
                        initialRouteName="Welcome"
                        screenOptions={{ headerShown: false }}
                    >
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="Welcome" component={WelcomeScreen} />
                        <Stack.Screen name="PasswordForgot" component={PasswordForgotScreen} />
                        <Stack.Screen name="MainTabs" component={TabNavigator} />
                        <Stack.Screen name="RecordPage" component={RecordPage} options={{ animation: 'fade' }}/>
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
            </LocaleProvider>
        </SafeAreaProvider>
    );
}