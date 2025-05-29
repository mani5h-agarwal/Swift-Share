import {launchCamera, Asset, MediaType} from 'react-native-image-picker';
import {pick, types} from '@react-native-documents/picker';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import {Linking} from 'react-native';

// Interface for document picker results when used for media
interface PhotoPickerResult {
  uri: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
  width?: number;
  height?: number;
}

export const promptOpenAppSettings = () => {
  Alert.alert(
    'Permission Required',
    'This permission is permanently denied. Please enable it in the app settings.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => Linking.openSettings(),
      },
    ],
    {cancelable: true},
  );
};

type MediaPickedCallback = (media: Asset | PhotoPickerResult) => void;
type FilePickedCallback = (file: any) => void;

// Use document picker for media selection (works on all Android versions)
const launchMediaPicker = async (
  mediaType: 'images' | 'videos' | 'mixed',
  onMediaPickedUp: MediaPickedCallback,
) => {
  try {
    let documentTypes;

    switch (mediaType) {
      case 'images':
        documentTypes = [types.images];
        break;
      case 'videos':
        documentTypes = [types.video];
        break;
      case 'mixed':
        documentTypes = [types.images, types.video];
        break;
      default:
        documentTypes = [types.allFiles];
    }

    const [pickResult] = await pick({
      type: documentTypes,
      allowMultiSelection: false,
    });

    if (pickResult) {
      // Convert document picker result to match expected format
      const mediaResult: PhotoPickerResult = {
        uri: pickResult.uri,
        fileName: pickResult.name,
        fileSize: pickResult.size,
        type: pickResult.type,
      };
      onMediaPickedUp(mediaResult);
    }
  } catch (err: any) {
    if (err.code !== 'DOCUMENT_PICKER_CANCELED') {
      console.log('Media picker error:', err);
      Alert.alert('Error', 'Failed to pick media');
    }
  }
};

export const pickImage = (
  onMediaPickedUp: MediaPickedCallback,
  showCameraOption: boolean = true,
) => {
  if (showCameraOption) {
    Alert.alert('Select Image', 'Choose an option', [
      {text: 'Camera', onPress: () => openCamera('photo', onMediaPickedUp)},
      {
        text: 'Gallery',
        onPress: () => launchMediaPicker('images', onMediaPickedUp),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  } else {
    launchMediaPicker('images', onMediaPickedUp);
  }
};

export const pickVideo = (
  onMediaPickedUp: MediaPickedCallback,
  showCameraOption: boolean = true,
) => {
  if (showCameraOption) {
    Alert.alert('Select Video', 'Choose an option', [
      {text: 'Camera', onPress: () => openCamera('video', onMediaPickedUp)},
      {
        text: 'Gallery',
        onPress: () => launchMediaPicker('videos', onMediaPickedUp),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  } else {
    launchMediaPicker('videos', onMediaPickedUp);
  }
};

export const pickMedia = (
  onMediaPickedUp: MediaPickedCallback,
  showCameraOption: boolean = true,
) => {
  if (showCameraOption) {
    Alert.alert('Select Media', 'Choose an option', [
      {
        text: 'Camera (Photo)',
        onPress: () => openCamera('photo', onMediaPickedUp),
      },
      {
        text: 'Camera (Video)',
        onPress: () => openCamera('video', onMediaPickedUp),
      },
      {
        text: 'Gallery',
        onPress: () => launchMediaPicker('mixed', onMediaPickedUp),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  } else {
    launchMediaPicker('mixed', onMediaPickedUp);
  }
};

// Camera launcher (unchanged)
const openCamera = (
  mediaType: MediaType,
  onMediaPickedUp: MediaPickedCallback,
) => {
  launchCamera(
    {
      mediaType,
      quality: 0.8,
      includeBase64: false,
      videoQuality: 'medium',
      durationLimit: 60,
    },
    (response: any) => {
      handleMediaResponse(response, onMediaPickedUp);
    },
  );
};

// Handle media response (unchanged)
const handleMediaResponse = (
  response: any,
  onMediaPickedUp: MediaPickedCallback,
) => {
  if (response.didCancel) {
    console.log('User canceled media picker');
  } else if (response.errorCode) {
    console.log('MediaPicker Error: ', response.errorMessage);
    Alert.alert('Error', response.errorMessage || 'Failed to pick media');
  } else {
    const {assets} = response;
    if (assets && assets.length > 0) {
      const selectedMedia = assets[0];
      onMediaPickedUp(selectedMedia);
    }
  }
};

// Simplified permission checker - no longer needs storage permissions
export const checkFilePermissions = async (platform: string = Platform.OS) => {
  // No storage permissions needed for Android Photo Picker
  if (platform === 'android') {
    console.log('Using Android Photo Picker - no storage permissions required');
    return true;
  }
  return true;
};

// Camera permission checker (unchanged)
export const checkCameraPermissions = async (
  platform: string = Platform.OS,
) => {
  if (platform === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('CAMERA PERMISSION GRANTED ✅');
        return true;
      } else {
        console.log('CAMERA PERMISSION DENIED ❌');
        return false;
      }
    } catch (err) {
      console.log('Camera permission error:', err);
      return false;
    }
  } else {
    return true;
  }
};

// Audio recording permission checker (unchanged)
export const checkMicrophonePermissions = async (
  platform: string = Platform.OS,
) => {
  if (platform === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('MICROPHONE PERMISSION GRANTED ✅');
        return true;
      } else {
        console.log('MICROPHONE PERMISSION DENIED ❌');
        return false;
      }
    } catch (err) {
      console.log('Microphone permission error:', err);
      return false;
    }
  } else {
    return true;
  }
};

// Document picker functions (unchanged)
export const pickDocument = async (
  onFilePickedUp: FilePickedCallback,
  fileType?: string,
) => {
  try {
    let documentTypes;

    switch (fileType) {
      case 'pdf':
        documentTypes = [types.pdf];
        break;
      case 'office':
        documentTypes = [types.doc, types.docx, types.ppt, types.pptx];
        break;
      case 'text':
        documentTypes = [types.plainText];
        break;
      case 'csv':
        documentTypes = [types.csv];
        break;
      case 'archive':
        documentTypes = [types.zip];
        break;
      case 'apk':
        documentTypes = [types.allFiles];
        break;
      case 'audio':
        documentTypes = [types.audio];
        break;
      default:
        documentTypes = [types.allFiles];
    }

    const [pickResult] = await pick({
      type: documentTypes,
      allowMultiSelection: false,
    });

    if (fileType === 'apk' && pickResult) {
      const fileName = pickResult.name?.toLowerCase() || '';
      if (!fileName.endsWith('.apk')) {
        Alert.alert('Invalid File', 'Please select an APK file');
        return;
      }
    }

    onFilePickedUp(pickResult);
  } catch (err: any) {
    if (err.code !== 'DOCUMENT_PICKER_CANCELED') {
      console.log('Document picker error:', err);
      Alert.alert('Error', 'Failed to pick document');
    }
  }
};

// Specific file type pickers (unchanged)
export const pickAudio = async (onFilePickedUp: FilePickedCallback) => {
  await pickDocument(onFilePickedUp, 'audio');
};

export const pickPDF = async (onFilePickedUp: FilePickedCallback) => {
  await pickDocument(onFilePickedUp, 'pdf');
};

export const pickOfficeDocument = async (
  onFilePickedUp: FilePickedCallback,
) => {
  await pickDocument(onFilePickedUp, 'office');
};

export const pickTextFile = async (onFilePickedUp: FilePickedCallback) => {
  await pickDocument(onFilePickedUp, 'text');
};

export const pickArchive = async (onFilePickedUp: FilePickedCallback) => {
  await pickDocument(onFilePickedUp, 'archive');
};

export const pickAPK = async (onFilePickedUp: FilePickedCallback) => {
  await pickDocument(onFilePickedUp, 'apk');
};

export const pickCSV = async (onFilePickedCallback: FilePickedCallback) => {
  await pickDocument(onFilePickedCallback, 'csv');
};

// Utility functions (unchanged)
export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes >= 1024 ** 3) {
    return (sizeInBytes / 1024 ** 3).toFixed(2) + ' GB';
  } else if (sizeInBytes >= 1024 ** 2) {
    return (sizeInBytes / 1024 ** 2).toFixed(2) + ' MB';
  } else if (sizeInBytes >= 1024) {
    return (sizeInBytes / 1024).toFixed(2) + ' KB';
  } else {
    return sizeInBytes + ' B';
  }
};

export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

export const getMediaType = (
  uri: string,
): 'image' | 'video' | 'audio' | 'document' => {
  const extension = getFileExtension(uri);

  if (['jpg', 'jpeg', 'png'].includes(extension)) {
    return 'image';
  } else if (['mp4'].includes(extension)) {
    return 'video';
  } else if (['mp3'].includes(extension)) {
    return 'audio';
  } else {
    return 'document';
  }
};

export const getFileTypeCategory = (
  fileName: string,
  mimeType?: string,
): string => {
  const extension = getFileExtension(fileName);

  if (['jpg', 'jpeg', 'png'].includes(extension)) {
    return 'image';
  }
  if (extension === 'mp4') {
    return 'video';
  }
  if (extension === 'mp3') {
    return 'audio';
  }
  if (extension === 'pdf') {
    return 'pdf';
  }
  if (extension === 'docx') {
    return 'word';
  }
  if (extension === 'pptx') {
    return 'powerpoint';
  }
  if (extension === 'txt') {
    return 'text';
  }
  if (extension === 'zip') {
    return 'archive';
  }
  if (extension === 'csv') {
    return 'csv';
  }
  if (extension === 'apk') {
    return 'apk';
  }

  return 'document';
};
