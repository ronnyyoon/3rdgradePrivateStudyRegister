import { Student } from './types';

// 2026학년도 3학년실 자율학습 출석부의 고정 원장 데이터셋 (73명)
// 요구사항 1에 따라 가상 데이터를 대신하여 제공된 명단으로 완벽 교체하였습니다.
export const INITIAL_STUDENTS: Student[] = [
  // --- 3-1반 학생 (13명) ---
  {
    id: 'st_3602',
    studentId: '3602',
    name: '강승균',
    classroom: '3-1',
    attendance: createDefaultAttendance(),
    notes: '월요일 야간 자습 2교시 대학 면접 대비 보충 수업 참가',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3615',
    studentId: '3615',
    name: '장우현',
    classroom: '3-1',
    attendance: createDefaultAttendance('미확인', {
      '월': { p1: '미확인', p2: '수업' }, // 월요일 2교시는 지정 수업
    }),
    notes: '월요일 수능 수학 특강 수강',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3616',
    studentId: '3616',
    name: '장준희',
    classroom: '3-1',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3706',
    studentId: '3706',
    name: '박종수',
    classroom: '3-1',
    attendance: createDefaultAttendance(),
    notes: '자습 리더 대표 학생',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3714',
    studentId: '3714',
    name: '조우성',
    classroom: '3-1',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3717',
    studentId: '3717',
    name: '최병언',
    classroom: '3-1',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3719',
    studentId: '3719',
    name: '최치원',
    classroom: '3-1',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3807',
    studentId: '3807',
    name: '김준명',
    classroom: '3-1',
    attendance: createDefaultAttendance('미확인', {
      '수': { p1: '미확인', p2: '미확인', p3: '병결' } // 수요일 3교시는 이과 논술로 부득이하게 병원
    }),
    notes: '감기 몸살로 인한 조퇴 병결 계출',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3812',
    studentId: '3812',
    name: '문준휘',
    classroom: '3-1',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3815',
    studentId: '3815',
    name: '신현우',
    classroom: '3-1',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3816',
    studentId: '3816',
    name: '오주호',
    classroom: '3-1',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3821',
    studentId: '3821',
    name: '이효일',
    classroom: '3-1',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3605',
    studentId: '3605',
    name: '김승호',
    classroom: '3-1',
    attendance: createDefaultAttendance(),
    notes: '학업 우수 장학생',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },

  // --- 3-2반 학생 (15명) ---
  {
    id: 'st_3105',
    studentId: '3105',
    name: '김민찬',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3106',
    studentId: '3106',
    name: '김성수',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3109',
    studentId: '3109',
    name: '김형준',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3115',
    studentId: '3115',
    name: '정승환',
    classroom: '3-2',
    attendance: createDefaultAttendance('미확인', {
      '화': { p1: '미참여일', p2: '미참여일' }
    }),
    notes: '화요일 고정 미참여일 (본교 특별 활동)',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3116',
    studentId: '3116',
    name: '정지용',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3120',
    studentId: '3120',
    name: '추범규',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3209',
    studentId: '3209',
    name: '마승인',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3210',
    studentId: '3210',
    name: '문민혁',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3215',
    studentId: '3215',
    name: '오현빈',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3216',
    studentId: '3216',
    name: '이선재',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3301',
    studentId: '3301',
    name: '김성진',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3302',
    studentId: '3302',
    name: '김시우',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '3-2반 김시우 학생',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3305',
    studentId: '3305',
    name: '김재환',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3306',
    studentId: '3306',
    name: '김하리',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3320',
    studentId: '3320',
    name: '최주원',
    classroom: '3-2',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },

  // --- 3-3반 학생 (17명) ---
  {
    id: 'st_3503',
    studentId: '3503',
    name: '김승규',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3504',
    studentId: '3504',
    name: '김인호',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3506',
    studentId: '3506',
    name: '김준성',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3508',
    studentId: '3508',
    name: '김지후',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3509',
    studentId: '3509',
    name: '김지훈',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3512',
    studentId: '3512',
    name: '박준후',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3513',
    studentId: '3513',
    name: '박진오',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3514',
    studentId: '3514',
    name: '박진혁',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3515',
    studentId: '3515',
    name: '서예준',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3517',
    studentId: '3517',
    name: '양민후',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3518',
    studentId: '3518',
    name: '오시후',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3520',
    studentId: '3520',
    name: '왕여준',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3521',
    studentId: '3521',
    name: '이기범',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3525',
    studentId: '3525',
    name: '정민교',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3526',
    studentId: '3526',
    name: '정우성',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3528',
    studentId: '3528',
    name: '정태진',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3530',
    studentId: '3530',
    name: '황주원',
    classroom: '3-3',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },

  // --- 3-4반 학생 (18명) ---
  {
    id: 'st_3401',
    studentId: '3401',
    name: '강경훈',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3403',
    studentId: '3403',
    name: '김강준',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3404',
    studentId: '3404',
    name: '김건우',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3406',
    studentId: '3406',
    name: '김요한',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3407',
    studentId: '3407',
    name: '김진우',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3408',
    studentId: '3408',
    name: '김태원',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3409',
    studentId: '3409',
    name: '김한결',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3410',
    studentId: '3410',
    name: '김현우',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3411',
    studentId: '3411',
    name: '문성원',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3413',
    studentId: '3413',
    name: '박세영',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3416',
    studentId: '3416',
    name: '서지한',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3417',
    studentId: '3417',
    name: '서태민',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3420',
    studentId: '3420',
    name: '원종운',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3421',
    studentId: '3421',
    name: '유시우',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3426',
    studentId: '3426',
    name: '장은찬',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3427',
    studentId: '3427',
    name: '장현수',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3428',
    studentId: '3428',
    name: '정세웅',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3431',
    studentId: '3431',
    name: '한승우',
    classroom: '3-4',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },

  // --- 셀터디 학생 (10명) ---
  {
    id: 'st_3405',
    studentId: '3405',
    name: '김시우',
    classroom: '셀터디',
    attendance: createDefaultAttendance(),
    notes: '셀터디 3405 김시우 학생',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3415',
    studentId: '3415',
    name: '백경탁',
    classroom: '셀터디',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3429',
    studentId: '3429',
    name: '조준호',
    classroom: '셀터디',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3430',
    studentId: '3430',
    name: '조현재',
    classroom: '셀터디',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3501',
    studentId: '3501',
    name: '김민준',
    classroom: '셀터디',
    attendance: createDefaultAttendance(),
    notes: '성실한 자율학습 태도 우수',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3505',
    studentId: '3505',
    name: '김주영',
    classroom: '셀터디',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3701',
    studentId: '3701',
    name: '강민건',
    classroom: '셀터디',
    attendance: createDefaultAttendance(),
    notes: '자과 캠퍼스 준비생',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3424',
    studentId: '3424',
    name: '이우준',
    classroom: '셀터디',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3510',
    studentId: '3510',
    name: '김태완',
    classroom: '셀터디',
    attendance: createDefaultAttendance(),
    notes: '',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  },
  {
    id: 'st_3524',
    studentId: '3524',
    name: '장한결',
    classroom: '셀터디',
    attendance: createDefaultAttendance(),
    notes: '인텔리전스 자율학습 참여 수기 관리',
    isWarning: false,
    warningReason: '',
    attendanceHistory: []
  }
];

// Helper: 정밀한 월~금 구조 생성 함수
export function createDefaultAttendance(
  status: any = '미확인', 
  custom?: Partial<any>
): any {
  const base = {
    '월': { p1: status, p2: status },
    '화': { p1: status, p2: status },
    '수': { p1: status, p2: status, p3: status }, // 수요일은 3교시 존재
    '목': { p1: status, p2: status },
    '금': { p1: status, p2: status },
  };
  
  if (custom) {
    return { ...base, ...custom };
  }
  return base;
}
