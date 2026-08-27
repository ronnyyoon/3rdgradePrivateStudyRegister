import React from 'react';
import { Calendar, Filter, Search, X, UserPlus, AlertTriangle, Info, Trash2, CheckCircle, Clock } from 'lucide-react';
import { DayOfWeek, Classroom, Student, AttendanceStatus } from '../types';
import {
  DAYS,
  getPeriodsForDay,
  getPeriodLabel,
  getStudentRoomForDay,
  getStatusBadgeStyle,
  getStudentEarlyLeaveText,
  isSaturdayNonParticipant,
  isWeekdayNonParticipant
} from '../utils/attendanceUtils';

interface AttendanceTableViewProps {
  students: Student[];
  filteredStudents: Student[];
  activeTabDay: DayOfWeek;
  setActiveTabDay: (day: DayOfWeek) => void;
  selectedClassroom: '전체' | Classroom;
  setSelectedClassroom: (room: '전체' | Classroom) => void;
  warningOnlyFilter: boolean;
  setWarningOnlyFilter: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateMap: Record<DayOfWeek, string>;
  activeStudentsCount: number;
  handlePeriodClick: (studentId: string, day: DayOfWeek, period: 'p1' | 'p2' | 'p3' | 'p4') => void;
  openStudentDetail: (student: Student) => void;
  handleDeleteStudent: (id: string, name: string) => void;
  setIsAddModalOpen: (open: boolean) => void;
  batchMarkAttendance: (day: DayOfWeek, status: AttendanceStatus) => void;
}

export const AttendanceTableView: React.FC<AttendanceTableViewProps> = ({
  students,
  filteredStudents,
  activeTabDay,
  setActiveTabDay,
  selectedClassroom,
  setSelectedClassroom,
  warningOnlyFilter,
  setWarningOnlyFilter,
  searchQuery,
  setSearchQuery,
  dateMap,
  activeStudentsCount,
  handlePeriodClick,
  openStudentDetail,
  handleDeleteStudent,
  setIsAddModalOpen,
  batchMarkAttendance,
}) => {
  const periods = getPeriodsForDay(activeTabDay);

  // 요일별 각 자습실에 실제 배정된 활성 학생 수 계산
  const roomCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      '전체': 0,
      '3-1': 0,
      '3-2': 0,
      '3-3': 0,
      '3-4': 0,
      '셀터디': 0,
    };

    students.forEach(student => {
      if (student.isDeleted) return;
      if (activeTabDay === '토') {
        if (isSaturdayNonParticipant(student)) return;
      } else {
        if (isWeekdayNonParticipant(student)) return;
      }

      counts['전체']++;
      const room = getStudentRoomForDay(student, activeTabDay);
      if (counts[room] !== undefined) {
        counts[room]++;
      }
    });

    return counts;
  }, [students, activeTabDay]);

  // 요일별 출석 통계 계산
  const dayStats = React.useMemo(() => {
    let presentCount = 0;
    let totalTargetCount = 0;

    filteredStudents.forEach(student => {
      periods.forEach(p => {
        const status = student.attendance[activeTabDay]?.[p] || '미참여일';
        if (status === '출석') {
          presentCount++;
          totalTargetCount++;
        } else if (status === '병결' || status === '개인사' || status === '미인정결') {
          totalTargetCount++;
        }
      });
    });

    const rate = totalTargetCount > 0 ? Math.round((presentCount / totalTargetCount) * 100) : 0;
    return { present: presentCount, total: totalTargetCount, rate };
  }, [filteredStudents, activeTabDay, periods]);

  // 교시별 카운팅 통계
  const periodStats = React.useMemo(() => {
    return periods.map(p => {
      let present = 0;
      let classCount = 0;
      let sick = 0;
      let personal = 0;
      let unauthorized = 0;
      let nonParticipant = 0;
      let unconfirmed = 0;

      filteredStudents.forEach(s => {
        const val = s.attendance[activeTabDay]?.[p] || '미참여일';
        if (val === '출석') present++;
        else if (val === '수업') classCount++;
        else if (val === '병결') sick++;
        else if (val === '개인사') personal++;
        else if (val === '미인정결') unauthorized++;
        else if (val === '미참여일') nonParticipant++;
        else if (val === '미확인') unconfirmed++;
      });

      return {
        periodKey: p,
        periodName: getPeriodLabel(activeTabDay, p),
        total: filteredStudents.length,
        present,
        classCount,
        sick,
        personal,
        unauthorized,
        nonParticipant,
        unconfirmed,
      };
    });
  }, [filteredStudents, activeTabDay, periods]);

  return (
    <div className="space-y-6">
      {/* 1. 요일 통계 일람 패널 */}
      <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-[rgba(255,215,0,0.15)] space-y-3 shadow-xl">
        <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between border-b border-zinc-800 pb-2">
          <span className="flex items-center space-x-1.5">
            <span className="w-1.5 h-3 bg-[var(--color-point-yellow)] rounded-full inline-block" />
            <span className="font-bold text-white text-xs">{activeTabDay}요일 통계 일람 ({dateMap[activeTabDay]})</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {selectedClassroom === '전체' ? '전체 교실 기준' : `${selectedClassroom} 기준`}
          </span>
        </label>
        
        <div className="flex flex-col md:flex-row items-center gap-6 pt-1">
          {/* 전체 출석률 원그래프 (SVG) */}
          <div className="flex flex-col items-center justify-center bg-zinc-900/60 p-4.5 rounded-xl border border-zinc-850 min-w-[150px] shrink-0">
            <span className="text-[10px] text-zinc-400 font-bold mb-3">일간 전체 출석률</span>
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  className="stroke-zinc-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  className="stroke-[var(--color-point-yellow)] transition-all duration-500 ease-out"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 - (dayStats.rate / 100) * (2 * Math.PI * 38)}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.2))' }}
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-base font-bold font-mono text-white">
                  {dayStats.rate}%
                </div>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-zinc-500 font-semibold text-center font-mono">
              출석 {dayStats.present} / 대상 {dayStats.total}
            </div>
          </div>

          {/* 교시별 상세 카운팅 */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${periods.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-3.5 flex-1 w-full`}>
            {periodStats.map((stat, sIdx) => (
              <div key={sIdx} className="bg-zinc-900/40 border border-zinc-800/85 rounded-xl p-3 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-[var(--color-point-yellow)] rounded-full inline-block" />
                    <span>{stat.periodName}</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono font-medium">
                    총원 {stat.total}명
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-medium text-zinc-400 pt-0.5">
                  <div className="flex justify-between items-center">
                    <span>출석</span>
                    <span className="text-[var(--color-point-yellow)] font-bold font-mono">{stat.present}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">미확인</span>
                    <span className="text-amber-400/90 font-bold font-mono">{stat.unconfirmed}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>수업</span>
                    <span className="text-blue-400 font-bold font-mono">{stat.classCount}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>병결</span>
                    <span className="text-orange-400 font-bold font-mono">{stat.sick}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>개인사</span>
                    <span className="text-purple-400 font-bold font-mono">{stat.personal}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">미인정결</span>
                    <span className="text-rose-500 font-bold font-mono">{stat.unauthorized}명</span>
                  </div>
                  <div className="flex justify-between items-center col-span-2 border-t border-zinc-800/60 pt-0.5">
                    <span className="text-zinc-500">미참여</span>
                    <span className="text-zinc-400 font-mono">{stat.nonParticipant}명</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 출석부 요일 선택 (월~토 6개 요일 탭) */}
      <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[rgba(255,215,0,0.12)]">
        <div className="text-[11px] font-bold text-zinc-400 flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-point-yellow)]" />
            <span>출석부 요일 선택</span>
            <span className="text-zinc-500 font-mono text-[10.5px]">({dateMap['월']} ~ {dateMap['토']})</span>
          </span>
          <span className="text-[10px] text-emerald-400/90 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/30 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            <span>매주 월요일 자동 리셋 & 이전 주 누적 보존</span>
          </span>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {DAYS.map((day) => {
            const isSelected = activeTabDay === day;
            const isSaturday = day === '토';
            return (
              <button
                key={day}
                onClick={() => setActiveTabDay(day)}
                className={`py-3 px-2 rounded-xl text-center transition-all cursor-pointer border ${
                  isSelected
                    ? isSaturday
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)] font-bold'
                      : 'bg-[rgba(255,215,0,0.12)] border-[var(--color-point-yellow)] text-white shadow-[0_0_12px_rgba(255,215,0,0.1)] font-bold'
                    : isSaturday
                    ? 'bg-zinc-900/80 hover:bg-zinc-850 border-amber-900/40 text-amber-400/80 hover:text-amber-300'
                    : 'bg-zinc-900/60 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="block text-sm font-bold">{day}요일</span>
                <span className="block text-[9.5px] font-mono mt-1 opacity-75 tracking-tight">
                  {dateMap[day]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 토요일 편성 안내 배너 */}
      {activeTabDay === '토' && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 flex items-start space-x-3 text-amber-200 text-xs shadow-lg">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <strong className="text-amber-300 font-bold text-sm">토요일 자율학습 편성 (총 {roomCounts['전체']}명 배정)</strong>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                토요 4교시 체제
              </span>
            </div>
            <p className="text-zinc-300 text-xs leading-relaxed">
              토요일은 <strong className="text-amber-300">3-3실({roomCounts['3-3']}명)</strong>, <strong className="text-amber-300">3-4실({roomCounts['3-4']}명)</strong>, <strong className="text-purple-300">셀터디실({roomCounts['셀터디']}명)</strong> 총 3개실로 통합 운영됩니다. (평일 3-2실 학생은 3-3실로 일괄 편성)
            </p>
          </div>
        </div>
      )}

      {/* 3. 자습 교실 선택 */}
      <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[rgba(255,215,0,0.12)] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-[var(--color-point-yellow)]" />
            <span>자습 교실 선택 {activeTabDay === '토' && <strong className="text-amber-400 text-[10px]">(토요일 자습실 편성 기준)</strong>}</span>
          </label>
          
          {/* 경고 학생 필터 */}
          <button
            onClick={() => setWarningOnlyFilter(!warningOnlyFilter)}
            className={`px-3 py-1 rounded-lg text-[10.5px] font-semibold border transition cursor-pointer ${
              warningOnlyFilter
                ? 'bg-red-950/45 text-red-400 border-red-500/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            ⚠️ 경고 대상자만 필터링
          </button>
        </div>

        {/* 교실 버튼 그룹 (토요일: 전체, 3-3, 3-4, 셀터디 4개실만 표시 / 평일: 6개실) */}
        {(() => {
          const availableRooms: ('전체' | '3-1' | '3-2' | '3-3' | '3-4' | '셀터디')[] = 
            activeTabDay === '토' 
              ? ['전체', '3-3', '3-4', '셀터디'] 
              : ['전체', '3-1', '3-2', '3-3', '3-4', '셀터디'];

          const gridColsClass = activeTabDay === '토' ? 'grid-cols-4' : 'grid-cols-6';

          return (
            <div className={`bg-zinc-900/80 p-0.5 sm:p-1 rounded-xl border border-zinc-850 grid ${gridColsClass} gap-0.5 sm:gap-1.5`}>
              {availableRooms.map((room) => {
                const isSelected = selectedClassroom === room;
                const count = roomCounts[room] || 0;

                return (
                  <button
                    key={room}
                    onClick={() => setSelectedClassroom(room)}
                    className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-[var(--color-point-yellow)] text-black shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span>{room}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${
                      isSelected 
                        ? 'bg-black/20 text-black font-extrabold' 
                        : 'text-zinc-400'
                    }`}>
                      {count}명
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* 4. 검색바 및 기능 도구창 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-850">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="학번 또는 학생 이름 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1E1E1E] text-white pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-800 focus:outline-none focus:border-[var(--color-point-yellow)]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-zinc-500 text-xs font-semibold">
            조회: <strong className="text-[var(--color-point-yellow)] font-mono">{filteredStudents.length}</strong>명
          </span>

          {/* 선택 요일 일괄 출석 처리 버튼 */}
          <button
            onClick={() => {
              if (confirm(`현재 조회된 ${filteredStudents.length}명의 ${activeTabDay}요일 미확인/참여 교시를 전원 '출석'으로 일괄 변경하시겠습니까?`)) {
                batchMarkAttendance(activeTabDay, '출석');
              }
            }}
            className="px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/40 text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            ✓ {activeTabDay}요일 전원 출석
          </button>
          
          {/* 학생 수동 등록 모달 트리거 */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-[var(--color-point-yellow)] hover:bg-[#E6C200] text-black rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>학생 수동 등록</span>
          </button>
        </div>
      </div>

      {/* 5. 자율학습명단 메인 리스트 보드 */}
      <div className="bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.12)] overflow-hidden shadow-xl">
        <div className="px-3 sm:px-6 py-3 sm:py-4.5 border-b border-zinc-800 bg-[#262626]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white flex items-center flex-wrap gap-1 sm:gap-2">
            <span className="w-1.5 h-3.5 bg-[var(--color-point-yellow)] rounded-full" />
            <span>자율학습명단</span>
            <span className="text-[11px] text-zinc-400">[{activeTabDay}요일 기준 배정 명부]</span>
            {activeTabDay === '토' && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                토요 자습 편성 적용
              </span>
            )}
          </h3>
          
          <span className="text-[10px] sm:text-[10.5px] text-zinc-400 bg-zinc-900 px-2 py-1 rounded-md font-medium border border-zinc-800 self-start sm:self-auto">
            💡 교시 버튼을 클릭하면 상태가 순환 변경됩니다
          </span>
        </div>

        {/* 대장 테이블 영역 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#262626]/40 border-b border-zinc-800 text-[10px] sm:text-[11px] font-bold text-zinc-400 leading-none">
                <th className="py-2.5 sm:py-4 px-2 sm:px-5 whitespace-nowrap">자습실</th>
                <th className="py-2.5 sm:py-4 px-1.5 sm:px-3 whitespace-nowrap">학번</th>
                <th className="py-2.5 sm:py-4 px-1.5 sm:px-4 whitespace-nowrap">이름</th>
                {periods.map(p => (
                  <th key={p} className="py-2.5 sm:py-4 px-1.5 sm:px-3 text-center whitespace-nowrap">
                    {getPeriodLabel(activeTabDay, p)}
                  </th>
                ))}
                <th className="py-2.5 sm:py-4 px-2 sm:px-4 text-right whitespace-nowrap">관리 제어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={periods.length + 4} className="py-12 text-center text-zinc-500 font-medium">
                    <AlertTriangle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <span>일치하는 자율학습 학생 데이터가 존재하지 않습니다.</span>
                    {activeTabDay === '토' ? (
                      <p className="text-[11px] text-zinc-400 mt-1">
                        (토요일 1~4교시 전체 미참여 학생은 토요일 명단에서 자동 제외됩니다)
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-400 mt-1">
                        (평일 월~금 전체 미참여 학생은 평일 명단에서 자동 제외됩니다)
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const hasWarning = student.isWarning;
                  const roomForDay = getStudentRoomForDay(student, activeTabDay);
                  const earlyLeaveText = getStudentEarlyLeaveText(student, activeTabDay);

                  return (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-zinc-900/70 transition-all ${
                        hasWarning ? 'bg-red-950/10 border-l-2 border-l-red-500' : ''
                      }`}
                    >
                      {/* 배정 자습실 */}
                      <td className="py-2 sm:py-3 px-2 sm:px-5 whitespace-nowrap">
                        <span className="flex items-center space-x-1 sm:space-x-1.5">
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9.5px] sm:text-[10px] font-bold font-mono ${
                            roomForDay === '셀터디' 
                              ? 'bg-purple-950/45 text-purple-400 border border-purple-800/30'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700/50'
                          }`}>
                            {roomForDay}
                          </span>

                          {hasWarning && (
                            <span className="flex items-center space-x-0.5 bg-red-950 text-red-400 border border-red-900/50 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[9.5px] font-bold animate-pulse" title="경고 대상자">
                              <span>⚠️</span>
                              <span className="hidden sm:inline">경고</span>
                            </span>
                          )}
                        </span>
                      </td>

                      {/* 학번 */}
                      <td className="py-2 sm:py-3 px-1.5 sm:px-3 font-mono font-semibold text-zinc-500 text-[10.5px] sm:text-xs whitespace-nowrap">
                        {student.studentId}
                      </td>

                      {/* 이름 + 조기 하교 표시 */}
                      <td className="py-2 sm:py-3 px-1.5 sm:px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <button
                            onClick={() => openStudentDetail(student)}
                            className="font-bold text-white hover:text-[var(--color-point-yellow)] transition hover:underline cursor-pointer text-left focus:outline-none text-[11px] sm:text-xs whitespace-nowrap inline-block"
                          >
                            {student.name}
                          </button>

                          {/* 21:20 조기 하교 대상자 표시 */}
                          {earlyLeaveText && (
                            <span 
                              className="inline-flex items-center space-x-1 text-[9.5px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/50 px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap"
                              title={`${earlyLeaveText} 대상자`}
                            >
                              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>({earlyLeaveText})</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 각 교시 출석 상태 블록 */}
                      {periods.map(p => {
                        const status = student.attendance[activeTabDay]?.[p] || '미참여일';
                        return (
                          <td key={p} className="py-2 sm:py-3 px-1.5 sm:px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => handlePeriodClick(student.id, activeTabDay, p)}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-bold tracking-tight inline-block cursor-pointer transition focus:scale-95 whitespace-nowrap ${getStatusBadgeStyle(
                                status
                              )}`}
                            >
                              {status}
                            </button>
                          </td>
                        );
                      })}

                      {/* 관리 제어 */}
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-1.5">
                          <button
                            onClick={() => openStudentDetail(student)}
                            className="p-1 sm:p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded hover:text-white transition cursor-pointer"
                            title="상세 조회"
                          >
                            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id, student.name)}
                            className="p-1 sm:p-1.5 bg-red-950/45 hover:bg-red-950 border border-red-900/30 text-red-400 rounded transition cursor-pointer"
                            title="학생 삭제"
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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

        {/* 하단 요일 출석부 퀵 요약 */}
        <div className="bg-[#262626]/20 p-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-1 text-zinc-400">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>
              {selectedClassroom} 자습실 {activeTabDay}요일 일간 출석률:
            </span>
            <strong className="text-white font-bold ml-1 font-mono">{dayStats.rate}%</strong>
          </div>
          
          <span className="text-zinc-500 font-medium">
            * 전체 {activeStudentsCount}명 명단 / {activeTabDay}요일 현재 참여 학생 {filteredStudents.length}명
          </span>
        </div>
      </div>
    </div>
  );
};
