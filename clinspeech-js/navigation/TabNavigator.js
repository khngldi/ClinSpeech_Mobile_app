import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch, safeJson } from '../api';

import HomeScreen from '../screens/HomeScreen';
import ListScreen from '../screens/ListScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PatientsScreen from '../screens/PatientsScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/Settings';
import ChatBotScreen from '../screens/ChatBotScreen';
import RecordPage from '../screens/RecordPage';
import { tabStyles } from '../styles/TabStyles';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

function HomeStackNavigator() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <HomeStack.Screen name="HomeRecord" component={HomeScreen} />
            <HomeStack.Screen name="RecordPage" component={RecordPage} />
            <HomeStack.Screen name="HomeList" component={ListScreen} />
            <HomeStack.Screen name="HomeDashboard" component={DashboardScreen} />
            <HomeStack.Screen name="HomeChatBot" component={ChatBotScreen} />
        </HomeStack.Navigator>
    );
}

function CustomTabBar({ state, navigation, role }) {
    const isPatient = role === 'patient';
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    const currentRoute = state.routes[state.index];
    const isMainTabFocused = currentRoute.name === 'Главная';
    const focusedRouteName = getFocusedRouteNameFromRoute(currentRoute) ?? 'HomeRecord';

    const subMenuOptions = useMemo(() => {
        if (isPatient) {
            return [
                { key: 'дашборд', label: 'Дэшборд', icon: require('../assets/favorites.png'), target: 'HomeDashboard' },
                { key: 'список', label: 'Список', icon: require('../assets/list.png'), target: 'HomeList' },
                { key: 'чат', label: 'Чат-бот', icon: require('../assets/template.png'), target: 'HomeChatBot' },
            ];
        }

        return [
            { key: 'запись', label: 'Записать', icon: require('../assets/record.png'), target: 'RecordPage' },
            { key: 'список', label: 'Список', icon: require('../assets/list.png'), target: 'HomeList' },
            { key: 'дашборд', label: 'Дэшборд', icon: require('../assets/favorites.png'), target: 'HomeDashboard' },
        ];
    }, [isPatient]);

    const activeSubOption = useMemo(() => {
        const active = subMenuOptions.find((opt) => opt.target === focusedRouteName);
        return active?.label || '';
    }, [focusedRouteName, subMenuOptions]);

    const toggleMenu = (shouldOpen) => {
        if (shouldOpen) {
            setIsMenuOpen(true);
            Animated.timing(animation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(animation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setIsMenuOpen(false);
            });
        }
    };

    const handleSubMenuPress = (option) => {
        toggleMenu(false);
        if (!option?.target) {
            Alert.alert(`Раздел ${option?.label || ''}`, 'Этот экран в разработке');
            return;
        }
        navigation.navigate('Главная', { screen: option.target });
    };

    const menuStyle = {
        opacity: animation,
        transform: [
            {
                translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                }),
            },
        ],
    };

    return (
        <View style={tabStyles.tabBarWrapper}>
            {isMenuOpen && (
                <Animated.View style={[tabStyles.overlay, { opacity: animation }]}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => toggleMenu(false)} />
                </Animated.View>
            )}

            {isMenuOpen && (
                <Animated.View style={[tabStyles.subMenuContainer, menuStyle]}>
                    <LinearGradient
                        colors={['#5eead4', '#2ec4b6']}
                        style={tabStyles.gradientBackground}
                    >
                        {subMenuOptions.map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    tabStyles.subMenuItem,
                                    activeSubOption === option.label && tabStyles.activeBackground,
                                ]}
                                onPress={() => handleSubMenuPress(option)}
                            >
                                <Image source={option.icon} style={tabStyles.subMenuIcon} />
                                <Text style={tabStyles.subMenuText}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </LinearGradient>
                </Animated.View>
            )}

            <View style={tabStyles.mainTabBarContainer}>
                <LinearGradient
                    colors={['#5eead4', '#2ec4b6']}
                    style={StyleSheet.absoluteFill}
                />

                <View style={tabStyles.tabsRow}>
                    {state.routes.map((route, index) => {
                        const isFocused = state.index === index;
                        const isMainButton = route.name === 'Главная';
                        const showActiveBg = (isMainButton && isMenuOpen) || (isFocused && !isMenuOpen);

                        let imageSource = require('../assets/home.png');
                        if (route.name === 'Пациенты') imageSource = require('../assets/template.png');
                        else if (route.name === 'Консультации' || route.name === 'Архив') imageSource = require('../assets/archive.png');
                        else if (route.name === 'Чат-бот') imageSource = require('../assets/template.png');
                        else if (route.name === 'Профиль') imageSource = require('../assets/profile.png');
                        else if (route.name === 'Настройки') imageSource = require('../assets/settings.png');

                        return (
                            <TouchableOpacity
                                key={route.key}
                                style={tabStyles.tabItem}
                                activeOpacity={1}
                                onPress={() => {
                                    if (isMainButton) {
                                        toggleMenu(!isMenuOpen);
                                    } else {
                                        toggleMenu(false);
                                        navigation.navigate(route.name);
                                    }
                                }}
                            >
                                <View style={[tabStyles.iconContainer, showActiveBg && tabStyles.activeBackground]}>
                                    <Image source={imageSource} style={tabStyles.mainIcon} />
                                    <Text style={tabStyles.label}>{route.name}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

export default function TabNavigator() {
    const [role, setRole] = useState('doctor');

    useEffect(() => {
        let alive = true;
        apiFetch('/me/')
            .then(safeJson)
            .then((data) => {
                if (!alive) return;
                setRole(data?.role || 'doctor');
            })
            .catch(() => {
                if (!alive) return;
                setRole('doctor');
            });

        return () => {
            alive = false;
        };
    }, []);

    const isPatient = role === 'patient';

    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} role={role} />}
            screenOptions={{ headerShown: false, animation: 'fade' }}
        >
            <Tab.Screen name="Главная" component={HomeStackNavigator} />
            {isPatient ? (
                <>
                    <Tab.Screen name="Консультации" component={ArchiveScreen} />
                    <Tab.Screen name="Чат-бот" component={ChatBotScreen} />
                    <Tab.Screen name="Профиль" component={ProfileScreen} />
                    <Tab.Screen name="Настройки" component={SettingsScreen} />
                </>
            ) : (
                <>
                    <Tab.Screen name="Пациенты" component={PatientsScreen} />
                    <Tab.Screen name="Архив" component={ArchiveScreen} />
                    <Tab.Screen name="Профиль" component={ProfileScreen} />
                    <Tab.Screen name="Настройки" component={SettingsScreen} />
                </>
            )}
        </Tab.Navigator>
    );
}
