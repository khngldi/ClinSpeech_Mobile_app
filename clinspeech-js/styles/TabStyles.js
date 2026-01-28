import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const TAB_HEIGHT = 65;

export const tabStyles = StyleSheet.create({
    tabBarWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    overlay: {
        position: 'absolute',
        bottom: TAB_HEIGHT,
        width: width,
        height: height,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    subMenuContainer: {
        position: 'absolute',
        bottom: TAB_HEIGHT,
        left: 0,
        width: '75%',
        height: TAB_HEIGHT,
    },
    gradientBackground: {
        flex: 1,
        flexDirection: 'row',
    },
    subMenuItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightColor: 'rgba(255,255,255,0.2)',
    },

    subMenuIcon: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
        tintColor: '#fff',
    },
    subMenuText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 4,
        fontWeight: '600',
    },
    mainTabBarContainer: {
        height: TAB_HEIGHT,
        width: '100%',
    },
    tabsRow: {
        flexDirection: 'row',
        height: '100%',
    },
    tabItem: {
        flex: 1,
    },
    iconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },

    mainIcon: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
        tintColor: '#fff',
    },
    activeBackground: {
        backgroundColor: '#005864',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
        color: '#ffffff',
    }
});