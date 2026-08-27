import React from 'react';
import { motion } from 'motion/react';
import { User, X, AlertTriangle, CheckCircle, Save, Clock } from 'lucide-react';
import { Student, DayOfWeek, AttendanceHistoryItem, AttendanceStatus } from '../types';
import { createDefaultAttendance } from '../data';
import { DAYS, getPeriodsForDay, getPeriodLabel, getStudentEarlyLeaveText } from '../utils/attendanceUtils';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudent: Student | null;
  detailWarningReason: string;
  setDetailWarningReason: (reason: string) => void;
  detailIsWarning: boolean;
  setDetailIsWarning: (isWarning: boolean) => void;
  onSave: () => void;
  dateMap: Record<DayOfWeek, string>;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  selectedStudent,
  detailWarningReason,
  setDetailWarningReason,
  detailIsWarning,
  setDetailIsWarning,
  onSave,
  dateMap,
}) => {
  if (!isOpen || !selectedStudent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 focus:outline-none" id="detail-modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.25)] shadow-2xl overflow-hidden"
        id="student-detail-modal"
      >
        {/* 모달 헤더 */}
        <div className="px-6 py-4.5 bg-[#262626] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-[var(--color-point-yellow)]" />
            <h3 className="text-sm font-bold text-white">학생 상세정보 조회</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* 1. 기본 인적 정보 */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 font-semibold text-[11px]">성명</span>
              <strong className="text-white text-sm">{selectedStudent.name}</strong>
            </div>
            <div className="flex justify-between text-xs border-t border-zinc-800/60 pt-2">
              <span className="text-zinc-500 font-semibold text-[11px]">학번</span>
              <strong className="text-white font-mono text-sm">{selectedStudent.studentId}</strong>
            </div>
            <div className="flex justify-between text-xs border-t border-zinc-800/60 pt-2">
              <span className="text-zinc-500 font-semibold text-[11px]">평일 자습실</span>
              <strong className="text-white text-sm">{selectedStudent.classroom}</strong>
            </div>
            {selectedStudent.saturdayClassroom && (
              <div className="flex justify-between text-xs border-t border-zinc-800/60 pt-2">
                <span className="text-zinc-500 font-semibold text-[11px]">토요일 자습실</span>
                <strong className="text-amber-400 text-sm font-bold">{selectedStudent.saturdayClassroom}</strong>
              </div>
            )}
            {getStudentEarlyLeaveText(selectedStudent, '월') && (
              <div className="flex justify-between text-xs border-t border-zinc-800/60 pt-2 items-center">
                <span className="text-zinc-500 font-semibold text-[11px]">하교 시간 안내</span>
                <span className="inline-flex items-center space-x-1 text-amber-300 font-bold bg-amber-950/50 border border-amber-500/40 px-2 py-0.5 rounded-md text-xs">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>21:20 조기 하교 대상자</span>
                </span>
              </div>
            )}
            {selectedStudent.notes && (
              <div className="flex justify-between text-xs border-t border-zinc-800/60 pt-2">
                <span className="text-zinc-500 font-semibold text-[11px]">비고</span>
                <span className="text-zinc-300 text-xs">{selectedStudent.notes}</span>
              </div>
            )}
            
            {/* 요일별 기본 상태 */}
            <div className="flex justify-between text-xs border-t border-zinc-800/60 pt-2 items-start">
              <span className="text-zinc-500 font-semibold text-[11px] mt-1">자율학습 참여 형태</span>
              <div className="flex flex-wrap gap-1 max-w-[280px] justify-end">
                {DAYS.map(d => {
                  const hasSettings = selectedStudent.fixedSettings || selectedStudent.attendance || createDefaultAttendance();
                  const pList = getPeriodsForDay(d);
                  return pList.map((p) => {
                    const status = hasSettings[d]?.[p] || '미참여일';
                    const isNonParticipant = status === '미참여일';
                    const pName = getPeriodLabel(d, p);
                    const label = `${d}(${pName})`;
                    return (
                      <span 
                        key={`${d}-${p}`} 
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isNonParticipant 
                            ? 'bg-zinc-800 text-zinc-500 line-through' 
                            : 'bg-[rgba(255,215,0,0.12)] text-[var(--color-point-yellow)]'
                        }`}
                      >
                        {label}
                      </span>
                    );
                  });
                })}
              </div>
            </div>
          </div>

          {/* 2. 옐로우 카드 표시 활성화 */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
                <span>교사 보증 옐로우카드 (경고 대상자 지정)</span>
              </label>
              
              <button
                type="button"
                onClick={() => setDetailIsWarning(!detailIsWarning)}
                className={`relative inline-flex h-5.5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  detailIsWarning ? 'bg-rose-600' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    detailIsWarning ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 경고사유 입력 폼 */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">상세 경고사유 작성란</span>
              <textarea
                placeholder="학부모 연계 통보용 경고 사유 입력 (예: 반복 무단 2교시 비참여)..."
                value={detailWarningReason}
                onChange={(e) => setDetailWarningReason(e.target.value)}
                disabled={!detailIsWarning}
                className="w-full bg-[#1E1E1E] text-white text-xs p-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-rose-500 disabled:opacity-50 min-h-[60px]"
              />
            </div>
          </div>

          {/* 3. 누적 자습 출석 이력 */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>누적 자습 출석 이력 (이전 주차 및 현재 주차 기록 일람)</span>
              </span>
            </label>
            
            {(() => {
              const currentWeekDlog: AttendanceHistoryItem[] = [];
              DAYS.forEach(day => {
                const pData = selectedStudent.attendance[day];
                if (!pData) return;
                const periods = getPeriodsForDay(day);
                
                periods.forEach(p => {
                  const val = pData[p];
                  if (val && val !== '미확인' && val !== '미참여일') {
                    currentWeekDlog.push({
                      date: dateMap[day],
                      day,
                      period: getPeriodLabel(day, p),
                      status: val
                    });
                  }
                });
              });

              // Combine current week with past archived history (deduplicate)
              const allHistory = [
                ...currentWeekDlog,
                ...(selectedStudent.attendanceHistory || [])
              ].filter((v, i, a) => a.findIndex(h => h.date === v.date && h.period === v.period) === i);

              // Calculate metrics
              let presentCount = 0;
              let absentCount = 0;
              let classCount = 0;

              allHistory.forEach(h => {
                if (h.status === '출석') presentCount++;
                else if (h.status === '병결' || h.status === '개인사' || h.status === '미인정결') absentCount++;
                else if (h.status === '수업') classCount++;
              });

              const totalChecked = presentCount + absentCount;
              const rate = totalChecked > 0 ? Math.round((presentCount / totalChecked) * 100) : null;

              const normalizeForSort = (dStr: string) => {
                if (!dStr) return '';
                const parts = dStr.split('.');
                if (parts.length === 3) {
                  const year = parts[0].length === 2 ? '20' + parts[0] : parts[0];
                  const month = parts[1].padStart(2, '0');
                  const day = parts[2].padStart(2, '0');
                  return `${year}.${month}.${day}`;
                }
                return dStr;
              };

              const sortedHistory = allHistory.sort((a, b) => normalizeForSort(b.date).localeCompare(normalizeForSort(a.date)));

              const getBadge = (status: AttendanceStatus) => {
                switch (status) {
                  case '출석':
                    return <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 rounded text-[9.5px] font-bold border border-emerald-800/40">출석</span>;
                  case '수업':
                    return <span className="px-2 py-0.5 bg-blue-950/60 text-blue-400 rounded text-[9.5px] font-bold border border-blue-800/40">수업</span>;
                  case '병결':
                    return <span className="px-2 py-0.5 bg-orange-950/60 text-orange-400 rounded text-[9.5px] font-bold border border-orange-800/40">병결</span>;
                  case '개인사':
                    return <span className="px-2 py-0.5 bg-purple-950/60 text-purple-400 rounded text-[9.5px] font-bold border border-purple-800/40">개인사</span>;
                  case '미인정결':
                    return <span className="px-2 py-0.5 bg-rose-950/60 text-rose-400 rounded text-[9.5px] font-bold border border-rose-800/40">미인정</span>;
                  default:
                    return <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9.5px] font-bold">{status}</span>;
                }
              };

              return (
                <div className="space-y-2">
                  {/* 누적 통계 요약 바 */}
                  <div className="grid grid-cols-4 gap-2 bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-zinc-400">누적 출석률</div>
                      <div className="font-bold text-[var(--color-point-yellow)] font-mono text-sm">{rate !== null ? `${rate}%` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400">출석 인정</div>
                      <div className="font-bold text-emerald-400 font-mono text-sm">{presentCount}회</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400">결석(사유/미인정)</div>
                      <div className="font-bold text-orange-400 font-mono text-sm">{absentCount}회</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400">수업(제외)</div>
                      <div className="font-bold text-blue-400 font-mono text-sm">{classCount}회</div>
                    </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl max-h-[160px] overflow-y-auto space-y-1.5">
                    {sortedHistory.length === 0 ? (
                      <div className="text-center py-4 text-zinc-500 text-xs">
                        체크 완료된 출석 기록이 존재하지 않습니다.
                      </div>
                    ) : (
                      sortedHistory.map((hist, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] bg-zinc-850 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                          <span className="font-mono text-zinc-400">{hist.date} ({hist.day})</span>
                          <span className="font-semibold text-zinc-300">{hist.period}</span>
                          {getBadge(hist.status)}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-4 bg-[#262626] border-t border-zinc-800 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            닫기
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-[var(--color-point-yellow)] hover:bg-[#E6C200] text-black rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>설정 저장</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
