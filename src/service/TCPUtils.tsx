// TCPUtils.js - Enhanced with progress tracking and better error handling
import {produce} from 'immer';
import {Alert} from 'react-native';
import {useChunkStore} from '../db/chunkStore';
import {Buffer} from 'buffer';

export class MessageFramer {
  constructor(onMessage) {
    this.buffer = Buffer.alloc(0);
    this.onMessage = onMessage;
  }

  processData(data) {
    this.buffer = Buffer.concat([this.buffer, data]);

    while (this.buffer.length >= 4) {
      const messageLength = this.buffer.readUInt32BE(0);

      if (this.buffer.length >= 4 + messageLength) {
        const messageData = this.buffer.slice(4, 4 + messageLength);
        this.buffer = this.buffer.slice(4 + messageLength);

        try {
          const message = JSON.parse(messageData.toString('utf8'));
          this.onMessage(message);
        } catch (error) {
          console.error('Parse error:', error);
        }
      } else {
        break;
      }
    }
  }

  static sendMessage(socket, message) {
    if (!socket || socket.readyState !== 'open') {
      console.error('Socket not ready');
      return false;
    }

    try {
      const messageJson = JSON.stringify(message);
      const messageBuffer = Buffer.from(messageJson, 'utf8');
      const lengthBuffer = Buffer.allocUnsafe(4);
      lengthBuffer.writeUInt32BE(messageBuffer.length, 0);

      socket.write(Buffer.concat([lengthBuffer, messageBuffer]));
      return true;
    } catch (error) {
      console.error('Send error:', error);
      return false;
    }
  }
}

export const receiveFileAck = async (
  data,
  socket,
  setReceivedFiles,
  setIsTransferring,
) => {
  const {setChunkStore, chunkStore} = useChunkStore.getState();

  if (chunkStore) {
    Alert.alert(
      'Transfer in Progress',
      'Another file transfer is already in progress. Please wait for it to complete.',
      [{text: 'OK'}],
    );
    return;
  }

  try {
    setIsTransferring(true);

    setReceivedFiles(prevData =>
      produce(prevData, draft => {
        draft.push({...data, available: false, progress: 0});
      }),
    );

    setChunkStore({
      id: data.id,
      totalChunks: data.totalChunks,
      name: data.name,
      size: data.size,
      mimeType: data.mimeType,
      chunkArray: [],
    });

    // Request first chunk immediately
    const success = MessageFramer.sendMessage(socket, {
      event: 'send_chunk_ack',
      chunkNo: 0,
    });
    if (success) {
      console.log(
        `Starting to receive: ${data.name} (${data.totalChunks} chunks)`,
      );
    } else {
      throw new Error('Failed to request first chunk');
    }
  } catch (error) {
    console.error('Error in receiveFileAck:', error);
    setIsTransferring(false);
    Alert.alert('Error', 'Failed to start file transfer.');
  }
};

export const sendChunkAck = async (
  chunkIndex,
  socket,
  setTotalSentBytes,
  setSentFiles,
  setTransferProgress,
  setIsTransferring,
) => {
  const {currentChunkSet, resetCurrentChunkSet} = useChunkStore.getState();

  if (!currentChunkSet) {
    console.log('Transfer cancelled or no chunks to send');
    return;
  }

  const chunk = currentChunkSet.chunkArray[chunkIndex];
  if (!chunk) {
    console.error('Chunk not found:', chunkIndex);
    return;
  }

  try {
    // Send chunk
    const success = MessageFramer.sendMessage(socket, {
      event: 'receive_chunk_ack',
      chunk: chunk.toString('base64'),
      chunkNo: chunkIndex,
    });

    if (!success) {
      throw new Error('Failed to send chunk');
    }

    setTotalSentBytes(prev => prev + chunk.length);

    // Update progress
    const progress = ((chunkIndex + 1) / currentChunkSet.totalChunks) * 100;
    setTransferProgress(progress);

    // Update sent files with progress
    setSentFiles(prevFiles =>
      produce(prevFiles, draft => {
        const fileIndex = draft.findIndex(f => f.id === currentChunkSet.id);
        if (fileIndex !== -1 && !draft[fileIndex].cancelled) {
          draft[fileIndex].progress = progress;
          draft[fileIndex].transferring = true;
        }
      }),
    );

    // Check if all chunks sent
    if (chunkIndex + 1 >= currentChunkSet.totalChunks) {
      console.log('All chunks sent successfully');
      setSentFiles(prevFiles =>
        produce(prevFiles, draft => {
          const fileIndex = draft.findIndex(f => f.id === currentChunkSet.id);
          if (fileIndex !== -1 && !draft[fileIndex].cancelled) {
            draft[fileIndex].available = true;
            draft[fileIndex].progress = 100;
            draft[fileIndex].transferring = false;
          }
        }),
      );
      resetCurrentChunkSet();
      setIsTransferring(false);
      setTransferProgress(0);
    }
  } catch (error) {
    console.error('Error in sendChunkAck:', error);
    setIsTransferring(false);
    Alert.alert(
      'Transfer Error',
      'Failed to send file chunk. Transfer cancelled.',
    );
  }
};

// 4. Fix in TCPUtils.js - Update receiveChunkAck to track progress properly
export const receiveChunkAck = async (
  chunk,
  chunkNo,
  socket,
  setTotalReceivedBytes,
  generateFile,
  setTransferProgress,
) => {
  const {chunkStore, setChunkStore} = useChunkStore.getState();

  if (!chunkStore) {
    console.error('No chunk store');
    return;
  }

  try {
    const bufferChunk = Buffer.from(chunk, 'base64');
    const updatedChunkArray = [...(chunkStore.chunkArray || [])];
    updatedChunkArray[chunkNo] = bufferChunk;

    setChunkStore({
      ...chunkStore,
      chunkArray: updatedChunkArray,
    });

    setTotalReceivedBytes(prev => prev + bufferChunk.length);

    // Update progress
    const progress = ((chunkNo + 1) / chunkStore.totalChunks) * 100;
    setTransferProgress(progress);
    console.log(
      `Received chunk ${chunkNo + 1}/${
        chunkStore.totalChunks
      } (${progress.toFixed(1)}%)`,
    );

    // Check if all chunks received
    if (chunkNo + 1 === chunkStore.totalChunks) {
      console.log('All chunks received, generating file...');
      await generateFile();
      return;
    }

    // Request next chunk immediately
    const success = MessageFramer.sendMessage(socket, {
      event: 'send_chunk_ack',
      chunkNo: chunkNo + 1,
    });

    if (!success) {
      throw new Error('Failed to request next chunk');
    }
  } catch (error) {
    console.error('Chunk processing error:', error);
    Alert.alert(
      'Transfer Error',
      'Failed to process received chunk. Transfer may be incomplete.',
    );
  }
};
