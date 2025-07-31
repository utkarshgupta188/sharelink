import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

interface Peer {
  id: string;
  socketId: string;
  username: string;
  isAuthenticated: boolean;
  connectedAt: Date;
}

export class P2PManager {
  private peers: Map<string, Peer> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);

      socket.on('peer:register', (data: { username: string }) => {
        this.registerPeer(socket, data.username);
      });

      socket.on('peer:authenticate', (data: { peerId: string; otp: string }) => {
        this.authenticatePeer(socket, data.peerId, data.otp);
      });

      socket.on('peer:discover', () => {
        this.sendPeerList(socket);
      });

      socket.on('file:share', (data: { fileId: string; targetPeerId: string }) => {
        this.shareFile(socket, data.fileId, data.targetPeerId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private registerPeer(socket: Socket, username: string): void {
    const peerId = uuidv4();
    const peer: Peer = {
      id: peerId,
      socketId: socket.id,
      username,
      isAuthenticated: false,
      connectedAt: new Date()
    };

    this.peers.set(peerId, peer);
    
    socket.emit('peer:registered', { peerId });
    this.broadcastPeerUpdate();
  }

  authenticatePeer(socket: Socket, peerId: string, otp: string): boolean {
    const peer = this.peers.get(peerId);
    if (!peer || peer.socketId !== socket.id) {
      socket.emit('auth:failed', { message: 'Invalid peer ID' });
      return false;
    }

    // Note: OTP verification would be handled by OTPManager in the main application
    peer.isAuthenticated = true;
    socket.emit('auth:success', { peerId });
    this.broadcastPeerUpdate();
    return true;
  }

  private sendPeerList(socket: Socket): void {
    const authenticatedPeers = Array.from(this.peers.values())
      .filter(peer => peer.isAuthenticated)
      .map(peer => ({
        id: peer.id,
        username: peer.username,
        connectedAt: peer.connectedAt
      }));

    socket.emit('peers:list', { peers: authenticatedPeers });
  }

  private shareFile(socket: Socket, fileId: string, targetPeerId: string): void {
    const senderPeer = Array.from(this.peers.values())
      .find(peer => peer.socketId === socket.id);
    
    const targetPeer = this.peers.get(targetPeerId);

    if (!senderPeer || !targetPeer || !senderPeer.isAuthenticated || !targetPeer.isAuthenticated) {
      socket.emit('file:share:failed', { message: 'Invalid peer or not authenticated' });
      return;
    }

    // Notify target peer about incoming file
    this.io.to(targetPeer.socketId).emit('file:incoming', {
      fileId,
      fromPeer: {
        id: senderPeer.id,
        username: senderPeer.username
      }
    });

    socket.emit('file:share:initiated', { targetPeerId });
  }

  private broadcastPeerUpdate(): void {
    const authenticatedPeers = Array.from(this.peers.values())
      .filter(peer => peer.isAuthenticated)
      .map(peer => ({
        id: peer.id,
        username: peer.username,
        connectedAt: peer.connectedAt
      }));

    this.io.emit('peers:updated', { peers: authenticatedPeers });
  }

  private handleDisconnect(socket: Socket): void {
    const peer = Array.from(this.peers.values())
      .find(p => p.socketId === socket.id);

    if (peer) {
      this.peers.delete(peer.id);
      this.broadcastPeerUpdate();
      console.log(`Peer disconnected: ${peer.username} (${peer.id})`);
    }
  }

  getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId);
  }

  getAllPeers(): Peer[] {
    return Array.from(this.peers.values());
  }
}
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) {
      return 0;
    }
    
    // Simulate progress (in real implementation, this would track actual progress)
    return Math.random() * 100;
  }
}
