import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    ImageBackground,
    SafeAreaView,
    Dimensions,
    Platform,
    Animated,
    Easing,
    KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BRAND_CYAN = '#00CCFF';
const TOTAL_STEPS = 5; // теперь всего 5 шагов

export default function RegisterScreen() {
    const [step, setStep] = useState(1);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const codeInputRef = useRef(null);
    const navigation = useNavigation();

    const [form, setForm] = useState({
        lastName: '',
        firstName: '',
        middleName: '',
        iin: '',
        birthDate: '',
        city: '',
        email: '',
        code: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(30);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            })
        ]).start();
    }, [step]);

    const formatDate = (value) => {
        const cleaned = value.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
        if (cleaned.length > 4) formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2, 4) + '-' + cleaned.slice(4, 8);
        return formatted;
    };

    const isValidDate = /^\d{2}-\d{2}-\d{4}$/.test(form.birthDate);
    const isPasswordValid = () => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(form.password);
    const isCodeValid = () => form.code.length === 6;

    const canProceed = () => {
        switch (step) {
            case 1:
                return form.lastName && form.firstName && form.iin.length === 12 && isValidDate && form.city;
            case 2:
                return form.email.includes('@');
            case 3:
                return isCodeValid();
            case 4:
                return isPasswordValid() && form.password === form.confirmPassword;
            default:
                return true;
        }
    };

    const renderCodeInputs = () => (
        <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => codeInputRef.current?.focus()}
                style={styles.codeContainer}
            >
                {[0,1,2,3,4,5].map(index => (
                    <View key={index} style={styles.codeBox}>
                        <Text style={styles.codeDigit}>
                            {form.code[index] || ''}
                        </Text>
                    </View>
                ))}
            </TouchableOpacity>
            <TextInput
                ref={codeInputRef}
                value={form.code}
                onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '').slice(0,6);
                    setForm(prev => ({ ...prev, code: cleaned }));
                }}
                keyboardType="numeric"
                maxLength={6}
                style={{ position:'absolute', opacity:0 }}
            />
        </View>
    );

    const nextStep = () => {
        if (step < TOTAL_STEPS) setStep(prev => prev + 1);
    };

    const renderWizard = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* STEP 1 - Личные данные */}
            {step === 1 && (
                <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                    <Title text="Регистрация пациента" />
                    <Input placeholder="Фамилия" value={form.lastName} onChangeText={v => setForm({...form,lastName:v})}/>
                    <Input placeholder="Имя" value={form.firstName} onChangeText={v => setForm({...form,firstName:v})}/>
                    <Input placeholder="Отчество" value={form.middleName} onChangeText={v => setForm({...form,middleName:v})}/>
                    <Input placeholder="ИИН" keyboardType="numeric" maxLength={12} value={form.iin} onChangeText={v => setForm({...form,iin:v.replace(/[^0-9]/g,'')})}/>
                    <Input placeholder="ДД-ММ-ГГГГ" keyboardType="numeric" maxLength={10} value={form.birthDate} onChangeText={v => setForm({...form,birthDate:formatDate(v)})}/>
                    <Input placeholder="Город" value={form.city} onChangeText={v => setForm({...form,city:v})}/>
                </Animated.View>
            )}

            {/* STEP 2 - Email */}
            {step === 2 && (
                <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                    <Title text="Электронная почта" />
                    <Input placeholder="example@mail.com" keyboardType="email-address" value={form.email} onChangeText={v=>setForm({...form,email:v})}/>
                </Animated.View>
            )}

            {/* STEP 3 - Код подтверждения */}
            {step === 3 && (
                <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                    <Title text="Код подтверждения" />
                    {renderCodeInputs()}
                </Animated.View>
            )}

            {/* STEP 4 - Пароль */}
            {step === 4 && (
                <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                    <Title text="Создать пароль" />
                    <Text style={styles.passwordInfo}>
                        Пароль должен содержать минимум 8 символов, 1 латинскую букву, 1 цифру и 1 спецсимвол.
                    </Text>
                    <Input secureTextEntry placeholder="Введите пароль" value={form.password} onChangeText={v=>setForm({...form,password:v})}/>
                    <Input secureTextEntry placeholder="Подтвердите пароль" value={form.confirmPassword} onChangeText={v=>setForm({...form,confirmPassword:v})}/>
                </Animated.View>
            )}

            {/* STEP 5 - Завершение */}
            {step === 5 && (
                <View style={{alignItems:'center',marginTop:50}}>
                    <Title text="Регистрация завершена" />
                    <Text style={styles.finalText}>Ваш аккаунт успешно создан. Теперь вы можете войти в систему.</Text>
                    <View style={styles.buttonContainer}>
                        <MainButton title="ВОЙТИ" onPress={()=>navigation.navigate('Login')} />
                    </View>
                </View>
            )}

            {step <= 4 && canProceed() && (
                <View style={styles.buttonContainer}>
                    <MainButton title="ДАЛЕЕ" onPress={nextStep}/>
                </View>
            )}
        </ScrollView>
    );

    return(
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <ImageBackground source={require('../assets/Ellipse 4.png')} style={styles.headerBackground} resizeMode="stretch">
                    <SafeAreaView style={styles.safeArea}>
                        <Text style={styles.headerTitle}>ClinSpeech</Text>
                    </SafeAreaView>
                </ImageBackground>
            </View>

            <KeyboardAvoidingView style={styles.content} behavior={Platform.OS==='ios'?'padding':undefined}>
                {renderWizard()}
            </KeyboardAvoidingView>
        </View>
    );
}

/* ---------- COMPONENTS ---------- */

const Title = ({text}) => (<Text style={styles.selectionTitle}>{text}</Text>);
const Input = props => (<TextInput style={styles.input} placeholderTextColor="#999" {...props}/>);
const MainButton = ({title,onPress}) => (<TouchableOpacity style={styles.roleButton} onPress={onPress}><Text style={styles.buttonText}>{title}</Text></TouchableOpacity>);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
    container:{flex:1,backgroundColor:'#FFF'},
    headerContainer:{width:'100%',height:150},
    headerBackground:{width:'100%',height:'100%'},
    safeArea:{flex:1,justifyContent:'center',alignItems:'center'},
    headerTitle:{fontSize:26,fontWeight:'bold',color:'#FFF'},
    content:{flex:1,width:'100%',paddingHorizontal:20},
    scrollContent:{flexGrow:1,paddingBottom:40},
    selectionTitle:{fontSize:22,fontWeight:'bold',textAlign:'center',marginBottom:25,color:'#333'},
    input:{borderBottomWidth:1,borderBottomColor:BRAND_CYAN,marginBottom:20,paddingVertical:10,fontSize:16},
    buttonContainer:{width:'85%',maxWidth:400,alignSelf:'center',marginTop:20},
    roleButton:{backgroundColor:BRAND_CYAN,paddingVertical:16,borderRadius:15,alignItems:'center'},
    buttonText:{color:'#FFF',fontSize:18,fontWeight:'bold'},
    passwordInfo:{fontSize:13,color:'#666',marginBottom:20},
    finalText:{textAlign:'center',fontSize:16,color:'#444',paddingHorizontal:20},
    codeContainer:{flexDirection:'row',justifyContent:'space-between',marginTop:20},
    codeBox:{borderBottomWidth:2,borderBottomColor:BRAND_CYAN,width:45,alignItems:'center',paddingVertical:10},
    codeDigit:{fontSize:22}
});