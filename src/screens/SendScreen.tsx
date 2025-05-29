import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import React, {FC, useEffect} from 'react';
import {useTCP} from '../service/TCPProvider';
import Icon from '../components/global/Icon';
import LottieView from 'lottie-react-native';
import {Image} from 'react-native';
import {goBack, navigate} from '../utils/NavigationUtil';
import dgram from 'react-native-udp';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const SendScreen: FC = () => {
  const {connectToServer, isConnected} = useTCP();
  const [nearbyDevices, setNearbyDevices] = React.useState<any[]>([]);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse animation for the scanning indicator
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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

  const handleScan = (data: any) => {
    try {
      const cleanData = data.replace('tcp://', '');
      const parts = cleanData.split('|');

      if (parts.length < 2) {
        console.error('Invalid connection data format - missing parts:', parts);
        return;
      }

      const [connectionData, deviceName] = parts;
      console.log(
        'Connection data:',
        connectionData,
        'Device name:',
        deviceName,
      );

      const connectionParts = connectionData.split(':');
      console.log('Connection parts:', connectionParts);

      if (connectionParts.length < 2) {
        console.error('Invalid host:port format:', connectionParts);
        return;
      }

      const [host, portStr] = connectionParts;
      const port = parseInt(portStr, 10);
      console.log('Parsed host/port:', host, port);

      if (isNaN(port)) {
        console.error('Invalid port number:', portStr);
        return;
      }

      console.log('Attempting connection to:', host, port, deviceName);
      connectToServer(host, port, deviceName);
    } catch (error) {
      console.error('Error in handleScan:', error);
    }
  };

  const handleGoBack = () => {
    goBack();
  };

  const listenForDevices = async () => {
    const server = dgram.createSocket({
      type: 'udp4',
      reusePort: true,
    });
    const port = 57143;
    server.bind(port, () => {
      console.log('Listening for nearby devices...');
    });
    server.on('message', (msg, rinfo) => {
      const [connectionData, otherDevice] = msg
        ?.toString()
        ?.replace('tcp://', '')
        ?.split('|');

      setNearbyDevices(prevDevices => {
        const deviceExists = prevDevices?.some(
          device => device?.name === otherDevice,
        );
        if (!deviceExists) {
          const newDevice = {
            id: `${Date.now()}_${Math.random()}`,
            name: otherDevice,
            image: require('../assets/icons/device.jpg'),
            fullAddress: msg?.toString(),
            position: getRandomPosition(
              120,
              prevDevices?.map(d => d.position),
              45,
            ),
            scale: new Animated.Value(0),
          };
          Animated.timing(newDevice.scale, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }).start();
          return [...prevDevices, newDevice];
        }
        return prevDevices;
      });
    });
  };

  const getRandomPosition = (
    radius: number,
    existingPositions: {x: number; y: number}[],
    minDistance: number,
  ) => {
    let position: any;
    let isOverlapping;

    do {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * (radius - 40) + 40;
      const x = distance * Math.cos(angle);
      const y = distance * Math.sin(angle);

      position = {x, y};
      isOverlapping = existingPositions.some(pos => {
        const dx = pos.x - position.x;
        const dy = pos.y - position.y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });
    } while (isOverlapping);
    return position;
  };

  useEffect(() => {
    if (isConnected) {
      navigate('ConnectionScreen');
    }
  }, [isConnected]);

  useEffect(() => {
    let udpServer: any;
    const setupServer = async () => {
      udpServer = await listenForDevices();
    };
    setupServer();

    return () => {
      if (udpServer) {
        udpServer.close(() => {
          console.log('UDP server closed');
        });
      }
      setNearbyDevices([]);
    };
  }, []);

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
          <Text style={styles.headerTitle}>Find Devices</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Status Section */}
          <View style={styles.statusSection}>
            <View style={styles.statusIcon}>
              <Icon
                name="search"
                iconFamily="Ionicons"
                color="rgba(255, 107, 107, 1)"
                size={28}
              />
            </View>
            <Text style={styles.statusTitle}>Searching for devices</Text>
            <Text style={styles.statusSubtitle}>
              Make sure both devices are connected to the same network or
              hotspot
            </Text>
          </View>

          {/* Scanner Section */}
          <View style={styles.scannerSection}>
            <Animated.View
              style={[
                styles.scannerContainer,
                {transform: [{scale: pulseAnim}]},
              ]}>
              <LottieView
                style={styles.lottie}
                source={require('../assets/animations/scanner.json')}
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
              </View>

              {/* Nearby Devices */}
              {nearbyDevices?.map(device => (
                <Animated.View
                  key={device?.id}
                  style={[
                    styles.deviceDot,
                    {
                      transform: [{scale: device.scale}],
                      left: SCREEN_WIDTH / 2 - 30 + device.position?.x,
                      top: 180 + device.position?.y,
                    },
                  ]}>
                  <TouchableOpacity
                    style={styles.deviceButton}
                    onPress={() => {
                      console.log(
                        'Device pressed:',
                        device?.name,
                        device?.fullAddress,
                      );
                      handleScan(device?.fullAddress);
                    }}>
                    <Image source={device.image} style={styles.deviceImage} />
                    <Text style={styles.deviceName}>{device.name}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
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
              onPress={() => navigate('QRScannerScreen')}>
              <View style={styles.qrButtonIcon}>
                <Icon
                  name="qrcode-scan"
                  iconFamily="MaterialCommunityIcons"
                  color="#ffffff"
                  size={20}
                />
              </View>
              <Text style={styles.qrButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
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
  },
  scannerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerContainer: {
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
    marginTop: -30,
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
  deviceDot: {
    position: 'absolute',
  },
  deviceButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 60,
  },
  deviceImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
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
    backgroundColor: 'rgba(255, 107, 107, 1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: 'rgba(255, 107, 107, 1)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  qrButtonIcon: {
    marginRight: 8,
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default SendScreen;
