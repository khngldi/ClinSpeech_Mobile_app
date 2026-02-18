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
    KeyboardAvoidingView,
    ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BRAND_CYAN = '#00CCFF';
const TOTAL_STEPS = 7;

const isWeb = Platform.OS === 'web';
const isLargeScreen = SCREEN_WIDTH > 600;

const SPECIALIZATIONS = [
    'Кардиолог',
    'Невролог',
    'Педиатр',
    'Терапевт',
    'Хирург',
    'Офтальмолог'
];

export default function RegisterScreen() {

    const [role, setRole] = useState(null);
    const [step, setStep] = useState(1);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const [form, setForm] = useState({
        lastName:'',
        firstName:'',
        middleName:'',
        iin:'',
        birthDate:'',
        city:'',
        specialization:'',
        documentType:'',
        documentFile:null,
        email:'',
        code:['','','',''],
        password:'',
        confirmPassword:''
    });

    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(30);

        Animated.parallel([
            Animated.timing(fadeAnim,{
                toValue:1,
                duration:300,
                easing:Easing.out(Easing.ease),
                useNativeDriver:true
            }),
            Animated.timing(slideAnim,{
                toValue:0,
                duration:300,
                useNativeDriver:true
            })
        ]).start();
    },[step]);

    const formatDate = (value) => {
        const cleaned = value.replace(/\D/g,'');
        let formatted = cleaned;

        if(cleaned.length > 2)
            formatted = cleaned.slice(0,2)+'-'+cleaned.slice(2);
        if(cleaned.length > 4)
            formatted = cleaned.slice(0,2)+'-'+cleaned.slice(2,4)+'-'+cleaned.slice(4,8);

        return formatted;
    };

    const isValidDate = /^\d{2}-\d{2}-\d{4}$/.test(form.birthDate);

    const isPasswordValid = () =>
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(form.password);

    const isCodeValid = () =>
        form.code.every(d => d.length === 1);

    const canProceed = () => {
        switch(step){
            case 1:
                return form.lastName &&
                    form.firstName &&
                    form.iin.length===12 &&
                    isValidDate &&
                    form.city;
            case 2:
                return !!form.specialization;
            case 3:
                return !!form.documentType && !!form.documentFile;
            case 4:
                return form.email.includes('@');
            case 5:
                return isCodeValid();
            case 6:
                return isPasswordValid() &&
                    form.password===form.confirmPassword;
            default:
                return true;
        }
    };

    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type:'application/pdf'
        });
        if(!result.canceled){
            setForm(prev=>({...prev, documentFile: result.assets[0]}));
        }
    };

    const renderCodeInputs = () => (
        <View style={styles.codeContainer}>
            {form.code.map((digit,index)=>(
                <TextInput
                    key={index}
                    style={styles.codeInput}
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    onChangeText={val=>{
                        const newCode=[...form.code];
                        newCode[index]=val;
                        setForm(prev=>({...prev,code:newCode}));
                    }}
                />
            ))}
        </View>
    );

    const nextStep = () => {
        if(step < TOTAL_STEPS){
            setStep(prev => prev + 1);
        }
    };

    const renderWizard = () => {

        if(!role){
            return(
                <>
                    <Text style={styles.selectionTitle}>Выберите роль</Text>

                    <View style={styles.imageContainer}>
                        <Image
                            source={require('../assets/photo1.png')}
                            style={styles.mainIllustration}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <MainButton title="ВРАЧ" onPress={()=>setRole('doctor')} />
                    </View>
                </>
            );
        }

        return (
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >

                {step <= 6 && (
                    <View style={styles.progressWrapper}>
                        <View style={styles.progressBackground}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {width:`${(step/6)*100}%`}
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            Шаг {step} из 6
                        </Text>
                    </View>
                )}

                {/* STEP 1 */}
                {step===1 && (
                    <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                        <Title text="Регистрация врача" />

                        <Input placeholder="Фамилия"
                               value={form.lastName}
                               onChangeText={v=>setForm({...form,lastName:v})}/>

                        <Input placeholder="Имя"
                               value={form.firstName}
                               onChangeText={v=>setForm({...form,firstName:v})}/>

                        <Input placeholder="Отчество"
                               value={form.middleName}
                               onChangeText={v=>setForm({...form,middleName:v})}/>

                        <Input placeholder="ИИН"
                               keyboardType="numeric"
                               maxLength={12}
                               value={form.iin}
                               onChangeText={v=>setForm({...form,iin:v.replace(/[^0-9]/g,'')})}/>

                        <Input placeholder="ДД-ММ-ГГГГ"
                               keyboardType="numeric"
                               maxLength={10}
                               value={form.birthDate}
                               onChangeText={v=>setForm({...form,birthDate:formatDate(v)})}/>

                        <Picker selectedValue={form.city}
                                onValueChange={v=>setForm({...form,city:v})}>
                            <Picker.Item label="Выберите город" value="" />
                            <Picker.Item label="Алматы" value="Алматы" />
                            <Picker.Item label="Астана" value="Астана" />
                            <Picker.Item label="Шымкент" value="Шымкент" />
                        </Picker>
                    </Animated.View>
                )}

                {/* STEP 2 */}
                {step===2 && (
                    <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                        <Title text="Выбор специализации" />
                        <Picker selectedValue={form.specialization}
                                onValueChange={v=>setForm({...form,specialization:v})}>
                            <Picker.Item label="Выберите специализацию" value="" />
                            {SPECIALIZATIONS.map(s=>
                                <Picker.Item key={s} label={s} value={s}/>
                            )}
                        </Picker>
                    </Animated.View>
                )}

                {/* STEP 3 */}
                {step===3 && (
                    <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                        <Title text="Тип документа" />

                        <SelectButton label="Паспорт"
                                      active={form.documentType==='passport'}
                                      onPress={()=>setForm({...form,documentType:'passport'})}/>

                        <SelectButton label="Удостоверение личности"
                                      active={form.documentType==='id'}
                                      onPress={()=>setForm({...form,documentType:'id'})}/>

                        {form.documentType && (
                            <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                                <Text>
                                    {form.documentFile ? 'PDF загружен' : 'Загрузить PDF'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                )}

                {/* STEP 4 */}
                {step===4 && (
                    <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                        <Title text="Электронная почта" />
                        <Input placeholder="example@mail.com"
                               keyboardType="email-address"
                               value={form.email}
                               onChangeText={v=>setForm({...form,email:v})}/>
                    </Animated.View>
                )}

                {/* STEP 5 */}
                {step===5 && (
                    <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                        <Title text="Код подтверждения" />
                        {renderCodeInputs()}
                    </Animated.View>
                )}

                {/* STEP 6 */}
                {step===6 && (
                    <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>
                        <Title text="Создать пароль" />
                        <Text style={styles.passwordInfo}>
                            Пароль должен содержать минимум 8 символов,
                            1 латинскую букву, 1 цифру и 1 спецсимвол.
                        </Text>

                        <Input secureTextEntry
                               placeholder="Введите пароль"
                               value={form.password}
                               onChangeText={v=>setForm({...form,password:v})}/>

                        <Input secureTextEntry
                               placeholder="Подтвердите пароль"
                               value={form.confirmPassword}
                               onChangeText={v=>setForm({...form,confirmPassword:v})}/>
                    </Animated.View>
                )}

                {/* STEP 7 */}
                {step===7 && (
                    <View style={{alignItems:'center',marginTop:50}}>
                        <Title text="Заявка отправлена" />
                        <ActivityIndicator size="large" color={BRAND_CYAN} style={{marginVertical:20}}/>
                        <Text style={styles.finalText}>
                            Мы отправили ваши данные на проверку.
                            Ожидайте подтверждение на почте.
                        </Text>
                    </View>
                )}

                {step<=6 && canProceed() && (
                    <View style={styles.buttonContainer}>
                        <MainButton title="ДАЛЕЕ" onPress={nextStep}/>
                    </View>
                )}

            </ScrollView>
        );
    };

    return(
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <ImageBackground
                    source={require('../assets/Ellipse 4.png')}
                    style={styles.headerBackground}
                    resizeMode="stretch">
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.logoWrapper}>
                            <Image
                                source={require('../assets/App_logo.png')}
                                style={styles.miniLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.headerTitle}>ClinSpeech</Text>
                        </View>
                    </SafeAreaView>
                </ImageBackground>
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS==='ios'?'padding':undefined}
            >
                {renderWizard()}
            </KeyboardAvoidingView>
        </View>
    );
}

/* ---------- COMPONENTS ---------- */

const Title = ({text})=>(<Text style={styles.selectionTitle}>{text}</Text>);

const Input = props=>(<TextInput style={styles.input} placeholderTextColor="#999" {...props}/>);

const MainButton = ({title,onPress})=>(<TouchableOpacity style={styles.roleButton} onPress={onPress}><Text style={styles.buttonText}>{title}</Text></TouchableOpacity>);

const SelectButton = ({label,active,onPress})=>(<TouchableOpacity style={[styles.selectBtn, active && {borderColor:BRAND_CYAN}]} onPress={onPress}><Text>{label}</Text></TouchableOpacity>);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
    container:{flex:1,backgroundColor:'#FFF'},
    headerContainer:{width:'100%',height:isWeb?180:SCREEN_HEIGHT*0.22,minHeight:150},
    headerBackground:{width:'100%',height:'100%'},
    safeArea:{flex:1,justifyContent:'center',alignItems:'center'},
    logoWrapper:{alignItems:'center'},
    miniLogo:{width:40,height:40,marginBottom:5},
    headerTitle:{fontSize:26,fontWeight:'bold',color:'#FFF'},
    content:{flex:1,width:'100%',paddingHorizontal:20},
    scrollContent:{flexGrow:1,paddingBottom:40},
    selectionTitle:{fontSize:22,fontWeight:'bold',textAlign:'center',marginBottom:25,color:'#333'},
    input:{borderBottomWidth:1,borderBottomColor:BRAND_CYAN,marginBottom:20,paddingVertical:10,fontSize:16},
    buttonContainer:{width:'85%',maxWidth:400,alignSelf:'center',marginTop:20},
    roleButton:{backgroundColor:BRAND_CYAN,paddingVertical:16,borderRadius:15,alignItems:'center'},
    buttonText:{color:'#FFF',fontSize:18,fontWeight:'bold'},
    progressWrapper:{marginBottom:25},
    progressBackground:{height:8,backgroundColor:'#eee',borderRadius:10,overflow:'hidden'},
    progressFill:{height:'100%',backgroundColor:BRAND_CYAN},
    progressText:{textAlign:'center',marginTop:6,fontSize:12,color:'#666'},
    imageContainer:{width:isLargeScreen?400:SCREEN_WIDTH*0.8,alignSelf:'center',alignItems:'center',marginVertical:10},
    mainIllustration:{width:'100%',height:200},
    selectBtn:{borderWidth:1,borderColor:'#ddd',padding:15,borderRadius:12,marginBottom:15,alignItems:'center'},
    uploadBtn:{borderWidth:1,borderColor:BRAND_CYAN,padding:15,borderRadius:12,marginTop:20,alignItems:'center'},
    codeContainer:{flexDirection:'row',justifyContent:'space-between',marginTop:20},
    codeInput:{borderBottomWidth:2,borderBottomColor:BRAND_CYAN,width:50,textAlign:'center',fontSize:22,paddingVertical:10},
    passwordInfo:{fontSize:13,color:'#666',marginBottom:20},
    finalText:{textAlign:'center',fontSize:16,color:'#444',paddingHorizontal:20}
});
