import { DayOfWeek, AttendanceStatus, Student, PeriodAttendance, AttendanceHistoryItem, Classroom } from '../types';

export const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토'];

export const STATUS_CYCLE: AttendanceStatus[] = [
  '미확인',
  '출석',
  '수업',
  '병결',
  '개인사',
  '미참여일',
  '미인정결'
];

/**
 * 주어진 날짜(또는 현재)가 속한 주의 월요일 Date 객체를 반환합니다.
 * (일요일은 해당 주 일요일이므로 이전 월요일 기준으로 산정)
 */
export const getMondayOfDate = (d: Date = new Date()): Date => {
  const date = new Date(d);
  const day = date.getDay(); // 0(일) ~ 6(토)
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Date 객체를 YY.MM.DD 포맷 문자열로 변환 (예: 26.08.24)
 */
export const formatDateYYMMDD = (date: Date): string => {
  const y = String(date.getFullYear()).slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
};

/**
 * YY.MM.DD 문자열을 Date 객체로 파싱
 */
export const parseDateFromYYMMDD = (dStr: string): Date | null => {
  if (!dStr) return null;
  const parts = dStr.split('.');
  if (parts.length === 3) {
    let year = parseInt(parts[0], 10);
    if (year < 100) year += 2000;
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return null;
};

/**
 * 특정 월요일 기준 월~토 날짜 매핑 획득
 */
export const getWeekDatesForMonday = (monday: Date): Record<DayOfWeek, string> => {
  const dates: Record<DayOfWeek, string> = {
    '월': '',
    '화': '',
    '수': '',
    '목': '',
    '금': '',
    '토': '',
  };

  DAYS.forEach((day, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    dates[day] = formatDateYYMMDD(d);
  });

  return dates;
};

/**
 * 이번 주 월~토 날짜 계산기
 */
export const getThisWeekDates = (): Record<DayOfWeek, string> => {
  const monday = getMondayOfDate(new Date());
  return getWeekDatesForMonday(monday);
};

/**
 * 학생의 특정 요일, 특정 교시 출석 상태를 반환하며, 공란/미설정 시 기본값 '미참여일'을 보장합니다.
 */
export const getPeriodStatus = (
  student: Student,
  day: DayOfWeek,
  period: 'p1' | 'p2' | 'p3' | 'p4'
): AttendanceStatus => {
  const status = student.attendance?.[day]?.[period];
  if (!status || status === '' as any) {
    return '미참여일';
  }
  return status;
};

/**
 * 요일별 교시 키 목록 반환
 * 평일: p1 (방과후), p2 (1교시), p3 (2교시)
 * 토요일: p1 (1교시(오전)), p2 (2교시(오전)), p3 (3교시(오후)), p4 (4교시(오후))
 */
export const getPeriodsForDay = (day: DayOfWeek): ('p1' | 'p2' | 'p3' | 'p4')[] => {
  if (day === '토') {
    return ['p1', 'p2', 'p3', 'p4'];
  }
  return ['p1', 'p2', 'p3'];
};

/**
 * 요일 및 교시 키에 따른 사용자 친화적 교시명 반환
 */
export const getPeriodLabel = (day: DayOfWeek, p: 'p1' | 'p2' | 'p3' | 'p4'): string => {
  if (day === '토') {
    switch (p) {
      case 'p1': return '1교시(오전)';
      case 'p2': return '2교시(오전)';
      case 'p3': return '3교시(오후)';
      case 'p4': return '4교시(오후)';
    }
  }
  switch (p) {
    case 'p1': return '방과후';
    case 'p2': return '1교시';
    case 'p3': return '2교시';
    default: return p;
  }
};

/**
 * 평일(월~금) 전체 기간 동안 참여가 전혀 없는(모두 '미참여일'인) 토요 전용 학생 여부 검사
 */
export const isWeekdayNonParticipant = (student: Student): boolean => {
  const weekdays: DayOfWeek[] = ['월', '화', '수', '목', '금'];
  
  for (const day of weekdays) {
    const pData = student.attendance[day];
    if (!pData) continue;
    // 하나라도 '출석', '수업', '병결', '개인사', '미인정결', '미확인'이 있으면 참여 학생임
    if (pData.p1 && pData.p1 !== '미참여일') return false;
    if (pData.p2 && pData.p2 !== '미참여일') return false;
    if (pData.p3 && pData.p3 !== '미참여일') return false;
  }
  
  return true;
};

/**
 * 토요일 1교시~4교시가 모두 '미참여일'인지 검사
 */
export const isSaturdayNonParticipant = (student: Student): boolean => {
  const sat = student.attendance['토'];
  if (!sat) return true;
  return (
    (sat.p1 === '미참여일' || !sat.p1) &&
    (sat.p2 === '미참여일' || !sat.p2) &&
    (sat.p3 === '미참여일' || !sat.p3) &&
    (sat.p4 === '미참여일' || !sat.p4)
  );
};

/**
 * 특정 요일 대상 조기 하교 안내 문구 획득 헬퍼 (예: "21:20 하교")
 */
export const getStudentEarlyLeaveText = (student: Student, day: DayOfWeek): string | null => {
  if (!student) return null;

  // 1. Record 형태 검사 (명시적으로 설정된 경우 최우선)
  if (student.earlyLeave && typeof student.earlyLeave === 'object' && !Array.isArray(student.earlyLeave)) {
    const val = (student.earlyLeave as Record<string, string>)[day];
    if (val) {
      return val.includes('하교') ? val : `${val} 하교`;
    }
    // Record가 정의되어 있으나 해당 요일에 없으면 해당 요일은 조기 하교 없음
    if (Object.keys(student.earlyLeave).length > 0) {
      return null;
    }
  }

  // 2. Array 형태 검사
  if (Array.isArray(student.earlyLeave)) {
    if (student.earlyLeave.includes(day)) return '21:20 하교';
    if (student.earlyLeave.length > 0) return null;
  }

  // 3. Notes 검사 (earlyLeave가 명시되지 않은 기존 데이터 호환용)
  if (student.notes && (student.notes.includes('21:30') || student.notes.includes('9:30'))) {
    if (day !== '토') return '21:30 하교';
  }
  if (student.notes && (student.notes.includes('21:20') || student.notes.includes('9:20') || student.notes.includes('조기'))) {
    if (day !== '토') return '21:20 하교';
  }

  // 4. 조기 하교 확정 학생 (3512: 21:30 하교, 3503, 3515, 3520: 21:20 하교) - 초기 기본값
  if (student.studentId === '3512' && day !== '토') {
    return '21:30 하교';
  }
  const knownEarlyLeaveIds = ['3503', '3515', '3520'];
  if (knownEarlyLeaveIds.includes(student.studentId) && day !== '토') {
    return '21:20 하교';
  }

  return null;
};

/**
 * 학생의 전체 조기 하교 요일 및 시간대 요약 정보 반환
 */
export const getStudentEarlyLeaveSummary = (student: Student): { days: DayOfWeek[]; time: string } | null => {
  if (!student) return null;

  // Record 형태
  if (student.earlyLeave && typeof student.earlyLeave === 'object' && !Array.isArray(student.earlyLeave)) {
    const entries = Object.entries(student.earlyLeave as Record<string, string>);
    if (entries.length > 0) {
      const days = entries.map(([d]) => d as DayOfWeek);
      const timeVal = entries[0][1];
      const time = timeVal.includes('하교') ? timeVal : `${timeVal} 하교`;
      return { days, time };
    }
  }

  // Array 형태
  if (Array.isArray(student.earlyLeave) && student.earlyLeave.length > 0) {
    return { days: student.earlyLeave as DayOfWeek[], time: '21:20 하교' };
  }

  // Notes or default legacy
  const weekdays: DayOfWeek[] = ['월', '화', '수', '목', '금'];
  if (student.studentId === '3512') {
    return { days: weekdays, time: '21:30 하교' };
  }
  if (['3503', '3515', '3520'].includes(student.studentId)) {
    return { days: weekdays, time: '21:20 하교' };
  }
  if (student.notes && student.notes.includes('21:30')) {
    return { days: weekdays, time: '21:30 하교' };
  }
  if (student.notes && student.notes.includes('21:20')) {
    return { days: weekdays, time: '21:20 하교' };
  }

  return null;
};

/**
 * 토요일 출석부에서만 학생 제외 (월~금 평일 자습은 100% 안전하게 유지)
 */
export const removeStudentFromSaturday = (student: Student): Student => {
  const allAbsentSaturday: PeriodAttendance = {
    p1: '미참여일',
    p2: '미참여일',
    p3: '미참여일',
    p4: '미참여일',
  };

  const newAttendance = {
    ...student.attendance,
    '토': { ...allAbsentSaturday },
  };

  const newFixed = student.fixedSettings ? {
    ...student.fixedSettings,
    '토': { ...allAbsentSaturday },
  } : undefined;

  const updated: Student = {
    ...student,
    attendance: newAttendance,
  };

  if (newFixed) {
    updated.fixedSettings = newFixed;
  }
  // saturdayClassroom 속성 제거 (undefined 저장 방지)
  delete updated.saturdayClassroom;

  return updated;
};

/**
 * 평일 출석부에서만 학생 제외 (토요일 자습은 100% 안전하게 유지)
 */
export const removeStudentFromWeekday = (student: Student): Student => {
  const allAbsentWeekday: PeriodAttendance = {
    p1: '미참여일',
    p2: '미참여일',
    p3: '미참여일',
  };

  const weekdays: DayOfWeek[] = ['월', '화', '수', '목', '금'];
  const newAttendance = { ...student.attendance };
  weekdays.forEach(d => {
    newAttendance[d] = { ...allAbsentWeekday };
  });

  const newFixed = student.fixedSettings ? { ...student.fixedSettings } : undefined;
  if (newFixed) {
    weekdays.forEach(d => {
      newFixed[d] = { ...allAbsentWeekday };
    });
  }

  const updated: Student = {
    ...student,
    attendance: newAttendance,
  };
  if (newFixed) {
    updated.fixedSettings = newFixed;
  }

  return updated;
};

/**
 * 토요일 자습 명단에 학생 추가 또는 복귀
 */
export const addStudentToSaturday = (student: Student, room: Classroom): Student => {
  const allActiveSaturday: PeriodAttendance = {
    p1: '미확인',
    p2: '미확인',
    p3: '미확인',
    p4: '미확인',
  };

  const newAttendance = {
    ...student.attendance,
    '토': { ...allActiveSaturday },
  };

  const newFixed = {
    ...(student.fixedSettings || student.attendance),
    '토': { ...allActiveSaturday },
  };

  return {
    ...student,
    saturdayClassroom: room,
    attendance: newAttendance,
    fixedSettings: newFixed,
  };
};

/**
 * 평일 자습 명단에 학생 추가 또는 복귀
 */
export const addStudentToWeekday = (student: Student, room: Classroom): Student => {
  const allActiveWeekday: PeriodAttendance = {
    p1: '미확인',
    p2: '미확인',
    p3: '미확인',
  };

  const weekdays: DayOfWeek[] = ['월', '화', '수', '목', '금'];
  const newAttendance = { ...student.attendance };
  weekdays.forEach(d => {
    newAttendance[d] = { ...allActiveWeekday };
  });

  const newFixed = {
    ...(student.fixedSettings || student.attendance),
  };
  weekdays.forEach(d => {
    newFixed[d] = { ...allActiveWeekday };
  });

  return {
    ...student,
    classroom: room,
    attendance: newAttendance,
    fixedSettings: newFixed,
  };
};

/**
 * 특정 요일에 학생이 미참여 상태인지 검사
 */
export const isDayNonParticipant = (student: Student, day: DayOfWeek): boolean => {
  if (day === '토') {
    return isSaturdayNonParticipant(student) && !student.saturdayClassroom;
  }
  const dayData = student.attendance[day];
  if (!dayData) return true;
  const periods = getPeriodsForDay(day);
  return periods.every(p => !dayData[p] || dayData[p] === '미참여일');
};

/**
 * 특정 요일 자습 명단에서만 학생 제외 (다른 요일은 안전하게 보존)
 */
export const removeStudentFromSpecificDay = (student: Student, day: DayOfWeek): Student => {
  if (day === '토') {
    return removeStudentFromSaturday(student);
  }
  const periods = getPeriodsForDay(day);
  const absentPeriods: any = {};
  periods.forEach(p => {
    absentPeriods[p] = '미참여일';
  });

  const newAttendance = {
    ...student.attendance,
    [day]: { ...absentPeriods },
  };

  const newFixed = student.fixedSettings ? {
    ...student.fixedSettings,
    [day]: { ...absentPeriods },
  } : undefined;

  const updated: Student = {
    ...student,
    attendance: newAttendance,
  };
  if (newFixed) {
    updated.fixedSettings = newFixed;
  }
  return updated;
};

/**
 * 특정 요일 자습 명단에 학생 추가 또는 복귀
 */
export const addStudentToSpecificDay = (student: Student, day: DayOfWeek, room?: Classroom): Student => {
  if (day === '토') {
    return addStudentToSaturday(student, room || student.saturdayClassroom || '3-3');
  }
  const periods = getPeriodsForDay(day);
  const activePeriods: any = {};
  periods.forEach(p => {
    activePeriods[p] = '미확인';
  });

  const newAttendance = {
    ...student.attendance,
    [day]: { ...activePeriods },
  };

  const newFixed = {
    ...(student.fixedSettings || student.attendance),
    [day]: { ...activePeriods },
  };

  const updated: Student = {
    ...student,
    attendance: newAttendance,
    fixedSettings: newFixed,
  };
  if (room) {
    updated.classroom = room;
  }
  return updated;
};

/**
 * 학생의 조기 하교 시간대 업데이트
 */
export const updateStudentEarlyLeave = (
  student: Student,
  days: DayOfWeek[],
  timeText: string
): Student => {
  const formattedTime = timeText.includes('하교') ? timeText.trim() : `${timeText.trim()} 하교`;
  const earlyLeaveMap: Partial<Record<DayOfWeek, string>> = {};
  days.forEach(d => {
    earlyLeaveMap[d] = formattedTime;
  });

  return {
    ...student,
    earlyLeave: earlyLeaveMap,
  };
};

/**
 * 학생의 조기 하교 설정 해제
 */
export const clearStudentEarlyLeave = (student: Student): Student => {
  const updated = { ...student };
  updated.earlyLeave = {};
  if (updated.notes && (updated.notes.includes('하교') || updated.notes.includes('21:20') || updated.notes.includes('21:30'))) {
    updated.notes = updated.notes
      .replace(/21:\d\d\s*하교/g, '')
      .replace(/조기\s*하교/g, '')
      .trim();
  }
  return updated;
};

/**
 * 학생의 해당 요일 자습실 반환 (토요일 자습교실이 다를 경우 반영)
 */
export const getStudentRoomForDay = (student: Student, day: DayOfWeek): string => {
  if (day === '토' && student.saturdayClassroom) {
    return student.saturdayClassroom;
  }
  return student.classroom;
};

/**
 * 날짜 문자열 정규화 (YY.MM.DD)
 */
export const normalizeDateStr = (dStr: string): string => {
  if (!dStr) return '';
  const parts = dStr.split('.');
  if (parts.length === 3) {
    let year = parts[0];
    if (year.length === 4) {
      year = year.slice(-2);
    }
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${year}.${month}.${day}`;
  }
  return dStr;
};

/**
 * 총 누적 출석률 계산엔진 (출석 / (출석 + 병결 + 개인사 + 미인정결) * 100)
 * 수업, 미참여일, 미확인(체크 전 대기)은 분모/분자 제외
 */
export const calculateStudentAttendanceRate = (
  student: Student,
  dateMap: Record<DayOfWeek, string>
): number | null => {
  let checkedPeriods = 0;
  let presentPeriods = 0;

  // 이번 주의 모든 요일 검사 (월~토)
  DAYS.forEach(day => {
    const pData = student.attendance[day];
    if (!pData) return;
    const periods = getPeriodsForDay(day);

    periods.forEach(p => {
      const val = pData[p];
      if (val === '출석') {
        checkedPeriods++;
        presentPeriods++;
      } else if (val === '병결' || val === '개인사' || val === '미인정결') {
        checkedPeriods++;
      }
      // '수업', '미참여일', '미확인(대기)'은 출석률 산정 대상에서 제외
    });
  });

  // 과거 이력 누적 가산 (이번 주 중복 제외)
  if (student.attendanceHistory && student.attendanceHistory.length > 0) {
    const currentWeekDates = Object.values(dateMap).map(normalizeDateStr);

    student.attendanceHistory.forEach(h => {
      const normDate = normalizeDateStr(h.date);
      if (currentWeekDates.includes(normDate)) {
        return;
      }

      const val = h.status;
      if (val === '출석') {
        checkedPeriods++;
        presentPeriods++;
      } else if (val === '병결' || val === '개인사' || val === '미인정결') {
        checkedPeriods++;
      }
    });
  }

  if (checkedPeriods === 0) return null;
  return Math.round((presentPeriods / checkedPeriods) * 100);
};

/**
 * 특정 요일 교시의 개별 출석률(%) 단일 계산기
 */
export const getIndividualPeriodRate = (
  student: Student,
  day: DayOfWeek,
  period: 'p1' | 'p2' | 'p3' | 'p4',
  dateMap: Record<DayOfWeek, string>
): string => {
  const periodKorean = getPeriodLabel(day, period);
  let checkedPeriodsCount = 0;
  let presentPeriodsCount = 0;
  let hasExclusionCurrentWeek = false;

  const currentWeekDateStr = normalizeDateStr(dateMap[day]);

  // 1. 과거 이력 반영
  if (student.attendanceHistory && student.attendanceHistory.length > 0) {
    student.attendanceHistory.forEach(h => {
      if (h.day === day && h.period === periodKorean) {
        if (normalizeDateStr(h.date) === currentWeekDateStr) {
          return;
        }

        const val = h.status;
        if (val === '출석') {
          checkedPeriodsCount++;
          presentPeriodsCount++;
        } else if (val === '병결' || val === '개인사' || val === '미인정결') {
          checkedPeriodsCount++;
        }
      }
    });
  }

  // 2. 이번 주 최신 상태 반영
  const status = student.attendance[day]?.[period];
  if (status) {
    if (status === '출석') {
      checkedPeriodsCount++;
      presentPeriodsCount++;
    } else if (status === '병결' || status === '개인사' || status === '미인정결') {
      checkedPeriodsCount++;
    } else if (status === '수업' || status === '미참여일') {
      hasExclusionCurrentWeek = true;
    }
  }

  if (checkedPeriodsCount > 0) {
    return `${Math.round((presentPeriodsCount / checkedPeriodsCount) * 100)}%`;
  }

  if (hasExclusionCurrentWeek) {
    return '제외';
  }

  return '-';
};

/**
 * 출석 상태 버튼 배지 스타일
 */
export const getStatusBadgeStyle = (status: AttendanceStatus): string => {
  switch (status) {
    case '미확인':
      return 'bg-zinc-900 text-zinc-500 border border-dashed border-zinc-700 hover:text-zinc-400 hover:bg-zinc-850';
    case '출석':
      return 'bg-[rgba(255,215,0,0.12)] text-[var(--color-point-yellow)] border border-[rgba(255,215,0,0.3)] hover:brightness-110';
    case '수업':
      return 'bg-blue-500/12 text-blue-400 border border-blue-500/25 hover:brightness-110';
    case '병결':
      return 'bg-orange-500/12 text-orange-400 border border-orange-500/25 hover:brightness-110';
    case '개인사':
      return 'bg-purple-500/12 text-purple-400 border border-purple-500/25 hover:brightness-110';
    case '미참여일':
      return 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 hover:brightness-110';
    case '미인정결':
      return 'bg-rose-500/12 text-rose-500 border border-rose-500/30 hover:brightness-110';
    default:
      return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
  }
};

/**
 * 관리자 설정 드롭다운 스타일
 */
export const getSelectStyle = (status: AttendanceStatus): string => {
  switch (status) {
    case '출석':
      return 'bg-[rgba(255,215,0,0.12)] text-[var(--color-point-yellow)] border-[rgba(255,215,0,0.35)] font-bold';
    case '수업':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30 font-bold';
    case '병결':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30 font-bold';
    case '개인사':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30 font-bold';
    case '미참여일':
      return 'bg-zinc-800/70 text-zinc-400 border-zinc-700/60 font-medium';
    case '미인정결':
      return 'bg-rose-500/12 text-rose-400 border-rose-500/35 font-bold';
    case '미확인':
    default:
      return 'bg-zinc-900 text-zinc-500 border-zinc-800/80 font-normal';
  }
};

/**
 * 주간 마감 및 출석 데이터 누적 아카이빙 & 새 주차 출석부 초기화
 * - 지난 주에 체크된 실제 출석 상태(출석, 수업, 병결, 개인사, 미인정결)를 attendanceHistory에 날짜/교시별로 누적 저장
 * - 새 주차 출석부(attendance)는 기본 세팅(참여 교시는 '미확인', 비참여는 '미참여일')으로 초기화
 */
export const archiveAndResetWeek = (
  students: Student[],
  prevWeekDates: Record<DayOfWeek, string>,
  initialStudentsMap?: Map<string, Student>
): Student[] => {
  return students.map(student => {
    // 1. 이전 주차에 체크된 유효 출석 데이터 수집
    const newHistoryItems: AttendanceHistoryItem[] = [];

    DAYS.forEach(day => {
      const dateStr = prevWeekDates[day];
      const pData = student.attendance[day];
      if (!pData || !dateStr) return;

      const periods = getPeriodsForDay(day);
      periods.forEach(p => {
        const status = pData[p];
        // '미확인', '미참여일'은 이력에 남기지 않고, 실제 체크된 '출석', '수업', '병결', '개인사', '미인정결'만 보존
        if (status && status !== '미확인' && status !== '미참여일') {
          newHistoryItems.push({
            date: dateStr,
            day,
            period: getPeriodLabel(day, p),
            status,
          });
        }
      });
    });

    // 2. 기존 이력과 병합 (중복 방지: 날짜 + 교시 기준)
    const existingHistory = student.attendanceHistory || [];
    const combinedHistory = [...existingHistory];

    newHistoryItems.forEach(item => {
      const normDate = normalizeDateStr(item.date);
      const isAlreadySaved = combinedHistory.some(
        h => normalizeDateStr(h.date) === normDate && h.period === item.period
      );
      if (!isAlreadySaved) {
        combinedHistory.push(item);
      }
    });

    // 3. 새 주차 출석부 초기화
    // 학생별 기본 편성(fixedSettings 또는 initialStudents)을 기반으로 리셋
    const freshAttendance: Student['attendance'] = {
      '월': { p1: '미참여일', p2: '미참여일', p3: '미참여일' },
      '화': { p1: '미참여일', p2: '미참여일', p3: '미참여일' },
      '수': { p1: '미참여일', p2: '미참여일', p3: '미참여일' },
      '목': { p1: '미참여일', p2: '미참여일', p3: '미참여일' },
      '금': { p1: '미참여일', p2: '미참여일', p3: '미참여일' },
      '토': { p1: '미참여일', p2: '미참여일', p3: '미참여일', p4: '미참여일' },
    };

    const initialStudent = initialStudentsMap?.get(student.id);

    if (student.fixedSettings) {
      // fixedSettings가 있는 경우: '출석' 또는 '미확인'으로 지정된 것은 새 주차 '미확인'으로, '수업'/'미참여일' 등은 유지
      DAYS.forEach(d => {
        const periods = getPeriodsForDay(d);
        const fixedDay = student.fixedSettings![d] || {};
        periods.forEach(p => {
          const val = fixedDay[p];
          if (val === '출석' || val === '미확인') {
            freshAttendance[d][p] = '미확인';
          } else if (val) {
            freshAttendance[d][p] = val;
          } else {
            freshAttendance[d][p] = '미참여일';
          }
        });
      });
    } else if (initialStudent) {
      // 초기 47명 원본 명단 기준 복원
      DAYS.forEach(d => {
        const periods = getPeriodsForDay(d);
        const initDay = initialStudent.attendance[d] || {};
        periods.forEach(p => {
          freshAttendance[d][p] = initDay[p] || '미참여일';
        });
      });
    } else {
      // 신규 등록 학생 등의 기본값 (평일 p1~p3 '미확인', 토요일 '미참여일')
      DAYS.forEach(d => {
        const periods = getPeriodsForDay(d);
        periods.forEach(p => {
          freshAttendance[d][p] = d === '토' ? '미참여일' : '미확인';
        });
      });
    }

    return {
      ...student,
      attendance: freshAttendance,
      attendanceHistory: combinedHistory,
    };
  });
};

