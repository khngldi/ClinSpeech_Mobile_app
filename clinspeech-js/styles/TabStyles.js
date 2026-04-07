import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const TAB_HEIGHT = 72;

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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    subMenuContainer: {
        position: 'absolute',
        bottom: TAB_HEIGHT + 12,
        left: 16,
        right: 16,
        height: 80,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#14b8a6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    gradientBackground: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.98)',
    },
    subMenuItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
    },
    subMenuItemActive: {
        backgroundColor: 'rgba(46,196,182,0.15)',
    },
    subMenuIcon: {
        width: 28,
        height: 28,
        resizeMode: 'contain',
        tintColor: '#14b8a6',
    },
    subMenuIconActive: {
        tintColor: '#0d9488',
    },
    subMenuText: {
        color: '#475569',
        fontSize: 11,
        marginTop: 4,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    subMenuTextActive: {
        color: '#14b8a6',
        fontWeight: '700',
    },
    mainTabBarContainer: {
        height: TAB_HEIGHT,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#14b8a6',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 12,
        ...Platform.select({
            android: {
                borderTopWidth: 0,
            },
            ios: {
                borderTopWidth: 0.5,
                borderTopColor: 'rgba(20,184,166,0.15)',
            },
        }),
    },
    tabsRow: {
        flexDirection: 'row',
        height: '100%',
        paddingHorizontal: 8,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 8,
    },
    iconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        borderRadius: 16,
        marginHorizontal: 4,
    },
    mainIcon: {
        width: 26,
        height: 26,
        resizeMode: 'contain',
    },
    activeBackground: {
        backgroundColor: 'rgba(46,196,182,0.12)',
        borderRadius: 16,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 3,
        letterSpacing: 0.1,
    },
    labelActive: {
        color: '#14b8a6',
    },
    labelInactive: {
        color: '#9ca3af',
    },
});