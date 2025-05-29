import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Platform,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import React, {FC, useEffect} from 'react';
import {useState} from 'react';
import Icon from '../components/global/Icon';
import LottieView from 'lottie-react-native';
import DeviceInfo from 'react-native-device-info';
import {goBack, navigate} from '../utils/NavigationUtil';
import {useTCP} from '../service/TCPProvider';
import {getBroadcastIPAddress, getLocalIPAddress} from '../utils/networkUtils';
import dgram from 'react-native-udp';

const ReceiveScreen: FC = () => {
  const {startServer, server, isConnected} = useTCP();
  const [qrValue, setQrValue] = useState('');
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  // Pulse animation for the receiving indicator
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Rotation animation for status icon
  React.useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    rotate.start();
    return () => rotate.stop();
  }, []);

  const setupServer = async () => {
    const deviceName = await DeviceInfo.getDeviceName();
    const port = 4000;
    const ip = await getLocalIPAddress();
    if (!server) {
      startServer(port);
    }
    setQrValue(`tcp://${ip}:${port} | ${deviceName}`);
    console.log('server info', `tcp://${ip}:${port} | ${deviceName}`);
  };

  const sendDiscoverySignal = async () => {
    const deviceName = await DeviceInfo.getDeviceName();
    const broadcastAddress = await getBroadcastIPAddress();
    const targetAddress = broadcastAddress || '255.255.255.255';
    const port = 57143;

    const client = dgram.createSocket({
      type: 'udp4',
      reusePort: true,
    });
    client.bind(() => {
      try {
        if (Platform.OS === 'ios') {
          client.setBroadcast(true);
        }
        client.send(
          `${qrValue}`,
          0,
          `${qrValue}`.length,
          port,
          targetAddress,
          err => {
            if (err) {
              console.error('Error sending discovery signal:', err);
            } else {
              console.log(
                `${deviceName} discovery signal sent to ${targetAddress}`,
              );
            }
            client.close();
          },
        );
      } catch (error) {
        console.error('failed to set broadcast or send: ', error);
        client.close();
      }
    });
  };

  useEffect(() => {
    if (!qrValue) return;
    sendDiscoverySignal();
    intervalRef.current = setInterval(sendDiscoverySignal, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [qrValue]);

  const handleGoBack = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    goBack();
  };

  useEffect(() => {
    if (isConnected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      navigate('ConnectionScreen');
    }
  }, [isConnected]);

  useEffect(() => {
    setupServer();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <View style={styles.backButtonInner}>
              <Icon
                name="arrow-back"
                iconFamily="Ionicons"
                size={20}
                color="#1a1a1a"
              />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ready to Receive</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Status Section */}
          <View style={styles.statusSection}>
            <Animated.View
              style={[styles.statusIcon, {transform: [{rotate: spin}]}]}>
              <Icon
                name="wifi"
                iconFamily="MaterialIcons"
                color="rgba(128, 77, 204, 1)"
                size={28}
              />
            </Animated.View>
            <Text style={styles.statusTitle}>Broadcasting signal</Text>
            <Text style={styles.statusSubtitle}>
              Your device is now discoverable by nearby senders
            </Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>Online</Text>
            </View>
          </View>

          {/* Animation Section */}
          <View style={styles.animationSection}>
            <Animated.View
              style={[
                styles.animationContainer,
                {transform: [{scale: pulseAnim}]},
              ]}>
              <LottieView
                style={styles.lottie}
                source={require('../assets/animations/scan2.json')}
                autoPlay
                loop={true}
                hardwareAccelerationAndroid
              />

              {/* Center Profile */}
              <View style={styles.centerProfile}>
                <Image
                  source={require('../assets/images/10459459.jpg')}
                  style={styles.profileImage}
                />
                <View style={styles.activeIndicator} />
              </View>
            </Animated.View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => navigate('QRGeneratorScreen')}>
              <View style={styles.qrButtonIcon}>
                <Icon
                  name="qrcode"
                  iconFamily="MaterialCommunityIcons"
                  color="#ffffff"
                  size={20}
                />
              </View>
              <Text style={styles.qrButtonText}>Show QR Code</Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <Icon
                name="info"
                // iconFamily="Feather"
                iconFamily="MaterialIcons"
                color="#64748b"
                size={16}
              />
              <Text style={styles.infoText}>
                Keep this screen open while the sender searches for your device
              </Text>
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(128, 77, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 77, 204, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(128, 77, 204, 0.1)',
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
  animationSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationContainer: {
    position: 'relative',
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 280,
    height: 280,
  },
  centerProfile: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -29,
    marginLeft: -30,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  actionSection: {
    paddingBottom: 40,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 77, 204, 1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: 'rgba(128, 77, 204, 1)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  qrButtonIcon: {
    marginRight: 8,
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default ReceiveScreen;
