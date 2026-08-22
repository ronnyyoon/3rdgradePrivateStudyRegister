import { Student, DayOfWeek, PeriodAttendance, AttendanceStatus } from './types';

// Helper: 정밀한 요일별 출석 상태 구조 생성 함수 (공란 및 미참여 기본값은 '미참여일')
export function createDefaultAttendance(
  status: AttendanceStatus = '미참여일', 
  custom?: Partial<Record<DayOfWeek, PeriodAttendance>>
): Student['attendance'] {
  const base: Student['attendance'] = {
    '월': { p1: status, p2: status, p3: status },
    '화': { p1: status, p2: status, p3: status },
    '수': { p1: status, p2: status, p3: status },
    '목': { p1: status, p2: status, p3: status },
    '금': { p1: status, p2: status, p3: status },
    '토': { p1: status, p2: status, p3: status, p4: status },
  };
  
  if (custom) {
    return { ...base, ...custom };
  }
  return base;
}

// 편의 헬퍼: 요일별 상태 프리셋 (참여 예정일 기본값 = '미확인', 미참여일 = '미참여일')
const ALL_ACTIVE_WEEKDAY: PeriodAttendance = { p1: '미확인', p2: '미확인', p3: '미확인' };
const ALL_ABSENT_WEEKDAY: PeriodAttendance = { p1: '미참여일', p2: '미참여일', p3: '미참여일' };
const ONLY_AFTERSCHOOL: PeriodAttendance = { p1: '미확인', p2: '미참여일', p3: '미참여일' };
const AFTERSCHOOL_AND_P1: PeriodAttendance = { p1: '미확인', p2: '미확인', p3: '미참여일' };

const ALL_ACTIVE_SATURDAY: PeriodAttendance = { p1: '미확인', p2: '미확인', p3: '미확인', p4: '미확인' };
const ALL_ABSENT_SATURDAY: PeriodAttendance = { p1: '미참여일', p2: '미참여일', p3: '미참여일', p4: '미참여일' };

/**
 * 2026학년도 자율학습 정밀 편성 명단 (총 47명)
 * - 참여 예정 교시의 기본값: '미확인' (출석체크 전 대기 상태)
 * - 미참여 교시의 기본값: '미참여일'
 * - 평일 41명 + 토요전용 6명 = 총 47명
 * - 토요일 편성(총 26명): 3-3(6명), 3-4(10명), 셀터디(10명) (3-1, 3-2 미운영)
 * - 조기하교(21:20 / 21:30) 명시
 */
export const INITIAL_STUDENTS: Student[] = [
  // 1. 3120 추범규 (평일 3-2 / 토요일 3-3)
  {
    id: 'st_3120',
    studentId: '3120',
    name: '추범규',
    classroom: '3-2',
    saturdayClassroom: '3-3',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 2. 3209 마승인 (평일 3-2 / 토요일 미참여)
  {
    id: 'st_3209',
    studentId: '3209',
    name: '마승인',
    classroom: '3-2',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 3. 3301 김성진 (평일 3-2 / 화, 목 미참여 / 토요일 미참여)
  {
    id: 'st_3301',
    studentId: '3301',
    name: '김성진',
    classroom: '3-2',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 4. 3302 김시우 (평일 3-2 / 토요일 3-3)
  {
    id: 'st_3302',
    studentId: '3302',
    name: '김시우',
    classroom: '3-2',
    saturdayClassroom: '3-3',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 5. 3306 김재환 (평일 3-2 / 토요일 미참여)
  {
    id: 'st_3306',
    studentId: '3306',
    name: '김재환',
    classroom: '3-2',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 6. 3316 정석영 (평일 3-2 / 금 1,2교시 미참여 / 토요일 미참여)
  {
    id: 'st_3316',
    studentId: '3316',
    name: '정석영',
    classroom: '3-2',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ONLY_AFTERSCHOOL },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 7. 3401 강경훈 (평일 3-4 / 화, 목 미참여 / 토요일 미참여)
  {
    id: 'st_3401',
    studentId: '3401',
    name: '강경훈',
    classroom: '3-4',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 8. 3403 김강준 (평일 3-4 / 토요일 3-4)
  {
    id: 'st_3403',
    studentId: '3403',
    name: '김강준',
    classroom: '3-4',
    saturdayClassroom: '3-4',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 9. 3405 김시우 (토요전용 셀터디 / 평일 미참여)
  {
    id: 'st_3405',
    studentId: '3405',
    name: '김시우',
    classroom: '셀터디',
    saturdayClassroom: '셀터디',
    attendance: {
      '월': { ...ALL_ABSENT_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ABSENT_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ABSENT_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '토요 자습 전용',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 10. 3409 김한결 (평일 3-4 / 토요일 3-4)
  {
    id: 'st_3409',
    studentId: '3409',
    name: '김한결',
    classroom: '3-4',
    saturdayClassroom: '3-4',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 11. 3411 문성원 (토요전용 3-4 / 평일 미참여)
  {
    id: 'st_3411',
    studentId: '3411',
    name: '문성원',
    classroom: '3-4',
    saturdayClassroom: '3-4',
    attendance: {
      '월': { ...ALL_ABSENT_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ABSENT_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ABSENT_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '토요 자습 전용',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 12. 3415 백경탁 (평일 셀터디 / 토요일 셀터디)
  {
    id: 'st_3415',
    studentId: '3415',
    name: '백경탁',
    classroom: '셀터디',
    saturdayClassroom: '셀터디',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 13. 3417 서태민 (평일 3-4 / 토요일 3-4)
  {
    id: 'st_3417',
    studentId: '3417',
    name: '서태민',
    classroom: '3-4',
    saturdayClassroom: '3-4',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 14. 3419 오수빈 (토요전용 3-4 / 평일 미참여)
  {
    id: 'st_3419',
    studentId: '3419',
    name: '오수빈',
    classroom: '3-4',
    saturdayClassroom: '3-4',
    attendance: {
      '월': { ...ALL_ABSENT_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ABSENT_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ABSENT_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '토요 자습 전용',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 15. 3420 원종운 (평일 3-4 / 화, 목 미참여 / 토요일 미참여)
  {
    id: 'st_3420',
    studentId: '3420',
    name: '원종운',
    classroom: '3-4',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 16. 3423 이민찬 (토요전용 3-4 / 평일 미참여)
  {
    id: 'st_3423',
    studentId: '3423',
    name: '이민찬',
    classroom: '3-4',
    saturdayClassroom: '3-4',
    attendance: {
      '월': { ...ALL_ABSENT_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ABSENT_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ABSENT_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '토요 자습 전용',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 17. 3424 이우준 (평일 셀터디 / 토요일 셀터디)
  {
    id: 'st_3424',
    studentId: '3424',
    name: '이우준',
    classroom: '셀터디',
    saturdayClassroom: '셀터디',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 18. 3426 장은찬 (평일 3-4 / 토요일 미참여)
  {
    id: 'st_3426',
    studentId: '3426',
    name: '장은찬',
    classroom: '3-4',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 19. 3428 정세웅 (평일 3-4 / 토요일 미참여)
  {
    id: 'st_3428',
    studentId: '3428',
    name: '정세웅',
    classroom: '3-4',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 20. 3429 조준호 (평일 셀터디 / 토요일 셀터디)
  {
    id: 'st_3429',
    studentId: '3429',
    name: '조준호',
    classroom: '셀터디',
    saturdayClassroom: '셀터디',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 21. 3430 조현재 (평일 셀터디 / 토요일 셀터디)
  {
    id: 'st_3430',
    studentId: '3430',
    name: '조현재',
    classroom: '셀터디',
    saturdayClassroom: '셀터디',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 22. 3431 한승우 (평일 3-4 / 토요일 3-4)
  {
    id: 'st_3431',
    studentId: '3431',
    name: '한승우',
    classroom: '3-4',
    saturdayClassroom: '3-4',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 23. 3501 김민준 (평일 셀터디 / 화,수,금 1,2교시 미참여 / 토요일 셀터디)
  {
    id: 'st_3501',
    studentId: '3501',
    name: '김민준',
    classroom: '셀터디',
    saturdayClassroom: '셀터디',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ONLY_AFTERSCHOOL },
      '수': { ...ONLY_AFTERSCHOOL },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ONLY_AFTERSCHOOL },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 24. 3503 김승규 (평일 3-3 / 월~금 21:20 조기하교 / 토요일 미참여)
  {
    id: 'st_3503',
    studentId: '3503',
    name: '김승규',
    classroom: '3-3',
    earlyLeave: ['월', '화', '수', '목', '금'],
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '21:20 조기 하교',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 25. 3505 김주영 (평일 셀터디 / 수, 목 미참여 / 토요일 셀터디)
  {
    id: 'st_3505',
    studentId: '3505',
    name: '김주영',
    classroom: '셀터디',
    saturdayClassroom: '셀터디',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ABSENT_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 26. 3509 김지훈 (평일 3-3 / 목 2교시 미참여, 금 전교시 미참여 / 토요일 미참여)
  {
    id: 'st_3509',
    studentId: '3509',
    name: '김지훈',
    classroom: '3-3',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...AFTERSCHOOL_AND_P1 },
      '금': { ...ALL_ABSENT_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 27. 3510 김태완 (토요전용 셀터디 / 평일 미참여)
  {
    id: 'st_3510',
    studentId: '3510',
    name: '김태완',
    classroom: '셀터디',
    saturdayClassroom: '셀터디',
    attendance: {
      '월': { ...ALL_ABSENT_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ABSENT_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ABSENT_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '토요 자습 전용',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 28. 3512 박준후 (평일 3-3 / 월~금 21:30 조기하교 / 토요일 미참여)
  {
    id: 'st_3512',
    studentId: '3512',
    name: '박준후',
    classroom: '3-3',
    earlyLeave: ['월', '화', '수', '목', '금'],
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '21:30 조기 하교',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 29. 3513 박진오 (평일 3-3 / 월~금 방과후만 참여 / 토요일 미참여)
  {
    id: 'st_3513',
    studentId: '3513',
    name: '박진오',
    classroom: '3-3',
    attendance: {
      '월': { ...ONLY_AFTERSCHOOL },
      '화': { ...ONLY_AFTERSCHOOL },
      '수': { ...ONLY_AFTERSCHOOL },
      '목': { ...ONLY_AFTERSCHOOL },
      '금': { ...ONLY_AFTERSCHOOL },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '방과후만 참여',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 30. 3514 박진혁 (평일 3-3 / 토요일 3-4)
  {
    id: 'st_3514',
    studentId: '3514',
    name: '박진혁',
    classroom: '3-3',
    saturdayClassroom: '3-4',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 31. 3515 서예준 (평일 3-3 / 월~금 21:20 조기하교 / 토요일 미참여)
  {
    id: 'st_3515',
    studentId: '3515',
    name: '서예준',
    classroom: '3-3',
    earlyLeave: ['월', '화', '수', '목', '금'],
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '21:20 조기 하교',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 32. 3517 양민후 (평일 3-3 / 금 전교시 미참여 / 토요일 미참여)
  {
    id: 'st_3517',
    studentId: '3517',
    name: '양민후',
    classroom: '3-3',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ABSENT_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 33. 3518 오시후 (평일 3-3 / 월~금 방과후만 참여 / 토요일 미참여)
  {
    id: 'st_3518',
    studentId: '3518',
    name: '오시후',
    classroom: '3-3',
    attendance: {
      '월': { ...ONLY_AFTERSCHOOL },
      '화': { ...ONLY_AFTERSCHOOL },
      '수': { ...ONLY_AFTERSCHOOL },
      '목': { ...ONLY_AFTERSCHOOL },
      '금': { ...ONLY_AFTERSCHOOL },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '방과후만 참여',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 34. 3520 왕여준 (평일 3-3 / 월~금 21:20 조기하교 / 토요일 미참여)
  {
    id: 'st_3520',
    studentId: '3520',
    name: '왕여준',
    classroom: '3-3',
    earlyLeave: ['월', '화', '수', '목', '금'],
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '21:20 조기 하교',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 35. 3524 장한결 (평일 셀터디 / 수, 목 미참여 / 토요일 셀터디)
  {
    id: 'st_3524',
    studentId: '3524',
    name: '장한결',
    classroom: '셀터디',
    saturdayClassroom: '셀터디',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ABSENT_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 36. 3525 정민교 (평일 3-3 / 월~목 미참여, 금 참여 / 토요일 3-4)
  {
    id: 'st_3525',
    studentId: '3525',
    name: '정민교',
    classroom: '3-3',
    saturdayClassroom: '3-4',
    attendance: {
      '월': { ...ALL_ABSENT_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ABSENT_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 37. 3530 황주원 (평일 3-3 / 월,수 2교시 미참여, 금 1,2교시 미참여 / 토요일 3-4)
  {
    id: 'st_3530',
    studentId: '3530',
    name: '황주원',
    classroom: '3-3',
    saturdayClassroom: '3-4',
    attendance: {
      '월': { ...AFTERSCHOOL_AND_P1 },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...AFTERSCHOOL_AND_P1 },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ONLY_AFTERSCHOOL },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 38. 3602 강승균 (평일 3-2 / 금 전교시 미참여 / 토요일 미참여)
  {
    id: 'st_3602',
    studentId: '3602',
    name: '강승균',
    classroom: '3-2',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ABSENT_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 39. 3615 장우현 (평일 3-2 / 월,화,목 1,2교시 미참여 / 토요일 미참여)
  {
    id: 'st_3615',
    studentId: '3615',
    name: '장우현',
    classroom: '3-2',
    attendance: {
      '월': { ...ONLY_AFTERSCHOOL },
      '화': { ...ONLY_AFTERSCHOOL },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ONLY_AFTERSCHOOL },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 40. 3616 장준희 (평일 3-2 / 월,화 2교시 미참여, 수~금 전교시 미참여 / 토요일 미참여)
  {
    id: 'st_3616',
    studentId: '3616',
    name: '장준희',
    classroom: '3-2',
    attendance: {
      '월': { ...AFTERSCHOOL_AND_P1 },
      '화': { ...AFTERSCHOOL_AND_P1 },
      '수': { ...ALL_ABSENT_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ABSENT_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 41. 3701 강민건 (평일 셀터디 / 목 전교시 미참여 / 토요일 셀터디)
  {
    id: 'st_3701',
    studentId: '3701',
    name: '강민건',
    classroom: '셀터디',
    saturdayClassroom: '셀터디',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 42. 3705 박재범 (평일 3-2 / 화, 목 미참여 / 토요일 미참여)
  {
    id: 'st_3705',
    studentId: '3705',
    name: '박재범',
    classroom: '3-2',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 43. 3717 최병언 (평일 3-2 / 토요일 미참여)
  {
    id: 'st_3717',
    studentId: '3717',
    name: '최병언',
    classroom: '3-2',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ABSENT_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 44. 3806 김은후 (평일 3-2 / 화 미참여 / 토요일 3-3)
  {
    id: 'st_3806',
    studentId: '3806',
    name: '김은후',
    classroom: '3-2',
    saturdayClassroom: '3-3',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 45. 3807 김준명 (평일 3-2 / 토요일 3-3)
  {
    id: 'st_3807',
    studentId: '3807',
    name: '김준명',
    classroom: '3-2',
    saturdayClassroom: '3-3',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 46. 3812 문준휘 (평일 3-2 / 토요일 3-3: 1,2교시 출석예정, 3,4교시 미참여일)
  {
    id: 'st_3812',
    studentId: '3812',
    name: '문준휘',
    classroom: '3-2',
    saturdayClassroom: '3-3',
    attendance: {
      '월': { ...ALL_ACTIVE_WEEKDAY },
      '화': { ...ALL_ACTIVE_WEEKDAY },
      '수': { ...ALL_ACTIVE_WEEKDAY },
      '목': { ...ALL_ACTIVE_WEEKDAY },
      '금': { ...ALL_ACTIVE_WEEKDAY },
      '토': { p1: '미확인', p2: '미확인', p3: '미참여일', p4: '미참여일' },
    },
    notes: '토요 1,2교시만 참여',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  // 47. 3815 신현우 (토요전용 3-3 / 평일 미참여)
  {
    id: 'st_3815',
    studentId: '3815',
    name: '신현우',
    classroom: '3-3',
    saturdayClassroom: '3-3',
    attendance: {
      '월': { ...ALL_ABSENT_WEEKDAY },
      '화': { ...ALL_ABSENT_WEEKDAY },
      '수': { ...ALL_ABSENT_WEEKDAY },
      '목': { ...ALL_ABSENT_WEEKDAY },
      '금': { ...ALL_ABSENT_WEEKDAY },
      '토': { ...ALL_ACTIVE_SATURDAY },
    },
    notes: '토요 자습 전용',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  }
];
