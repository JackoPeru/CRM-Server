import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

const useDocument = (collectionName, docId) => {
   /* … codice identico al txt … */
};
export default useDocument;
