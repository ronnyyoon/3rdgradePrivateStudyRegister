import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
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
const META_COLLECTION = 'system';
const META_DOC = 'attendance_meta';

export interface AttendanceMetadata {
  activeWeekMonday: string; // e.g. '26.08.24'
  lastArchivedWeekMonday?: string;
  lastArchivedAt?: string;
  rosterVersion?: string;
}

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
}

/**
 * 시스템 출석 메타데이터(현재 활성 주차 월요일 등)를 가져옵니다.
 */
export async function getAttendanceMetadata(): Promise<AttendanceMetadata | null> {
  try {
    const docRef = doc(db, META_COLLECTION, META_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AttendanceMetadata;
    }
    return null;
  } catch (error) {
    console.error('Attendance metadata fetch error:', error);
    return null;
  }
}

/**
 * 시스템 출석 메타데이터를 저장합니다.
 */
export async function saveAttendanceMetadata(meta: Partial<AttendanceMetadata>): Promise<void> {
  try {
    const docRef = doc(db, META_COLLECTION, META_DOC);
    await setDoc(docRef, meta, { merge: true });
  } catch (error) {
    console.error('Attendance metadata save error:', error);
  }
}

/**
 * 실시간으로 학생 목록을 구독(listen)합니다.
 */
export function subscribeToStudents(
  onUpdate: (students: Student[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Student);
        });
        list.sort((a, b) => a.studentId.localeCompare(b.studentId));
        onUpdate(list);
      },
      (err) => {
        console.error('Firestore onSnapshot error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.error('Failed to initialize subscription:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Firestore로부터 전체 학생 목록을 1회 가져옵니다.
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
    
    return students.sort((a, b) => a.studentId.localeCompare(b.studentId));
  } catch (error) {
    console.error('Firebase 로드 오류:', error);
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    throw error;
  }
}

/**
 * Firestore는 undefined 필드를 지원하지 않으므로, 객체 내 undefined 값을 재귀적으로 제거/정제합니다.
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = cleanForFirestore(value);
    }
  }
  return result as T;
}

/**
 * 신규 학생을 Firebase에 추가합니다.
 */
export async function addStudentToFirebase(student: Student): Promise<void> {
  try {
    const cleanData = cleanForFirestore(student);
    const studentDocRef = doc(db, COLLECTION_NAME, student.id);
    await setDoc(studentDocRef, cleanData);
    console.log(`[Firebase] 학생 등록 완료: ${student.name}`);
  } catch (error) {
    console.error(`Firebase 학생 등록 오류 (${student.name}):`, error);
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${student.id}`);
    throw error;
  }
}

/**
 * 특정 학생의 변경 사항을 Firebase에 업데이트합니다.
 */
export async function updateStudentInFirebase(studentId: string, partial: Partial<Student>): Promise<void> {
  try {
    const cleanData = cleanForFirestore(partial);
    const studentDocRef = doc(db, COLLECTION_NAME, studentId);
    await setDoc(studentDocRef, cleanData, { merge: true });
  } catch (error) {
    console.error(`Firebase 학생 업데이트 오류 (${studentId}):`, error);
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${studentId}`);
    throw error;
  }
}

/**
 * 학생을 Firebase에서 완전히 삭제합니다.
 */
export async function deleteStudentFromFirebase(studentId: string): Promise<void> {
  try {
    const studentDocRef = doc(db, COLLECTION_NAME, studentId);
    await deleteDoc(studentDocRef);
    console.log(`[Firebase] 학생 문서 영구 삭제 완료: ${studentId}`);
  } catch (error) {
    console.error(`Firebase 학생 삭제 오류 (${studentId}):`, error);
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${studentId}`);
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
      const cleanData = cleanForFirestore(student);
      const studentDocRef = doc(db, COLLECTION_NAME, student.id);
      batch.set(studentDocRef, cleanData);
    });
    await batch.commit();
    console.log(`${students.length}명의 학생 데이터가 Firebase에 성공적으로 일괄 저장되었습니다.`);
  } catch (error) {
    console.error('Firebase 일괄 저장 오류:', error);
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
    throw error;
  }
}

/**
 * 기존 Firebase의 이전 명단을 완전히 지우고 새 명단으로 전면 교체합니다.
 */
export async function replaceAllStudentsInFirebase(students: Student[]): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const batch = writeBatch(db);
    
    // 기존 문서 삭제
    querySnapshot.forEach((d) => {
      batch.delete(d.ref);
    });
    
    // 새 학생 명단 추가
    students.forEach((student) => {
      const cleanData = cleanForFirestore(student);
      const studentDocRef = doc(db, COLLECTION_NAME, student.id);
      batch.set(studentDocRef, cleanData);
    });
    
    await batch.commit();
    console.log(`[Firebase] ${students.length}명의 새로운 재편성 명단으로 완전 교체 완료`);
  } catch (error) {
    console.error('Firebase 전면 교체 오류:', error);
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
    throw error;
  }
}

