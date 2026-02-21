import { Component, inject, effect, viewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallService } from './services/call.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="flex flex-col h-screen w-full bg-black text-white overflow-hidden font-sans relative selection:bg-red-500 selection:text-white">
  
  <!-- Background Effects -->
  <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full blur-[100px] animate-pulse-slow"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px] animate-pulse-slow" style="animation-delay: 2s"></div>
  </div>

  <!-- Header -->
  <header class="p-4 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-20 sticky top-0">
    <div class="flex items-center gap-3">
      <div class="relative">
        <div class="w-2 h-2 bg-green-500 rounded-full absolute top-0 right-0 animate-ping"></div>
        <div class="w-8 h-8 bg-gradient-to-br from-red-600 to-red-900 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      <div>
        <h1 class="text-lg font-bold tracking-wider text-white">HouseGram</h1>
        <p class="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Secure Voice</p>
      </div>
    </div>
    
    <button (click)="toggleMenu()" class="p-2 text-gray-400 hover:text-white transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    </button>
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col relative z-10 overflow-y-auto custom-scrollbar">
    
    <!-- Hidden Audio -->
    <audio #remoteAudio autoplay playsinline></audio>

    <!-- Error Toast -->
    @if (callService.errorMessage()) {
      <div class="mx-4 mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 animate-slide-down backdrop-blur-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-red-200">{{ callService.errorMessage() }}</p>
      </div>
    }

    <!-- VIEW: IDLE (Dashboard) -->
    @if (callService.callState() === 'idle') {
      <div class="flex-1 flex flex-col p-6 max-w-md mx-auto w-full animate-fade-in">
        
        <!-- My ID Card -->
        <div class="mb-8 relative group">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-purple-600 rounded-2xl opacity-30 group-hover:opacity-70 transition duration-500 blur"></div>
          <div class="relative bg-black border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center">
            <span class="text-xs text-gray-500 uppercase tracking-widest mb-2">Ваш личный ID</span>
            <div (click)="copyId()" class="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform">
              <span class="text-3xl font-mono font-bold text-white tracking-wider">{{ callService.myUserId() }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-[10px] text-gray-600 mt-2">Нажмите, чтобы скопировать и отправить другу</p>
          </div>
        </div>

        <!-- Call Action -->
        <div class="space-y-4">
          <label class="text-sm text-gray-400 font-medium ml-1">Позвонить другу</label>
          <div class="relative">
            <input 
              type="text" 
              [(ngModel)]="targetId" 
              placeholder="Введите ID собеседника" 
              class="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-4 pl-12 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-mono"
            >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>

          <button (click)="startCall()" [disabled]="!targetId().trim()" class="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10 flex items-center justify-center gap-2">
            <span>Позвонить</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        <!-- Recent (Placeholder) -->
        <div class="mt-12">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">История (Скоро)</h3>
          <div class="space-y-2 opacity-50 pointer-events-none">
            <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs">ID</div>
                <span class="font-mono text-sm">748392</span>
              </div>
              <span class="text-xs text-gray-500">Вчера</span>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- VIEW: CALLING (Outgoing) -->
    @if (callService.callState() === 'calling') {
      <div class="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
        <div class="relative mb-8">
          <div class="absolute inset-0 bg-red-500 rounded-full blur-2xl opacity-20 animate-pulse-ring"></div>
          <div class="w-32 h-32 rounded-full border-2 border-red-500/30 flex items-center justify-center bg-black relative z-10">
            <div class="w-24 h-24 rounded-full bg-red-900/20 flex items-center justify-center animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
        </div>
        
        <h2 class="text-2xl font-bold text-white mb-2">Вызов...</h2>
        <p class="text-gray-400 font-mono mb-12">{{ callService.remoteUserId() }}</p>
        
        <button (click)="hangup()" class="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-900/50 transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    }

    <!-- VIEW: INCOMING (Incoming) -->
    @if (callService.callState() === 'incoming') {
      <div class="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in bg-black/90 z-50 fixed inset-0">
        <div class="absolute inset-0 overflow-hidden">
           <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/20 rounded-full blur-[120px] animate-pulse"></div>
        </div>

        <div class="relative z-10 text-center">
          <div class="w-24 h-24 mx-auto bg-gray-800 rounded-full mb-6 flex items-center justify-center border-2 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
             <span class="text-4xl">👋</span>
          </div>
          <h2 class="text-3xl font-bold text-white mb-2">Входящий звонок</h2>
          <p class="text-green-400 font-mono mb-12">Кто-то хочет поговорить</p>
          
          <div class="flex items-center gap-8">
            <button (click)="hangup()" class="flex flex-col items-center gap-2 group">
              <div class="w-16 h-16 rounded-full bg-red-600/20 border border-red-600 text-red-500 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span class="text-xs text-gray-400">Отклонить</span>
            </button>

            <button (click)="answer()" class="flex flex-col items-center gap-2 group">
              <div class="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:scale-110 transition-all duration-300 animate-bounce-slight">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span class="text-xs text-white font-bold">Ответить</span>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- VIEW: IN CALL (Active) -->
    @if (callService.callState() === 'incall') {
      <div class="flex-1 flex flex-col items-center justify-center p-6 space-y-12 animate-fade-in relative">
        
        <!-- Timer / Status -->
        <div class="text-center space-y-2 z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold tracking-widest uppercase mb-4">
            <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Live Audio
          </div>
          <h2 class="text-4xl font-bold text-white tracking-tight">Connected</h2>
          <p class="text-gray-500 font-mono text-sm">{{ callService.remoteUserId() || 'Unknown User' }}</p>
        </div>

        <!-- Visualizer -->
        <div class="h-40 w-full flex items-center justify-center gap-1.5 z-10">
           @for (bar of [1,2,3,4,5,6,7,8,9,10]; track bar) {
             <div class="w-3 bg-gradient-to-t from-red-600 to-purple-600 rounded-full wave-bar opacity-80" 
                  [style.animation-duration]="(0.4 + Math.random() * 0.5) + 's'"
                  [style.height]="(20 + Math.random() * 60) + '%'"></div>
           }
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-6 z-10">
           <button class="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
           </button>
           
           <button (click)="hangup()" class="p-6 rounded-full bg-red-600 text-white shadow-xl shadow-red-900/50 hover:bg-red-700 active:scale-95 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
           </button>

           <button class="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
           </button>
        </div>
      </div>
    }

  </main>

  <!-- Menu Overlay -->
  @if (menuOpen()) {
    <div class="absolute top-16 right-4 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 animate-fade-in origin-top-right overflow-hidden">
       <div class="p-4 border-b border-white/5">
         <p class="text-xs text-gray-500 uppercase">Настройки</p>
       </div>
       <button class="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition-colors">Правила сервиса</button>
       <button class="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition-colors">Политика конфиденциальности</button>
       <div class="h-px bg-white/5 mx-4"></div>
       <button class="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors">Сбросить ID</button>
    </div>
    <div (click)="toggleMenu()" class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"></div>
  }

</div>
  `,
  styles: [`
    .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    .animate-pulse-ring { animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
    .animate-bounce-slight { animation: bounce-slight 2s infinite; }
    .animate-slide-down { animation: slide-down 0.3s ease-out; }
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
    
    @keyframes pulse-ring {
      0% { transform: scale(0.8); opacity: 0.5; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    @keyframes bounce-slight {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    @keyframes slide-down {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .wave-bar {
      animation: wave 1s ease-in-out infinite;
    }
    @keyframes wave {
      0%, 100% { height: 20%; }
      50% { height: 80%; }
    }
  `]
})
export class AppComponent {
  callService = inject(CallService);
  
  remoteAudio = viewChild<ElementRef<HTMLAudioElement>>('remoteAudio');
  
  targetId = signal('');
  menuOpen = signal(false);
  
  Math = Math; // For template

  constructor() {
    effect(() => {
      const stream = this.callService.remoteStream();
      const audioEl = this.remoteAudio()?.nativeElement;
      if (stream && audioEl) {
        audioEl.srcObject = stream;
        audioEl.play().catch(e => console.error("Error playing audio:", e));
      }
    });
  }

  startCall() {
    if (this.targetId().trim()) {
      this.callService.requestNotificationPermission();
      this.callService.startCall(this.targetId().trim());
    }
  }

  answer() {
    this.callService.requestNotificationPermission();
    this.callService.answerCall();
  }

  hangup() {
    this.callService.hangup();
  }
  
  copyId() {
    const id = this.callService.myUserId();
    if(id) {
       navigator.clipboard.writeText(id).then(() => alert('ID скопирован!'));
    }
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }
}