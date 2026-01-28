import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TabNavigator from './navigation/TabNavigator';
import SettingsScreen from './screens/Settings';
import RecordPage from './screens/RecordPage';
import ConfirmScreen from "./screens/ConfirmScreen";

const Stack = createStackNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <StatusBar style="light" />

                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="MainTabs" component={TabNavigator} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="RecordPage" component={RecordPage} options={{ animation: 'fade' }}/>
                    <Stack.Screen name="ConfirmScreen" component={ConfirmScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}