import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import HomeScreen from '../screens/HomeScreen';
import ListScreen from '../screens/ListScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PatientsScreen from '../screens/PatientsScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/Settings';
import { tabStyles } from '../styles/TabStyles';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

function HomeStackNavigator() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <HomeStack.Screen name="HomeRecord" component={HomeScreen} />
            <HomeStack.Screen name="HomeList" component={ListScreen} />
            <HomeStack.Screen name="HomeDashboard" component={DashboardScreen} />
        </HomeStack.Navigator>
    );
}

function CustomTabBar({ state, navigation }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    const currentRoute = state.routes[state.index];
    const isMainTabFocused = currentRoute.name === 'Главная';

    const focusedRouteName = getFocusedRouteNameFromRoute(currentRoute) ?? 'HomeRecord';

    let activeSubOption = '';
    if (isMainTabFocused) {
        if (focusedRouteName === 'HomeRecord') activeSubOption = 'Записать';
        else if (focusedRouteName === 'HomeList') activeSubOption = 'Список';
        else if (focusedRouteName === 'HomeDashboard') activeSubOption = 'Дэшборд';
    }

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

    const handleSubMenuPress = (action) => {

        toggleMenu(false);

        if (action === 'Записать') {
            navigation.navigate('Главная', { screen: 'HomeRecord' });
        } else if (action === 'Список') {
            navigation.navigate('Главная', { screen: 'HomeList' });
        } else if (action === 'Дэшборд') {
            navigation.navigate('Главная', { screen: 'HomeDashboard' });
        } else {
            Alert.alert(`Раздел ${action}`, "Этот экран в разработке");
        }
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
            {/* Оверлей */}
            {isMenuOpen && (
                <Animated.View style={[tabStyles.overlay, { opacity: animation }]}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => toggleMenu(false)} />
                </Animated.View>
            )}

            {/* ПОДМЕНЮ */}
            {isMenuOpen && (
                <Animated.View style={[tabStyles.subMenuContainer, menuStyle]}>
                    <LinearGradient
                        colors={['#29D8FF', '#0088A4']}
                        style={tabStyles.gradientBackground}
                    >
                        <TouchableOpacity
                            style={[
                                tabStyles.subMenuItem,
                                (activeSubOption === 'Записать') && tabStyles.activeBackground
                            ]}
                            onPress={() => handleSubMenuPress('Записать')}
                        >
                            <Image source={require('../assets/record.png')} style={tabStyles.subMenuIcon} />
                            <Text style={tabStyles.subMenuText}>Записать</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                tabStyles.subMenuItem,
                                (activeSubOption === 'Список') && tabStyles.activeBackground
                            ]}
                            onPress={() => handleSubMenuPress('Список')}
                        >
                            <Image source={require('../assets/list.png')} style={tabStyles.subMenuIcon} />
                            <Text style={tabStyles.subMenuText}>Список</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                tabStyles.subMenuItem,
                                (activeSubOption === 'Дэшборд') && tabStyles.activeBackground
                            ]}
                            onPress={() => handleSubMenuPress('Дэшборд')}
                        >
                            <Image source={require('../assets/favorites.png')} style={tabStyles.subMenuIcon} />
                            <Text style={tabStyles.subMenuText}>Дэшборд</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            )}

            <View style={tabStyles.mainTabBarContainer}>
                <LinearGradient
                    colors={['#29D8FF', '#0088A4']}
                    style={StyleSheet.absoluteFill}
                />

                <View style={tabStyles.tabsRow}>
                    {state.routes.map((route, index) => {
                        const isFocused = state.index === index;
                        const isMainButton = route.name === 'Главная';

                        const showActiveBg = (isMainButton && isMenuOpen) || (isFocused && !isMenuOpen);

                        let imageSource;
                        if (route.name === 'Главная') imageSource = require('../assets/home.png');
                        else if (route.name === 'Пациенты') imageSource = require('../assets/template.png');
                        else if (route.name === 'Архив') imageSource = require('../assets/archive.png');
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
    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false, animation: 'fade' }}
        >
            <Tab.Screen name="Главная" component={HomeStackNavigator} />
            <Tab.Screen name="Пациенты" component={PatientsScreen} />
            <Tab.Screen name="Архив" component={ArchiveScreen} />
            <Tab.Screen name="Профиль" component={ProfileScreen} />
            <Tab.Screen name="Настройки" component={SettingsScreen} />
        </Tab.Navigator>
    );
}