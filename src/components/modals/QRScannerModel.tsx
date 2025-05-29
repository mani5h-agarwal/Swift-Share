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
import React, {useEffect, useState, useMemo, useRef} from 'react';
import {FC} from 'react';
import Icon from '../global/Icon';
import {Camera, CodeScanner, useCameraDevice} from 'react-native-vision-camera';
import {useTCP} from '../../service/TCPProvider';
import {goBack, navigate} from '../../utils/NavigationUtil';

const QRScannerScreen: FC = () => {
  const {connectToServer, isConnected} = useTCP();
  const [loading, setLoading] = useState(true);
  const [codeFound, setCodeFound] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const device = useCameraDevice('back') as any;

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Scanning line animation
  useEffect(() => {
    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    scanAnimation.start();
    return () => scanAnimation.stop();
  }, []);

  // Pulse animation for corners
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    const checkPermission = async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'granted');
      setLoading(false);
    };
    checkPermission();
  }, []);

  const handleScan = (data: any) => {
    try {
      const cleanData = data.replace('tcp://', '');
      const parts = cleanData.split('|');

      if (parts.length < 2) {
        console.error('Invalid connection data format');
        return;
      }

      const [connectionData, deviceName] = parts;
      const [host, portStr] = connectionData.split(':');
      const port = parseInt(portStr, 10);

      if (isNaN(port)) {
        console.error('Invalid port number');
        return;
      }

      console.log('Connecting to:', host, port, deviceName);
      connectToServer(host, port, deviceName);
    } catch (error) {
      console.error('Error in handleScan:', error);
    }
  };

  const codeScanner = useMemo<CodeScanner>(
    () => ({
      codeTypes: ['qr', 'codabar'],
      onCodeScanned: codes => {
        if (codeFound) return;

        if (codes?.length > 0) {
          const scannedData = codes[0].value;
          console.log('QR Code scanned:', scannedData);
          setCodeFound(true);
          handleScan(scannedData);
        }
      },
    }),
    [codeFound],
  );

  useEffect(() => {
    if (isConnected) {
      navigate('ConnectionScreen');
    }
  }, [isConnected]);

  const handleGoBack = () => {
    goBack();
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
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
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Camera Section */}
          <View style={styles.cameraSection}>
            <View style={styles.cameraContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#ff6b6b" />
                  <Text style={styles.loadingText}>Initializing camera...</Text>
                </View>
              ) : !device || !hasPermission ? (
                <View style={styles.errorContainer}>
                  <Icon
                    name="camera-off"
                    iconFamily="MaterialCommunityIcons"
                    size={40}
                    color="#ff6b6b"
                  />
                  <Text style={styles.errorTitle}>Camera not available</Text>
                  <Text style={styles.errorSubtitle}>
                    Please check camera permissions
                  </Text>
                </View>
              ) : (
                <>
                  <Camera
                    style={styles.camera}
                    isActive={!codeFound}
                    device={device}
                    codeScanner={codeScanner}
                  />

                  {/* Scanning Overlay */}
                  <View style={styles.scannerOverlay}>
                    {/* Corner indicators */}
                    <Animated.View
                      style={[
                        styles.scannerFrame,
                        {transform: [{scale: pulseAnim}]},
                      ]}>
                      <View style={[styles.corner, styles.topLeft]} />
                      <View style={[styles.corner, styles.topRight]} />
                      <View style={[styles.corner, styles.bottomLeft]} />
                      <View style={[styles.corner, styles.bottomRight]} />

                      {/* Scanning line */}
                      <Animated.View
                        style={[
                          styles.scanLine,
                          {
                            transform: [{translateY: scanLineTranslateY}],
                          },
                        ]}
                      />
                    </Animated.View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Icon
                  name="qrcode-scan"
                  iconFamily="MaterialCommunityIcons"
                  color="#ff6b6b"
                  size={24}
                />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Position QR code in frame</Text>
                <Text style={styles.infoSubtitle}>
                  Make sure both devices are on the same Wi-Fi network
                </Text>
              </View>
            </View>

            <View style={styles.statusCard}>
              <View style={styles.statusIndicator}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {codeFound ? 'Connecting...' : 'Scanning...'}
                </Text>
              </View>
              {codeFound && (
                <ActivityIndicator
                  size="small"
                  color="#ff6b6b"
                  style={styles.connectingSpinner}
                />
              )}
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
  content: {
    flex: 1,
  },
  cameraSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cameraContainer: {
    width: 280,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  noCameraImage: {
    width: 60,
    height: 60,
    marginBottom: 16,
    opacity: 0.7,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#ff6b6b',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
    marginRight: 8,
    shadowColor: '#ff6b6b',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  connectingSpinner: {
    marginLeft: 8,
  },
});

export default QRScannerScreen;
