// styles/RecordStyles.js
import { StyleSheet } from 'react-native';

const MINT = '#2ec4b6';
const MINT_LIGHT = '#5eead4';
const MINT_BG = '#f0fdfa';

export const recordStyles = StyleSheet.create({
    master: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    back: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    title: {
        fontSize: 32,
        color: 'white',
        marginBottom: 60,
        zIndex: 10,
    },
    center: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    wave: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(46, 196, 182, 0.3)',
    },
    button: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
});
