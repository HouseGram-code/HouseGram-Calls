import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { ref, set, onValue, remove, onDisconnect } from "firebase/database";
import Peer, { MediaConnection } from 'peerjs';

export type CallState = 'idle' | 'calling' | 'incoming' | 'incall' | 'error';

@Injectable({
  providedIn: 'root'
})
export class CallService implements OnDestroy {
  private firebaseService = inject(FirebaseService);
  private db = this.firebaseService.getDb();
  
  public callState = signal<CallState>('idle');
  public myUserId = signal<string>('');
  public remoteUserId = signal<string | null>(null);
  public remoteStream = signal<MediaStream | null>(null);
  public errorMessage = signal<string | null>(null);

  private peer: Peer | null = null;
  private activeCall: MediaConnection | null = null;
  private localStream: MediaStream | null = null;
  
  // --- AUDIO ASSETS ---
  private ringtoneAudio = new Audio('https://cdn.freesound.org/previews/530/530583_11309838-lq.mp3');
  private connectionSound = new Audio('https://cdn.freesound.org/previews/337/337049_3232293-lq.mp3');
  private endCallSound = new Audio('https://cdn.freesound.org/previews/325/325330_5762266-lq.mp3');
  private incomingCallSound = new Audio('https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3'); // New sound for incoming

  constructor() {
    this.initializeUserId();
    this.initPeer();

    // Audio setup
    this.ringtoneAudio.loop = true;
    this.ringtoneAudio.volume = 0.4;
    
    this.incomingCallSound.loop = true;
    this.incomingCallSound.volume = 0.5;

    this.connectionSound.volume = 0.6;
    this.endCallSound.volume = 0.5;
  }

  ngOnDestroy() {
    this.hangup();
    if (this.myUserId()) {
      remove(ref(this.db, `users/${this.myUserId()}`));
    }
  }

  private initializeUserId() {
    let id = localStorage.getItem('housegram_userid');
    if (!id) {
      // Generate a simple random ID (e.g., 6 digits for easier typing)
      id = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('housegram_userid', id);
    }
    this.myUserId.set(id);
  }

  // --- AUDIO CONTROL ---
  private playRingtone() {
    this.ringtoneAudio.currentTime = 0;
    this.ringtoneAudio.play().catch(() => {});
  }

  private stopRingtone() {
    this.ringtoneAudio.pause();
    this.ringtoneAudio.currentTime = 0;
  }

  private playIncomingSound() {
    this.incomingCallSound.currentTime = 0;
    this.incomingCallSound.play().catch(() => {});
  }

  private stopIncomingSound() {
    this.incomingCallSound.pause();
    this.incomingCallSound.currentTime = 0;
  }

  private playConnectSound() {
    this.connectionSound.currentTime = 0;
    this.connectionSound.play().catch(() => {});
  }

  private playEndSound() {
    this.endCallSound.currentTime = 0;
    this.endCallSound.play().catch(() => {});
  }

  // --- NOTIFICATIONS ---
  public requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  private triggerNotification(title: string, body: string) {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico', tag: 'housegram-call' });
    }
  }

  // --- WEBRTC / PEER LOGIC ---
  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      console.error("Microphone error:", err);
      this.errorMessage.set("Ошибка доступа к микрофону.");
      throw err;
    }
  }

  private initPeer() {
    try {
      this.peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (peerId) => {
        console.log('My Peer ID:', peerId);
        this.registerPresence(peerId);
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        this.errorMessage.set(`Ошибка сети: ${err.type}`);
        // Retry logic could go here
      });

      // Handle incoming calls
      this.peer.on('call', (call) => {
        console.log('Incoming call...');
        
        // If already in a call, busy? For now, auto-reject or replace?
        // Let's simple auto-answer for now or show UI. 
        // Ideally: Show "Incoming Call" UI.
        
        this.handleIncomingCall(call);
      });

    } catch (e) {
      console.error('Peer init failed', e);
    }
  }

  private registerPresence(peerId: string) {
    const userId = this.myUserId();
    const userRef = ref(this.db, `users/${userId}`);
    
    set(userRef, {
      peerId: peerId,
      lastSeen: Date.now(),
      status: 'online'
    });

    // Remove from DB on disconnect
    onDisconnect(userRef).remove();
  }

  private handleIncomingCall(call: MediaConnection) {
    if (this.callState() === 'incall' || this.callState() === 'calling') {
      // Busy
      call.close();
      return;
    }

    this.activeCall = call;
    this.callState.set('incoming');
    this.playIncomingSound();
    
    // Handle if caller hangs up before we answer
    call.on('close', () => {
      this.hangup();
    });
    
    call.on('error', () => {
      this.hangup();
    });
  }

  async answerCall() {
    if (!this.activeCall) return;
    
    try {
      this.stopIncomingSound();
      await this.startLocalStream();
      
      this.activeCall.answer(this.localStream!);
      this.setupCallEvents(this.activeCall);
      
    } catch (e) {
      console.error(e);
      this.hangup();
    }
  }

  async startCall(targetUserId: string) {
    this.errorMessage.set(null);
    if (!targetUserId) return;
    if (targetUserId === this.myUserId()) {
      this.errorMessage.set("Нельзя позвонить самому себе");
      return;
    }

    this.callState.set('calling');
    this.remoteUserId.set(targetUserId);
    this.playRingtone();

    try {
      await this.startLocalStream();

      // Lookup peerId
      const snapshot = await new Promise<any>((resolve) => {
        onValue(ref(this.db, `users/${targetUserId}/peerId`), (snap) => resolve(snap), { onlyOnce: true });
      });
      
      const targetPeerId = snapshot.val();
      
      if (!targetPeerId) {
        throw new Error("Пользователь не в сети или не существует");
      }

      if (!this.peer) throw new Error("Peer not initialized");

      // Call
      const call = this.peer.call(targetPeerId, this.localStream!, {
        metadata: { callerId: this.myUserId() }
      });
      
      this.setupCallEvents(call);

    } catch (e: any) {
      console.error(e);
      this.stopRingtone();
      this.errorMessage.set(e.message || "Не удалось позвонить");
      this.callState.set('idle');
    }
  }

  private setupCallEvents(call: MediaConnection) {
    this.activeCall = call;

    call.on('stream', (remoteStream) => {
      console.log('Stream received');
      this.stopRingtone();
      this.stopIncomingSound();
      this.playConnectSound();
      
      this.remoteStream.set(remoteStream);
      this.callState.set('incall');
    });

    call.on('close', () => {
      this.hangup();
    });

    call.on('error', () => {
      this.errorMessage.set("Ошибка связи");
      this.hangup();
    });
  }

  hangup() {
    this.stopRingtone();
    this.stopIncomingSound();
    
    if (this.callState() === 'incall') {
      this.playEndSound();
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    if (this.activeCall) {
      this.activeCall.close();
      this.activeCall = null;
    }

    this.remoteStream.set(null);
    this.callState.set('idle');
    this.remoteUserId.set(null);
  }
}