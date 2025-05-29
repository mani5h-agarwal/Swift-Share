import {View, TouchableOpacity, Platform, StyleSheet, Text} from 'react-native';
import React, {FC} from 'react';
import RNFS from 'react-native-fs';
import Icon from '../components/global/Icon';
import LinearGradient from 'react-native-linear-gradient';
import {formatFileSize} from '../utils/libraryHelpers';
import ReactNativeBlobUtil from 'react-native-blob-util';

const ReceivedFilesSection: FC = () => {
  const [receivedFiles, setReceivedFiles] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const getFilesFromDirectory = async () => {
    setIsLoading(true);

    // Use SwiftShare folder path
    let basePath: string;
    if (Platform.OS === 'android') {
      basePath = `${RNFS.DownloadDirectoryPath}/SwiftShare`;
    } else {
      basePath = `${RNFS.DocumentDirectoryPath}/SwiftShare`;
    }

    try {
      const exists = await RNFS.exists(basePath);
      if (!exists) {
        console.log('SwiftShare folder does not exist yet');
        setReceivedFiles([]);
        setIsLoading(false);
        return;
      }

      const files = await RNFS.readDir(basePath);

      // Filter out directories, only show files
      const fileItems = files.filter(file => file.isFile());

      const formattedFiles = fileItems.map(file => ({
        id: file.name,
        name: file.name,
        size: file.size,
        uri: file.path,
        mimeType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        dateModified: file.mtime, // Add modification date for sorting
      }));

      // Sort by date modified (newest first)
      const sortedFiles = formattedFiles.sort(
        (a, b) =>
          new Date(b.dateModified).getTime() -
          new Date(a.dateModified).getTime(),
      );

      setReceivedFiles(sortedFiles);
    } catch (error) {
      console.error('Error fetching files from SwiftShare:', error);
      setReceivedFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    getFilesFromDirectory();
  }, []);

  const getFileIcon = (mimeType: string) => {
    const iconProps = {size: 20, iconFamily: 'Ionicons' as const};

    switch (mimeType) {
      case 'mp3':
      case 'wav':
      case 'aac':
        return <Icon name="musical-notes" {...iconProps} color="#FF6B6B" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Icon name="videocam" {...iconProps} color="#4ECDC4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Icon name="image" {...iconProps} color="#FFD93D" />;
      case 'pdf':
        return <Icon name="document-text" {...iconProps} color="#FF6B6B" />;
      case 'doc':
      case 'docx':
        return <Icon name="document" {...iconProps} color="#4A90E2" />;
      case 'zip':
      case 'rar':
        return <Icon name="archive" {...iconProps} color="#9B59B6" />;
      default:
        return <Icon name="document-outline" {...iconProps} color="#95A5A6" />;
    }
  };

  const handleFilePress = (item: any) => {
    const normalizedPath =
      Platform.OS === 'ios' ? `file://${item?.uri}` : item?.uri;

    if (Platform.OS === 'ios') {
      ReactNativeBlobUtil.ios
        .openDocument(normalizedPath)
        .then(() => console.log('File opened successfully'))
        .catch(error => console.error('Error opening file:', error));
    } else {
      ReactNativeBlobUtil.android
        .actionViewIntent(normalizedPath, '*/*')
        .then(() => console.log('File opened successfully'))
        .catch(error => console.error('Error opening file:', error));
    }
  };

  const renderFileItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.fileItem}
      onPress={() => handleFilePress(item)}
      activeOpacity={0.7}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.fileItemGradient}>
        {/* File Icon */}
        <View style={styles.fileIconContainer}>
          {getFileIcon(item.mimeType)}
        </View>

        {/* File Info */}
        <View style={styles.fileInfo}>
          <Text numberOfLines={1} style={styles.fileName}>
            {item.name}
          </Text>
          <Text style={styles.fileSize}>{formatFileSize(item.size)}</Text>
        </View>

        {/* Tap indicator */}
        <View style={styles.tapIndicator}>
          <Icon
            name="chevron-forward"
            size={14}
            color="rgba(128, 77, 204, 0.6)"
            iconFamily="Ionicons"
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // eslint-disable-next-line react/no-unstable-nested-components
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(128, 77, 204, 0.1)', 'rgba(153, 102, 255, 0.05)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.emptyGradient}>
        <View style={styles.emptyIconContainer}>
          <Icon
            name="cloud-download-outline"
            size={32}
            color="rgba(128, 77, 204, 0.6)"
            iconFamily="Ionicons"
          />
        </View>

        <Text style={styles.emptyTitle}>No files received yet</Text>

        <Text style={styles.emptySubtitle}>
          Files received through SwiftShare will appear here
        </Text>
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Recent Files</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Icon
            name="refresh"
            size={20}
            color="rgba(128, 77, 204, 0.6)"
            iconFamily="Ionicons"
          />
          <Text style={styles.loadingText}>Loading files...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>SwiftShare Files</Text>
        <TouchableOpacity
          onPress={getFilesFromDirectory}
          style={styles.refreshButton}>
          <Icon
            name="refresh"
            size={16}
            color="rgba(128, 77, 204, 0.8)"
            iconFamily="Ionicons"
          />
        </TouchableOpacity>
      </View>

      {receivedFiles.length > 0 ? (
        <View>{receivedFiles.map(renderFileItem)}</View>
      ) : (
        <EmptyState />
      )}
    </View>
  );
};

export default ReceivedFilesSection;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },

  sectionTitle: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 16,
    fontWeight: 'bold',
  },

  fileItem: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },

  fileItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },

  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(128, 77, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  fileInfo: {
    flex: 1,
  },

  fileName: {
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 2,
    fontSize: 11,
    fontWeight: 'bold',
  },

  fileSize: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 9,
    fontWeight: '500',
  },

  tapIndicator: {
    marginLeft: 8,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },

  loadingText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 11,
    fontWeight: '500',
  },

  emptyContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 10,
  },

  emptyGradient: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },

  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(128, 77, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 6,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },

  emptySubtitle: {
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 77, 204, 0.1)',
  },
});
