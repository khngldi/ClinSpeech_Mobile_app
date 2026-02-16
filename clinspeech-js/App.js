import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import WelcomeScreen from './auth/WelcomeScreen';
import TabNavigator from './navigation/TabNavigator';
import SettingsScreen from './screens/Settings';
import RecordPage from './screens/RecordPage';
import ConfirmScreen from "./screens/ConfirmScreen";
import DetailScreen from './screens/DetailScreen';
import RegisterScreen from './auth/RegisterScreen';
import LoginScreen from "./auth/LoginScreen";

const Stack = createStackNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <StatusBar style="light" />

                <Stack.Navigator
                    initialRouteName="Welcome"
                    screenOptions={{ headerShown: false }}
                >
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />

                    <Stack.Screen name="MainTabs" component={TabNavigator} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="RecordPage" component={RecordPage} options={{ animation: 'fade' }}/>
                    <Stack.Screen name="ConfirmScreen" component={ConfirmScreen} />
                    <Stack.Screen name="Detail" component={DetailScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}