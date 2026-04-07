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
        tintColor: '#1a1a2e',
    },

    langSwitch: {
        flexDirection: 'row',
        backgroundColor: 'rgba(46, 196, 182, 0.12)',
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
        color: '#64748b',
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
        position: 'relative',
        zIndex: 1,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1a1a2e',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#64748b',
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
        color: '#1a1a2e',
        textAlign: 'center',
    },
});