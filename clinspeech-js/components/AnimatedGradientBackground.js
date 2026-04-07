import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW, height: SH } = Dimensions.get('window');

// Create soft blurred blob effect with multiple gradient layers
function SoftBlob({ color, size, startX, startY, delay, moveX, moveY, opacity = 0.4 }) {
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: moveX[0], duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: moveY[0], duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1.2, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: moveX[1], duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: moveY[1], duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 0.85, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: moveX[2], duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: moveY[2], duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1.1, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(translateX, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(translateY, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ]),
            ])
        ).start();
    }, []);

    // Multiple layers to simulate blur
    return (
        <Animated.View style={{
            position: 'absolute',
            left: startX,
            top: startY,
            width: size,
            height: size,
            transform: [{ translateX }, { translateY }, { scale }],
        }}>
            {/* Outer soft glow */}
            <LinearGradient
                colors={[`${color}00`, `${color}15`, `${color}25`, `${color}15`, `${color}00`]}
                style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
            {/* Middle layer */}
            <View style={{
                position: 'absolute',
                left: size * 0.15,
                top: size * 0.15,
                width: size * 0.7,
                height: size * 0.7,
            }}>
                <LinearGradient
                    colors={[`${color}00`, `${color}30`, `${color}50`, `${color}30`, `${color}00`]}
                    style={[StyleSheet.absoluteFill, { borderRadius: size * 0.35 }]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </View>
            {/* Inner core */}
            <View style={{
                position: 'absolute',
                left: size * 0.3,
                top: size * 0.3,
                width: size * 0.4,
                height: size * 0.4,
                borderRadius: size * 0.2,
                backgroundColor: color,
                opacity: opacity,
            }} />
        </Animated.View>
    );
}

export default function AnimatedGradientBackground() {
    return (
        <View style={s.root} pointerEvents="none">
            {/* Soft gradient base */}
            <LinearGradient
                colors={['#f0fdfa', '#f0f9ff', '#faf5ff', '#f0fdfa']}
                style={s.base}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            {/* Floating soft blobs */}
            <View style={s.blobContainer}>
                {/* Teal blob - top left area */}
                <SoftBlob 
                    color="#2ec4b6"
                    size={SW * 1.4}
                    startX={-SW * 0.5}
                    startY={-SH * 0.15}
                    delay={0}
                    moveX={[100, -50, 70]}
                    moveY={[-60, 100, 40]}
                    opacity={0.35}
                />
                
                {/* Light mint blob - center left */}
                <SoftBlob 
                    color="#5eead4"
                    size={SW * 1.2}
                    startX={-SW * 0.3}
                    startY={SH * 0.45}
                    delay={2500}
                    moveX={[70, -40, 60]}
                    moveY={[-80, 60, -30]}
                    opacity={0.3}
                />
                
                {/* Purple blob - top right */}
                <SoftBlob 
                    color="#a78bfa"
                    size={SW * 1.0}
                    startX={SW * 0.35}
                    startY={SH * 0.1}
                    delay={5000}
                    moveX={[-60, 80, -40]}
                    moveY={[70, -50, 90]}
                    opacity={0.25}
                />
                
                {/* Teal blob - bottom right */}
                <SoftBlob 
                    color="#2dd4bf"
                    size={SW * 1.3}
                    startX={SW * 0.2}
                    startY={SH * 0.55}
                    delay={7500}
                    moveX={[-70, 50, -30]}
                    moveY={[-70, 50, -40]}
                    opacity={0.3}
                />
                
                {/* Extra soft cyan highlight */}
                <SoftBlob 
                    color="#67e8f9"
                    size={SW * 0.8}
                    startX={SW * 0.1}
                    startY={SH * 0.25}
                    delay={10000}
                    moveX={[50, -30, 40]}
                    moveY={[40, -60, 30]}
                    opacity={0.2}
                />
            </View>
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
    blobContainer: {
        ...StyleSheet.absoluteFillObject,
    },
});
