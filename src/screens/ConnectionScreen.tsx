// ConnectionScreen.tsx - Added loading state for file processing
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
} from 'react-native';
import React, {FC, useEffect, useState} from 'react';
import {useTCP} from '../service/TCPProvider';
import Icon from '../components/global/Icon';
import {resetAndNavigate} from '../utils/NavigationUtil';
import LinearGradient from 'react-native-linear-gradient';
import {formatFileSize, getFileTypeCategory} from '../utils/libraryHelpers';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  pickMedia,
  pickDocument,
  checkCameraPermissions,
  checkFilePermissions,
} from '../utils/libraryHelpers';

const ConnectionScreen: FC = () => {
  const {
    connectedDevice,
    disconnect,
    sendFileAck,
    sentFiles,
    receivedFiles,
    totalReceivedBytes,
    totalSentBytes,
    isConnected,
    cancelTransfer,
  } = useTCP();

  const [activeTab, setActiveTab] = useState<'SENT' | 'RECEIVED'>('SENT');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingFileName, setProcessingFileName] = useState('');

  const fileOptions = [
    {
      id: 'media',
      title: 'Media',
      icon: 'camera',
      colors: ['rgba(255, 107, 107, 1)', 'rgba(255, 142, 83, 1)'],
    },
    {
      id: 'documents',
      title: 'Documents',
      icon: 'document-text',
      colors: ['rgba(128, 77, 204, 1)', 'rgba(153, 102, 255, 1)'],
    },
    {
      id: 'files',
      title: 'Files',
      icon: 'folder',
      colors: ['rgba(34, 197, 94, 1)', 'rgba(59, 130, 246, 1)'],
    },
  ];

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const fileType = getFileTypeCategory(fileName, mimeType);

    switch (fileType) {
      case 'image':
        return 'image';
      case 'video':
        return 'videocam';
      case 'audio':
        return 'musical-notes';
      case 'pdf':
        return 'document-text';
      case 'word':
        return 'document-text';
      case 'powerpoint':
        return 'easel';
      case 'text':
        return 'document-outline';
      case 'archive':
        return 'archive';
      case 'csv':
        return 'grid';
      case 'apk':
        return 'phone-portrait';
      default:
        return 'document';
    }
  };

  const handleFileSelection = async (file: any, type: string) => {
    setIsProcessingFile(true);
    setProcessingFileName(file.name || file.fileName || 'Unknown file');

    try {
      await sendFileAck(file, type === 'media' ? 'image' : 'file');
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessingFile(false);
      setProcessingFileName('');
    }
  };

  const handleFilePicker = async (type: string) => {
    const hasFilePermissions = await checkFilePermissions();
    if (!hasFilePermissions) return;

    switch (type) {
      case 'media':
        const hasCameraPermission = await checkCameraPermissions();
        pickMedia(
          media => handleFileSelection(media, 'media'),
          hasCameraPermission,
        );
        break;

      case 'documents':
        pickDocument(file => handleFileSelection(file, 'document'), 'office');
        break;

      case 'files':
        pickDocument(file => handleFileSelection(file, 'file'));
        break;
    }
  };

  const renderProcessingModal = () => (
    <View style={styles.modalOverlay}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.98)', 'rgba(248, 250, 252, 0.98)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.modalContent}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="rgba(128, 77, 204, 1)" />
        </View>
        <Text style={styles.processingTitle}>Processing File</Text>
        <Text style={styles.processingSubtitle} numberOfLines={2}>
          {processingFileName}
        </Text>
        <Text style={styles.processingDescription}>
          Please wait while we prepare your file for transfer...
        </Text>
      </LinearGradient>
    </View>
  );

  useEffect(() => {
    if (!isConnected) {
      resetAndNavigate('HomeScreen');
    }
  }, [isConnected]);

  const renderFileItem = ({item}: any) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => {
        if (item?.available && !item?.cancelled) {
          const normalizedPath =
            Platform.OS === 'ios' ? `file://${item?.uri}` : item?.uri;
          if (Platform.OS === 'ios') {
            ReactNativeBlobUtil.ios.openDocument(normalizedPath);
          } else {
            ReactNativeBlobUtil.android.actionViewIntent(normalizedPath, '*/*');
          }
        }
      }}
      activeOpacity={item?.cancelled ? 1 : 0.7}>
      <LinearGradient
        colors={
          item?.cancelled
            ? ['rgba(248, 248, 248, 0.95)', 'rgba(240, 240, 240, 0.85)']
            : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']
        }
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.fileItemGradient}>
        <View style={styles.fileIconContainer}>
          <Icon
            name={getFileIcon(item?.name, item?.mimeType)}
            iconFamily="Ionicons"
            size={18}
            color={
              item?.cancelled
                ? 'rgba(128, 128, 128, 0.6)'
                : 'rgba(128, 77, 204, 0.8)'
            }
          />
        </View>

        <View style={styles.fileDetails}>
          <Text
            style={[
              styles.fileName,
              item?.cancelled && {color: 'rgba(128, 128, 128, 0.8)'},
            ]}
            numberOfLines={1}>
            {item?.name}
          </Text>
          <Text
            style={[
              styles.fileInfo,
              item?.cancelled && {color: 'rgba(128, 128, 128, 0.6)'},
            ]}>
            {formatFileSize(item.size)}
            {item?.cancelled && ' • Cancelled'}
          </Text>
          {/* Show progress for transferring files */}
          {item?.transferring && item?.progress !== undefined && (
            <Text style={styles.progressText}>
              {Math.round(item.progress)}% transferred
            </Text>
          )}
        </View>

        {/* Updated status container with cancel button for transferring files */}
        {item?.cancelled ? (
          <View style={styles.statusContainer}>
            <Icon
              name="close-circle"
              iconFamily="Ionicons"
              size={16}
              color="rgba(239, 68, 68, 0.8)"
            />
          </View>
        ) : item?.available ? (
          <View style={styles.statusContainer}>
            <Icon
              name="checkmark-circle"
              iconFamily="Ionicons"
              size={16}
              color="rgba(34, 197, 94, 0.8)"
            />
          </View>
        ) : item?.transferring || (!item?.available && !item?.cancelled) ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator color="rgba(128, 77, 204, 0.8)" size="small" />
            {/* Add cancel button for files being transferred */}
            {item?.transferring && (
              <TouchableOpacity
                style={styles.fileCancelButton}
                onPress={() => cancelTransfer()}>
                <Icon
                  name="close"
                  iconFamily="Ionicons"
                  size={12}
                  color="rgba(239, 68, 68, 0.8)"
                />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ActivityIndicator color="rgba(128, 77, 204, 0.8)" size="small" />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const currentFiles = activeTab === 'SENT' ? sentFiles : receivedFiles;
  const currentBytes =
    activeTab === 'SENT' ? totalSentBytes : totalReceivedBytes;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="rgba(128, 77, 204, 1)"
      />
      {isProcessingFile && renderProcessingModal()}

      {/* Header */}
      <LinearGradient
        colors={['rgba(128, 77, 204, 1)', 'rgba(153, 102, 255, 1)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}>
        <SafeAreaView />
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => resetAndNavigate('HomeScreen')}
            style={styles.backButton}>
            <Icon
              name="chevron-back"
              iconFamily="Ionicons"
              color="#FFFFFF"
              size={20}
            />
          </TouchableOpacity>

          <View style={styles.deviceInfo}>
            <Text style={styles.deviceLabel}>Connected to</Text>
            <Text style={styles.deviceName} numberOfLines={1}>
              {connectedDevice || 'Unknown Device'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={disconnect}
            style={styles.disconnectButton}>
            <Icon
              name="close"
              iconFamily="Ionicons"
              color="#FFFFFF"
              size={20}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Send Options */}
        <View style={styles.sendSection}>
          <Text style={styles.sectionTitle}>Send Files</Text>
          <View style={styles.optionsGrid}>
            {fileOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  isProcessingFile && styles.optionButtonDisabled,
                ]}
                onPress={() => !isProcessingFile && handleFilePicker(option.id)}
                activeOpacity={isProcessingFile ? 1 : 0.9}
                disabled={isProcessingFile}>
                <LinearGradient
                  colors={option.colors}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.optionGradient}>
                  <View style={styles.optionPattern}>
                    <View style={[styles.circle, styles.circle1]} />
                    <View style={[styles.circle, styles.circle2]} />
                  </View>
                  <Icon
                    name={option.icon}
                    iconFamily="Ionicons"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.optionText}>{option.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* File History */}
        <View style={styles.historySection}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.95)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.historyGradient}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => setActiveTab('SENT')}
                style={[styles.tab, activeTab === 'SENT' && styles.activeTab]}>
                {activeTab === 'SENT' && (
                  <LinearGradient
                    colors={['rgba(128, 77, 204, 1)', 'rgba(153, 102, 255, 1)']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.activeTabGradient}
                  />
                )}
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'SENT' && styles.activeTabText,
                  ]}>
                  Sent
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('RECEIVED')}
                style={[
                  styles.tab,
                  activeTab === 'RECEIVED' && styles.activeTab,
                ]}>
                {activeTab === 'RECEIVED' && (
                  <LinearGradient
                    colors={['rgba(128, 77, 204, 1)', 'rgba(153, 102, 255, 1)']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.activeTabGradient}
                  />
                )}
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'RECEIVED' && styles.activeTabText,
                  ]}>
                  Received
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {currentFiles?.length || 0} files •{' '}
                {formatFileSize(currentBytes || 0)} /{' '}
                {formatFileSize(
                  currentFiles?.reduce((acc, file) => acc + file.size, 0) || 0,
                )}
              </Text>
            </View>

            {currentFiles?.length > 0 ? (
              <FlatList
                data={currentFiles}
                keyExtractor={item => item.id.toString()}
                renderItem={renderFileItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.fileList}
              />
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Icon
                    name="folder-outline"
                    iconFamily="Ionicons"
                    size={32}
                    color="rgba(128, 77, 204, 0.4)"
                  />
                </View>
                <Text style={styles.emptyText}>
                  No {activeTab.toLowerCase()} files yet
                </Text>
                <Text style={styles.emptySubtext}>
                  Files will appear here once transferred
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  loaderContainer: {
    marginBottom: 20,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.9)',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(128, 77, 204, 0.8)',
    marginBottom: 12,
    textAlign: 'center',
  },
  processingDescription: {
    fontSize: 12,
    color: 'rgba(107, 114, 128, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Existing styles...
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 4,
  },
  deviceInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  deviceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  deviceName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 2,
  },
  disconnectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sendSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },
  optionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  optionPattern: {
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
    width: 40,
    height: 40,
    top: -10,
    right: -10,
  },
  circle2: {
    width: 30,
    height: 30,
    bottom: -8,
    left: -8,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 6,
    textAlign: 'center',
  },
  historySection: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  historyGradient: {
    flex: 1,
    paddingVertical: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243, 244, 246, 0.9)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  activeTab: {
    // Active styling handled by gradient
  },
  activeTabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(107, 114, 128, 0.8)',
    zIndex: 1,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statsText: {
    fontSize: 13,
    color: 'rgba(107, 114, 128, 0.8)',
    fontWeight: '600',
  },
  fileList: {
    paddingBottom: 20,
  },
  fileItem: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fileItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  fileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(128, 77, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 2,
  },
  fileInfo: {
    fontSize: 11,
    color: 'rgba(107, 114, 128, 0.8)',
    fontWeight: '500',
  },
  statusContainer: {
    marginLeft: 8,
    flexDirection: 'row-reverse',
    gap: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(128, 77, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: 'rgba(107, 114, 128, 0.7)',
    fontWeight: '500',
  },
  fileCancelButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(128, 77, 204, 0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
});

export default ConnectionScreen;
