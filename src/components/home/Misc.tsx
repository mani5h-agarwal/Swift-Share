import {View, Text, StyleSheet} from 'react-native';
import React from 'react';
import CustomText from '../global/CustomText';
import LinearGradient from 'react-native-linear-gradient';

const Misc = () => {
  return (
    <View style={styles.container}>
      {/* Developer Credit Card */}
      <LinearGradient
        colors={['rgba(128, 77, 204, 0.1)', 'rgba(153, 102, 255, 0.05)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.creditCard}>
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        {/* Content */}
        <View style={styles.creditContent}>
          <View style={styles.heartContainer}>
            <Text style={styles.heartIcon}>❤️</Text>
          </View>

          <CustomText
            fontFamily="Okra-Bold"
            fontSize={16}
            style={styles.madeWithText}>
            Made with love by
          </CustomText>

          <CustomText
            fontFamily="Okra-Bold"
            fontSize={18}
            style={styles.developerName}>
            Manish Agarwal
          </CustomText>

          <View style={styles.tagline}>
            <CustomText
              fontFamily="Okra-Medium"
              fontSize={12}
              style={styles.taglineText}>
              Crafting seamless file sharing experiences
            </CustomText>
          </View>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeElements}>
          <View style={styles.smallDot} />
          <View style={[styles.smallDot, styles.smallDot2]} />
          <View style={[styles.smallDot, styles.smallDot3]} />
        </View>
      </LinearGradient>
    </View>
  );
};

export default Misc;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  creditCard: {
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(128, 77, 204, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: 'rgba(128, 77, 204, 0.3)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(128, 77, 204, 0.06)',
    borderRadius: 999,
  },

  circle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -30,
  },

  circle2: {
    width: 60,
    height: 60,
    bottom: -20,
    left: -20,
  },

  circle3: {
    width: 40,
    height: 40,
    top: '60%',
    right: 20,
    opacity: 0.4,
  },

  creditContent: {
    alignItems: 'center',
    zIndex: 2,
  },

  heartContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },

  heartIcon: {
    fontSize: 28,
  },

  madeWithText: {
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 4,
    textAlign: 'center',
  },

  developerName: {
    color: 'rgba(128, 77, 204, 1)',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  tagline: {
    backgroundColor: 'rgba(128, 77, 204, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(128, 77, 204, 0.15)',
  },

  taglineText: {
    color: 'rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

  smallDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(153, 102, 255, 0.3)',
  },

  smallDot2: {
    top: 20,
    left: 30,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },

  smallDot3: {
    bottom: 30,
    right: 50,
    backgroundColor: 'rgba(128, 77, 204, 0.3)',
  },
});
