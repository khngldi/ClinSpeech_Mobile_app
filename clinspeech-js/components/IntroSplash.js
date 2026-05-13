import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocale } from '../i18n/LocaleContext';
import AnimatedGradientBackground from './AnimatedGradientBackground';

const PRIMARY = '#2ec4b6';
const TIP_INTERVAL_MS = 9000;

const INTRO_TIPS = [
  ['intro.tip1', 'Записывайте приём в тихом месте, чтобы отчёт был точнее.'],
  ['intro.tip2', 'Перед записью проверьте выбранного пациента.'],
  ['intro.tip3', 'Говорите диагноз и рекомендации чётко и по порядку.'],
  ['intro.tip4', 'После генерации проверьте отчёт перед сохранением.'],
  ['intro.tip5', 'Добавляйте снимки анализов, если они важны для консультации.'],
  ['intro.tip6', 'Используйте шаблоны для типовых консультаций.'],
  ['intro.tip7', 'Регулярно обновляйте историю пациента.'],
  ['intro.tip8', 'Короткие паузы помогают ИИ лучше разделять смысловые блоки.'],
  ['intro.tip9', 'Подтверждайте рекомендации пациенту простыми словами.'],
  ['intro.tip10', 'Контролируйте доступ к отчётам и не передавайте токены другим.'],
  ['intro.tip11', 'Сон, вода и движение помогают восстановлению организма.'],
  ['intro.tip12', 'При ухудшении самочувствия обращайтесь к врачу вовремя.'],
  ['intro.tip13', 'Профилактические осмотры помогают заметить проблему раньше.'],
  ['intro.tip14', 'Принимайте лекарства только по назначению специалиста.'],
  ['intro.tip15', 'Храните медицинские документы и результаты анализов в порядке.'],
  ['intro.tip16', 'Перед приёмом подготовьте список жалоб и вопросов.'],
  ['intro.tip17', 'Сравнивайте новые симптомы с историей пациента.'],
  ['intro.tip18', 'Для срочных состояний не ждите генерации отчёта, вызывайте помощь.'],
  ['intro.tip19', 'Проверяйте дату рождения пациента перед созданием записи.'],
  ['intro.tip20', 'Чёткая структура консультации экономит время врача.'],
];

export default function IntroSplash({ durationMs = 12000 }) {
  const { t } = useLocale();
  const [tipIndex, setTipIndex] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const slide = useRef(new Animated.Value(18)).current;
  const tipFade = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      useNativeDriver: false,
    }).start();

    const timer = setInterval(() => {
      Animated.timing(tipFade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setTipIndex((index) => (index + 1) % INTRO_TIPS.length);
        Animated.timing(tipFade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    }, TIP_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [durationMs, fade, progress, scale, slide, tipFade]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['8%', '100%'],
  });
  const [tipKey, tipFallback] = INTRO_TIPS[tipIndex];

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground />
      <Animated.View style={[styles.content, { opacity: fade, transform: [{ scale }, { translateY: slide }] }]}>
        <Image source={require('../assets/App_logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>ClinSpeech</Text>

        <View style={styles.tipPanel}>
          <View style={styles.tipHeader}>
            <View style={styles.tipIcon}>
              <Ionicons name="heart-outline" size={17} color={PRIMARY} />
            </View>
            <Text style={styles.tipLabel}>{t('Совет')}</Text>
          </View>
          <Animated.Text style={[styles.tipText, { opacity: tipFade }]}>
            {t(tipKey, tipFallback)}
          </Animated.Text>
        </View>

        <View style={styles.progressWrap}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>{t('Подготовка системы')}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 128,
    height: 128,
  },
  title: {
    marginTop: 18,
    fontSize: 32,
    fontWeight: '800',
    color: '#102a43',
  },
  tipPanel: {
    width: '100%',
    maxWidth: 360,
    minHeight: 132,
    marginTop: 26,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.22)',
    shadowColor: '#0f766e',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46,196,182,0.12)',
  },
  tipLabel: {
    fontSize: 13,
    color: '#0f766e',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tipText: {
    minHeight: 58,
    fontSize: 16,
    lineHeight: 23,
    color: '#102a43',
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#627d98',
    fontWeight: '700',
  },
  progressWrap: {
    width: 190,
    height: 5,
    marginTop: 24,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(46,196,182,0.14)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  caption: {
    fontSize: 13,
    color: '#486581',
    fontWeight: '600',
  },
});
