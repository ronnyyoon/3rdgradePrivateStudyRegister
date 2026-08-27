/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 메뉴 네비게이션 타입
export type NavigationMenu = 'attendance' | 'stats' | 'admin_settings';

// 요일 타입 정의 (월요일부터 토요일까지)
export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토';

// 자습 교실 타입 정의 (3-1 자습인원 미존재로 3-2, 3-3, 3-4, 셀터디 운영)
export type Classroom = '3-2' | '3-3' | '3-4' | '셀터디';

// 출석 상태 타입 정의
export type AttendanceStatus = '출석' | '수업' | '병결' | '개인사' | '미참여일' | '미인정결' | '미확인';

// 요일별 교시 상태 구조
// 평일: p1 (방과후), p2 (1교시), p3 (2교시)
// 토요일: p1 (1교시(오전)), p2 (2교시(오전)), p3 (3교시(오후)), p4 (4교시(오후))
export interface PeriodAttendance {
  p1: AttendanceStatus;
  p2: AttendanceStatus;
  p3?: AttendanceStatus;
  p4?: AttendanceStatus;
}

// 학생 상세 이력 기록 단위
export interface AttendanceHistoryItem {
  date: string;          // 예: '2026.06.15'
  day: DayOfWeek;        // 요일
  period: string;        // '방과후', '1교시', '2교시', '1교시(오전)', '2교시(오전)', '3교시(오후)', '4교시(오후)'
  status: AttendanceStatus;
}

// 학생 인터페이스 정의
export interface Student {
  id: string;            // 고유 ID
  studentId: string;     // 학번 (예: 3120)
  name: string;          // 이름
  classroom: Classroom;  // 평일 자습실 위치
  saturdayClassroom?: Classroom; // 토요일 자습실 위치 (다르게 편성 가능)
  earlyLeave?: Partial<Record<DayOfWeek, string>> | DayOfWeek[]; // 조기 하교 안내 문구 (예: { '월': '21:20 하교' } 또는 ['월','화','수','목','금'])
  attendance: {
    '월': PeriodAttendance;
    '화': PeriodAttendance;
    '수': PeriodAttendance;
    '목': PeriodAttendance;
    '금': PeriodAttendance;
    '토': PeriodAttendance;
  };
  notes?: string;         // 개별 비고 사항
  isWarning?: boolean;    // 옐로우카드 경고 표시 활성화 여부
  warningReason?: string; // 경고사유
  attendanceHistory?: AttendanceHistoryItem[]; // 누적 출석 기록
  
  // 관리자 설정에서 지정하는 고정값 세팅
  fixedSettings?: {
    '월': PeriodAttendance;
    '화': PeriodAttendance;
    '수': PeriodAttendance;
    '목': PeriodAttendance;
    '금': PeriodAttendance;
    '토': PeriodAttendance;
  };
  isDeleted?: boolean; // 삭제 여부 플래그 (통계 보존 및 동일 학생 재추가 시 연동용)
}

// 출석부 요약 통계 인터페이스
export interface AttendanceStats {
  totalStudents: number;
  presentCount: number;  // '출석' 횟수
  classClassCount: number; // '수업' 등 타 상태 카운팅을 위한 구조
  absentCount: number;   // 병결, 개인사, 미참여일 등 분류별 분석용
  attendanceRate: number; // 출석률 (%)
}
