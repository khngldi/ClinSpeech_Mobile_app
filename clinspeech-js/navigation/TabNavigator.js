import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'; // Импорт для проверки текущего экрана
import { LinearGradient } from 'expo-linear-gradient';

import HomeScreen from '../screens/HomeScreen';
import ListScreen from '../screens/ListScreen'; // Импортируем новый экран
import { tabStyles } from '../styles/TabStyles';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

function HomeStackNavigator() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <HomeStack.Screen name="HomeRecord" component={HomeScreen} />
            <HomeStack.Screen name="HomeList" component={ListScreen} />
        </HomeStack.Navigator>
    );
}

const Placeholder = ({ name }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#005864' }}>Экран {name} в разработке</Text>
    </View>
);

function CustomTabBar({ state, navigation }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    // --- 2. Логика определения текущего под-экрана ---
    const currentRoute = state.routes[state.index];
    const isMainTabFocused = currentRoute.name === 'Главная';

    // Получаем имя активного экрана внутри стека 'Главная'
    // Если routeName undefined, значит мы на первом экране стека (HomeRecord)
    const focusedRouteName = getFocusedRouteNameFromRoute(currentRoute) ?? 'HomeRecord';

    // Определяем, какая кнопка подменю активна
    let activeSubOption = '';
    if (isMainTabFocused) {
        if (focusedRouteName === 'HomeRecord') activeSubOption = 'Записать';
        else if (focusedRouteName === 'HomeList') activeSubOption = 'Список';
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
        // Не закрываем меню сразу, если хочешь видеть переход,
        // но обычно лучше закрыть для чистоты UI:
        toggleMenu(false);

        if (action === 'Записать') {
            // Переход на экран Записи внутри стека Главная
            navigation.navigate('Главная', { screen: 'HomeRecord' });
        } else if (action === 'Список') {
            // Переход на экран Списка внутри стека Главная
            navigation.navigate('Главная', { screen: 'HomeList' });
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
            {/* Оверлей (закрывает меню при клике вне кнопок) */}
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
                        {/* Кнопка Записать */}
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

                        {/* Кнопка Список */}
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

                        {/* Кнопка Избранные */}
                        <TouchableOpacity
                            style={[
                                tabStyles.subMenuItem,
                                (activeSubOption === 'Избранные') && tabStyles.activeBackground
                            ]}
                            onPress={() => handleSubMenuPress('Избранные')}
                        >
                            <Image source={require('../assets/favorites.png')} style={tabStyles.subMenuIcon} />
                            <Text style={tabStyles.subMenuText}>Избранные</Text>
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

                        // Логика подсветки главной кнопки:
                        // Она активна, если открыто меню ИЛИ если мы просто находимся на вкладке Главная (независимо от Record или List)
                        const showActiveBg = (isMainButton && isMenuOpen) || (isFocused && !isMenuOpen);

                        let imageSource;
                        if (route.name === 'Главная') imageSource = require('../assets/home.png');
                        else if (route.name === 'Архив') imageSource = require('../assets/archive.png');
                        else if (route.name === 'Пациенты') imageSource = require('../assets/template.png');
                        else if (route.name === 'Профиль') imageSource = require('../assets/profile.png');

                        return (
                            <TouchableOpacity
                                key={route.key}
                                style={tabStyles.tabItem}
                                activeOpacity={1}
                                onPress={() => {
                                    if (isMainButton) {
                                        // Если нажали Главную - просто открываем/закрываем меню
                                        // Не переходим никуда, остаемся на текущем под-экране (Список или Запись)
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

// Экспорт основного навигатора
export default function TabNavigator() {
    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false, animation: 'fade' }}
        >
            {/* Вместо HomeScreen теперь ставим HomeStackNavigator */}
            <Tab.Screen name="Главная" component={HomeStackNavigator} />

            <Tab.Screen name="Архив" component={Placeholder} />
            <Tab.Screen name="Шаблоны" component={Placeholder} />
            <Tab.Screen name="Профиль" component={Placeholder} />
        </Tab.Navigator>
    );
}