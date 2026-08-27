import React from 'react';
import { Sliders, Filter, RefreshCw, Calendar, Archive, CheckCircle2 } from 'lucide-react';
import { Student, Classroom, DayOfWeek, AttendanceStatus } from '../types';
import { createDefaultAttendance } from '../data';
import { STATUS_CYCLE, getSelectStyle, getPeriodsForDay, getPeriodLabel, DAYS } from '../utils/attendanceUtils';

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
  forceResetAllToFixed: () => void;
  resetAllFixedSettings: () => void;
  restoreFromInitialRoster: () => void;
  handleManualWeekRollover: () => void;
  currentWeekMonday: string;
  lastArchivedWeekMonday?: string;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  students,
  selectedClassroom,
  setSelectedClassroom,
  filteredStudents,
  handleFixedSettingChange,
  handleSaturdayClassroomChange,
  forceResetAllToFixed,
  resetAllFixedSettings,
  restoreFromInitialRoster,
  handleManualWeekRollover,
  currentWeekMonday,
  lastArchivedWeekMonday,
  showToast,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. 주간 출석 마감 & 누적 관리 카드 */}
      <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-emerald-500/20 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-white text-sm">주간 출석 자동 갱신 및 누적 아카이빙 현황</h4>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 rounded-lg font-mono font-medium">
              현재 활성 주차 시작일: {currentWeekMonday} (월)
            </span>
            {lastArchivedWeekMonday && (
              <span className="px-2.5 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-lg font-mono">
                최근 누적 마감 주차: {lastArchivedWeekMonday}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-zinc-400 text-xs leading-relaxed">
            • <strong className="text-emerald-400">매주 월요일 자동 갱신</strong>: 매주 월요일이 되면 지난 주 출석 기록이 학생별 <strong className="text-white">누적 이력</strong>에 안전하게 보존되고, 이번 주 출석부가 '미확인'으로 자동 초기화됩니다.<br />
            • 필요 시 아래 <strong className="text-amber-400">수동 마감</strong> 버튼을 클릭하여 언제든 현재 주차 기록을 즉시 누적 저장하고 새 주차로 시작할 수 있습니다.
          </p>

          <button
            onClick={handleManualWeekRollover}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shrink-0 shadow-lg"
          >
            <Archive className="w-4 h-4" />
            <span>이번 주 출석 수동 마감 & 새 주차 시작</span>
          </button>
        </div>
      </div>

      {/* 2. 관리자 공지 및 제어 허브 */}
      <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-3">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-[var(--color-point-yellow)]" />
          <h4 className="font-bold text-white text-sm">자율학습 참여 기본 고정값 환경 세팅 및 명단 관리</h4>
        </div>
        <p className="text-zinc-400 text-xs leading-relaxed">
          학생들이 특정 요일에 수능 수업, 모의면접, 학업상 하차 미참여가 확정되어 있는 경우 (예: 방과후 "수업", 1~2교시 "미참여일"),<br />
          이곳에서 <strong className="text-white">학생별 기본 설정</strong> 및 <strong className="text-amber-400">토요일 자습교실</strong>을 설정하십시오.
          해당 설정은 출석부에 즉시 연계 반영되며, 매주 초기화 시 복원 기준값이 됩니다.
        </p>

        <div className="pt-2 flex flex-wrap gap-2">
          <button
            onClick={restoreFromInitialRoster}
            className="px-4 py-2 bg-[var(--color-point-yellow)] hover:bg-[#E6C200] text-black rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>스프레드시트 47명 최신 편성표 원본으로 재동기화</span>
          </button>
          <button
            onClick={forceResetAllToFixed}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-bold transition border border-zinc-700 cursor-pointer"
          >
            🔄 지금 즉시 현재 고정값에 전체 동기화
          </button>
          <button
            onClick={resetAllFixedSettings}
            className="px-4 py-2 bg-red-950/20 hover:bg-red-950/45 text-red-400 rounded-xl text-xs font-bold transition border border-red-900/30 cursor-pointer"
          >
            ⚠️ 기본 고정값 전원 초기화
          </button>
        </div>
      </div>

      {/* 2. 자습 교실 필터 단말 */}
      <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[rgba(255,215,0,0.12)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-[var(--color-point-yellow)]" />
            <span className="text-xs font-bold text-white">필터 설정 대상실 (평일 기준)</span>
          </div>
          <div className="bg-zinc-900 p-1 rounded-xl flex gap-1 w-full sm:w-auto">
            {(['전체', '3-2', '3-3', '3-4', '셀터디'] as const).map((r) => {
              const count = r === '전체' 
                ? students.filter(s => !s.isDeleted).length 
                : students.filter(s => !s.isDeleted && s.classroom === r).length;
              return (
                <button
                  key={r}
                  onClick={() => setSelectedClassroom(r)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                    selectedClassroom === r ? 'bg-[var(--color-point-yellow)] text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{r}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 개별 고정값 입력 제어 시트 */}
      <div className="bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.12)] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#262626]/30 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">기본값 및 토요일 자습실 설정</h3>
          <span className="text-xs text-zinc-500 font-mono">총 {filteredStudents.length}명 표시</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#262626]/40 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 leading-none">
                <th className="py-4 px-3 sticky left-0 bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">평일실</th>
                <th className="py-4 px-3 sticky left-[55px] bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] text-amber-400">토요실</th>
                <th className="py-4 px-3 sticky left-[125px] bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">학번</th>
                <th className="py-4 px-3 sticky left-[180px] bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] border-r-2 border-zinc-700/80">이름</th>
                
                {/* 월 */}
                <th className="py-4 px-1 text-center text-zinc-300">월_방</th>
                <th className="py-4 px-1 text-center text-zinc-300">월_1</th>
                <th className="py-4 px-1 text-center text-zinc-300 border-r-2 border-zinc-700/80">월_2</th>
                
                {/* 화 */}
                <th className="py-4 px-1 text-center text-zinc-300">화_방</th>
                <th className="py-4 px-1 text-center text-zinc-300">화_1</th>
                <th className="py-4 px-1 text-center text-zinc-300 border-r-2 border-zinc-700/80">화_2</th>
                
                {/* 수 */}
                <th className="py-4 px-1 text-center text-zinc-300">수_방</th>
                <th className="py-4 px-1 text-center text-zinc-300">수_1</th>
                <th className="py-4 px-1 text-center text-zinc-300 border-r-2 border-zinc-700/80">수_2</th>
                
                {/* 목 */}
                <th className="py-4 px-1 text-center text-zinc-300">목_방</th>
                <th className="py-4 px-1 text-center text-zinc-300">목_1</th>
                <th className="py-4 px-1 text-center text-zinc-300 border-r-2 border-zinc-700/80">목_2</th>
                
                {/* 금 */}
                <th className="py-4 px-1 text-center text-zinc-300">금_방</th>
                <th className="py-4 px-1 text-center text-zinc-300">금_1</th>
                <th className="py-4 px-1 text-center text-zinc-300 border-r-2 border-zinc-700/80">금_2</th>

                {/* 토 */}
                <th className="py-4 px-1 text-center text-amber-300 bg-amber-950/10">토_오전1</th>
                <th className="py-4 px-1 text-center text-amber-300 bg-amber-950/10">토_오전2</th>
                <th className="py-4 px-1 text-center text-amber-300 bg-amber-950/10">토_오후3</th>
                <th className="py-4 px-1 text-center text-amber-300 bg-amber-950/10">토_오후4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs font-mono">
              {filteredStudents.map((student) => {
                const currentFixed = student.fixedSettings || student.attendance || createDefaultAttendance();
                
                return (
                  <tr key={student.id} className="hover:bg-zinc-900/60">
                    {/* 평일 자습실 */}
                    <td className="py-3 px-2 sticky left-0 bg-[#1E1E1E]/95 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 whitespace-nowrap">
                        {student.classroom}
                      </span>
                    </td>

                    {/* 토요일 자습실 선택 */}
                    <td className="py-3 px-2 sticky left-[55px] bg-[#1E1E1E]/95 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                      <select
                        value={student.saturdayClassroom || student.classroom}
                        onChange={(e) => {
                          handleSaturdayClassroomChange(student.id, e.target.value as Classroom);
                          showToast(`${student.name} 토요일 자습실이 [${e.target.value}]로 변경되었습니다.`, 'success');
                        }}
                        className="bg-amber-950/30 text-amber-300 border border-amber-800/40 text-[10px] rounded px-1 py-0.5 focus:outline-none focus:border-amber-400 font-bold"
                      >
                        <option value="3-2">3-2</option>
                        <option value="3-3">3-3</option>
                        <option value="3-4">3-4</option>
                        <option value="셀터디">셀터디</option>
                      </select>
                    </td>

                    {/* 학번 & 이름 */}
                    <td className="py-3 px-2 sticky left-[125px] bg-[#1E1E1E]/95 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] text-zinc-400 font-semibold text-[11px]">{student.studentId}</td>
                    <td className="py-3 px-2 sticky left-[180px] bg-[#1E1E1E]/95 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] font-bold text-white whitespace-nowrap border-r-2 border-zinc-700/80 text-[11px]">{student.name}</td>
                    
                    {/* 월~금 교시별 설정 */}
                    {(['월', '화', '수', '목', '금'] as DayOfWeek[]).map((day) => {
                      const pList: ('p1' | 'p2' | 'p3')[] = ['p1', 'p2', 'p3'];
                      return pList.map((p, pIdx) => {
                        const isLastInDay = pIdx === pList.length - 1;
                        const val = currentFixed[day]?.[p] || '미참여일';
                        return (
                          <td 
                            key={`${day}-${p}`} 
                            className={`py-3 px-0.5 text-center ${isLastInDay ? 'border-r-2 border-zinc-700/60' : ''}`}
                          >
                            <select
                              className={`text-[9.5px] px-1 py-0.8 rounded border focus:outline-none focus:border-amber-400 w-[62px] transition ${getSelectStyle(val)}`}
                              value={val}
                              onChange={(e) => {
                                handleFixedSettingChange(student.id, day, p, e.target.value as AttendanceStatus);
                                showToast(`${student.name} ${day}(${getPeriodLabel(day, p)}) 설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                              }}
                            >
                              {STATUS_CYCLE.map((s) => (
                                <option key={s} value={s} className="bg-zinc-900 text-white font-medium">{s}</option>
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
                            className={`text-[9.5px] px-1 py-0.8 rounded border focus:outline-none focus:border-amber-400 w-[62px] transition ${getSelectStyle(val)}`}
                            value={val}
                            onChange={(e) => {
                              handleFixedSettingChange(student.id, '토', p, e.target.value as AttendanceStatus);
                              showToast(`${student.name} 토(${getPeriodLabel('토', p)}) 설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                            }}
                          >
                            {STATUS_CYCLE.map((s) => (
                              <option key={s} value={s} className="bg-zinc-900 text-white font-medium">{s}</option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
