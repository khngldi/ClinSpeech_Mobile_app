import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AnimatedGradientBackground() {
    const drift = useRef(new Animated.Value(0)).current;
    const driftSoft = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const primary = Animated.loop(
            Animated.sequence([
                Animated.timing(drift, {
                    toValue: 1,
                    duration: 8000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(drift, {
                    toValue: 0,
                    duration: 8000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        const secondary = Animated.loop(
            Animated.sequence([
                Animated.timing(driftSoft, {
                    toValue: 1,
                    duration: 10000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(driftSoft, {
                    toValue: 0,
                    duration: 10000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        primary.start();
        secondary.start();

        return () => {
            primary.stop();
            secondary.stop();
        };
    }, [drift, driftSoft]);

    const overlayTransform = {
        transform: [
            {
                translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 18],
                }),
            },
            {
                translateY: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, -14],
                }),
            },
            {
                scale: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.03],
                }),
            },
        ],
    };

    const overlayTransformSoft = {
        transform: [
            {
                translateX: driftSoft.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, -12],
                }),
            },
            {
                translateY: driftSoft.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 16],
                }),
            },
            {
                scale: driftSoft.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.02, 1],
                }),
            },
        ],
    };

    return (
        <View style={s.root} pointerEvents="none">
            <LinearGradient
                colors={['#f8fafc', '#eefcf9', '#f1f5ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.base}
            />

            <Animated.View style={[s.overlay, overlayTransform]}>
                <LinearGradient
                    colors={['rgba(94,234,212,0.34)', 'rgba(46,196,182,0.20)', 'rgba(167,139,250,0.18)']}
                    start={{ x: 0, y: 0.15 }}
                    end={{ x: 1, y: 0.85 }}
                    style={s.fill}
                />
            </Animated.View>

            <Animated.View style={[s.overlay, s.overlaySoft, overlayTransformSoft]}>
                <LinearGradient
                    colors={['rgba(20,184,166,0.16)', 'rgba(94,234,212,0.12)', 'rgba(248,250,252,0.00)']}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0.1, y: 1 }}
                    style={s.fill}
                />
            </Animated.View>
        </View>
    );
}

const s = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    base: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    overlaySoft: {
        opacity: 0.88,
    },
    fill: {
        ...StyleSheet.absoluteFillObject,
    },
});
