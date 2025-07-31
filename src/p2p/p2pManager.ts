interface PeerInfo {
  id: string;
  connectedAt: Date;
}

interface FileTransferRequest {
  senderId: string;
  receiverId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  otp: string;
}

export class P2PManager {
  private peers: Map<string, PeerInfo> = new Map();
  private activeTransfers: Map<string, FileTransferRequest> = new Map();

  constructor() {
    // Simple constructor without external dependencies
  }

  // Add a peer to the network
  addPeer(peerId: string): void {
    const peerInfo: PeerInfo = {
      id: peerId,
      connectedAt: new Date()
    };
    this.peers.set(peerId, peerInfo);
    console.log(`Peer ${peerId} connected`);
  }

  // Remove a peer from the network
  removePeer(peerId: string): void {
    this.peers.delete(peerId);
    
    // Clean up active transfers involving this peer
    for (const [transferId, transfer] of this.activeTransfers.entries()) {
      if (transfer.senderId === peerId || transfer.receiverId === peerId) {
        this.activeTransfers.delete(transferId);
        console.log(`Transfer ${transferId} cancelled due to peer ${peerId} disconnection`);
      }
    }
    
    console.log(`Peer ${peerId} disconnected`);
  }

  // Get list of available peers
  getAvailablePeers(excludePeerId?: string): PeerInfo[] {
    return Array.from(this.peers.values())
      .filter(peer => peer.id !== excludePeerId);
  }

  // Request file transfer between peers
  requestFileTransfer(request: FileTransferRequest): boolean {
    const receiverPeer = this.peers.get(request.receiverId);
    if (!receiverPeer) {
      console.log(`Receiver ${request.receiverId} not found`);
      return false;
    }

    const transferId = `${request.senderId}-${request.receiverId}-${Date.now()}`;
    this.activeTransfers.set(transferId, request);
    
    console.log(`File transfer requested: ${request.fileName} from ${request.senderId} to ${request.receiverId}`);
    console.log(`Transfer ID: ${transferId}, OTP: ${request.otp}`);
    
    return true;
  }

  // Accept a file transfer
  acceptFileTransfer(transferId: string, otp: string): boolean {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) {
      console.log(`Transfer ${transferId} not found`);
      return false;
    }

    if (transfer.otp !== otp) {
      console.log(`Invalid OTP for transfer ${transferId}`);
      return false;
    }

    console.log(`File transfer ${transferId} accepted`);
    return true;
  }

  // Reject a file transfer
  rejectFileTransfer(transferId: string): boolean {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) {
      return false;
    }

    this.activeTransfers.delete(transferId);
    console.log(`File transfer ${transferId} rejected`);
    return true;
  }

  // Complete a file transfer
  completeFileTransfer(transferId: string): boolean {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) {
      return false;
    }

    this.activeTransfers.delete(transferId);
    console.log(`File transfer ${transferId} completed successfully`);
    return true;
  }

  // Get active transfers
  getActiveTransfers(): FileTransferRequest[] {
    return Array.from(this.activeTransfers.values());
  }

  // Get peer count
  getPeerCount(): number {
    return this.peers.size;
  }

  // Simulate peer discovery
  discoverPeers(): PeerInfo[] {
    console.log(`Discovering peers... Found ${this.peers.size} peers`);
    return Array.from(this.peers.values());
  }

  // Simulate file chunk transfer
  transferFileChunk(transferId: string, chunkIndex: number, totalChunks: number): boolean {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) {
      return false;
    }

    const progress = Math.round((chunkIndex / totalChunks) * 100);
    console.log(`Transfer ${transferId}: ${progress}% complete (chunk ${chunkIndex}/${totalChunks})`);
    
    return true;
  }

  // Get transfer progress
  getTransferProgress(transferId: string): number {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) {
      return 0;
    }
    
    // Simulate progress (in real implementation, this would track actual progress)
    return Math.random() * 100;
  }
}
