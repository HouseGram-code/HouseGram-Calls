import { Injectable, inject } from '@angular/core';
import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDKCtksw4Nbc8q0DvJ3pZGnj_5hsZcPHDs",
  authDomain: "housegram-beta.firebaseapp.com",
  databaseURL: "https://housegram-beta-default-rtdb.firebaseio.com",
  projectId: "housegram-beta",
  storageBucket: "housegram-beta.firebasestorage.app",
  messagingSenderId: "378536276797",
  appId: "1:378536276797:web:e84f7296602f2e7d888b54",
  measurementId: "G-5PE5JSHG5V"
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private db: Database;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    // Explicitly passing the app instance to ensure correct service resolution
    this.db = getDatabase(this.app);
    console.log("Firebase initialized");
  }

  getDb() {
    return this.db;
  }
}