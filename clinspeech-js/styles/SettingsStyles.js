import { StyleSheet } from 'react-native';

export const settingsStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        height: 60,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ffffff',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    content: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingTop: 20,
    },
    placeholderText: {
        color: '#000000',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
    }
});