import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const homeStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        alignItems: 'center',
    },
    settingsIcon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
        tintColor: '#fff',
    },

    langSwitch: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        padding: 2,
    },
    langButton: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 18,
    },
    activeLangButton: {
        backgroundColor: '#fff',
    },
    langText: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.7,
    },
    activeLangText: {
        fontWeight: 'bold',
        opacity: 1,
        color: '#2ec4b6',
    },

    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 40,
        opacity: 0.9,
    },
    micContainer: {
        marginBottom: 30,
        marginTop: 18,
    },
    micButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    micImage: {
        width: 180,
        height: 180,
        resizeMode: 'contain',
    },
    hintText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
});