// TCPProvider.tsx - Fixed file saving with proper error handling
import 'react-native-get-random-values';
import React, {useCallback, useState} from 'react';
import {Buffer} from 'buffer';
import {useChunkStore} from '../db/chunkStore';
import TcpSocket from 'react-native-tcp-socket';
import DeviceInfo from 'react-native-device-info';
import {Alert, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {v4 as uuidv4} from 'uuid';
import {produce} from 'immer';
import {
  receiveChunkAck,
  receiveFileAck,
  sendChunkAck,
  MessageFramer,
} from './TCPUtils';

// File size limits and configuration
const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB maximum
  RECOMMENDED_SIZE: 50 * 1024 * 1024, // 50MB recommended
  WARNING_SIZE: 25 * 1024 * 1024, // 25MB warning threshold
};

const formatFileSize = bytes => {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Fixed file name sanitization and unique name generation
const sanitizeFileName = (fileName: string): string => {
  // Remove invalid characters for file names
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
};

const getUniqueFileName = async (basePath: string, fileName: string) => {
  try {
    // Ensure directory exists
    const dirExists = await RNFS.exists(basePath);
    if (!dirExists) {
      await RNFS.mkdir(basePath);
    }

    // Sanitize the file name
    const sanitizedFileName = sanitizeFileName(fileName);

    const fileExtension = sanitizedFileName.includes('.')
      ? sanitizedFileName.split('.').pop()
      : '';
    const nameWithoutExtension = sanitizedFileName.includes('.')
      ? sanitizedFileName.split('.').slice(0, -1).join('.')
      : sanitizedFileName;

    let counter = 0;
    let uniqueFileName = sanitizedFileName;
    let fullPath = `${basePath}/${uniqueFileName}`;

    // Check if file exists and generate unique name
    while (await RNFS.exists(fullPath)) {
      counter++;
      uniqueFileName = fileExtension
        ? `${nameWithoutExtension}_${counter}.${fileExtension}`
        : `${nameWithoutExtension}_${counter}`;
      fullPath = `${basePath}/${uniqueFileName}`;
    }

    return {uniqueFileName, fullPath};
  } catch (error) {
    console.error('Error in getUniqueFileName:', error);
    // Fallback to timestamp-based name
    const timestamp = Date.now();
    const fallbackName = `file_${timestamp}`;
    return {
      uniqueFileName: fallbackName,
      fullPath: `${basePath}/${fallbackName}`,
    };
  }
};

interface TCPContextType {
  isConnected: boolean;
  connectedDevice: string | null;
  sentFiles: any[];
  receivedFiles: any[];
  totalSentBytes: number;
  totalReceivedBytes: number;
  isTransferring: boolean;
  transferProgress: number;
  startServer: (port: number) => void;
  connectToServer: (host: string, port: number, deviceName: string) => void;
  sendFileAck: (file: any, type: 'file' | 'image') => Promise<boolean>;
  disconnect: () => void;
  cancelTransfer: () => void;
}

const TCPContext = React.createContext<TCPContextType | undefined>(undefined);

export const useTCP = (): TCPContextType => {
  const context = React.useContext(TCPContext);
  if (!context) {
    throw new Error('useTCP must be used within a TCPProvider');
  }
  return context;
};

export const TCPProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [server, setServer] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [activeSocket, setActiveSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [sentFiles, setSentFiles] = useState<any[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<any[]>([]);
  const [totalSentBytes, setTotalSentBytes] = useState<number>(0);
  const [totalReceivedBytes, setTotalReceivedBytes] = useState<number>(0);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferProgress, setTransferProgress] = useState<number>(0);

  const {setCurrentChunkSet, setChunkStore} = useChunkStore();

  const cleanupState = useCallback(() => {
    setReceivedFiles([]);
    setSentFiles([]);
    setCurrentChunkSet(null);
    setTotalReceivedBytes(0);
    setTotalSentBytes(0);
    setChunkStore(null);
    setIsConnected(false);
    setConnectedDevice(null);
    setActiveSocket(null);
    setIsTransferring(false);
    setTransferProgress(0);
  }, [setCurrentChunkSet, setChunkStore]);

  // In TCPProvider.tsx - Replace the cancelTransfer function
  const cancelTransfer = useCallback(() => {
    console.log('Cancelling transfer...');

    // Get current transfer info before reset
    const {currentChunkSet, chunkStore} = useChunkStore.getState();

    // Send cancel message
    if (activeSocket?.readyState === 'open') {
      try {
        MessageFramer.sendMessage(activeSocket, {event: 'cancel_transfer'});
      } catch (e) {
        console.log('Error sending cancel:', e);
      }
    }

    // Update sent files status to cancelled (preserve progress)
    if (currentChunkSet) {
      setSentFiles(prevFiles =>
        produce(prevFiles, draft => {
          const fileIndex = draft.findIndex(f => f.id === currentChunkSet.id);
          if (fileIndex !== -1) {
            draft[fileIndex].available = false;
            draft[fileIndex].cancelled = true;
            draft[fileIndex].transferring = false;
            // Don't reset progress to 0 - keep current progress
          }
        }),
      );
    }

    // Reset transfer state
    const {resetCurrentChunkSet, resetChunkStore} = useChunkStore.getState();
    resetCurrentChunkSet();
    resetChunkStore();
    setIsTransferring(false);
    setTransferProgress(0);
  }, [activeSocket, setSentFiles]);
  const disconnect = useCallback(() => {
    console.log('Disconnecting...');

    // Send disconnect message
    if (activeSocket?.readyState === 'open') {
      try {
        MessageFramer.sendMessage(activeSocket, {event: 'disconnect'});
      } catch (e) {
        console.log('Error sending disconnect:', e);
      }
    }

    // Close connections
    [client, activeSocket, server].forEach(conn => {
      if (conn) {
        try {
          conn.destroy();
        } catch (e) {
          console.log('Error closing connection:', e);
        }
      }
    });

    setServer(null);
    setClient(null);
    cleanupState();
  }, [client, activeSocket, server, cleanupState]);

  const handleMessage = (data: any, socket: any) => {
    switch (data.event) {
      case 'connect':
        setIsConnected(true);
        setConnectedDevice(data.deviceName);
        setActiveSocket(socket);
        break;
      case 'disconnect':
        cleanupState();
        break;
      case 'cancel_transfer':
        const {
          currentChunkSet: cancelCurrentChunkSet,
          chunkStore: cancelChunkStore,
          resetCurrentChunkSet,
          resetChunkStore,
        } = useChunkStore.getState();

        // Update receiver files status to cancelled (preserve progress)
        if (cancelChunkStore) {
          setReceivedFiles(prevFiles =>
            produce(prevFiles, draft => {
              const fileIndex = draft.findIndex(
                f => f.id === cancelChunkStore.id,
              );
              if (fileIndex !== -1) {
                draft[fileIndex].available = false;
                draft[fileIndex].cancelled = true;
                // Don't reset progress - keep current progress
                const currentProgress =
                  ((draft[fileIndex].chunkArray?.length || 0) /
                    cancelChunkStore.totalChunks) *
                  100;
                draft[fileIndex].progress = currentProgress;
              }
            }),
          );
        }

        resetCurrentChunkSet();
        resetChunkStore();
        setIsTransferring(false);
        setTransferProgress(0);
        Alert.alert(
          'Transfer Cancelled',
          'File transfer was cancelled by the sender.',
        );
        break;
      case 'file_ack':
        receiveFileAck(data.file, socket, setReceivedFiles, setIsTransferring);
        break;
      case 'send_chunk_ack':
        sendChunkAck(
          data.chunkNo,
          socket,
          setTotalSentBytes,
          setSentFiles,
          setTransferProgress,
          setIsTransferring,
        );
        break;
      case 'receive_chunk_ack':
        receiveChunkAck(
          data.chunk,
          data.chunkNo,
          socket,
          setTotalReceivedBytes,
          generateFile,
          setTransferProgress,
        );
        break;
    }
  };

  const setupSocket = (socket: any) => {
    // Optimize for large file transfers
    socket.setNoDelay(true);
    socket.setKeepAlive(true, 1000);
    socket.readableHighWaterMark = 1024 * 1024 * 8; // 8MB buffer
    socket.writableHighWaterMark = 1024 * 1024 * 8; // 8MB buffer

    const messageFramer = new MessageFramer(message =>
      handleMessage(message, socket),
    );

    socket.on('data', (data: Buffer) => messageFramer.processData(data));
    socket.on('close', () => {
      console.log('Socket closed');
      cleanupState();
    });
    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      cleanupState();
    });
  };

  const startServer = useCallback(
    (port: number) => {
      if (server) return;

      const newServer = TcpSocket.createServer(socket => {
        console.log('Client connected');
        setupSocket(socket);
      });

      newServer.listen({port, host: '0.0.0.0'}, () => {
        console.log(`Server started on port ${port}`);
      });

      newServer.on('error', (error: any) => {
        console.error('Server error:', error);
        cleanupState();
      });

      setServer(newServer);
    },
    [server],
  );

  const connectToServer = useCallback(
    (host: string, port: number, deviceName: string) => {
      const newClient = TcpSocket.createConnection({host, port}, () => {
        const myDevice = DeviceInfo.getDeviceNameSync();
        MessageFramer.sendMessage(newClient, {
          event: 'connect',
          deviceName: myDevice,
        });
        setConnectedDevice(deviceName);
        setIsConnected(true);
        setActiveSocket(newClient);
      });

      setupSocket(newClient);
      setClient(newClient);
    },
    [],
  );

  // Fixed generateFile function with proper error handling
  const generateFile = async () => {
    const {chunkStore, resetChunkStore} = useChunkStore.getState();
    if (
      !chunkStore ||
      chunkStore.totalChunks !== chunkStore.chunkArray.length
    ) {
      console.error('Invalid chunk store');
      setIsTransferring(false);
      return;
    }

    try {
      console.log('Starting file generation...');
      const combinedChunks = Buffer.concat(chunkStore.chunkArray);

      let platformPath: string;
      try {
        let basePath: string;
        if (Platform.OS === 'ios') {
          basePath = RNFS.DocumentDirectoryPath;
        } else {
          // For Android, try Downloads folder first
          const hasPermission = await RNFS.exists(
            RNFS.ExternalStorageDirectoryPath,
          );
          basePath = hasPermission
            ? `${RNFS.ExternalStorageDirectoryPath}/Download`
            : RNFS.DocumentDirectoryPath;
        }

        // Create SwiftShare folder
        platformPath = `${basePath}/SwiftShare`;
      } catch (pathError) {
        console.warn('Path error, using fallback:', pathError);
        platformPath = `${RNFS.DocumentDirectoryPath}/SwiftShare`;
      }

      console.log('Using SwiftShare path:', platformPath);
      // Get unique file name to avoid conflicts
      const {uniqueFileName, fullPath} = await getUniqueFileName(
        platformPath,
        chunkStore.name || 'received_file',
      );

      console.log('Writing file to:', fullPath);

      // Write file with error handling
      await RNFS.writeFile(
        fullPath,
        combinedChunks.toString('base64'),
        'base64',
      );

      // Verify file was written
      const fileExists = await RNFS.exists(fullPath);
      if (!fileExists) {
        throw new Error('File was not created successfully');
      }

      const fileStats = await RNFS.stat(fullPath);
      console.log('File saved successfully:', {
        path: fullPath,
        size: fileStats.size,
        name: uniqueFileName,
      });

      setReceivedFiles(prevFiles =>
        produce(prevFiles, draft => {
          const fileIndex = draft.findIndex(f => f.id === chunkStore.id);
          if (fileIndex !== -1) {
            draft[fileIndex] = {
              ...draft[fileIndex],
              uri: fullPath,
              available: true,
              name: uniqueFileName,
              actualSize: fileStats.size,
            };
          }
        }),
      );

      resetChunkStore();
      setIsTransferring(false);
      setTransferProgress(0);
      Alert.alert(
        'Transfer Complete',
        `File "${uniqueFileName}" (${formatFileSize(
          chunkStore.size,
        )}) has been received successfully.\n\nSaved to: ${
          Platform.OS === 'ios'
            ? 'Documents/SwiftShare'
            : 'Downloads/SwiftShare'
        }`,
        [{text: 'OK'}],
      );
    } catch (error) {
      console.error('Error saving file:', error);
      setIsTransferring(false);

      // More specific error messages
      let errorMessage = 'Failed to save the received file.';
      if (error.message.includes('ENOENT')) {
        errorMessage = 'Directory not found. Please check storage permissions.';
      } else if (error.message.includes('EEXIST')) {
        errorMessage = 'File already exists and could not be overwritten.';
      } else if (error.message.includes('EACCES')) {
        errorMessage = 'Permission denied. Please check storage permissions.';
      } else if (error.message.includes('ENOSPC')) {
        errorMessage = 'Not enough storage space available.';
      }

      Alert.alert(
        'Save Error',
        `${errorMessage}\n\nError details: ${error.message}`,
        [
          {text: 'OK'},
          {
            text: 'Retry',
            onPress: () => {
              // Retry with a different approach
              generateFile();
            },
          },
        ],
      );
    }
  };

  const checkFileSize = (fileSize: number): Promise<boolean> => {
    return new Promise(resolve => {
      if (fileSize > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
        Alert.alert(
          'File Too Large',
          `The selected file (${formatFileSize(
            fileSize,
          )}) exceeds the maximum transfer limit of ${formatFileSize(
            FILE_SIZE_LIMITS.MAX_FILE_SIZE,
          )}.\n\nPlease select a smaller file.`,
          [
            {
              text: 'OK',
              onPress: () => resolve(false),
            },
          ],
        );
      } else if (fileSize > FILE_SIZE_LIMITS.RECOMMENDED_SIZE) {
        Alert.alert(
          'Large File Warning',
          `The selected file (${formatFileSize(
            fileSize,
          )}) is quite large.\n\nRecommended size: ${formatFileSize(
            FILE_SIZE_LIMITS.RECOMMENDED_SIZE,
          )}\nMaximum size: ${formatFileSize(
            FILE_SIZE_LIMITS.MAX_FILE_SIZE,
          )}\n\nTransfer may take longer and could fail on unstable connections. Continue?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Continue',
              onPress: () => resolve(true),
            },
          ],
        );
      } else if (fileSize > FILE_SIZE_LIMITS.WARNING_SIZE) {
        Alert.alert(
          'File Size Notice',
          `File size: ${formatFileSize(
            fileSize,
          )}\n\nThis file is moderately large. Transfer will proceed normally.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Send',
              onPress: () => resolve(true),
            },
          ],
        );
      } else {
        resolve(true);
      }
    });
  };

  const sendFileAck = async (
    file: any,
    type: 'file' | 'image',
  ): Promise<boolean> => {
    if (useChunkStore.getState().currentChunkSet || isTransferring) {
      Alert.alert(
        'Transfer in Progress',
        'Please wait for the current transfer to complete before sending another file.',
        [
          {
            text: 'OK',
          },
        ],
      );
      return false;
    }

    if (!isConnected || !activeSocket || activeSocket.readyState !== 'open') {
      Alert.alert(
        'Connection Error',
        'Not connected to any device. Please establish a connection first.',
      );
      return false;
    }

    try {
      const fileSize = type === 'file' ? file.size : file.fileSize;

      // Check file size and get user confirmation
      const shouldProceed = await checkFileSize(fileSize);
      if (!shouldProceed) {
        return false;
      }

      setIsTransferring(true);
      setTransferProgress(0);

      const normalizedPath =
        Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri;

      const fileData = await RNFS.readFile(normalizedPath, 'base64');
      const buffer = Buffer.from(fileData, 'base64');
      const CHUNK_SIZE = 1024 * 64; // 64KB chunks

      const chunkArray = [];
      for (let offset = 0; offset < buffer.length; offset += CHUNK_SIZE) {
        chunkArray.push(buffer.slice(offset, offset + CHUNK_SIZE));
      }

      const fileInfo = {
        id: uuidv4(),
        name: type === 'file' ? file.name : file.fileName,
        size: fileSize,
        mimeType: type === 'file' ? 'file' : '.jpg',
        totalChunks: chunkArray.length,
      };

      setCurrentChunkSet({
        id: fileInfo.id,
        chunkArray,
        totalChunks: chunkArray.length,
      });
      setSentFiles(prevFiles =>
        produce(prevFiles, draft => {
          draft.push({
            ...fileInfo,
            uri: file.uri,
            transferring: true, // Add this flag
            progress: 0, // Add progress tracking
          });
        }),
      );

      MessageFramer.sendMessage(activeSocket, {
        event: 'file_ack',
        file: fileInfo,
      });

      console.log(
        `Starting transfer: ${fileInfo.name} (${formatFileSize(fileSize)})`,
      );
      return true;
    } catch (error) {
      console.error('Error preparing file:', error);
      setIsTransferring(false);
      Alert.alert(
        'Error',
        'Failed to prepare file for transfer. Please try again.',
      );
      return false;
    }
  };

  return (
    <TCPContext.Provider
      value={{
        isConnected,
        connectedDevice,
        sentFiles,
        receivedFiles,
        totalReceivedBytes,
        totalSentBytes,
        isTransferring,
        transferProgress,
        startServer,
        connectToServer,
        disconnect,
        sendFileAck,
        cancelTransfer,
      }}>
      {children}
    </TCPContext.Provider>
  );
};
