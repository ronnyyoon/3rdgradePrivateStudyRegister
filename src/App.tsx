import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  PlusCircle,
  BarChart3,
  CheckSquare,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  Student,
  DayOfWeek,
  Classroom,
  AttendanceStatus,
  NavigationMenu,
} from './types';
import { INITIAL_STUDENTS, createDefaultAttendance } from './data';
import {
  subscribeToStudents,
  addStudentToFirebase,
  updateStudentInFirebase,
  saveStudentDocument,
  deleteStudentFromFirebase,
  replaceAllStudentsInFirebase,
  getAttendanceMetadata,
  saveAttendanceMetadata,
  AttendanceMetadata,
} from './lib/firebase';
import {
  DAYS,
  STATUS_CYCLE,
  getPeriodsForDay,
  getStudentRoomForDay,
  isSaturdayNonParticipant,
  isWeekdayNonParticipant,
  getMondayOfDate,
  formatDateYYMMDD,
  parseDateFromYYMMDD,
  getWeekDatesForMonday,
  archiveAndResetWeek,
  removeStudentFromSaturday,
  removeStudentFromWeekday,
  addStudentToSaturday,
  addStudentToWeekday,
  removeStudentFromSpecificDay,
  addStudentToSpecificDay,
  updateStudentEarlyLeave,
  clearStudentEarlyLeave,
  generateDefaultPastAttendanceHistory,
  normalizeDateStr,
} from './utils/attendanceUtils';

// 분리된 뷰 및 모달 컴포넌트
import { AttendanceTableView } from './components/AttendanceTableView';
import { AttendanceStatsView } from './components/AttendanceStatsView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { StudentDetailModal } from './components/StudentDetailModal';
import { StudentAddModal, StudentAddFormData } from './components/StudentAddModal';
import { StudentDeleteModal } from './components/StudentDeleteModal';

const LOCAL_STORAGE_KEY = 'highschool_nightstudy_attendance_v7_unconfirmed';
const LOCAL_STORAGE_META_KEY = 'highschool_nightstudy_meta_v7';

// Helper: 학생 출석 데이터 공란('미참여일') 정규화 보장 및 신규 등록 학생 안전 복구
function normalizeStudentAttendance(student: Student): Student {
  const normAttendance = { ...student.attendance };

  // 신규 등록 버그로 인해 월~토 전 교시가 '미참여일'로 남아있던 학생 자동 복구
  const allDaysEmpty = DAYS.every(d => {
    const pData = normAttendance[d];
    if (!pData) return true;
    const periods = getPeriodsForDay(d);
    return periods.every(p => !pData[p] || pData[p] === '미참여일');
  });

  if (allDaysEmpty) {
    const weekdays: DayOfWeek[] = ['월', '화', '수', '목', '금'];
    weekdays.forEach(d => {
      normAttendance[d] = { p1: '미확인', p2: '미확인', p3: '미확인' };
    });
    if (student.saturdayClassroom) {
      normAttendance['토'] = { p1: '미확인', p2: '미확인', p3: '미확인', p4: '미확인' };
    }
  } else if (student.saturdayClassroom) {
    const sat = normAttendance['토'];
    const satAllEmpty = !sat || (
      (sat.p1 === '미참여일' || !sat.p1) &&
      (sat.p2 === '미참여일' || !sat.p2) &&
      (sat.p3 === '미참여일' || !sat.p3) &&
      (sat.p4 === '미참여일' || !sat.p4)
    );
    if (satAllEmpty && (student.id.startsWith('student_') || !student.id.startsWith('st_'))) {
      normAttendance['토'] = { p1: '미확인', p2: '미확인', p3: '미확인', p4: '미확인' };
    }
  }

  DAYS.forEach(d => {
    const periods = getPeriodsForDay(d);
    const dayData = { ...(normAttendance[d] || {}) };
    periods.forEach(p => {
      if (!dayData[p] || (dayData[p] as any) === '') {
        dayData[p] = '미참여일';
      }
    });
    normAttendance[d] = dayData as any;
  });

  // 토요일 전체가 '미참여일'인 학생은 saturdayClassroom 속성도 확실히 제거 (출석부-관리자설정 22명 동기화)
  const sat = normAttendance['토'];
  const satAllAbsent = !sat || (
    (sat.p1 === '미참여일' || !sat.p1) &&
    (sat.p2 === '미참여일' || !sat.p2) &&
    (sat.p3 === '미참여일' || !sat.p3) &&
    (sat.p4 === '미참여일' || !sat.p4)
  );
  const cleanSaturdayClassroom = satAllAbsent ? undefined : student.saturdayClassroom;

  // 누적 출석 이력(attendanceHistory) 복원: 기존 기록이 비어있으면 과거 아카이브 기록으로 자동 복원
  const hist = student.attendanceHistory && student.attendanceHistory.length > 0
    ? student.attendanceHistory
    : generateDefaultPastAttendanceHistory({ ...student, attendance: normAttendance });

  const result: Student = {
    ...student,
    saturdayClassroom: cleanSaturdayClassroom,
    attendance: normAttendance,
    attendanceHistory: hist,
  };
  if (!cleanSaturdayClassroom) {
    delete result.saturdayClassroom;
  }

  return result;
}

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [metadata, setMetadata] = useState<AttendanceMetadata | null>(null);
  const [currentMenu, setCurrentMenu] = useState<NavigationMenu>('attendance');
  const [activeTabDay, setActiveTabDay] = useState<DayOfWeek>(() => {
    const dayNames: DayOfWeek[] = ['토', '월', '화', '수', '목', '금', '토'];
    const today = new Date().getDay();
    return (dayNames[today] || '월') as DayOfWeek;
  });
  const [selectedClassroom, setSelectedClassroom] = useState<'전체' | Classroom>('전체');
  const [warningOnlyFilter, setWarningOnlyFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 현재 날짜 기준 주차 계산 (월요일 시작)
  const currentMondayDate = useMemo(() => getMondayOfDate(new Date()), []);
  const currentMondayStr = useMemo(() => formatDateYYMMDD(currentMondayDate), [currentMondayDate]);
  const dateMap = useMemo(() => getWeekDatesForMonday(currentMondayDate), [currentMondayDate]);

  // 47명 원본 명단 매핑
  const initialStudentsMap = useMemo(() => new Map(INITIAL_STUDENTS.map(s => [s.id, s])), []);

  // 모달 상태
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailWarningReason, setDetailWarningReason] = useState('');
  const [detailIsWarning, setDetailIsWarning] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<StudentAddFormData>({
    studentId: '',
    name: '',
    participationType: 'both',
    classroom: '3-2',
    saturdayClassroom: '3-3',
    enableEarlyLeave: false,
    earlyLeaveTime: '21:20',
    earlyLeaveDays: ['월', '화', '수', '목', '금'],
    notes: '',
  });

  // 분리 삭제 확인 모달 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetStudent, setDeleteTargetStudent] = useState<Student | null>(null);
  const [deleteModalDay, setDeleteModalDay] = useState<DayOfWeek>('월');

  // 토스트 메시지
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // 주간 갱신 처리 완료 여부 플래그
  const rolloverCheckDone = useRef(false);

  // 1. 데이터 로드 및 Firebase 실시간 연동 (월요일 자동 리셋 & 주간 누적)
  useEffect(() => {
    let unsubscribe = () => {};

    // 1-1. 시스템 메타데이터 확인 및 월요일 자동 롤오버 체크
    const checkWeeklyRollover = async (currentList: Student[]) => {
      if (rolloverCheckDone.current) return;
      rolloverCheckDone.current = true;

      try {
        let meta = await getAttendanceMetadata();
        if (!meta) {
          const localMeta = localStorage.getItem(LOCAL_STORAGE_META_KEY);
          if (localMeta) {
            try { meta = JSON.parse(localMeta); } catch {}
          }
        }

        if (meta && meta.activeWeekMonday && meta.activeWeekMonday !== currentMondayStr) {
          // 새 주차(월요일)가 시작됨! 이전 주차 기록 누적 아카이빙 및 출석부 초기화 수행
          console.log(`[Weekly Rollover] 새 주차 감지: 지난 주(${meta.activeWeekMonday}) -> 이번 주(${currentMondayStr})`);
          
          const prevMondayDate = parseDateFromYYMMDD(meta.activeWeekMonday) || new Date(currentMondayDate.getTime() - 7 * 86400000);
          const prevWeekDates = getWeekDatesForMonday(prevMondayDate);

          const rolledOverList = archiveAndResetWeek(currentList, prevWeekDates, initialStudentsMap);
          setStudents(rolledOverList);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rolledOverList));
          await replaceAllStudentsInFirebase(rolledOverList);

          const newMeta: AttendanceMetadata = {
            activeWeekMonday: currentMondayStr,
            lastArchivedWeekMonday: meta.activeWeekMonday,
            lastArchivedAt: new Date().toISOString(),
          };
          setMetadata(newMeta);
          localStorage.setItem(LOCAL_STORAGE_META_KEY, JSON.stringify(newMeta));
          await saveAttendanceMetadata(newMeta);

          showToast(`[주간 갱신] 새로운 주차가 시작되어 지난 주(${meta.activeWeekMonday}) 출석 기록이 누적 저장되고, 이번 주 출석부가 초기화되었습니다.`, 'success');
        } else {
          // 동일 주차 내 유지
          const currentMeta: AttendanceMetadata = meta || {
            activeWeekMonday: currentMondayStr,
          };
          setMetadata(currentMeta);
          localStorage.setItem(LOCAL_STORAGE_META_KEY, JSON.stringify(currentMeta));
          if (!meta) {
            await saveAttendanceMetadata(currentMeta);
          }
        }
      } catch (err) {
        console.error('Weekly rollover check error:', err);
      }
    };

    try {
      unsubscribe = subscribeToStudents(
        (data) => {
          if (data && data.length > 0) {
            const normalized = data.map(normalizeStudentAttendance);
            setStudents(normalized);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
            checkWeeklyRollover(normalized);
          } else {
            // Firestore가 비어있는 경우 로컬 스토리지 또는 INITIAL_STUDENTS로 최초 세팅
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localData) {
              try {
                const parsed = JSON.parse(localData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const normalized = parsed.map(normalizeStudentAttendance);
                  setStudents(normalized);
                  replaceAllStudentsInFirebase(normalized).catch(console.error);
                  checkWeeklyRollover(normalized);
                  return;
                }
              } catch (e) {
                console.error(e);
              }
            }
            // 디폴트 초기 명단 세팅
            setStudents(INITIAL_STUDENTS);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_STUDENTS));
            replaceAllStudentsInFirebase(INITIAL_STUDENTS).catch(console.error);
            checkWeeklyRollover(INITIAL_STUDENTS);
          }
        },
        (error) => {
          console.warn('Firebase sync offline, falling back to local storage', error);
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              const normalized = parsed.map(normalizeStudentAttendance);
              setStudents(normalized);
              checkWeeklyRollover(normalized);
            } catch {
              setStudents(INITIAL_STUDENTS);
              checkWeeklyRollover(INITIAL_STUDENTS);
            }
          } else {
            setStudents(INITIAL_STUDENTS);
            checkWeeklyRollover(INITIAL_STUDENTS);
          }
        }
      );
    } catch {
      setStudents(INITIAL_STUDENTS);
    }

    return () => unsubscribe();
  }, [currentMondayStr, currentMondayDate, initialStudentsMap]);

  // 2. students 변경 시 로컬 스토리지 백업
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students));
    }
  }, [students]);

  // 관리자 수동 주간 마감 및 새 주차 출석부 시작 핸들러
  const handleManualWeekRollover = async () => {
    const confirmMsg = `현재 주차(${currentMondayStr} 시작 주간)의 출석체크 내용을 학생별 '누적 출석 이력'에 저장하고,\n새로운 주차 출석부로 초기화하시겠습니까?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const rolledOver = archiveAndResetWeek(students, dateMap, initialStudentsMap);
      setStudents(rolledOver);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rolledOver));
      await replaceAllStudentsInFirebase(rolledOver);

      const newMeta: AttendanceMetadata = {
        activeWeekMonday: currentMondayStr,
        lastArchivedWeekMonday: currentMondayStr,
        lastArchivedAt: new Date().toISOString(),
      };
      setMetadata(newMeta);
      localStorage.setItem(LOCAL_STORAGE_META_KEY, JSON.stringify(newMeta));
      await saveAttendanceMetadata(newMeta);

      showToast('성공적으로 이번 주 출석 기록이 누적 저장되고, 새 주차 출석부로 초기화되었습니다.', 'success');
    } catch (e) {
      console.error('Manual rollover failed:', e);
      showToast('주간 마감 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // 활성(비삭제) 학생 수
  const activeStudentsCount = useMemo(() => {
    return students.filter(s => !s.isDeleted).length;
  }, [students]);

  // 자율학습 출석부 필터링 목록
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // 1. 삭제된 학생 제외
      if (student.isDeleted) return false;

      // 2. 평일(월~금) 규칙: 월~금 전체 공란(미참여일)인 학생은 평일 명단에서 제외 (토요 전용 학생)
      if (activeTabDay !== '토' && isWeekdayNonParticipant(student)) {
        return false;
      }

      // 3. 토요일 특별 규칙: 토요일 1~4교시 모두 '미참여일'인 학생은 토요일 명단에서 제외
      if (activeTabDay === '토' && isSaturdayNonParticipant(student)) {
        return false;
      }

      // 4. 자습실 필터링 (토요일은 saturdayClassroom 우선 기준)
      if (selectedClassroom !== '전체') {
        const studentRoom = getStudentRoomForDay(student, activeTabDay);
        if (studentRoom !== selectedClassroom) return false;
      }

      // 5. 경고 학생 필터
      if (warningOnlyFilter && !student.isWarning) return false;

      // 6. 검색어 필터
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = student.name.toLowerCase().includes(query);
        const matchId = student.studentId.toLowerCase().includes(query);
        if (!matchName && !matchId) return false;
      }

      return true;
    });
  }, [students, activeTabDay, selectedClassroom, warningOnlyFilter, searchQuery]);

  // 관리자 설정 뷰 필터링 목록
  const adminFilteredStudents = useMemo(() => {
    return students.filter(s => {
      if (s.isDeleted) return false;
      if (selectedClassroom !== '전체') {
        if (s.classroom !== selectedClassroom && s.saturdayClassroom !== selectedClassroom) {
          return false;
        }
      }
      return true;
    });
  }, [students, selectedClassroom]);

  // 요일 탭 전환 핸들러 (토요일 선택 시 3-2실에 있던 필터를 '전체'로 안전 전환)
  const handleTabDayChange = (day: DayOfWeek) => {
    setActiveTabDay(day);
    if (day === '토' && selectedClassroom === '3-2') {
      setSelectedClassroom('전체');
    }
  };

  // 교시 클릭 시 출석 상태 순환 변경 핸들러
  const handlePeriodClick = (studentId: string, day: DayOfWeek, period: 'p1' | 'p2' | 'p3' | 'p4') => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const currentStatus = student.attendance[day]?.[period] || '미참여일';
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];

    const updatedAttendance = {
      ...student.attendance,
      [day]: {
        ...student.attendance[day],
        [period]: nextStatus,
      },
    };

    const updatedStudent = { ...student, attendance: updatedAttendance };

    setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));
    updateStudentInFirebase(studentId, { attendance: updatedAttendance }).catch(console.error);
  };

  // 선택 요일 일괄 출석 처리
  const batchMarkAttendance = (day: DayOfWeek, status: AttendanceStatus) => {
    const periods = getPeriodsForDay(day);
    const updatedList = students.map(student => {
      if (student.isDeleted) return student;
      if (day === '토' && isSaturdayNonParticipant(student)) return student;

      // 현재 선택된 자습실에 속한 학생만 일괄 변경
      if (selectedClassroom !== '전체') {
        const room = getStudentRoomForDay(student, day);
        if (room !== selectedClassroom) return student;
      }

      const dayAttendance = { ...(student.attendance[day] || {}) };
      periods.forEach(p => {
        const currentVal = dayAttendance[p];
        // '미참여일'로 고정된 항목이 아닌 경우에만 일괄 변경
        if (currentVal !== '미참여일') {
          dayAttendance[p] = status;
        }
      });

      const updated = {
        ...student,
        attendance: {
          ...student.attendance,
          [day]: dayAttendance,
        },
      };

      updateStudentInFirebase(student.id, { attendance: updated.attendance }).catch(console.error);
      return updated;
    });

    setStudents(updatedList);
    showToast(`${day}요일 학생 출석 상태가 [${status}]로 일괄 처리되었습니다.`, 'success');
  };

  // 학생 삭제 / 자습 제외 모달 오픈 핸들러
  const handleDeleteStudent = (id: string, name: string, day: DayOfWeek = activeTabDay) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    setDeleteTargetStudent(student);
    setDeleteModalDay(day);
    setIsDeleteModalOpen(true);
  };

  // 1. 토요일 자습에서만 학생 제외 (평일 자습은 100% 안전 보존)
  const handleRemoveFromSaturday = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updated = removeStudentFromSaturday(student);
    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    try {
      await saveStudentDocument(updated);
      showToast(`${student.name} 학생이 토요일 자습 명단에서 제외되었습니다. (월~금 평일 자습 유지)`, 'success');
    } catch (e) {
      console.error(e);
      showToast('토요일 자습 제외 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // 2. 평일(월~금) 자습에서만 학생 제외 (토요일 자습은 안전 보존)
  const handleRemoveFromWeekday = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updated = removeStudentFromWeekday(student);
    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    try {
      await updateStudentInFirebase(studentId, {
        attendance: updated.attendance,
        fixedSettings: updated.fixedSettings,
      });
      showToast(`${student.name} 학생이 평일 자습 명단에서 제외되었습니다. (토요일 자습 유지)`, 'success');
    } catch (e) {
      console.error(e);
      showToast('평일 자습 제외 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // 3. 전체 명단에서 완전 영구 삭제
  const handlePermanentDelete = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    const studentName = student?.name || '학생';
    try {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      await deleteStudentFromFirebase(studentId);
      showToast(`${studentName} 학생이 전체 자율학습 명단에서 완전히 삭제되었습니다.`, 'success');
    } catch (e) {
      console.error(e);
      showToast('영구 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  // 4. 토요일 자습에 학생 추가 / 배정
  const handleAddToSaturday = async (studentId: string, room: Classroom) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updated = addStudentToSaturday(student, room);
    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    try {
      await updateStudentInFirebase(studentId, {
        saturdayClassroom: room,
        attendance: updated.attendance,
        fixedSettings: updated.fixedSettings,
      });
      showToast(`${student.name} 학생이 토요일 [${room}] 자습실로 배정되었습니다.`, 'success');
    } catch (e) {
      console.error(e);
      showToast('토요일 배정 중 오류가 발생했습니다.', 'error');
    }
  };

  // 5. 평일 자습에 학생 추가 / 배정
  const handleAddToWeekday = async (studentId: string, room: Classroom) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updated = addStudentToWeekday(student, room);
    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    try {
      await updateStudentInFirebase(studentId, {
        classroom: room,
        attendance: updated.attendance,
        fixedSettings: updated.fixedSettings,
      });
      showToast(`${student.name} 학생이 평일 [${room}] 자습실로 배정되었습니다.`, 'success');
    } catch (e) {
      console.error(e);
      showToast('평일 배정 중 오류가 발생했습니다.', 'error');
    }
  };

  // 5-1. 특정 요일 자습에서만 학생 제외 (다른 요일은 안전하게 보존)
  const handleRemoveFromSpecificDay = async (studentId: string, day: DayOfWeek) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updated = removeStudentFromSpecificDay(student, day);
    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    try {
      if (day === '토') {
        await saveStudentDocument(updated);
      } else {
        await updateStudentInFirebase(studentId, {
          attendance: updated.attendance,
          fixedSettings: updated.fixedSettings,
        });
      }
      showToast(`${student.name} 학생이 [${day}요일] 자습 명단에서 제외되었습니다. (다른 요일 유지)`, 'success');
    } catch (e) {
      console.error(e);
      showToast(`${day}요일 자습 제외 처리 중 오류가 발생했습니다.`, 'error');
    }
  };

  // 5-2. 특정 요일 자습에 학생 추가 / 배정
  const handleAddToSpecificDay = async (studentId: string, day: DayOfWeek, room?: Classroom) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updated = addStudentToSpecificDay(student, day, room);
    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    try {
      const updateData: any = {
        attendance: updated.attendance,
        fixedSettings: updated.fixedSettings,
        classroom: updated.classroom,
      };
      if (day === '토') {
        updateData.saturdayClassroom = updated.saturdayClassroom || room || '3-3';
      }
      await updateStudentInFirebase(studentId, updateData);
      showToast(`${student.name} 학생이 [${day}요일] 자습 명단에 추가되었습니다.`, 'success');
    } catch (e) {
      console.error(e);
      showToast(`${day}요일 자습 추가 중 오류가 발생했습니다.`, 'error');
    }
  };

  // 6. 조기 하교 설정 직접 업데이트
  const handleUpdateEarlyLeave = async (studentId: string, days: DayOfWeek[], timeText: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updated = updateStudentEarlyLeave(student, days, timeText);
    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    try {
      await updateStudentInFirebase(studentId, {
        earlyLeave: updated.earlyLeave,
      });
      showToast(`${student.name} 학생의 조기 하교(${days.join(',')}) [${timeText}] 설정이 저장되었습니다.`, 'success');
    } catch (e) {
      console.error(e);
      showToast('조기 하교 설정 저장 중 오류가 발생했습니다.', 'error');
    }
  };

  // 7. 조기 하교 설정 해제
  const handleClearEarlyLeave = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updated = clearStudentEarlyLeave(student);
    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    try {
      await updateStudentInFirebase(studentId, {
        earlyLeave: {},
        notes: updated.notes || '',
      });
      showToast(`${student.name} 학생의 조기 하교 설정이 해제되었습니다.`, 'info');
    } catch (e) {
      console.error(e);
      showToast('조기 하교 해제 중 오류가 발생했습니다.', 'error');
    }
  };

  // 관리자 설정: 평일 자습실 변경 핸들러
  const handleWeekdayClassroomChange = (studentId: string, room: Classroom) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updated = {
      ...student,
      classroom: room,
    };

    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    updateStudentInFirebase(studentId, { classroom: room }).catch(console.error);
    showToast(`${student.name} 평일 자습실이 [${room}]로 변경되었습니다.`, 'success');
  };

  // 관리자 설정: 고정값 변경 핸들러
  const handleFixedSettingChange = (
    studentId: string,
    day: DayOfWeek,
    period: 'p1' | 'p2' | 'p3' | 'p4',
    status: AttendanceStatus
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const currentFixed = student.fixedSettings || student.attendance || createDefaultAttendance();
    const newFixed = {
      ...currentFixed,
      [day]: {
        ...currentFixed[day],
        [period]: status,
      },
    };

    // 실시간 출석부에도 동기화
    const newAttendance = {
      ...student.attendance,
      [day]: {
        ...student.attendance[day],
        [period]: status,
      },
    };

    const updated = {
      ...student,
      fixedSettings: newFixed,
      attendance: newAttendance,
    };

    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    updateStudentInFirebase(studentId, {
      fixedSettings: newFixed,
      attendance: newAttendance,
    }).catch(console.error);
  };

  // 관리자 설정: 토요일 자습실 변경 핸들러
  const handleSaturdayClassroomChange = (studentId: string, room: Classroom) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updated = {
      ...student,
      saturdayClassroom: room,
    };

    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    updateStudentInFirebase(studentId, { saturdayClassroom: room }).catch(console.error);
  };

  // 고정값 전체 강제 동기화
  const forceResetAllToFixed = () => {
    const updated = students.map(s => {
      const fixed = s.fixedSettings || s.attendance || createDefaultAttendance();
      return {
        ...s,
        attendance: JSON.parse(JSON.stringify(fixed)),
      };
    });

    setStudents(updated);
    replaceAllStudentsInFirebase(updated).catch(console.error);
    showToast('모든 학생의 출석부가 관리자 기본 고정값으로 전원 동기화되었습니다.', 'success');
  };

  // 고정값 전원 초기화
  const resetAllFixedSettings = () => {
    if (!confirm('모든 학생들의 관리자 사전 고정 설정을 공란으로 초기화하시겠습니까?')) {
      return;
    }
    const updated = students.map(s => ({ ...s, fixedSettings: undefined }));
    setStudents(updated);
    replaceAllStudentsInFirebase(updated).catch(console.error);
    showToast('전원 기본 고정값이 해제되었습니다.', 'info');
  };

  // 스프레드시트 47명 최신 원본 명단 전체 재동기화 (누적 출석 이력 100% 안전 보존)
  const restoreFromInitialRoster = async () => {
    try {
      const historyMap = new Map<string, any[]>();
      students.forEach(s => {
        if (s.attendanceHistory && s.attendanceHistory.length > 0) {
          historyMap.set(s.id, s.attendanceHistory);
        }
      });

      const restoredWithHistory = INITIAL_STUDENTS.map(init => {
        const hist = historyMap.get(init.id);
        const resolvedHist = hist && hist.length > 0 ? hist : generateDefaultPastAttendanceHistory(init);
        return {
          ...init,
          attendanceHistory: resolvedHist,
        };
      });

      setStudents(restoredWithHistory);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(restoredWithHistory));
      await replaceAllStudentsInFirebase(restoredWithHistory);
      showToast('스프레드시트 47명 최신 편성표로 전체 명단이 성공적으로 재동기화되었습니다! (출석 누가기록 보존됨)', 'success');
    } catch (e) {
      console.error(e);
      showToast('명단 재동기화 중 오류가 발생했습니다.', 'error');
    }
  };

  // 삭제되었던 지난 주차(26.10.12~10.24) 출석 누가기록 복원 핸들러
  const handleRestoreCumulativeHistory = async () => {
    try {
      const updated = students.map(student => {
        const past = generateDefaultPastAttendanceHistory(student);
        const current = student.attendanceHistory || [];
        const combined = [...current];

        past.forEach(item => {
          const norm = normalizeDateStr(item.date);
          const exists = combined.some(c => normalizeDateStr(c.date) === norm && c.period === item.period);
          if (!exists) {
            combined.push(item);
          }
        });

        return {
          ...student,
          attendanceHistory: combined,
        };
      });

      setStudents(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      await replaceAllStudentsInFirebase(updated);
      showToast('모든 학생의 이전 주차 출석 누가기록이 성공적으로 복원되었습니다!', 'success');
    } catch (e) {
      console.error(e);
      showToast('누가기록 복원 중 오류가 발생했습니다.', 'error');
    }
  };

  // 학생 세부 모달 열기
  const openStudentDetail = (student: Student) => {
    setSelectedStudent(student);
    setDetailWarningReason(student.warningReason || '');
    setDetailIsWarning(!!student.isWarning);
    setIsDetailModalOpen(true);
  };

  // 학생 세부 모달 저장
  const saveStudentDetailChanges = () => {
    if (!selectedStudent) return;

    const updated: Student = {
      ...selectedStudent,
      isWarning: detailIsWarning,
      warningReason: detailIsWarning ? detailWarningReason : '',
    };

    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updated : s));
    updateStudentInFirebase(selectedStudent.id, {
      isWarning: detailIsWarning,
      warningReason: detailIsWarning ? detailWarningReason : '',
    }).catch(console.error);

    setIsDetailModalOpen(false);
    showToast(`${selectedStudent.name} 학생의 상세 정보가 저장되었습니다.`, 'success');
  };

  // 학생 수동 등록 (오류 없는 안전 등록 & 평일/토요/조기하교 분리 지원)
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.studentId.trim() || !addForm.name.trim()) {
      showToast('학번과 이름을 모두 입력해주세요.', 'error');
      return;
    }

    const trimmedId = addForm.studentId.trim();
    const trimmedName = addForm.name.trim();

    // 학번 중복 검사 (비삭제 학생 중)
    const existing = students.find(s => !s.isDeleted && s.studentId === trimmedId);
    if (existing) {
      if (!confirm(`학번 ${trimmedId}(${existing.name}) 학생이 이미 등록되어 있습니다. 계속 등록하시겠습니까?`)) {
        return;
      }
    }

    // 참여 일정 구분 (both: 평일+토요, weekday: 평일만, saturday: 토요만)
    const isWeekday = addForm.participationType === 'both' || addForm.participationType === 'weekday';
    const isSaturday = addForm.participationType === 'both' || addForm.participationType === 'saturday';

    const allActiveWeekday = { p1: '미확인' as const, p2: '미확인' as const, p3: '미확인' as const };
    const allAbsentWeekday = { p1: '미참여일' as const, p2: '미참여일' as const, p3: '미참여일' as const };
    const allActiveSaturday = { p1: '미확인' as const, p2: '미확인' as const, p3: '미확인' as const, p4: '미확인' as const };
    const allAbsentSaturday = { p1: '미참여일' as const, p2: '미참여일' as const, p3: '미참여일' as const, p4: '미참여일' as const };

    const defaultAttendance: Student['attendance'] = {
      '월': isWeekday ? { ...allActiveWeekday } : { ...allAbsentWeekday },
      '화': isWeekday ? { ...allActiveWeekday } : { ...allAbsentWeekday },
      '수': isWeekday ? { ...allActiveWeekday } : { ...allAbsentWeekday },
      '목': isWeekday ? { ...allActiveWeekday } : { ...allAbsentWeekday },
      '금': isWeekday ? { ...allActiveWeekday } : { ...allAbsentWeekday },
      '토': isSaturday ? { ...allActiveSaturday } : { ...allAbsentSaturday },
    };

    const fixedAttendance: Student['attendance'] = JSON.parse(JSON.stringify(defaultAttendance));

    // 조기 하교 맵 구성
    let earlyLeaveMap: Partial<Record<DayOfWeek, string>> | undefined = undefined;
    if (addForm.enableEarlyLeave && addForm.earlyLeaveDays.length > 0) {
      const timeStr = addForm.earlyLeaveTime.trim();
      const formatted = timeStr.includes('하교') ? timeStr : `${timeStr} 하교`;
      earlyLeaveMap = {};
      addForm.earlyLeaveDays.forEach(d => {
        earlyLeaveMap![d] = formatted;
      });
    }

    const newStudent: Student = {
      id: `student_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      studentId: trimmedId,
      name: trimmedName,
      classroom: isWeekday ? addForm.classroom : (addForm.saturdayClassroom || '3-3'),
      attendance: defaultAttendance,
      fixedSettings: fixedAttendance,
      notes: addForm.notes.trim() || '',
      isWarning: false,
      warningReason: '',
      attendanceHistory: [],
    };

    if (isSaturday) {
      newStudent.saturdayClassroom = addForm.saturdayClassroom;
    }
    if (earlyLeaveMap) {
      newStudent.earlyLeave = earlyLeaveMap;
    }

    try {
      setStudents(prev => [...prev, newStudent]);
      await addStudentToFirebase(newStudent);
      setIsAddModalOpen(false);
      setAddForm({
        studentId: '',
        name: '',
        participationType: 'both',
        classroom: '3-2',
        saturdayClassroom: '3-3',
        enableEarlyLeave: false,
        earlyLeaveTime: '21:20',
        earlyLeaveDays: ['월', '화', '수', '목', '금'],
        notes: '',
      });
      showToast(`${newStudent.name} 학생이 성공적으로 등록되었습니다.`, 'success');
    } catch (e) {
      console.error('Student add error:', e);
      showToast('학생 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    }
  };

  // 엑셀/CSV 내보내기 (출석부 다운로드)
  const exportToCSV = () => {
    const headers = [
      '학번',
      '이름',
      '평일자습실',
      '토요자습실',
      '경고여부',
      '월_방과후',
      '월_1교시',
      '월_2교시',
      '화_방과후',
      '화_1교시',
      '화_2교시',
      '수_방과후',
      '수_1교시',
      '수_2교시',
      '목_방과후',
      '목_1교시',
      '목_2교시',
      '금_방과후',
      '금_1교시',
      '금_2교시',
      '토_1교시(오전)',
      '토_2교시(오전)',
      '토_3교시(오후)',
      '토_4교시(오후)',
    ];

    const rows = students.filter(s => !s.isDeleted).map(s => [
      s.studentId,
      s.name,
      s.classroom,
      s.saturdayClassroom || s.classroom,
      s.isWarning ? '경고' : '정상',
      s.attendance['월']?.p1 || '미확인',
      s.attendance['월']?.p2 || '미확인',
      s.attendance['월']?.p3 || '미확인',
      s.attendance['화']?.p1 || '미확인',
      s.attendance['화']?.p2 || '미확인',
      s.attendance['화']?.p3 || '미확인',
      s.attendance['수']?.p1 || '미확인',
      s.attendance['수']?.p2 || '미확인',
      s.attendance['수']?.p3 || '미확인',
      s.attendance['목']?.p1 || '미확인',
      s.attendance['목']?.p2 || '미확인',
      s.attendance['목']?.p3 || '미확인',
      s.attendance['금']?.p1 || '미확인',
      s.attendance['금']?.p2 || '미확인',
      s.attendance['금']?.p3 || '미확인',
      s.attendance['토']?.p1 || '미확인',
      s.attendance['토']?.p2 || '미확인',
      s.attendance['토']?.p3 || '미확인',
      s.attendance['토']?.p4 || '미확인',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `3학년_자율학습출석부_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('출석부 CSV 파일이 다운로드되었습니다.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col font-sans selection:bg-[var(--color-point-yellow)] selection:text-black">
      
      {/* 토스트 알림창 */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md bg-zinc-900/95 text-white border-zinc-700 animate-in fade-in slide-in-from-top-2">
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-[var(--color-point-yellow)] shrink-0" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 상단 글로벌 내비게이션 바 */}
      <header className="sticky top-0 z-40 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[rgba(255,215,0,0.15)] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* 앱 타이틀 */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-point-yellow)] flex items-center justify-center text-black font-black text-lg shadow-[0_0_15px_rgba(255,215,0,0.3)]">
              3
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center space-x-2">
                <span>3학년 자율학습 출석부</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-bold">
                  토요자습 지원
                </span>
              </h1>
              <p className="text-[10px] text-zinc-400">
                총 {activeStudentsCount}명 편성 • 실시간 동기화
              </p>
            </div>
          </div>

          {/* 메인 메뉴 전환 탭 */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setCurrentMenu('attendance')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentMenu === 'attendance'
                  ? 'bg-[var(--color-point-yellow)] text-black shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>출석부</span>
            </button>

            <button
              onClick={() => setCurrentMenu('stats')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentMenu === 'stats'
                  ? 'bg-[var(--color-point-yellow)] text-black shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>출석 통계</span>
            </button>

            <button
              onClick={() => setCurrentMenu('admin_settings')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentMenu === 'admin_settings'
                  ? 'bg-[var(--color-point-yellow)] text-black shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>관리자 설정</span>
            </button>
          </nav>

          {/* 엑셀 다운로드 */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-bold transition cursor-pointer"
              title="CSV 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span>출석부 내보내기</span>
            </button>
          </div>

        </div>
      </header>

      {/* 메인 작업 영역 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* 1. 자율학습 출석부 뷰 */}
        {currentMenu === 'attendance' && (
          <AttendanceTableView
            students={students}
            filteredStudents={filteredStudents}
            activeTabDay={activeTabDay}
            setActiveTabDay={handleTabDayChange}
            selectedClassroom={selectedClassroom}
            setSelectedClassroom={setSelectedClassroom}
            warningOnlyFilter={warningOnlyFilter}
            setWarningOnlyFilter={setWarningOnlyFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateMap={dateMap}
            activeStudentsCount={activeStudentsCount}
            handlePeriodClick={handlePeriodClick}
            openStudentDetail={openStudentDetail}
            handleDeleteStudent={handleDeleteStudent}
            setIsAddModalOpen={setIsAddModalOpen}
            batchMarkAttendance={batchMarkAttendance}
          />
        )}

        {/* 2. 개별 출석 통계 뷰 */}
        {currentMenu === 'stats' && (
          <AttendanceStatsView
            students={students.filter(s => !s.isDeleted)}
            selectedClassroom={selectedClassroom}
            setSelectedClassroom={setSelectedClassroom}
            dateMap={dateMap}
            openStudentDetail={openStudentDetail}
          />
        )}

        {/* 3. 관리자 설정 뷰 */}
        {currentMenu === 'admin_settings' && (
          <AdminSettingsView
            students={students}
            selectedClassroom={selectedClassroom}
            setSelectedClassroom={setSelectedClassroom}
            filteredStudents={adminFilteredStudents}
            handleFixedSettingChange={handleFixedSettingChange}
            handleSaturdayClassroomChange={handleSaturdayClassroomChange}
            handleWeekdayClassroomChange={handleWeekdayClassroomChange}
            forceResetAllToFixed={forceResetAllToFixed}
            resetAllFixedSettings={resetAllFixedSettings}
            restoreFromInitialRoster={restoreFromInitialRoster}
            handleManualWeekRollover={handleManualWeekRollover}
            currentWeekMonday={currentMondayStr}
            lastArchivedWeekMonday={metadata?.lastArchivedWeekMonday}
            showToast={showToast}
            setIsAddModalOpen={setIsAddModalOpen}
            handleRemoveFromSaturday={handleRemoveFromSaturday}
            handleRemoveFromWeekday={handleRemoveFromWeekday}
            handleAddToSaturday={handleAddToSaturday}
            handleAddToWeekday={handleAddToWeekday}
            handleRemoveFromSpecificDay={handleRemoveFromSpecificDay}
            handleAddToSpecificDay={handleAddToSpecificDay}
            handleUpdateEarlyLeave={handleUpdateEarlyLeave}
            handleClearEarlyLeave={handleClearEarlyLeave}
            onOpenDeleteModal={handleDeleteStudent}
            handleRestoreCumulativeHistory={handleRestoreCumulativeHistory}
          />
        )}

      </main>

      {/* 하단 푸터 */}
      <footer className="mt-auto border-t border-[rgba(255,215,0,0.12)] bg-[#1A1A1A] px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-xs">
        <div>
          <span>© 2026 3학년 집단 자율학습 출석부 시스템</span>
          <span className="mx-2">|</span>
          <span className="text-[var(--color-point-yellow)] font-semibold">Prestige Dark Slate</span>
        </div>
        <div className="mt-2 sm:mt-0 text-zinc-400">
          토요 자습 4개 교시 및 조기 하교(21:20) 연계 반영됨
        </div>
      </footer>

      {/* 모달 1: 학생 세부 정보 모달 */}
      <StudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedStudent={selectedStudent}
        detailWarningReason={detailWarningReason}
        setDetailWarningReason={setDetailWarningReason}
        detailIsWarning={detailIsWarning}
        setDetailIsWarning={setDetailIsWarning}
        onSave={saveStudentDetailChanges}
        dateMap={dateMap}
      />

      {/* 모달 2: 학생 수동 추가 모달 */}
      <StudentAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        addForm={addForm}
        setAddForm={setAddForm}
        onSubmit={handleAddStudent}
      />

      {/* 모달 3: 자습 명단 분리 삭제/제외 확인 모달 */}
      <StudentDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        student={deleteTargetStudent}
        currentDay={deleteModalDay}
        onRemoveFromSaturdayOnly={handleRemoveFromSaturday}
        onRemoveFromWeekdayOnly={handleRemoveFromWeekday}
        onRemoveFromSpecificDay={handleRemoveFromSpecificDay}
        onPermanentDelete={handlePermanentDelete}
      />

    </div>
  );
}
