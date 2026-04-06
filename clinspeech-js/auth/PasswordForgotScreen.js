import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ImageBackground,
    SafeAreaView,
    Platform,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BRAND_MINT = '#2ec4b6';

export default function PasswordForgotScreen() {
    const [step, setStep] = useState(1);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const codeInputRef = useRef(null);
    const navigation = useNavigation();

    const [form, setForm] = useState({
        email: '',
        code: '',
        password: '',
        confirmPassword: ''
    });

    const [isSendingCode, setIsSendingCode] = useState(false);

    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start();
    }, [step]);

    const isCodeValid = () => form.code.length === 6;
    const isPasswordValid = () => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(form.password);

    const canProceed = () => {
        switch (step) {
            case 1: return form.email.includes('@');
            case 2: return isCodeValid();
            case 3: return isPasswordValid() && form.password === form.confirmPassword;
            default: return true;
        }
    };

    const sendCode = () => {
        if (!form.email.includes('@')) return;
        setIsSendingCode(true);
        setTimeout(() => {
            setIsSendingCode(false);
            Alert.alert('Код отправлен', 'На ваш email отправлен 6-значный код.');
            setStep(2);
        }, 1500);
    };

    const renderCodeInputs = () => (
        <View style={{ alignItems: 'center' }}>
            <TouchableOpacity activeOpacity={1} onPress={() => codeInputRef.current?.focus()} style={styles.codeContainer}>
                {[0,1,2,3,4,5].map(i => (
                    <View key={i} style={styles.codeBox}>
                        <Text style={styles.codeDigit}>{form.code[i] || ''}</Text>
                    </View>
                ))}
            </TouchableOpacity>
            <TextInput
                ref={codeInputRef}
                value={form.code}
                onChangeText={text => setForm(prev => ({ ...prev, code: text.replace(/[^0-9]/g,'').slice(0,6) }))}
                keyboardType="numeric"
                maxLength={6}
                style={{ position:'absolute', opacity:0 }}
            />
        </View>
    );

    const nextStep = () => {
        if (step === 1) sendCode();
        else setStep(prev => prev + 1);
    };

    const renderWizard = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* STEP 1 - Email */}
            {step === 1 && (
                <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                    <Text style={styles.selectionTitle}>Восстановление пароля</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Введите ваш email"
                        keyboardType="email-address"
                        value={form.email}
                        onChangeText={v=>setForm({...form,email:v})}
                    />
                </Animated.View>
            )}

            {/* STEP 2 - Код */}
            {step === 2 && (
                <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                    <Text style={styles.selectionTitle}>Код подтверждения</Text>
                    {renderCodeInputs()}
                </Animated.View>
            )}

            {/* STEP 3 - Новый пароль */}
            {step === 3 && (
                <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                    <Text style={styles.selectionTitle}>Новый пароль</Text>
                    <Text style={styles.passwordInfo}>Пароль должен содержать минимум 8 символов, 1 латинскую букву, 1 цифру и 1 спецсимвол.</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Введите новый пароль"
                        secureTextEntry
                        value={form.password}
                        onChangeText={v=>setForm({...form,password:v})}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Подтвердите пароль"
                        secureTextEntry
                        value={form.confirmPassword}
                        onChangeText={v=>setForm({...form,confirmPassword:v})}
                    />
                </Animated.View>
            )}

            {/* STEP 4 - Завершение */}
            {step === 4 && (
                <View style={{alignItems:'center',marginTop:50}}>
                    <Text style={styles.selectionTitle}>Пароль обновлён</Text>
                    <Text style={styles.finalText}>Теперь вы можете войти в систему с новым паролем.</Text>
                    <View style={styles.buttonContainer}>
                        <MainButton title="ВОЙТИ" onPress={()=>navigation.navigate('Login')} />
                    </View>
                </View>
            )}

            {step <= 3 && canProceed() && (
                <View style={styles.buttonContainer}>
                    <MainButton title={step===1?'ОТПРАВИТЬ КОД':'ДАЛЕЕ'} onPress={nextStep} />
                </View>
            )}
        </ScrollView>
    );

    return (
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

const MainButton = ({title,onPress}) => (
    <TouchableOpacity style={styles.roleButton} onPress={onPress}>
        <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
);

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
    input:{borderBottomWidth:1,borderBottomColor:BRAND_MINT,marginBottom:20,paddingVertical:10,fontSize:16},
    buttonContainer:{width:'85%',maxWidth:400,alignSelf:'center',marginTop:20},
    roleButton:{backgroundColor:BRAND_MINT,paddingVertical:16,borderRadius:15,alignItems:'center'},
    buttonText:{color:'#FFF',fontSize:18,fontWeight:'bold'},
    passwordInfo:{fontSize:13,color:'#666',marginBottom:20},
    finalText:{textAlign:'center',fontSize:16,color:'#444',paddingHorizontal:20},
    codeContainer:{flexDirection:'row',justifyContent:'space-between',marginTop:20},
    codeBox:{borderBottomWidth:2,borderBottomColor:BRAND_MINT,width:45,alignItems:'center',paddingVertical:10},
    codeDigit:{fontSize:22}
});
