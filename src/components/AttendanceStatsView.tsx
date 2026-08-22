import React, { useState, useMemo } from 'react';
import { Info, Filter, Clock } from 'lucide-react';
import { Student, Classroom, DayOfWeek } from '../types';
import {
  calculateStudentAttendanceRate,
  getIndividualPeriodRate,
  getPeriodsForDay,
  getPeriodLabel,
  getStudentEarlyLeaveText,
  DAYS
} from '../utils/attendanceUtils';

interface AttendanceStatsViewProps {
  students: Student[];
  selectedClassroom: '전체' | Classroom;
  setSelectedClassroom: (room: '전체' | Classroom) => void;
  dateMap: Record<DayOfWeek, string>;
  openStudentDetail: (student: Student) => void;
}

export const AttendanceStatsView: React.FC<AttendanceStatsViewProps> = ({
  students,
  selectedClassroom,
  setSelectedClassroom,
  dateMap,
  openStudentDetail,
}) => {
  const [statsSortOrder, setStatsSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

  // 교실 필터링
  const classroomFilteredStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedClassroom === '전체') return true;
      return student.classroom === selectedClassroom;
    });
  }, [students, selectedClassroom]);

  // 총 누적 출석률 정렬
  const statsSortedStudents = useMemo(() => {
    const arr = [...classroomFilteredStudents];
    if (statsSortOrder === 'none') {
      return arr.sort((a, b) => a.studentId.localeCompare(b.studentId));
    }
    return arr.sort((a, b) => {
      const rateA = calculateStudentAttendanceRate(a, dateMap) ?? -1;
      const rateB = calculateStudentAttendanceRate(b, dateMap) ?? -1;
      if (statsSortOrder === 'asc') return rateA - rateB;
      return rateB - rateA;
    });
  }, [classroomFilteredStudents, statsSortOrder, dateMap]);

  return (
    <div className="space-y-6">
      {/* 1. 출석률 산정 가이드 패널 */}
      <div className="bg-zinc-900/80 p-4.5 rounded-2xl border border-zinc-800 flex items-start space-x-3.5">
        <Info className="w-5 h-5 text-[var(--color-point-yellow)] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-white">출석률 계산 및 산정 기준</h4>
          <p className="text-zinc-400 leading-relaxed">
            자율학습 총 누적 출석률은 체크된 각 교시를 <strong className="text-white font-bold">1단위</strong>로 환산 정밀 처리합니다.<br />
            <strong className="text-white font-bold">‘고정 수업’ 및 ‘미참여일’</strong>로 지정된 시간은 분모 및 분자 모두에서 <strong className="text-rose-400">완전 제외</strong>되며,
            정당한 사유가 기록되지 않은 <strong className="text-orange-400 font-bold">‘병결’, ‘개인사’, ‘미인정결’, ‘미확인’</strong>에 대해서만 감산 처리됩니다.
          </p>
        </div>
      </div>

      {/* 2. 자습 교실 필터 */}
      <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[rgba(255,215,0,0.12)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-[var(--color-point-yellow)]" />
            <span className="text-xs font-bold text-white">자습실 대조 필터</span>
          </div>
          <div className="bg-zinc-900 p-1 rounded-xl flex gap-1 w-full sm:w-auto">
            {(['전체', '3-1', '3-2', '3-3', '3-4', '셀터디'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedClassroom(r)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedClassroom === r ? 'bg-[var(--color-point-yellow)] text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 종합 누적 출석 통계 그리드 */}
      <div className="bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.12)] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#262626]/30 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
            <span className="w-1.5 h-3.5 bg-[var(--color-point-yellow)] rounded-full" />
            <span>개별 누적 출석 통계 (월~토)</span>
          </h3>
          <span className="text-zinc-500 text-xs font-mono">총 {statsSortedStudents.length}명</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#262626]/40 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 leading-none">
                <th className="py-4 px-3 sticky left-0 bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">학번</th>
                <th className="py-4 px-3 sticky left-[65px] bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">이름</th>
                
                {/* 총 누적률 (정렬 가능) */}
                <th className="py-4 px-3 text-center font-bold text-[var(--color-point-yellow)] bg-[rgba(255,215,0,0.03)] border-r border-zinc-800/80">
                  <button
                    onClick={() => {
                      if (statsSortOrder === 'none') setStatsSortOrder('desc');
                      else if (statsSortOrder === 'desc') setStatsSortOrder('asc');
                      else setStatsSortOrder('none');
                    }}
                    className="inline-flex items-center space-x-1 hover:text-white transition cursor-pointer focus:outline-none"
                  >
                    <span>총 누적률</span>
                    {statsSortOrder === 'none' && <span className="text-[9px] text-zinc-500">↕</span>}
                    {statsSortOrder === 'desc' && <span className="text-[10px] text-[var(--color-point-yellow)]">▼</span>}
                    {statsSortOrder === 'asc' && <span className="text-[10px] text-[var(--color-point-yellow)]">▲</span>}
                  </button>
                </th>
                
                {/* 월요일 */}
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/30">월_방</th>
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/30">월_1</th>
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/80">월_2</th>
                
                {/* 화요일 */}
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/30">화_방</th>
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/30">화_1</th>
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/80">화_2</th>
                
                {/* 수요일 */}
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/30">수_방</th>
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/30">수_1</th>
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/80">수_2</th>
                
                {/* 목요일 */}
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/30">목_방</th>
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/30">목_1</th>
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/80">목_2</th>
                
                {/* 금요일 */}
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/30">금_방</th>
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/30">금_1</th>
                <th className="py-4 px-1.5 text-center border-r border-zinc-800/80">금_2</th>

                {/* 토요일 (오전1, 오전2, 오후3, 오후4) */}
                <th className="py-4 px-1.5 text-center text-amber-400 bg-amber-950/20 border-r border-zinc-800/30">토_오전1</th>
                <th className="py-4 px-1.5 text-center text-amber-400 bg-amber-950/20 border-r border-zinc-800/30">토_오전2</th>
                <th className="py-4 px-1.5 text-center text-amber-400 bg-amber-950/20 border-r border-zinc-800/30">토_오후3</th>
                <th className="py-4 px-1.5 text-center text-amber-400 bg-amber-950/20">토_오후4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs font-mono">
              {statsSortedStudents.map((student) => {
                const totalRate = calculateStudentAttendanceRate(student, dateMap);

                return (
                  <tr 
                    key={student.id} 
                    className={`hover:bg-zinc-900/60 transition duration-150 ${
                      student.isDeleted ? 'opacity-50 text-zinc-500' : ''
                    }`}
                  >
                    {/* 학번 고정 열 */}
                    <td className="py-3 px-3 sticky left-0 bg-[#1E1E1E] font-semibold text-zinc-400 font-mono z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                      {student.studentId}
                    </td>
                    {/* 이름 고정 열 */}
                    <td className="py-3 px-3 sticky left-[65px] bg-[#1E1E1E] font-bold text-white font-sans z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <button
                          onClick={() => openStudentDetail(student)}
                          className="hover:text-[var(--color-point-yellow)] hover:underline text-left cursor-pointer whitespace-nowrap"
                        >
                          {student.name}
                        </button>
                        {getStudentEarlyLeaveText(student, '월') && (
                          <span 
                            className="inline-flex items-center space-x-0.5 text-[9px] text-amber-300 font-normal px-1 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 shrink-0 whitespace-nowrap"
                            title="21:20 조기 하교 대상자"
                          >
                            <Clock className="w-2.5 h-2.5 text-amber-400" />
                            <span>(21:20 하교)</span>
                          </span>
                        )}
                        {student.isDeleted && (
                          <span className="text-[9px] text-rose-400 font-normal px-1 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 shrink-0 select-none">
                            삭제됨
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 총 누적 출석률 */}
                    <td className="py-3 px-3 text-center font-bold bg-[rgba(255,215,0,0.02)] border-r border-zinc-800/80 text-white">
                      {totalRate === null ? (
                        <span className="text-zinc-500 font-normal">-</span>
                      ) : (
                        <span className={totalRate >= 90 ? 'text-emerald-400' : totalRate < 70 ? 'text-rose-400' : 'text-[var(--color-point-yellow)]'}>
                          {totalRate}%
                        </span>
                      )}
                    </td>

                    {/* 월 */}
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px]">{getIndividualPeriodRate(student, '월', 'p1', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px]">{getIndividualPeriodRate(student, '월', 'p2', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/80 text-[11px]">{getIndividualPeriodRate(student, '월', 'p3', dateMap)}</td>

                    {/* 화 */}
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px]">{getIndividualPeriodRate(student, '화', 'p1', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px]">{getIndividualPeriodRate(student, '화', 'p2', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/80 text-[11px]">{getIndividualPeriodRate(student, '화', 'p3', dateMap)}</td>

                    {/* 수 */}
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px]">{getIndividualPeriodRate(student, '수', 'p1', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px]">{getIndividualPeriodRate(student, '수', 'p2', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/80 text-[11px]">{getIndividualPeriodRate(student, '수', 'p3', dateMap)}</td>

                    {/* 목 */}
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px]">{getIndividualPeriodRate(student, '목', 'p1', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px]">{getIndividualPeriodRate(student, '목', 'p2', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/80 text-[11px]">{getIndividualPeriodRate(student, '목', 'p3', dateMap)}</td>

                    {/* 금 */}
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px]">{getIndividualPeriodRate(student, '금', 'p1', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px]">{getIndividualPeriodRate(student, '금', 'p2', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/80 text-[11px]">{getIndividualPeriodRate(student, '금', 'p3', dateMap)}</td>

                    {/* 토 */}
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px] bg-amber-950/10">{getIndividualPeriodRate(student, '토', 'p1', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px] bg-amber-950/10">{getIndividualPeriodRate(student, '토', 'p2', dateMap)}</td>
                    <td className="py-3 px-1 text-center border-r border-zinc-800/30 text-[11px] bg-amber-950/10">{getIndividualPeriodRate(student, '토', 'p3', dateMap)}</td>
                    <td className="py-3 px-1 text-center text-[11px] bg-amber-950/10">{getIndividualPeriodRate(student, '토', 'p4', dateMap)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-[#262626]/20 p-4 border-t border-zinc-800 text-right text-[11px] text-zinc-500 font-semibold">
          * 요일교시별 출석률은 (출석 / (출석+결석))으로 정밀 계산되며 '수업' 및 '미참여일'은 완전 제외됩니다.
        </div>
      </div>
    </div>
  );
};
