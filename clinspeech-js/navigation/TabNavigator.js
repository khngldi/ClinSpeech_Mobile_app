import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch, safeJson } from '../api';
import { useLocale } from '../i18n/LocaleContext';

import HomeScreen from '../screens/HomeScreen';
import ListScreen from '../screens/ListScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PatientsScreen from '../screens/PatientsScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/Settings';
import ChatBotScreen from '../screens/ChatBotScreen';
import RecordPage from '../screens/RecordPage';
import NotificationsScreen from '../screens/NotificationsScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import UsersScreen from '../screens/admin/UsersScreen';
import AuditLogScreen from '../screens/admin/AuditLogScreen';
import { tabStyles } from '../styles/TabStyles';
import imageSource from "../assets/home.png";

// Словарь переводов для названий вкладок
const TAB_TRANSLATIONS = {
    'Главная': { ru: 'Главная', kk: 'Басты бет' },
    'Пациенты': { ru: 'Пациенты', kk: 'Пациенттер' },
    'Архив': { ru: 'Архив', kk: 'Архив' },
    'Профиль': { ru: 'Профиль', kk: 'Профиль' },
    'Настройки': { ru: 'Настройки', kk: 'Баптаулар' },
    'Консультации': { ru: 'Консультации', kk: 'Консультация' },
    'Чат-бот': { ru: 'Чат-бот', kk: 'Чат-бот' },
    'Уведомления': { ru: 'Уведомления', kk: 'Хабарлама' },
    'Расписание': { ru: 'Расписание', kk: 'Кесте' },
    'Пользователи': { ru: 'Пользователи', kk: 'Қолданушы' },
    'Аудит': { ru: 'Аудит', kk: 'Аудит' },
};

// Переводы для подменю
const SUBMENU_TRANSLATIONS = {
    'Записать': { ru: 'Записать', kk: 'Жазу' },
    'Список': { ru: 'Список', kk: 'Тізім' },
    'Дэшборд': { ru: 'Дэшборд', kk: 'Дэшборд' },
    'Пользователи': { ru: 'Пользователи', kk: 'Қолданушы' },
    'Чат-бот': { ru: 'Чат-бот', kk: 'Чат-бот' },
};

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const PatientHomeStack = createStackNavigator();

// HomeStack для врачей и админов
function HomeStackNavigator() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <HomeStack.Screen name="HomeRecord" component={HomeScreen} />
            <HomeStack.Screen name="RecordPage" component={RecordPage} />
            <HomeStack.Screen name="HomeList" component={ListScreen} />
            <HomeStack.Screen name="HomeDashboard" component={DashboardScreen} />
            <HomeStack.Screen name="HomeChatBot" component={ChatBotScreen} />
            <HomeStack.Screen name="AdminUsers" component={UsersScreen} />
            <HomeStack.Screen name="AdminAuditLog" component={AuditLogScreen} />
        </HomeStack.Navigator>
    );
}

// HomeStack для пациентов - сразу Dashboard (без записи консультаций)
function PatientHomeStackNavigator() {
    return (
        <PatientHomeStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <PatientHomeStack.Screen name="PatientDashboard" component={DashboardScreen} />
            <PatientHomeStack.Screen name="PatientList" component={ListScreen} />
        </PatientHomeStack.Navigator>
    );
}

function CustomTabBar({ state, navigation, role, locale }) {
    const isPatient = role === 'patient';
    const isAdmin = role === 'admin';
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    // Функция перевода для вкладок
    const translateTab = (name) => {
        const trans = TAB_TRANSLATIONS[name];
        return trans ? trans[locale] || trans.ru : name;
    };

    // Функция перевода для подменю
    const translateSubmenu = (label) => {
        const trans = SUBMENU_TRANSLATIONS[label];
        return trans ? trans[locale] || trans.ru : label;
    };

    const currentRoute = state.routes[state.index];
    const isMainTabFocused = currentRoute.name === 'Главная';
    const focusedRouteName = getFocusedRouteNameFromRoute(currentRoute) ?? 'HomeRecord';

    // Пациенты не имеют подменю - у них нет "Записать"
    const subMenuOptions = useMemo(() => {
        if (isPatient) {
            return []; // Пустой массив - нет подменю для пациентов
        }

        if (isAdmin) {
            return [
                { key: 'запись', label: 'Записать', icon: require('../assets/record.png'), target: 'RecordPage' },
                { key: 'список', label: 'Список', icon: require('../assets/list.png'), target: 'HomeList' },
                { key: 'дашборд', label: 'Дэшборд', icon: require('../assets/dashboard.png'), target: 'HomeDashboard' },
                { key: 'пользователи', label: 'Пользователи', icon: require('../assets/profile.png'), target: 'AdminUsers' },
            ];
        }

        return [
            { key: 'запись', label: 'Записать', icon: require('../assets/record.png'), target: 'RecordPage' },
            { key: 'список', label: 'Список', icon: require('../assets/list.png'), target: 'HomeList' },
            { key: 'дашборд', label: 'Дэшборд', icon: require('../assets/favorites.png'), target: 'HomeDashboard' },
        ];
    }, [isPatient, isAdmin]);

    const activeSubOption = useMemo(() => {
        const active = subMenuOptions.find((opt) => opt.target === focusedRouteName);
        return active?.label || '';
    }, [focusedRouteName, subMenuOptions]);

    const toggleMenu = (shouldOpen) => {
        // Пациенты не могут открывать подменю
        if (isPatient) return;
        
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
            {/* Подменю только для врачей и админов */}
            {!isPatient && isMenuOpen && (
                <Animated.View style={[tabStyles.overlay, { opacity: animation }]}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => toggleMenu(false)} />
                </Animated.View>
            )}

            {!isPatient && isMenuOpen && (
                <Animated.View style={[tabStyles.subMenuContainer, menuStyle]}>
                    <View style={tabStyles.gradientBackground}>
                        {subMenuOptions.map((option) => {
                            const isActive = activeSubOption === option.label;
                            return (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[
                                        tabStyles.subMenuItem,
                                        isActive && tabStyles.subMenuItemActive,
                                    ]}
                                    onPress={() => handleSubMenuPress(option)}
                                >
                                    <Image 
                                        source={option.icon} 
                                        style={[
                                            tabStyles.subMenuIcon,
                                            isActive && tabStyles.subMenuIconActive
                                        ]} 
                                    />
                                    <Text style={[
                                        tabStyles.subMenuText,
                                        isActive && tabStyles.subMenuTextActive
                                    ]}>
                                        {translateSubmenu(option.label)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            )}

            <View style={tabStyles.mainTabBarContainer}>
                <View style={tabStyles.tabsRow}>
                    {state.routes.map((route, index) => {
                        const isFocused = state.index === index;
                        const isMainButton = route.name === 'Главная';
                        const showActiveBg = (!isPatient && isMainButton && isMenuOpen) || (isFocused && !isMenuOpen);

                        let imageSource = require('../assets/home.png');
                        if (route.name === 'Пациенты') imageSource = require('../assets/patient.png');
                        else if (route.name === 'Архив') imageSource = require('../assets/archive.png');
                        else if (route.name === 'Консультации') imageSource = require('../assets/consultation.png');
                        else if (route.name === 'Чат-бот') imageSource = require('../assets/chatbot.png');
                        else if (route.name === 'Профиль') imageSource = require('../assets/profile.png');
                        else if (route.name === 'Настройки') imageSource = require('../assets/settings.png');
                        else if (route.name === 'Уведомления') imageSource = require('../assets/template.png');
                        else if (route.name === 'Расписание') imageSource = require('../assets/schedule.png');
                        else if (route.name === 'Шаблоны') imageSource = require('../assets/template.png');
                        else if (route.name === 'Пользователи') imageSource = require('../assets/profile.png');
                        else if (route.name === 'Аудит') imageSource = require('../assets/list.png');

                        const iconTint = showActiveBg ? '#14b8a6' : '#9ca3af';

                        return (
                            <TouchableOpacity
                                key={route.key}
                                style={tabStyles.tabItem}
                                activeOpacity={0.7}
                                onPress={() => {
                                    if (isMainButton && !isPatient) {
                                        toggleMenu(!isMenuOpen);
                                    } else {
                                        toggleMenu(false);
                                        navigation.navigate(route.name);
                                    }
                                }}
                            >
                                <View style={[tabStyles.iconContainer, showActiveBg && tabStyles.activeBackground]}>
                                    <Image source={imageSource} style={[tabStyles.mainIcon, { tintColor: iconTint }]} />
                                    <Text style={[tabStyles.label, showActiveBg ? tabStyles.labelActive : tabStyles.labelInactive]}>
                                        {translateTab(route.name)}
                                    </Text>
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
    const [role, setRole] = useState(null); // null = загрузка, чтобы не показывать интерфейс врача пациентам
    const [loading, setLoading] = useState(true);
    const { locale } = useLocale();

    useEffect(() => {
        let alive = true;
        apiFetch('/me/')
            .then(safeJson)
            .then((data) => {
                if (!alive) return;
                setRole(data?.role || 'doctor');
                setLoading(false);
            })
            .catch(() => {
                if (!alive) return;
                setRole('doctor');
                setLoading(false);
            });

        return () => {
            alive = false;
        };
    }, []);

    const isPatient = role === 'patient';
    const isAdmin = role === 'admin';

    // Показываем загрузку пока роль не определена (чтобы пациенты не видели интерфейс врача)
    if (loading || role === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' }}>
                <ActivityIndicator size="large" color="#2ec4b6" />
            </View>
        );
    }

    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} role={role} locale={locale} />}
            screenOptions={{ headerShown: false, animation: 'fade' }}
        >
            {isPatient ? (
                <>
                    <Tab.Screen name="Главная" component={PatientHomeStackNavigator} />
                    <Tab.Screen name="Консультации" component={ArchiveScreen} />
                    <Tab.Screen name="Чат-бот" component={ChatBotScreen} />
                    <Tab.Screen name="Профиль" component={ProfileScreen} />
                    <Tab.Screen name="Настройки" component={SettingsScreen} />
                </>
            ) : isAdmin ? (
                <>
                    <Tab.Screen name="Главная" component={HomeStackNavigator} />
                    <Tab.Screen name="Пациенты" component={PatientsScreen} />
                    <Tab.Screen name="Архив" component={ArchiveScreen} />
                    <Tab.Screen name="Пользователи" component={UsersScreen} />
                    <Tab.Screen name="Аудит" component={AuditLogScreen} />
                    <Tab.Screen name="Настройки" component={SettingsScreen} />
                </>
            ) : (
                <>
                    <Tab.Screen name="Главная" component={HomeStackNavigator} />
                    <Tab.Screen name="Пациенты" component={PatientsScreen} />
                    <Tab.Screen name="Архив" component={ArchiveScreen} />
                    <Tab.Screen name="Расписание" component={AppointmentsScreen} />
                    <Tab.Screen name="Профиль" component={ProfileScreen} />
                    <Tab.Screen name="Настройки" component={SettingsScreen} />
                </>
            )}
        </Tab.Navigator>
    );
}