import {View, Text, SafeAreaView, Image, StatusBar} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '../global/Icon';

const HomeHeader = () => {
  return (
    <LinearGradient
      colors={['rgba(128, 77, 204, 1)', 'rgba(153, 102, 255, 1)']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <View style={homeHeaderStyles.mainContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="rgba(128, 77, 204, 1)"
        />
        <SafeAreaView />
        <View style={homeHeaderStyles.container}>
          <View style={homeHeaderStyles.logoSection}>
            <View style={homeHeaderStyles.logoContainer}>
              <Icon name="flash" size={24} color="#fff" iconFamily="Ionicons" />
            </View>
            <Text style={homeHeaderStyles.appTitle}>Swift Share</Text>
          </View>
          <View style={homeHeaderStyles.profileButton}>
            <Image
              source={require('../../assets/images/10459459.jpg')}
              style={homeHeaderStyles.profile}
            />
            <View style={homeHeaderStyles.statusIndicator} />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

export default HomeHeader;

import {StyleSheet} from 'react-native';

const homeHeaderStyles = StyleSheet.create({
  mainContainer: {
    // backgroundColor: 'rgba(128, 77, 204, 1)',
    position: 'relative',
    zIndex: 1,
  },

  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  menuButton: {
    padding: 8,
  },

  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  logoSection: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },

  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  appTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },

  appSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Profile Button Styles
  profileButton: {
    position: 'relative',
    padding: 4,
  },

  profile: {
    width: 46,
    height: 46,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  statusIndicator: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4ADE80',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
