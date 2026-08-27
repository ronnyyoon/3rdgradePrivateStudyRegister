import React from 'react';
import { motion } from 'motion/react';
import { UserPlus, X } from 'lucide-react';
import { Classroom } from '../types';

interface StudentAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  addForm: {
    studentId: string;
    name: string;
    classroom: Classroom;
    notes: string;
  };
  setAddForm: React.Dispatch<React.SetStateAction<{
    studentId: string;
    name: string;
    classroom: Classroom;
    notes: string;
  }>>;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 focus:outline-none" id="add-modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.25)] shadow-2xl overflow-hidden"
        id="student-add-modal"
      >
        <div className="px-6 py-4 bg-[#262626] border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">신규 자율학습 학생 수동 등록</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-bold block uppercase tracking-wider">학번 (예: 3101)</label>
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
            <label className="text-[11px] text-zinc-400 font-bold block uppercase tracking-wider">이름</label>
            <input
              type="text"
              required
              placeholder="학생 이름 입력"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full bg-[#262626] text-white text-xs px-3.5 py-2 rounded-xl border border-zinc-750 focus:outline-none focus:border-[var(--color-point-yellow)]"
            />
          </div>

          <div className="space-y-1 font-sans">
            <label className="text-[11px] text-zinc-400 font-bold block uppercase tracking-wider">배정 자습 교실</label>
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

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-bold block uppercase tracking-wider">개별 참고 비고</label>
            <input
              type="text"
              placeholder="예: 특이 건강 사유 등..."
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              className="w-full bg-[#262626] text-white text-xs px-3.5 py-2 rounded-xl border border-zinc-750 focus:outline-none focus:border-[var(--color-point-yellow)]"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
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
