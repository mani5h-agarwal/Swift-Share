import {View, Text, Animated, Dimensions, StatusBar} from 'react-native';
import React, {FC, useEffect, useRef} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '../components/global/Icon';
import {navigate} from '../utils/NavigationUtil';

const {width, height} = Dimensions.get('window');

const SplashScreen: FC = () => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(50)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const backgroundScale = useRef(new Animated.Value(0.8)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  const navigateToHome = () => {
    navigate('HomeScreen');
  };

  useEffect(() => {
    // Background scale animation
    Animated.timing(backgroundScale, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Logo animations sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(textSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Sparkle effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const timeoutId = setTimeout(navigateToHome, 2500);
    return () => clearTimeout(timeoutId);
  }, []);

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="rgba(128, 77, 204, 1)"
      />
      <LinearGradient
        colors={[
          'rgba(128, 77, 204, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(180, 130, 255, 1)',
        ]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.container}>
        {/* Animated Background Elements */}
        <Animated.View
          style={[
            styles.backgroundCircle,
            {
              transform: [{scale: backgroundScale}],
            },
          ]}
        />

        {/* Sparkle Effects */}
        <Animated.View
          style={[styles.sparkle, styles.sparkle1, {opacity: sparkleOpacity}]}
        />
        <Animated.View
          style={[styles.sparkle, styles.sparkle2, {opacity: sparkleOpacity}]}
        />
        <Animated.View
          style={[styles.sparkle, styles.sparkle3, {opacity: sparkleOpacity}]}
        />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo Container */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  {scale: logoScale},
                  {rotate: logoRotateInterpolate},
                ],
              },
            ]}>
            <View style={styles.logoInner}>
              <Icon name="flash" size={48} color="#fff" iconFamily="Ionicons" />
            </View>
          </Animated.View>

          {/* App Title */}
          <Animated.View
            style={{
              opacity: textOpacity,
              transform: [{translateY: textSlide}],
            }}>
            <Text style={styles.appTitle}>Swift Share</Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={{opacity: subtitleOpacity}}>
            <Text style={styles.appSubtitle}>Share your files instantly</Text>
          </Animated.View>

          {/* Loading Indicator */}
          <Animated.View
            style={[styles.loadingContainer, {opacity: subtitleOpacity}]}>
            <View style={styles.loadingBar}>
              <Animated.View
                style={[
                  styles.loadingProgress,
                  {
                    transform: [{scaleX: backgroundScale}],
                  },
                ]}
              />
            </View>
          </Animated.View>
        </View>

        {/* Bottom Wave Effect */}
        <View style={styles.waveContainer}>
          <View style={styles.wave} />
        </View>
      </LinearGradient>
    </>
  );
};

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -width * 0.3,
  },
  sparkle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  sparkle1: {
    top: height * 0.2,
    left: width * 0.2,
  },
  sparkle2: {
    top: height * 0.3,
    right: width * 0.25,
  },
  sparkle3: {
    bottom: height * 0.25,
    left: width * 0.15,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 3},
    textShadowRadius: 6,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingBar: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
    transformOrigin: 'left',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
};

export default SplashScreen;
