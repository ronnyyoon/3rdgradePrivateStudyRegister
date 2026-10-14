import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Trash2, X, ShieldAlert, Check } from 'lucide-react';
import { Student, DayOfWeek } from '../types';
import { isSaturdayNonParticipant, isWeekdayNonParticipant } from '../utils/attendanceUtils';

interface StudentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  currentDay: DayOfWeek;
  onRemoveFromSaturdayOnly: (studentId: string) => void;
  onRemoveFromWeekdayOnly: (studentId: string) => void;
  onPermanentDelete: (studentId: string) => void;
}

export const StudentDeleteModal: React.FC<StudentDeleteModalProps> = ({
  isOpen,
  onClose,
  student,
  currentDay,
  onRemoveFromSaturdayOnly,
  onRemoveFromWeekdayOnly,
  onPermanentDelete,
}) => {
  if (!isOpen || !student) return null;

  const isSat = currentDay === '토';
  const hasSaturday = !isSaturdayNonParticipant(student);
  const hasWeekday = !isWeekdayNonParticipant(student);
  const participatesBoth = hasSaturday && hasWeekday;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 focus:outline-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[#1E1E1E] rounded-2xl border border-red-500/30 shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 bg-red-950/40 border-b border-red-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-sm font-bold text-white">
              {student.name} ({student.studentId}) 자습 명단 관리
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* 현 참여 상태 안내 카드 */}
          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-[11px] font-bold">현재 자습 참여 현황:</span>
              <span className="font-mono text-zinc-400">
                평일: {hasWeekday ? `참여 (${student.classroom})` : '미참여'} / 토요: {hasSaturday ? `참여 (${student.saturdayClassroom || student.classroom})` : '미참여'}
              </span>
            </div>

            {isSat && participatesBoth && (
              <div className="bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-lg text-amber-300 space-y-1">
                <p className="font-bold">💡 토요일 자습만 제외할 수 있습니다.</p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  토요일 출석부에서 제외하더라도 <strong className="text-white underline">월~금 평일 자습 명단과 출석 기록은 100% 안전하게 유지</strong>됩니다.
                </p>
              </div>
            )}

            {!isSat && participatesBoth && (
              <div className="bg-blue-950/30 border border-blue-800/40 p-2.5 rounded-lg text-blue-300 space-y-1">
                <p className="font-bold">💡 평일 자습만 제외할 수 있습니다.</p>
                <p className="text-[11px] text-blue-200/80 leading-relaxed">
                  평일 출석부에서 제외하더라도 <strong className="text-white underline">토요일 자습 명단은 유지</strong>됩니다.
                </p>
              </div>
            )}
          </div>

          <p className="text-zinc-400 leading-relaxed">
            원하시는 작업을 선택해 주세요:
          </p>

          {/* 작업 선택 버튼 목록 */}
          <div className="space-y-2 pt-1">
            {/* 1. 토요일 자습에서만 제외 (토요일 탭이거나 토요 참여 중일 때) */}
            {hasSaturday && (
              <button
                type="button"
                onClick={() => {
                  onRemoveFromSaturdayOnly(student.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl font-bold flex items-center justify-between transition cursor-pointer text-left ${
                  isSat
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>토요일 자습에서만 제외</span>
                  </div>
                  <p className={`text-[10px] ${isSat ? 'text-black/80' : 'text-zinc-400'}`}>
                    토요일 출석부에서 빠지고, 월~금 평일 명단은 그대로 유지됩니다.
                  </p>
                </div>
                <span className="text-xs font-mono">→</span>
              </button>
            )}

            {/* 2. 평일(월~금) 자습에서만 제외 (평일 탭이거나 평일 참여 중일 때) */}
            {hasWeekday && (
              <button
                type="button"
                onClick={() => {
                  onRemoveFromWeekdayOnly(student.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl font-bold flex items-center justify-between transition cursor-pointer text-left ${
                  !isSat && participatesBoth
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-blue-300 border border-blue-500/30'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>평일(월~금) 자습에서만 제외</span>
                  </div>
                  <p className={`text-[10px] ${!isSat && participatesBoth ? 'text-black/80' : 'text-zinc-400'}`}>
                    월~금 평일 출석부에서 빠지고, 토요일 명단은 그대로 유지됩니다.
                  </p>
                </div>
                <span className="text-xs font-mono">→</span>
              </button>
            )}

            {/* 3. 전체 명단에서 완전 영구 삭제 */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`[${student.name}] 학생을 전체 자율학습 명단에서 완전히 영구 삭제(제명)하시겠습니까?`)) {
                  onPermanentDelete(student.id);
                  onClose();
                }
              }}
              className="w-full p-3 bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-900/40 rounded-xl font-bold flex items-center justify-between transition cursor-pointer text-left"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  <span>전체 명단에서 완전 영구 삭제</span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  평일과 토요일을 포함하여 데이터베이스에서 영구히 제명합니다.
                </p>
              </div>
              <span className="text-xs font-mono">→</span>
            </button>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              취소
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
