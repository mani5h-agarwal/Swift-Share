import {View, TouchableOpacity, Text, Animated} from 'react-native';
import {StyleSheet} from 'react-native';
import React, {FC, useRef} from 'react';
import {screenHeight, screenWidth} from '../../utils/Constants';
import {navigate} from '../../utils/NavigationUtil';
import Icon from '../global/Icon';
import LinearGradient from 'react-native-linear-gradient';

const SendReceiveButton: FC = () => {
  const sendScale = useRef(new Animated.Value(1)).current;
  const receiveScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 0.8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Send Button */}
      <Animated.View
        style={[styles.buttonWrapper, {transform: [{scale: sendScale}]}]}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigate('SendScreen')}
          onPressIn={() => handlePressIn(sendScale)}
          onPressOut={() => handlePressOut(sendScale)}
          activeOpacity={1}>
          <LinearGradient
            colors={['rgba(255, 107, 107, 1)', 'rgba(255, 142, 83, 1)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.gradientButton}>
            {/* Background Pattern */}
            <View style={styles.backgroundPattern}>
              <View style={[styles.circle, styles.circle1]} />
              <View style={[styles.circle, styles.circle2]} />
              <View style={[styles.circle, styles.circle3]} />
            </View>

            {/* Content */}
            <View style={styles.buttonContent}>
              <View style={styles.iconContainer}>
                <Icon
                  name="paper-plane"
                  size={28}
                  color="#fff"
                  iconFamily="Ionicons"
                />
              </View>
              <Text style={styles.buttonTitle}>Send</Text>
              <Text style={styles.buttonSubtitle}>Share files instantly</Text>
            </View>

            {/* Shine Effect */}
            <View style={styles.shineEffect} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Receive Button */}
      <Animated.View
        style={[styles.buttonWrapper, {transform: [{scale: receiveScale}]}]}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigate('ReceiveScreen')}
          onPressIn={() => handlePressIn(receiveScale)}
          onPressOut={() => handlePressOut(receiveScale)}
          activeOpacity={1}>
          <LinearGradient
            colors={['rgba(128, 77, 204, 1)', 'rgba(153, 102, 255, 1)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.gradientButton}>
            {/* Background Pattern */}
            <View style={styles.backgroundPattern}>
              <View style={[styles.circle, styles.circle1]} />
              <View style={[styles.circle, styles.circle2]} />
              <View style={[styles.circle, styles.circle3]} />
            </View>

            {/* Content */}
            <View style={styles.buttonContent}>
              <View style={styles.iconContainer}>
                <Icon
                  name="download"
                  size={28}
                  color="#fff"
                  iconFamily="Ionicons"
                />
              </View>
              <Text style={styles.buttonTitle}>Receive</Text>
              <Text style={styles.buttonSubtitle}>Get files from others</Text>
            </View>

            {/* Shine Effect */}
            <View style={styles.shineEffect} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default SendReceiveButton;

const styles = StyleSheet.create({
  container: {
    marginTop: screenHeight * 0.05,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },

  buttonWrapper: {
    flex: 1,
    maxWidth: (screenWidth - 55) / 2, // Account for padding and gap
  },

  button: {
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  gradientButton: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
  },

  circle1: {
    width: 80,
    height: 80,
    top: -20,
    right: -20,
  },

  circle2: {
    width: 60,
    height: 60,
    bottom: -15,
    left: -15,
  },

  circle3: {
    width: 40,
    height: 40,
    top: '50%',
    right: 10,
    opacity: 0.6,
  },

  buttonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    zIndex: 2,
  },

  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  buttonSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },

  shineEffect: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 50,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{skewX: '-20deg'}],
    zIndex: 1,
  },
});
