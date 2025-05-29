import {
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import React, {useEffect, useState, useRef} from 'react';
import {FC} from 'react';
import QRCode from 'react-native-qrcode-svg';
import Icon from '../global/Icon';
import {useTCP} from '../../service/TCPProvider';
import DeviceInfo from 'react-native-device-info';
import {getLocalIPAddress} from '../../utils/networkUtils';
import {goBack, navigate} from '../../utils/NavigationUtil';

const QRGeneratorScreen: FC = () => {
  const {isConnected, startServer, server} = useTCP();
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for QR container
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Glow animation
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    glow.start();
    return () => glow.stop();
  }, []);

  // Scale animation for QR appearance
  useEffect(() => {
    if (!loading && qrValue) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, qrValue]);

  const setupServer = async () => {
    try {
      const name = await DeviceInfo.getDeviceName();
      const ip = await getLocalIPAddress();
      const port = 4000;

      setDeviceName(name);
      setIpAddress(ip);

      if (!server) {
        startServer(port);
      }

      const connectionString = `tcp://${ip}:${port} | ${name}`;
      setQrValue(connectionString);
      console.log('Server info:', connectionString);

      setTimeout(() => setLoading(false), 800);
    } catch (error) {
      console.error('Setup server error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setupServer();
  }, []);

  useEffect(() => {
    if (isConnected) {
      navigate('ConnectionScreen');
    }
  }, [isConnected]);

  const handleGoBack = () => {
    goBack();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <View style={styles.backButtonInner}>
              <Icon
                name="arrow-back"
                iconFamily="Ionicons"
                size={20}
                color="#ffffff"
              />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share QR Code</Text>
           <View style={styles.placeholder} />
        </View>
        {/* Main Content */}
        <View style={styles.content}>
          {/* Device Info Section */}
          <View style={styles.deviceInfoSection}>
            <View style={styles.deviceIcon}>
              <Icon
                name="devices"
                iconFamily="MaterialIcons"
                color="rgba(128, 77, 204, 1)"
                size={28}
              />
            </View>
            <Text style={styles.deviceTitle}>Ready to Connect</Text>
            <Text style={styles.deviceSubtitle}>
              {deviceName || 'Your Device'} • {ipAddress || 'Getting IP...'}
            </Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>Broadcasting</Text>
            </View>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <Animated.View
              style={[
                styles.qrContainer,
                {
                  transform: [{scale: pulseAnim}, {scale: scaleAnim}],
                },
              ]}>
              {loading || !qrValue ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.skeletonQR}>
                    <ActivityIndicator
                      size="large"
                      color="rgba(128, 77, 204, 1)"
                    />
                    <Text style={styles.loadingText}>
                      Generating QR code...
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  {/* Glow effect */}
                  <Animated.View
                    style={[
                      styles.glowEffect,
                      {
                        opacity: glowOpacity,
                      },
                    ]}
                  />

                  <QRCode
                    value={qrValue}
                    size={220}
                    logoSize={50}
                    logoBackgroundColor="#ffffff"
                    logoMargin={4}
                    logoBorderRadius={25}
                    logo={require('../../assets/images/10459459.jpg')}
                    backgroundColor="transparent"
                    color="#1a1a1a"
                  />
                </>
              )}
            </Animated.View>
          </View>

          {/* Instructions Section */}
          <View style={styles.instructionsSection}>
            <View style={styles.instructionCard}>
              <View style={styles.instructionIconContainer}>
                <Icon
                  name="wifi"
                  iconFamily="MaterialIcons"
                  color="rgba(128, 77, 204, 1)"
                  size={20}
                />
              </View>
              <View style={styles.instructionTextContainer}>
                <Text style={styles.instructionTitle}>
                  Same Network Required
                </Text>
                <Text style={styles.instructionSubtitle}>
                  Both devices must be connected to the same Wi-Fi network
                </Text>
              </View>
            </View>
          </View>

          {/* Status Section */}
          <View style={styles.statusSection}>
            <View style={styles.statusCard}>
              <View style={styles.statusIndicator}>
                <View style={styles.statusDotLarge} />
                <Text style={styles.statusText}>Waiting for connection...</Text>
              </View>
              <ActivityIndicator
                size="small"
                color="rgba(128, 77, 204, 1)"
                style={styles.statusSpinner}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
    placeholder: {
    width: 44,
  },
  shareButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  deviceInfoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  deviceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(128, 77, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(128, 77, 204, 0.2)',
  },
  deviceTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  deviceSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 77, 204, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(128, 77, 204, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(128, 77, 204, 1)',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(128, 77, 204, 1)',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrContainer: {
    position: 'relative',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    shadowColor: 'rgba(128, 77, 204, 1)',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 34,
    backgroundColor: 'rgba(128, 77, 204, 0.4)',
    shadowColor: 'rgba(128, 77, 204, 1)',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  loadingContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonQR: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(128, 77, 204, 1)',
    fontWeight: '500',
    marginTop: 16,
  },
  instructionsSection: {
    marginBottom: 5,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 77, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 77, 204, 0.2)',
  },
  instructionTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  instructionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  statusSection: {
    marginBottom: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(128, 77, 204, 1)',
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statusSpinner: {
    marginLeft: 16,
  },
});

export default QRGeneratorScreen;
