import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Student } from '../types';

const firebaseConfig = {
  projectId: "modified-mote-207pf",
  appId: "1:921522866159:web:754d71b905c75ab8de181a",
  apiKey: "AIzaSyAmWv8nUlpusf7mIKUFonmbx-eITFR_ETw",
  authDomain: "modified-mote-207pf.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-1d951efd-3138-4319-8cd7-fd9bf83f529a",
  storageBucket: "modified-mote-207pf.firebasestorage.app",
  messagingSenderId: "921522866159",
  measurementId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId and force long polling
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

export const db = dbId
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, dbId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

const COLLECTION_NAME = 'students';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Firestore로부터 전체 학생 목록을 가져옵니다.
 * 만약 비어있다면, 제공된 initialStudents를 최초 1회 Firebase에 업로드 한 후 반환합니다.
 */
export async function loadStudentsFromFirebase(initialStudents: Student[]): Promise<Student[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const students: Student[] = [];
    
    querySnapshot.forEach((doc) => {
      students.push(doc.data() as Student);
    });
    
    if (students.length === 0 && initialStudents.length > 0) {
      console.log('Firebase-firestore 비어있음 - 최초 1회 초기 목록 자동 업로드 중...');
      await saveAllStudentsToFirebase(initialStudents);
      return initialStudents;
    }
    
    // 학번(studentId) 순으로 오름차순 정렬하여 일관되게 제공
    return students.sort((a, b) => a.studentId.localeCompare(b.studentId));
  } catch (error) {
    console.error('Firebase 로드 오류:', error);
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    throw error;
  }
}

/**
 * 전체 학생 데이터를 일괄적으로 Firebase에 저장합니다. (Batch 사용)
 */
export async function saveAllStudentsToFirebase(students: Student[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    students.forEach((student) => {
      const studentDocRef = doc(db, COLLECTION_NAME, student.id);
      batch.set(studentDocRef, student);
    });
    await batch.commit();
    console.log(`${students.length}명의 학생 데이터가 Firebase에 성공적으로 일괄 보존 저장되었습니다.`);
  } catch (error) {
    console.error('Firebase 일괄 저장 오류:', error);
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
    throw error;
  }
}

/**
 * 특정 학생의 변경 사항을 Firebase에 업데이트합니다.
 */
export async function updateStudentInFirebase(student: Student): Promise<void> {
  try {
    const studentDocRef = doc(db, COLLECTION_NAME, student.id);
    await setDoc(studentDocRef, student, { merge: true });
    console.log(`[Firebase] 학생 수시 동기화 완료: ${student.name}`);
  } catch (error) {
    console.error(`Firebase 학생 업데이트 오류 (${student.name}):`, error);
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${student.id}`);
    throw error;
  }
}
