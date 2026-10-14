import React from 'react';
import { motion } from 'motion/react';
import { UserPlus, X, Clock, Calendar, Check } from 'lucide-react';
import { Classroom, DayOfWeek } from '../types';
import { DAYS } from '../utils/attendanceUtils';

export interface StudentAddFormData {
  studentId: string;
  name: string;
  participationType: 'both' | 'weekday' | 'saturday';
  classroom: Classroom;
  saturdayClassroom: Classroom;
  enableEarlyLeave: boolean;
  earlyLeaveTime: string;
  earlyLeaveDays: DayOfWeek[];
  notes: string;
}

interface StudentAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  addForm: StudentAddFormData;
  setAddForm: React.Dispatch<React.SetStateAction<StudentAddFormData>>;
  onSubmit: (e: React.FormEvent) => void;
}

export const StudentAddModal: React.FC<StudentAddModalProps> = ({
  isOpen,
  onClose,
  addForm,
  setAddForm,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const toggleEarlyLeaveDay = (day: DayOfWeek) => {
    setAddForm((prev) => {
      const exists = prev.earlyLeaveDays.includes(day);
      const newDays = exists
        ? prev.earlyLeaveDays.filter((d) => d !== day)
        : [...prev.earlyLeaveDays, day];
      return { ...prev, earlyLeaveDays: newDays };
    });
  };

  const selectAllWeekdays = () => {
    setAddForm((prev) => ({
      ...prev,
      earlyLeaveDays: ['월', '화', '수', '목', '금'],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 focus:outline-none overflow-y-auto" id="add-modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.25)] shadow-2xl overflow-hidden my-4"
        id="student-add-modal"
      >
        <div className="px-5 py-4 bg-[#262626] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-[var(--color-point-yellow)]" />
            <h3 className="text-sm font-bold text-white">신규 자율학습 학생 수동 등록</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* 기본 인적사항 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 font-bold block">학번 * (예: 3101)</label>
              <input
                type="text"
                required
                placeholder="예: 3101"
                value={addForm.studentId}
                onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })}
                className="w-full bg-[#262626] text-white text-xs px-3.5 py-2 rounded-xl border border-zinc-750 focus:outline-none focus:border-[var(--color-point-yellow)] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 font-bold block">이름 *</label>
              <input
                type="text"
                required
                placeholder="학생 이름 입력"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full bg-[#262626] text-white text-xs px-3.5 py-2 rounded-xl border border-zinc-750 focus:outline-none focus:border-[var(--color-point-yellow)]"
              />
            </div>
          </div>

          {/* 자습 참여 구분 (평일+토요일 / 평일만 / 토요일만) */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] text-zinc-400 font-bold block flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>자습 참여 일정 구분</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setAddForm({ ...addForm, participationType: 'both' })}
                className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
                  addForm.participationType === 'both'
                    ? 'bg-[var(--color-point-yellow)] text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                평일 + 토요일
              </button>
              <button
                type="button"
                onClick={() => setAddForm({ ...addForm, participationType: 'weekday' })}
                className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
                  addForm.participationType === 'weekday'
                    ? 'bg-[var(--color-point-yellow)] text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                평일만 참여
              </button>
              <button
                type="button"
                onClick={() => setAddForm({ ...addForm, participationType: 'saturday' })}
                className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
                  addForm.participationType === 'saturday'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                토요일만 참여
              </button>
            </div>
          </div>

          {/* 자습실 배정 (평일실 & 토요실) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {addForm.participationType !== 'saturday' && (
              <div className="space-y-1 font-sans">
                <label className="text-[11px] text-zinc-400 font-bold block">평일(월~금) 자습실</label>
                <select
                  value={addForm.classroom}
                  onChange={(e) => setAddForm({ ...addForm, classroom: e.target.value as Classroom })}
                  className="w-full bg-[#262626] text-white text-xs px-3 py-2 rounded-xl border border-zinc-750 focus:outline-none focus:border-[var(--color-point-yellow)]"
                >
                  <option value="3-2">3-2 교실</option>
                  <option value="3-3">3-3 교실</option>
                  <option value="3-4">3-4 교실</option>
                  <option value="셀터디">셀터디 자습실</option>
                </select>
              </div>
            )}

            {addForm.participationType !== 'weekday' && (
              <div className="space-y-1 font-sans">
                <label className="text-[11px] text-amber-300 font-bold block">토요일 자습실</label>
                <select
                  value={addForm.saturdayClassroom}
                  onChange={(e) => setAddForm({ ...addForm, saturdayClassroom: e.target.value as Classroom })}
                  className="w-full bg-[#262626] text-amber-300 text-xs px-3 py-2 rounded-xl border border-amber-800/60 focus:outline-none focus:border-amber-400 font-bold"
                >
                  <option value="3-3">3-3 교실</option>
                  <option value="3-4">3-4 교실</option>
                  <option value="셀터디">셀터디 자습실</option>
                </select>
              </div>
            )}
          </div>

          {/* 조기 하교 설정 (선택사항) */}
          <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addForm.enableEarlyLeave}
                  onChange={(e) => setAddForm({ ...addForm, enableEarlyLeave: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400 bg-zinc-800 border-zinc-700"
                />
                <span className="text-xs font-bold text-zinc-200 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>조기 하교 학생으로 설정</span>
                </span>
              </label>

              {addForm.enableEarlyLeave && (
                <button
                  type="button"
                  onClick={selectAllWeekdays}
                  className="text-[10px] text-amber-400 hover:underline cursor-pointer font-medium"
                >
                  평일 전체(월~금) 선택
                </button>
              )}
            </div>

            {addForm.enableEarlyLeave && (
              <div className="space-y-2.5 pt-1 border-t border-zinc-800">
                {/* 하교 시간대 선택 */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 block">하교 시간대</span>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {['21:20', '21:30', '21:00', '17:00'].map((timePreset) => (
                      <button
                        key={timePreset}
                        type="button"
                        onClick={() => setAddForm({ ...addForm, earlyLeaveTime: timePreset })}
                        className={`px-2.5 py-1 rounded text-[10.5px] font-mono font-bold transition cursor-pointer ${
                          addForm.earlyLeaveTime === timePreset
                            ? 'bg-amber-400 text-black'
                            : 'bg-zinc-800 text-zinc-300 hover:text-white'
                        }`}
                      >
                        {timePreset}
                      </button>
                    ))}
                    <input
                      type="text"
                      placeholder="시간 직접 입력 (예: 21:20)"
                      value={addForm.earlyLeaveTime}
                      onChange={(e) => setAddForm({ ...addForm, earlyLeaveTime: e.target.value })}
                      className="bg-zinc-800 text-white text-xs px-2.5 py-1 rounded border border-zinc-700 focus:outline-none focus:border-amber-400 flex-1 min-w-[120px]"
                    />
                  </div>
                </div>

                {/* 적용 요일 선택 */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 block">적용 요일</span>
                  <div className="grid grid-cols-6 gap-1">
                    {DAYS.map((d) => {
                      const isSelected = addForm.earlyLeaveDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleEarlyLeaveDay(d)}
                          className={`py-1 rounded text-[10.5px] font-bold transition cursor-pointer flex items-center justify-center space-x-0.5 ${
                            isSelected
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                          <span>{d}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 개별 비고 */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-bold block">개별 참고 비고 (선택)</label>
            <input
              type="text"
              placeholder="예: 특이 건강 사유 등..."
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              className="w-full bg-[#262626] text-white text-xs px-3.5 py-2 rounded-xl border border-zinc-750 focus:outline-none focus:border-[var(--color-point-yellow)]"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-point-yellow)] hover:bg-[#E6C200] text-black rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>학생 추가 완료</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

