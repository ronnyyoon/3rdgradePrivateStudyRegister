import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Filter,
  RefreshCw,
  Calendar,
  Archive,
  UserPlus,
  Clock,
  Trash2,
  Plus,
  CheckCircle2,
  CalendarDays,
  Building,
  Edit2,
  AlertTriangle,
  X,
  Check,
  CalendarCheck,
  UserCheck,
} from 'lucide-react';
import { Student, Classroom, DayOfWeek, AttendanceStatus } from '../types';
import { createDefaultAttendance } from '../data';
import {
  STATUS_CYCLE,
  getSelectStyle,
  getPeriodsForDay,
  getPeriodLabel,
  DAYS,
  getStudentRoomForDay,
  isSaturdayNonParticipant,
  isWeekdayNonParticipant,
  isDayNonParticipant,
  getStudentEarlyLeaveSummary,
} from '../utils/attendanceUtils';

interface AdminSettingsViewProps {
  students: Student[];
  selectedClassroom: '전체' | Classroom;
  setSelectedClassroom: (room: '전체' | Classroom) => void;
  filteredStudents: Student[];
  handleFixedSettingChange: (
    studentId: string,
    day: DayOfWeek,
    period: 'p1' | 'p2' | 'p3' | 'p4',
    status: AttendanceStatus
  ) => void;
  handleSaturdayClassroomChange: (studentId: string, room: Classroom) => void;
  handleWeekdayClassroomChange: (studentId: string, room: Classroom) => void;
  forceResetAllToFixed: () => void;
  resetAllFixedSettings: () => void;
  restoreFromInitialRoster: () => void;
  handleManualWeekRollover: () => void;
  currentWeekMonday: string;
  lastArchivedWeekMonday?: string;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  setIsAddModalOpen: (open: boolean) => void;
  handleRemoveFromSaturday: (studentId: string) => void;
  handleRemoveFromWeekday: (studentId: string) => void;
  handleAddToSaturday: (studentId: string, room: Classroom) => void;
  handleAddToWeekday: (studentId: string, room: Classroom) => void;
  handleRemoveFromSpecificDay: (studentId: string, day: DayOfWeek) => void;
  handleAddToSpecificDay: (studentId: string, day: DayOfWeek, room?: Classroom) => void;
  handleUpdateEarlyLeave: (studentId: string, days: DayOfWeek[], timeText: string) => void;
  handleClearEarlyLeave: (studentId: string) => void;
  onOpenDeleteModal: (student: Student, day: DayOfWeek) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  students,
  selectedClassroom,
  setSelectedClassroom,
  filteredStudents,
  handleFixedSettingChange,
  handleSaturdayClassroomChange,
  handleWeekdayClassroomChange,
  forceResetAllToFixed,
  resetAllFixedSettings,
  restoreFromInitialRoster,
  handleManualWeekRollover,
  currentWeekMonday,
  lastArchivedWeekMonday,
  showToast,
  setIsAddModalOpen,
  handleRemoveFromSaturday,
  handleRemoveFromWeekday,
  handleAddToSaturday,
  handleAddToWeekday,
  handleRemoveFromSpecificDay,
  handleAddToSpecificDay,
  handleUpdateEarlyLeave,
  handleClearEarlyLeave,
  onOpenDeleteModal,
}) => {
  // 관리자 서브탭:
  // 'overview'(전체 고정값 매트릭스) | 'day_roster'(각 요일별 명단 관리) | 'saturday'(토요 전용 관리) | 'weekday'(평일 전용 관리) | 'early_leave'(조기 하교 관리)
  const [adminSubTab, setAdminSubTab] = useState<'overview' | 'day_roster' | 'saturday' | 'weekday' | 'early_leave'>('day_roster');

  // 각 요일별 명단 관리에서 활성화된 요일 (기본값: 오늘 요일 또는 '월')
  const [selectedDayRoster, setSelectedDayRoster] = useState<DayOfWeek>(() => {
    const dayNames: DayOfWeek[] = ['토', '월', '화', '수', '목', '금', '토'];
    const today = new Date().getDay();
    return (dayNames[today] || '월') as DayOfWeek;
  });

  // 요일별 자습실 필터
  const [dayFilterRoom, setDayFilterRoom] = useState<'전체' | Classroom>('전체');

  // 토요일 자습실 필터
  const [satFilterRoom, setSatFilterRoom] = useState<'전체' | Classroom>('전체');

  // 평일 자습실 필터
  const [weekdayFilterRoom, setWeekdayFilterRoom] = useState<'전체' | Classroom>('전체');

  // 요일별 추가 상태
  const [dayAddStudentId, setDayAddStudentId] = useState<string>('');
  const [dayAddRoom, setDayAddRoom] = useState<Classroom>('3-2');

  // 토요일 추가 상태
  const [satAddStudentId, setSatAddStudentId] = useState<string>('');
  const [satAddRoom, setSatAddRoom] = useState<Classroom>('3-3');

  // 평일 추가 상태
  const [weekdayAddStudentId, setWeekdayAddStudentId] = useState<string>('');
  const [weekdayAddRoom, setWeekdayAddRoom] = useState<Classroom>('3-2');

  // 조기 하교 폼 상태
  const [earlyLeaveStudentId, setEarlyLeaveStudentId] = useState<string>('');
  const [earlyLeaveTime, setEarlyLeaveTime] = useState<string>('21:20');
  const [earlyLeaveDays, setEarlyLeaveDays] = useState<DayOfWeek[]>(['월', '화', '수', '목', '금']);

  // 활성(비삭제) 학생 목록
  const activeStudents = useMemo(() => students.filter((s) => !s.isDeleted), [students]);

  // 요일별 참여 인원 수 계산 맵
  const dayParticipantsMap = useMemo(() => {
    const map: Record<DayOfWeek, Student[]> = {
      '월': [],
      '화': [],
      '수': [],
      '목': [],
      '금': [],
      '토': [],
    };
    DAYS.forEach((d) => {
      map[d] = activeStudents.filter((s) => !isDayNonParticipant(s, d));
    });
    return map;
  }, [activeStudents]);

  // 현재 선택된 요일의 참여 학생 목록
  const currentDayParticipants = useMemo(() => {
    return dayParticipantsMap[selectedDayRoster] || [];
  }, [dayParticipantsMap, selectedDayRoster]);

  // 현재 선택된 요일의 미참여 학생 목록 (추가 드롭다운용)
  const currentDayNonParticipants = useMemo(() => {
    return activeStudents.filter((s) => isDayNonParticipant(s, selectedDayRoster));
  }, [activeStudents, selectedDayRoster]);

  // 현재 선택된 요일의 자습실 필터링 목록
  const filteredCurrentDayList = useMemo(() => {
    return currentDayParticipants.filter((s) => {
      if (dayFilterRoom === '전체') return true;
      const room = getStudentRoomForDay(s, selectedDayRoster);
      return room === dayFilterRoom;
    });
  }, [currentDayParticipants, dayFilterRoom, selectedDayRoster]);

  // 토요일 참여 학생 목록 (총 N명)
  const saturdayParticipants = useMemo(() => {
    return activeStudents.filter((s) => !isSaturdayNonParticipant(s) || !!s.saturdayClassroom);
  }, [activeStudents]);

  // 평일 참여 학생 목록 (총 N명)
  const weekdayParticipants = useMemo(() => {
    return activeStudents.filter((s) => !isWeekdayNonParticipant(s));
  }, [activeStudents]);

  // 토요일 미참여 중인 학생 목록 (토요 추가용)
  const saturdayNonParticipants = useMemo(() => {
    return activeStudents.filter((s) => isSaturdayNonParticipant(s) && !s.saturdayClassroom);
  }, [activeStudents]);

  // 평일 미참여 중인 학생 목록 (평일 추가용)
  const weekdayNonParticipants = useMemo(() => {
    return activeStudents.filter((s) => isWeekdayNonParticipant(s));
  }, [activeStudents]);

  // 조기 하교 설정된 학생 목록
  const earlyLeaveStudents = useMemo(() => {
    return activeStudents
      .map((student) => {
        const summary = getStudentEarlyLeaveSummary(student);
        return summary ? { student, ...summary } : null;
      })
      .filter((item): item is { student: Student; days: DayOfWeek[]; time: string } => item !== null);
  }, [activeStudents]);

  // 토요일 탭 필터링 목록
  const filteredSaturdayList = useMemo(() => {
    return saturdayParticipants.filter((s) => {
      if (satFilterRoom === '전체') return true;
      const room = s.saturdayClassroom || s.classroom;
      return room === satFilterRoom;
    });
  }, [saturdayParticipants, satFilterRoom]);

  // 평일 탭 필터링 목록
  const filteredWeekdayList = useMemo(() => {
    return weekdayParticipants.filter((s) => {
      if (weekdayFilterRoom === '전체') return true;
      return s.classroom === weekdayFilterRoom;
    });
  }, [weekdayParticipants, weekdayFilterRoom]);

  // 조기 하교 요일 토글
  const toggleEarlyLeaveDay = (day: DayOfWeek) => {
    setEarlyLeaveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // 조기 하교 폼 제출
  const handleSubmitEarlyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!earlyLeaveStudentId) {
      showToast('대상이 될 학생을 선택해주세요.', 'error');
      return;
    }
    if (earlyLeaveDays.length === 0) {
      showToast('적용할 요일을 최소 하나 이상 선택해주세요.', 'error');
      return;
    }
    if (!earlyLeaveTime.trim()) {
      showToast('하교 시간대를 입력해주세요.', 'error');
      return;
    }

    handleUpdateEarlyLeave(earlyLeaveStudentId, earlyLeaveDays, earlyLeaveTime.trim());
    setEarlyLeaveStudentId('');
    setEarlyLeaveTime('21:20');
    setEarlyLeaveDays(['월', '화', '수', '목', '금']);
  };

  // 조기 하교 학생 선택 시 기존 설정 자동 로드
  const handleSelectEarlyLeaveStudent = (studentId: string) => {
    setEarlyLeaveStudentId(studentId);
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const summary = getStudentEarlyLeaveSummary(student);
    if (summary) {
      const cleanTime = summary.time.replace(/\s*하교/g, '').trim();
      setEarlyLeaveTime(cleanTime);
      setEarlyLeaveDays(summary.days);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 상단 주간 갱신 현황 및 빠른 초기화 */}
      <div className="bg-[#1E1E1E] p-4 sm:p-5 rounded-2xl border border-emerald-500/20 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-white text-sm">주간 출석 자동 갱신 및 누적 아카이빙 현황</h4>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 rounded-lg font-mono font-medium">
              현재 활성 주차: {currentWeekMonday} (월)
            </span>
            {lastArchivedWeekMonday && (
              <span className="px-2.5 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-lg font-mono">
                최근 마감 주차: {lastArchivedWeekMonday}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-zinc-400 text-xs leading-relaxed">
            • <strong className="text-emerald-400">매주 월요일 자동 갱신</strong>: 월요일이 되면 지난 주 출석 기록이 학생별 <strong className="text-white">누적 이력</strong>에 저장되고 새 주차로 시작됩니다.<br />
            • 각 요일별, 평일, 토요일 명단에서 학생을 자유롭게 추가하거나 삭제(제외)할 수 있습니다.
          </p>

          <button
            onClick={handleManualWeekRollover}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shrink-0 shadow-lg"
          >
            <Archive className="w-4 h-4" />
            <span>이번 주 출석 수동 마감 & 새 주차 시작</span>
          </button>
        </div>
      </div>

      {/* 2. 관리자 공통 컨트롤 바 */}
      <div className="bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[var(--color-point-yellow)]" />
            <h4 className="font-bold text-white text-sm">자율학습 참여 환경 세팅 및 학생 명단 관리</h4>
          </div>

          {/* 신규 학생 수동 등록 버튼 */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[var(--color-point-yellow)] hover:bg-[#E6C200] text-black rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-lg self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ 신규 학생 수동 등록</span>
          </button>
        </div>

        <div className="pt-1 flex flex-wrap gap-2 text-xs">
          <button
            onClick={restoreFromInitialRoster}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-bold transition flex items-center space-x-1.5 border border-zinc-750 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>스프레드시트 47명 최신 편성표 원본으로 재동기화</span>
          </button>
          <button
            onClick={forceResetAllToFixed}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-bold transition border border-zinc-750 cursor-pointer"
          >
            🔄 지금 즉시 현재 고정값에 전체 동기화
          </button>
          <button
            onClick={resetAllFixedSettings}
            className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950/45 text-red-400 rounded-lg font-bold transition border border-red-900/30 cursor-pointer"
          >
            ⚠️ 기본 고정값 전원 초기화
          </button>
        </div>
      </div>

      {/* 3. 관리자 서브 네비게이션 탭 */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        {/* 요일별 명단 관리 탭 (메인 요청) */}
        <button
          onClick={() => setAdminSubTab('day_roster')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            adminSubTab === 'day_roster'
              ? 'bg-amber-400 text-black shadow-lg ring-2 ring-amber-300/30 font-black'
              : 'bg-zinc-900 text-amber-300/80 hover:text-white border border-amber-500/20'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>📅 각 요일별 명단 관리 (추가/삭제)</span>
        </button>

        {/* 전체 기본 고정값 매트릭스 */}
        <button
          onClick={() => setAdminSubTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            adminSubTab === 'overview'
              ? 'bg-[var(--color-point-yellow)] text-black shadow-lg font-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>전체 기본 고정값 및 교실 설정 ({activeStudents.length}명)</span>
        </button>

        {/* 토요일 자습 관리 */}
        <button
          onClick={() => setAdminSubTab('saturday')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            adminSubTab === 'saturday'
              ? 'bg-amber-500 text-black shadow-lg font-black'
              : 'bg-zinc-900 text-amber-300/80 hover:text-amber-200 border border-amber-500/20'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>토요일 자습 명단 관리 ({saturdayParticipants.length}명)</span>
        </button>

        {/* 평일(월~금) 자습 관리 */}
        <button
          onClick={() => setAdminSubTab('weekday')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            adminSubTab === 'weekday'
              ? 'bg-blue-500 text-white shadow-lg font-black'
              : 'bg-zinc-900 text-blue-300/80 hover:text-blue-200 border border-blue-500/20'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>평일(월~금) 자습 명단 관리 ({weekdayParticipants.length}명)</span>
        </button>

        {/* 조기 하교 관리 */}
        <button
          onClick={() => setAdminSubTab('early_leave')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            adminSubTab === 'early_leave'
              ? 'bg-purple-600 text-white shadow-lg font-black'
              : 'bg-zinc-900 text-purple-300/80 hover:text-purple-200 border border-purple-500/20'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>⏰ 조기 하교 학생 관리 ({earlyLeaveStudents.length}명)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 서브탭 1: 📅 각 요일별 자습 명단 관리 (추가 & 삭제 지원) */}
      {/* ======================================================== */}
      {adminSubTab === 'day_roster' && (
        <div className="space-y-4">
          {/* 요일 선택 서브바 (월, 화, 수, 목, 금, 토) */}
          <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-amber-500/30 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                  <CalendarCheck className="w-4 h-4 text-amber-400" />
                  <span>관리 대상 요일 선택:</span>
                  <span className="text-amber-400 font-extrabold text-base">
                    [{selectedDayRoster}요일] 자습 명단 관리 ({currentDayParticipants.length}명 참여)
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1">
                  💡 요일별로 학생을 독립적으로 추가하거나 제외(삭제)할 수 있습니다. 특정 요일에서 제외하더라도 다른 요일 자습 명단은 안전하게 유지됩니다.
                </p>
              </div>

              {/* 요일 버튼 그룹 */}
              <div className="flex flex-wrap gap-1 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 self-start md:self-auto">
                {DAYS.map((day) => {
                  const count = (dayParticipantsMap[day] || []).length;
                  const isSelected = selectedDayRoster === day;
                  const isSat = day === '토';
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDayRoster(day);
                        setDayFilterRoom('전체');
                        setDayAddStudentId('');
                        if (day === '토') {
                          setDayAddRoom('3-3');
                        } else {
                          setDayAddRoom('3-2');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                        isSelected
                          ? isSat
                            ? 'bg-amber-500 text-black shadow-md font-black'
                            : 'bg-amber-400 text-black shadow-md font-black'
                          : isSat
                          ? 'text-amber-300 hover:text-white hover:bg-zinc-800'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <span>{day}요일</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {count}명
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 필터 및 해당 요일 배정 추가 섹션 */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
              {/* 자습실 필터 단말 */}
              <div className="flex items-center space-x-2">
                <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-xs text-zinc-400 font-bold whitespace-nowrap">자습실 필터:</span>
                <div className="bg-zinc-900 p-1 rounded-xl flex gap-1 overflow-x-auto">
                  {(selectedDayRoster === '토'
                    ? (['전체', '3-3', '3-4', '셀터디'] as const)
                    : (['전체', '3-2', '3-3', '3-4', '셀터디'] as const)
                  ).map((r) => {
                    const count =
                      r === '전체'
                        ? currentDayParticipants.length
                        : currentDayParticipants.filter((s) => getStudentRoomForDay(s, selectedDayRoster) === r).length;
                    return (
                      <button
                        key={r}
                        onClick={() => setDayFilterRoom(r as any)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                          dayFilterRoom === r
                            ? 'bg-[var(--color-point-yellow)] text-black'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span>{r}</span>
                        <span className="text-[10px] font-mono opacity-80">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 해당 요일에 학생 신규/기존 배정 추가 툴바 */}
              <div className="flex flex-wrap items-center gap-2 bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 flex-1 lg:max-w-xl">
                <span className="text-xs font-bold text-amber-300 whitespace-nowrap flex items-center space-x-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{selectedDayRoster}요일에 추가:</span>
                </span>

                <select
                  value={dayAddStudentId}
                  onChange={(e) => setDayAddStudentId(e.target.value)}
                  className="bg-zinc-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-amber-400 flex-1 min-w-[140px]"
                >
                  <option value="">-- {selectedDayRoster}요일 미참여 학생 중 선택 ({currentDayNonParticipants.length}명) --</option>
                  {currentDayNonParticipants.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentId} {s.name} (기본실: {s.classroom})
                    </option>
                  ))}
                </select>

                <select
                  value={dayAddRoom}
                  onChange={(e) => setDayAddRoom(e.target.value as Classroom)}
                  className="bg-zinc-800 text-amber-300 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-amber-400 font-bold"
                >
                  {selectedDayRoster === '토' ? (
                    <>
                      <option value="3-3">3-3 자습실</option>
                      <option value="3-4">3-4 자습실</option>
                      <option value="셀터디">셀터디 자습실</option>
                    </>
                  ) : (
                    <>
                      <option value="3-2">3-2 자습실</option>
                      <option value="3-3">3-3 자습실</option>
                      <option value="3-4">3-4 자습실</option>
                      <option value="셀터디">셀터디 자습실</option>
                    </>
                  )}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (!dayAddStudentId) {
                      showToast(`추가할 학생을 선택해주세요.`, 'error');
                      return;
                    }
                    handleAddToSpecificDay(dayAddStudentId, selectedDayRoster, dayAddRoom);
                    setDayAddStudentId('');
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap shadow"
                >
                  + {selectedDayRoster}요일 배정
                </button>
              </div>
            </div>
          </div>

          {/* 해당 요일 학생 명단 테이블 */}
          <div className="bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.12)] overflow-hidden shadow-xl">
            <div className="px-5 py-3 border-b border-zinc-800 bg-[#262626]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-xs">
                  {selectedDayRoster}요일 자습 참여 명단 ({filteredCurrentDayList.length}명)
                </span>
                <span className="text-[11px] text-zinc-500">
                  (기본 고정값 변경 시 자동 저장됩니다)
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                🔴 [요일 제외]: 해당 요일만 미참여 처리 | 🗑️ [상세 삭제]: 영구 제명 또는 선택 삭제
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#262626]/40 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 leading-none">
                    <th className="py-4 px-3 w-28">자습실</th>
                    <th className="py-4 px-3 w-20">학번</th>
                    <th className="py-4 px-4 w-28">이름</th>
                    <th className="py-4 px-3 text-zinc-400">참여 현황 / 특이사항</th>
                    {getPeriodsForDay(selectedDayRoster).map((p) => (
                      <th key={p} className="py-4 px-2 text-center text-amber-300 w-24">
                        {getPeriodLabel(selectedDayRoster, p)}
                      </th>
                    ))}
                    <th className="py-4 px-4 text-right w-44">명단 관리 (추가/삭제)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-xs font-mono">
                  {filteredCurrentDayList.length === 0 ? (
                    <tr>
                      <td colSpan={5 + getPeriodsForDay(selectedDayRoster).length} className="py-12 text-center text-zinc-500 font-sans">
                        해당 조건의 {selectedDayRoster}요일 참여 학생이 없습니다. 상단에서 학생을 배정해주세요.
                      </td>
                    </tr>
                  ) : (
                    filteredCurrentDayList.map((student) => {
                      const room = getStudentRoomForDay(student, selectedDayRoster);
                      const currentFixed = student.fixedSettings || student.attendance || createDefaultAttendance();
                      const earlyLeave = getStudentEarlyLeaveSummary(student);
                      const periods = getPeriodsForDay(selectedDayRoster);

                      return (
                        <tr key={student.id} className="hover:bg-zinc-900/60">
                          {/* 자습실 변경 */}
                          <td className="py-3 px-3">
                            <select
                              value={room}
                              onChange={(e) => {
                                const newRoom = e.target.value as Classroom;
                                if (selectedDayRoster === '토') {
                                  handleSaturdayClassroomChange(student.id, newRoom);
                                } else {
                                  handleWeekdayClassroomChange(student.id, newRoom);
                                }
                              }}
                              className="bg-zinc-800 text-amber-300 border border-zinc-700 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:border-amber-400"
                            >
                              {selectedDayRoster === '토' ? (
                                <>
                                  <option value="3-3">3-3 자습실</option>
                                  <option value="3-4">3-4 자습실</option>
                                  <option value="셀터디">셀터디</option>
                                </>
                              ) : (
                                <>
                                  <option value="3-2">3-2 자습실</option>
                                  <option value="3-3">3-3 자습실</option>
                                  <option value="3-4">3-4 자습실</option>
                                  <option value="셀터디">셀터디</option>
                                </>
                              )}
                            </select>
                          </td>

                          {/* 학번 & 이름 */}
                          <td className="py-3 px-3 text-zinc-400 font-semibold">{student.studentId}</td>
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{student.name}</td>

                          {/* 특이사항 / 조기 하교 */}
                          <td className="py-3 px-3 text-zinc-400 font-sans text-[11px]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {earlyLeave && (
                                <span className="bg-purple-950/50 text-purple-300 border border-purple-800/40 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1">
                                  <Clock className="w-2.5 h-2.5 text-purple-400" />
                                  <span>{earlyLeave.time}</span>
                                </span>
                              )}
                              {selectedDayRoster !== '토' && student.saturdayClassroom && (
                                <span className="text-[10px] text-amber-400/80 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/30">
                                  토: {student.saturdayClassroom}
                                </span>
                              )}
                              {selectedDayRoster === '토' && (
                                <span className="text-[10px] text-blue-400/80 bg-blue-950/30 px-1.5 py-0.5 rounded border border-blue-800/30">
                                  평일: {student.classroom}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 교시별 기본 고정값 드롭다운 */}
                          {periods.map((p) => {
                            const val = currentFixed[selectedDayRoster]?.[p] || '미확인';
                            return (
                              <td key={`${selectedDayRoster}-${p}`} className="py-3 px-1 text-center bg-zinc-900/30">
                                <select
                                  className={`text-[9.5px] px-1 py-0.8 rounded border focus:outline-none focus:border-amber-400 w-[64px] transition ${getSelectStyle(
                                    val
                                  )}`}
                                  value={val}
                                  onChange={(e) => {
                                    handleFixedSettingChange(
                                      student.id,
                                      selectedDayRoster,
                                      p,
                                      e.target.value as AttendanceStatus
                                    );
                                    showToast(
                                      `${student.name} ${selectedDayRoster}(${getPeriodLabel(selectedDayRoster, p)}) 설정이 [${e.target.value}]로 변경되었습니다.`,
                                      'success'
                                    );
                                  }}
                                >
                                  {STATUS_CYCLE.map((s) => (
                                    <option key={s} value={s} className="bg-zinc-900 text-white font-medium">
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            );
                          })}

                          {/* 명단 제외 / 삭제 버튼 */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* 1. 해당 요일 자습에서만 제외 버튼 */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleRemoveFromSpecificDay(student.id, selectedDayRoster);
                                }}
                                className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-950/80 text-amber-300 border border-amber-800/40 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                                title={`${selectedDayRoster}요일 자습에서만 제외 (다른 요일은 안전 보존)`}
                              >
                                <span>{selectedDayRoster}요일 제외</span>
                              </button>

                              {/* 2. 상세 삭제 모달 열기 (영구 삭제 및 다중 옵션) */}
                              <button
                                type="button"
                                onClick={() => onOpenDeleteModal(student, selectedDayRoster)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                title="상세 삭제 / 영구 삭제 메뉴"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 서브탭 2: 전체 기본 고정값 및 교실 설정 (Overview Matrix) */}
      {/* ======================================================== */}
      {adminSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[rgba(255,215,0,0.12)]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-[var(--color-point-yellow)]" />
                <span className="text-xs font-bold text-white">필터 설정 대상실 (평일 기준)</span>
              </div>
              <div className="bg-zinc-900 p-1 rounded-xl flex gap-1 w-full sm:w-auto">
                {(['전체', '3-2', '3-3', '3-4', '셀터디'] as const).map((r) => {
                  const count =
                    r === '전체'
                      ? activeStudents.length
                      : activeStudents.filter((s) => s.classroom === r).length;
                  return (
                    <button
                      key={r}
                      onClick={() => setSelectedClassroom(r)}
                      className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center space-x-1 ${
                        selectedClassroom === r
                          ? 'bg-[var(--color-point-yellow)] text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>{r}</span>
                      <span className="text-[10px] font-mono opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.12)] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#262626]/40 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 leading-none">
                    <th className="py-4 px-2 w-24">평일 자습실</th>
                    <th className="py-4 px-2 w-24 text-amber-400/90">토요 자습실</th>
                    <th className="py-4 px-2 w-16">학번</th>
                    <th className="py-4 px-3 w-24">이름</th>
                    {DAYS.filter((d) => d !== '토').map((d) => (
                      <th
                        key={d}
                        colSpan={3}
                        className="py-4 px-1 text-center border-l border-zinc-800 text-zinc-300 font-bold"
                      >
                        {d}요일
                      </th>
                    ))}
                    <th
                      colSpan={4}
                      className="py-4 px-1 text-center border-l border-amber-900/40 bg-amber-950/20 text-amber-400 font-bold"
                    >
                      토요일 (4교시)
                    </th>
                    <th className="py-4 px-2 text-center w-20 sticky right-0 bg-[#262626] z-20">
                      학생 삭제
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-xs font-mono">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={24} className="py-12 text-center text-zinc-500 font-sans">
                        선택된 자습실에 배정된 학생이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const currentFixed = student.fixedSettings || student.attendance || createDefaultAttendance();
                      const satRoom = student.saturdayClassroom || student.classroom;

                      return (
                        <tr key={student.id} className="hover:bg-zinc-900/60 transition">
                          <td className="py-3 px-2">
                            <select
                              value={student.classroom}
                              onChange={(e) => {
                                handleWeekdayClassroomChange(student.id, e.target.value as Classroom);
                              }}
                              className="bg-zinc-900 text-zinc-300 border border-zinc-750 text-[11px] rounded-lg px-2 py-1 font-bold focus:outline-none focus:border-[var(--color-point-yellow)]"
                            >
                              <option value="3-2">3-2</option>
                              <option value="3-3">3-3</option>
                              <option value="3-4">3-4</option>
                              <option value="셀터디">셀터디</option>
                            </select>
                          </td>

                          <td className="py-3 px-2">
                            <select
                              value={satRoom}
                              onChange={(e) => {
                                handleSaturdayClassroomChange(student.id, e.target.value as Classroom);
                                showToast(`${student.name} 토요일 자습실이 [${e.target.value}]로 변경되었습니다.`, 'success');
                              }}
                              className="bg-amber-950/40 text-amber-300 border border-amber-800/60 text-[11px] rounded-lg px-2 py-1 font-bold focus:outline-none focus:border-amber-400"
                            >
                              <option value="3-3">3-3</option>
                              <option value="3-4">3-4</option>
                              <option value="셀터디">셀터디</option>
                            </select>
                          </td>

                          <td className="py-3 px-2 text-zinc-400 font-semibold">{student.studentId}</td>
                          <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <span>{student.name}</span>
                              <button
                                type="button"
                                onClick={() => onOpenDeleteModal(student, '월')}
                                className="opacity-40 hover:opacity-100 text-rose-400 hover:text-rose-300 transition cursor-pointer p-0.5"
                                title={`${student.name} 학생 삭제`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* 월~금 (p1~p3) */}
                          {(['월', '화', '수', '목', '금'] as const).map((day) => {
                            return (['p1', 'p2', 'p3'] as const).map((p) => {
                              const val = currentFixed[day]?.[p] || '미참여일';
                              return (
                                <td key={`${day}-${p}`} className="py-3 px-0.5 text-center">
                                  <select
                                    className={`text-[9.5px] px-1 py-0.8 rounded border focus:outline-none focus:border-[var(--color-point-yellow)] w-[62px] transition ${getSelectStyle(
                                      val
                                    )}`}
                                    value={val}
                                    onChange={(e) => {
                                      handleFixedSettingChange(student.id, day, p, e.target.value as AttendanceStatus);
                                      showToast(
                                        `${student.name} ${day}(${getPeriodLabel(day, p)}) 설정이 [${e.target.value}]로 변경되었습니다.`,
                                        'success'
                                      );
                                    }}
                                  >
                                    {STATUS_CYCLE.map((s) => (
                                      <option key={s} value={s} className="bg-zinc-900 text-white font-medium">
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              );
                            });
                          })}

                          {/* 토요일 (p1~p4) */}
                          {(['p1', 'p2', 'p3', 'p4'] as const).map((p) => {
                            const val = currentFixed['토']?.[p] || '미참여일';
                            return (
                              <td key={`토-${p}`} className="py-3 px-0.5 text-center bg-amber-950/10">
                                <select
                                  className={`text-[9.5px] px-1 py-0.8 rounded border focus:outline-none focus:border-amber-400 w-[62px] transition ${getSelectStyle(
                                    val
                                  )}`}
                                  value={val}
                                  onChange={(e) => {
                                    handleFixedSettingChange(student.id, '토', p, e.target.value as AttendanceStatus);
                                    showToast(
                                      `${student.name} 토(${getPeriodLabel('토', p)}) 설정이 [${e.target.value}]로 변경되었습니다.`,
                                      'success'
                                    );
                                  }}
                                >
                                  {STATUS_CYCLE.map((s) => (
                                    <option key={s} value={s} className="bg-zinc-900 text-white font-medium">
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            );
                          })}

                          {/* 학생 삭제 버튼 */}
                          <td className="py-3 px-2 text-center sticky right-0 bg-[#1E1E1E]/95 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                            <button
                              type="button"
                              onClick={() => onOpenDeleteModal(student, '월')}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer inline-flex items-center space-x-1"
                              title={`${student.name} 학생 삭제 / 자습 제외`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[10px] hidden xl:inline text-rose-400/80">삭제</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 서브탭 3: 토요일 자습 명단 관리 (독립 관리) */}
      {/* ======================================================== */}
      {adminSubTab === 'saturday' && (
        <div className="space-y-4">
          <div className="bg-[#1E1E1E] p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h4 className="font-bold text-amber-300 text-sm flex items-center space-x-1.5">
                  <CalendarDays className="w-4 h-4 text-amber-400" />
                  <span>토요일 자습 명단 독립 관리 (총 {saturdayParticipants.length}명 참여 중)</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1">
                  💡 토요일 자습은 평일 자습과 완전히 분리되어 관리됩니다. 여기서 토요일 자습에서 제외하더라도 <strong className="text-white">월~금 평일 자습 명단은 안전하게 유지</strong>됩니다.
                </p>
              </div>

              {/* 토요 자습실 필터 */}
              <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl self-start sm:self-auto">
                {(['전체', '3-3', '3-4', '셀터디'] as const).map((room) => {
                  const count =
                    room === '전체'
                      ? saturdayParticipants.length
                      : saturdayParticipants.filter((s) => (s.saturdayClassroom || s.classroom) === room).length;
                  return (
                    <button
                      key={room}
                      onClick={() => setSatFilterRoom(room)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                        satFilterRoom === room
                          ? 'bg-amber-500 text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>{room}</span>
                      <span className="text-[10px] font-mono opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 토요일 자습에 신규/평일 학생 추가 바 */}
            <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <span className="text-xs font-bold text-amber-300 whitespace-nowrap flex items-center space-x-1">
                <Plus className="w-3.5 h-3.5" />
                <span>토요일 자습에 학생 배정 추가:</span>
              </span>

              <select
                value={satAddStudentId}
                onChange={(e) => setSatAddStudentId(e.target.value)}
                className="bg-zinc-800 text-white text-xs px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-amber-400 flex-1"
              >
                <option value="">-- 토요일 미참여 학생 중 선택 ({saturdayNonParticipants.length}명) --</option>
                {saturdayNonParticipants.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentId} {s.name} (평일: {s.classroom})
                  </option>
                ))}
              </select>

              <select
                value={satAddRoom}
                onChange={(e) => setSatAddRoom(e.target.value as Classroom)}
                className="bg-amber-950/40 text-amber-300 text-xs px-3 py-2 rounded-lg border border-amber-800/60 focus:outline-none focus:border-amber-400 font-bold"
              >
                <option value="3-3">3-3 자습실</option>
                <option value="3-4">3-4 자습실</option>
                <option value="셀터디">셀터디 자습실</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  if (!satAddStudentId) {
                    showToast('추가할 학생을 선택해주세요.', 'error');
                    return;
                  }
                  handleAddToSaturday(satAddStudentId, satAddRoom);
                  setSatAddStudentId('');
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap"
              >
                토요 자습 배정
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ 신규 등록</span>
              </button>
            </div>
          </div>

          {/* 토요일 전용 학생 명단 테이블 */}
          <div className="bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.12)] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#262626]/40 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 leading-none">
                    <th className="py-4 px-3">토요 배정실</th>
                    <th className="py-4 px-3">학번</th>
                    <th className="py-4 px-4">이름</th>
                    <th className="py-4 px-3 text-zinc-500">평일 자습실</th>
                    <th className="py-4 px-2 text-center text-amber-300">토_오전1</th>
                    <th className="py-4 px-2 text-center text-amber-300">토_오전2</th>
                    <th className="py-4 px-2 text-center text-amber-300">토_오후3</th>
                    <th className="py-4 px-2 text-center text-amber-300">토_오후4</th>
                    <th className="py-4 px-4 text-right">토요 자습 관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-xs font-mono">
                  {filteredSaturdayList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-zinc-500 font-sans">
                        해당 자습실의 토요일 참여 학생이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredSaturdayList.map((student) => {
                      const satRoom = student.saturdayClassroom || student.classroom;
                      const currentFixed = student.fixedSettings || student.attendance || createDefaultAttendance();

                      return (
                        <tr key={student.id} className="hover:bg-zinc-900/60">
                          {/* 토요 자습실 변경 */}
                          <td className="py-3 px-3">
                            <select
                              value={satRoom}
                              onChange={(e) => {
                                handleSaturdayClassroomChange(student.id, e.target.value as Classroom);
                                showToast(`${student.name} 토요일 자습실이 [${e.target.value}]로 변경되었습니다.`, 'success');
                              }}
                              className="bg-amber-950/40 text-amber-300 border border-amber-800/60 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:border-amber-400"
                            >
                              <option value="3-3">3-3 자습실</option>
                              <option value="3-4">3-4 자습실</option>
                              <option value="셀터디">셀터디</option>
                            </select>
                          </td>

                          <td className="py-3 px-3 text-zinc-400 font-semibold">{student.studentId}</td>
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{student.name}</td>

                          <td className="py-3 px-3 text-zinc-500 font-sans">
                            {isWeekdayNonParticipant(student) ? (
                              <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">
                                평일 미참여
                              </span>
                            ) : (
                              <span>평일: {student.classroom}</span>
                            )}
                          </td>

                          {(['p1', 'p2', 'p3', 'p4'] as const).map((p) => {
                            const val = currentFixed['토']?.[p] || '미참여일';
                            return (
                              <td key={`sat-${p}`} className="py-3 px-1 text-center bg-amber-950/5">
                                <select
                                  className={`text-[9.5px] px-1 py-0.8 rounded border focus:outline-none focus:border-amber-400 w-[64px] transition ${getSelectStyle(
                                    val
                                  )}`}
                                  value={val}
                                  onChange={(e) => {
                                    handleFixedSettingChange(student.id, '토', p, e.target.value as AttendanceStatus);
                                    showToast(
                                      `${student.name} 토(${getPeriodLabel('토', p)}) 설정이 [${e.target.value}]로 변경되었습니다.`,
                                      'success'
                                    );
                                  }}
                                >
                                  {STATUS_CYCLE.map((s) => (
                                    <option key={s} value={s} className="bg-zinc-900 text-white font-medium">
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            );
                          })}

                          {/* 토요 자습 제외 / 삭제 컨트롤 */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveFromSaturday(student.id)}
                                className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-950/80 text-amber-300 border border-amber-800/40 rounded-lg text-xs font-bold transition cursor-pointer"
                                title="토요일 자습에서만 제외"
                              >
                                토요 자습 제외
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenDeleteModal(student, '토')}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                title="상세 삭제 / 영구 삭제 메뉴"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 서브탭 4: 평일(월~금) 자습 명단 관리 */}
      {/* ======================================================== */}
      {adminSubTab === 'weekday' && (
        <div className="space-y-4">
          <div className="bg-[#1E1E1E] p-4 sm:p-5 rounded-2xl border border-blue-500/30 space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h4 className="font-bold text-blue-300 text-sm flex items-center space-x-1.5">
                  <Building className="w-4 h-4 text-blue-400" />
                  <span>평일(월~금) 자습 명단 독립 관리 (총 {weekdayParticipants.length}명 참여 중)</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1">
                  💡 평일 자습 명단을 독립적으로 제어합니다. 평일 자습에서 제외하더라도 <strong className="text-white">토요일 자습실 명단은 안전하게 유지</strong>됩니다.
                </p>
              </div>

              {/* 평일 자습실 필터 */}
              <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl self-start sm:self-auto">
                {(['전체', '3-2', '3-3', '3-4', '셀터디'] as const).map((room) => {
                  const count =
                    room === '전체'
                      ? weekdayParticipants.length
                      : weekdayParticipants.filter((s) => s.classroom === room).length;
                  return (
                    <button
                      key={room}
                      onClick={() => setWeekdayFilterRoom(room)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                        weekdayFilterRoom === room
                          ? 'bg-blue-500 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>{room}</span>
                      <span className="text-[10px] font-mono opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 평일 자습 추가 바 */}
            <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <span className="text-xs font-bold text-blue-300 whitespace-nowrap flex items-center space-x-1">
                <Plus className="w-3.5 h-3.5" />
                <span>평일 자습에 학생 배정 추가:</span>
              </span>

              <select
                value={weekdayAddStudentId}
                onChange={(e) => setWeekdayAddStudentId(e.target.value)}
                className="bg-zinc-800 text-white text-xs px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-400 flex-1"
              >
                <option value="">-- 평일 미참여(토요전용) 학생 중 선택 ({weekdayNonParticipants.length}명) --</option>
                {weekdayNonParticipants.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentId} {s.name} (토요: {s.saturdayClassroom || s.classroom})
                  </option>
                ))}
              </select>

              <select
                value={weekdayAddRoom}
                onChange={(e) => setWeekdayAddRoom(e.target.value as Classroom)}
                className="bg-blue-950/40 text-blue-300 text-xs px-3 py-2 rounded-lg border border-blue-800/60 focus:outline-none focus:border-blue-400 font-bold"
              >
                <option value="3-2">3-2 자습실</option>
                <option value="3-3">3-3 자습실</option>
                <option value="3-4">3-4 자습실</option>
                <option value="셀터디">셀터디 자습실</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  if (!weekdayAddStudentId) {
                    showToast('추가할 학생을 선택해주세요.', 'error');
                    return;
                  }
                  handleAddToWeekday(weekdayAddStudentId, weekdayAddRoom);
                  setWeekdayAddStudentId('');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap"
              >
                평일 자습 배정
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                <span>+ 신규 등록</span>
              </button>
            </div>
          </div>

          {/* 평일 전용 학생 명단 테이블 */}
          <div className="bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.12)] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#262626]/40 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 leading-none">
                    <th className="py-4 px-3">평일 배정실</th>
                    <th className="py-4 px-3">학번</th>
                    <th className="py-4 px-4">이름</th>
                    <th className="py-4 px-3 text-amber-400/80">토요일 배정실</th>
                    <th className="py-4 px-4 text-right">평일 자습 관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-xs font-mono">
                  {filteredWeekdayList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500 font-sans">
                        해당 자습실의 평일 참여 학생이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredWeekdayList.map((student) => {
                      const hasSat = !isSaturdayNonParticipant(student);
                      const satRoom = student.saturdayClassroom || student.classroom;

                      return (
                        <tr key={student.id} className="hover:bg-zinc-900/60">
                          <td className="py-3 px-3">
                            <select
                              value={student.classroom}
                              onChange={(e) => {
                                handleWeekdayClassroomChange(student.id, e.target.value as Classroom);
                              }}
                              className="bg-blue-950/40 text-blue-200 border border-blue-800/60 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:border-blue-400"
                            >
                              <option value="3-2">3-2 자습실</option>
                              <option value="3-3">3-3 자습실</option>
                              <option value="3-4">3-4 자습실</option>
                              <option value="셀터디">셀터디</option>
                            </select>
                          </td>

                          <td className="py-3 px-3 text-zinc-400 font-semibold">{student.studentId}</td>
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{student.name}</td>

                          <td className="py-3 px-3 text-amber-300/80 font-sans">
                            {hasSat ? (
                              <span className="bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/30 text-[11px]">
                                토요일: {satRoom}
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">
                                토요일 미참여
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveFromWeekday(student.id)}
                                className="px-2.5 py-1 bg-blue-950/40 hover:bg-blue-950/80 text-blue-300 border border-blue-800/40 rounded-lg text-xs font-bold transition cursor-pointer"
                                title="평일 자습에서만 제외"
                              >
                                평일 자습 제외
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenDeleteModal(student, '월')}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                title="상세 삭제 / 영구 삭제 메뉴"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 서브탭 5: ⏰ 조기 하교 학생 직접 관리 (시간대 입력) */}
      {/* ======================================================== */}
      {adminSubTab === 'early_leave' && (
        <div className="space-y-6">
          <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
              <Clock className="w-5 h-5 text-purple-400" />
              <div>
                <h4 className="font-bold text-white text-sm">조기 하교 학생 신규 지정 및 시간대 설정</h4>
                <p className="text-[11px] text-zinc-400">
                  학생별로 조기 하교하는 요일과 희망 시간대(예: 21:20, 21:30 등)를 직접 등록하거나 수정할 수 있습니다.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitEarlyLeave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-300 block">대상 학생 선택 *</label>
                <select
                  value={earlyLeaveStudentId}
                  onChange={(e) => handleSelectEarlyLeaveStudent(e.target.value)}
                  required
                  className="w-full bg-[#262626] text-white text-xs px-3.5 py-2.5 rounded-xl border border-zinc-750 focus:outline-none focus:border-purple-400"
                >
                  <option value="">-- 학생을 선택하세요 --</option>
                  {activeStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentId} {s.name} ({s.classroom})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-300 block">하교 시간대 입력 *</label>
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {['21:20', '21:30', '21:00', '17:00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEarlyLeaveTime(preset)}
                        className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                          earlyLeaveTime === preset
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-800 text-zinc-300 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="시간대 직접 입력 (예: 21:20)"
                    value={earlyLeaveTime}
                    onChange={(e) => setEarlyLeaveTime(e.target.value)}
                    className="w-full bg-[#262626] text-white text-xs px-3 py-2 rounded-xl border border-zinc-750 focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-zinc-300 block">적용 요일 선택 *</label>
                  <button
                    type="button"
                    onClick={() => setEarlyLeaveDays(['월', '화', '수', '목', '금'])}
                    className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                  >
                    평일 전체(월~금)
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {DAYS.map((d) => {
                    const isSelected = earlyLeaveDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleEarlyLeaveDay(d)}
                        className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-0.5 ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                        <span>{d}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-lg flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>조기 하교 설정 저장</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-[#1E1E1E] rounded-2xl border border-purple-500/20 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-800 bg-[#262626]/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>현재 조기 하교 등록 학생 명단 ({earlyLeaveStudents.length}명)</span>
              </h3>
              <span className="text-xs text-zinc-500">
                출석부 테이블에 ({'{'}시간{'}'} 하교) 배지가 자동 표시됩니다
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#262626]/40 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 leading-none">
                    <th className="py-4 px-4">자습실</th>
                    <th className="py-4 px-3">학번</th>
                    <th className="py-4 px-4">이름</th>
                    <th className="py-4 px-4 text-amber-300">하교 시간대</th>
                    <th className="py-4 px-4">적용 요일</th>
                    <th className="py-4 px-4 text-right">설정 관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-xs font-mono">
                  {earlyLeaveStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500 font-sans">
                        현재 등록된 조기 하교 학생이 없습니다. 상단 폼에서 학생을 등록해주세요.
                      </td>
                    </tr>
                  ) : (
                    earlyLeaveStudents.map(({ student, days, time }) => (
                      <tr key={student.id} className="hover:bg-zinc-900/60">
                        <td className="py-3 px-4">
                          <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-bold">
                            {student.classroom}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 font-semibold">{student.studentId}</td>
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{student.name}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center space-x-1 text-amber-300 bg-amber-950/60 border border-amber-500/50 px-2 py-0.5 rounded-md font-bold text-xs">
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{time}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-zinc-300">
                          <div className="flex gap-1">
                            {days.map((d) => (
                              <span key={d} className="bg-purple-950/50 text-purple-300 border border-purple-800/50 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {d}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleSelectEarlyLeaveStudent(student.id)}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>수정</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearEarlyLeave(student.id)}
                              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-950/70 text-red-400 border border-red-900/40 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              해제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
