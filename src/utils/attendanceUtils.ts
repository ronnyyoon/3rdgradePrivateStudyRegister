import { DayOfWeek, AttendanceStatus, Student, PeriodAttendance } from '../types';

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

  // 1. Record 형태 검사
  if (student.earlyLeave && typeof student.earlyLeave === 'object' && !Array.isArray(student.earlyLeave)) {
    const val = (student.earlyLeave as Record<string, string>)[day];
    if (val) return val;
  }

  // 2. Array 형태 검사
  if (Array.isArray(student.earlyLeave)) {
    if (student.earlyLeave.includes(day)) return '21:20 하교';
  }

  // 3. Notes 검사
  if (student.notes && (student.notes.includes('21:30') || student.notes.includes('9:30'))) {
    if (day !== '토') return '21:30 하교';
  }
  if (student.notes && (student.notes.includes('21:20') || student.notes.includes('9:20') || student.notes.includes('조기'))) {
    if (day !== '토') return '21:20 하교';
  }

  // 4. 조기 하교 확정 학생 (3512: 21:30 하교, 3503, 3515, 3520: 21:20 하교)
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
