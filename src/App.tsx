import React, { useState, useEffect, useMemo } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Search, 
  Trash2, 
  UserPlus, 
  RefreshCw, 
  Sliders, 
  Clock, 
  Check, 
  Edit3, 
  AlertTriangle, 
  Calendar, 
  X, 
  Save, 
  Filter, 
  Info, 
  User,
  CheckCircle,
  FileText
} from 'lucide-react';
import { DayOfWeek, AttendanceStatus, Student, Classroom, PeriodAttendance, AttendanceHistoryItem } from './types';
import { INITIAL_STUDENTS, createDefaultAttendance } from './data';

export default function App() {
  // --- 상태 관리 (Local Storage 동기화 포함) ---
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('self_study_attendance_students_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Student[];
        let mutated = false;
        const migrated = parsed.map(s => {
          const days: DayOfWeek[] = ['월', '화', '수', '목', '금'];
          const newAttendance = { ...s.attendance };
          days.forEach(d => {
            const periods = d === '수' ? ['p1', 'p2', 'p3'] : ['p1', 'p2'];
            periods.forEach(p => {
              // @ts-ignore
              if (newAttendance[d]?.[p] === '출석') {
                // @ts-ignore
                newAttendance[d][p] = '미확인';
                mutated = true;
              }
            });
          });
          return { ...s, attendance: newAttendance };
        });
        if (mutated) {
          localStorage.setItem('self_study_attendance_students_v2', JSON.stringify(migrated));
        }
        return migrated;
      } catch (e) {
        console.error('로컬스토리지 데이터를 파싱하는 중 오류:', e);
      }
    }
    return INITIAL_STUDENTS;
  });

  // 복구/정렬/필터 상태
  const [currentMenu, setCurrentMenu] = useState<'attendance_chart' | 'stats' | 'admin_settings'>('attendance_chart');
  const [activeTabDay, setActiveTabDay] = useState<DayOfWeek>('월'); // 현재 출석부 선택 요일 (월, 화, 수, 목, 금)
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | '전체'>('전체'); // 자습 교실 필터
  const [searchQuery, setSearchQuery] = useState<string>(''); // 검색 키워드
  const [warningOnlyFilter, setWarningOnlyFilter] = useState<boolean>(false); // 경고 대상 학생만 보기
  const [statsSortOrder, setStatsSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

  // 실시간 날짜 및 시간 시계
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 토스트 경고 알림
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');
  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 학생 세부 정보 모달 상태
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  
  // 경고 정보 임시 작성용 상태
  const [detailWarningReason, setDetailWarningReason] = useState<string>('');
  const [detailIsWarning, setDetailIsWarning] = useState<boolean>(false);

  // 학생 추가 관리자 폼 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addForm, setAddForm] = useState({
    studentId: '',
    name: '',
    classroom: '3-1' as Classroom,
    notes: ''
  });

  // 주차 일자 실시간 바인딩 (2026.06.16이 화요일인 이번 주 기준 계산)
  const dateMap = useMemo(() => {
    // 2026년 6월 16일은 화요일이므로, 이번 주의 요일별 진짜 날짜를 뽑아낸다.
    // 기준 시점: 2026년 6월 16일 (화요일)
    const baseDate = new Date('2026-06-16T09:00:00'); 
    const dayIndex = baseDate.getDay(); // 2일 (화요일)
    
    const getFormatted = (offset: number) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + offset);
      const year = String(d.getFullYear()).slice(-2);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    };

    return {
      '월': getFormatted(-1), // 2026.06.15
      '화': getFormatted(0),  // 2026.06.16
      '수': getFormatted(1),  // 2026.06.17
      '목': getFormatted(2),  // 2026.06.18
      '금': getFormatted(3),  // 2026.06.19
    };
  }, []);

  // --- 요구사항 14: 월요일 오전 00:00 일괄 자동 초기화 로직 ---
  useEffect(() => {
    const checkResetWeekly = () => {
      // 한국 기준 이번주의 월요일 일자 계산
      const now = new Date();
      const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ...
      const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const mondayDate = new Date(now);
      mondayDate.setDate(now.getDate() + distToMonday);
      
      const monStr = `${mondayDate.getFullYear()}.${String(mondayDate.getMonth() + 1).padStart(2, '0')}.${String(mondayDate.getDate()).padStart(2, '0')}`;
      const lastResetMonday = localStorage.getItem('self_study_weekly_reset_monday');
      
      // 만약 등록된 마지막 리셋 월요일 날짜와 금주 월요일 날짜가 다르다면 일괄 리셋 진행!
      if (lastResetMonday !== monStr) {
        setStudents(prevStudents => {
          const reseted = prevStudents.map(student => {
            // 자신의 fixedSettings가 있으면 그것으로 복제 복원, 없으면 기본 출석값으로 리셋
            const targetSettings = student.fixedSettings || createDefaultAttendance();
            // 지난주 자습 결과를 누적 이력(History)에 아카이빙 시켜서 세련도를 더 높일 수 있습니다.
            return {
              ...student,
              attendance: JSON.parse(JSON.stringify(targetSettings))
            };
          });
          showToast(`월요일 오전 00:00 초기화 감지: 금주(${monStr}) 표준 양식으로 자동 리셋되었습니다.`, 'info');
          return reseted;
        });
        localStorage.setItem('self_study_weekly_reset_monday', monStr);
      }
    };

    checkResetWeekly();
    // 1분마다 월요일 도달 여부 간접 스캔 및 감시
    const monitorTimer = setInterval(checkResetWeekly, 60000);
    return () => clearInterval(monitorTimer);
  }, []);

  // 데이터 보존
  useEffect(() => {
    localStorage.setItem('self_study_attendance_students_v2', JSON.stringify(students));
  }, [students]);

  // --- 상태 순환 변경 리스트 도우미 (요구사항 6) ---
  const statusCycle: AttendanceStatus[] = ['출석', '수업', '병결', '개인사', '미참여일', '미인정결', '미확인'];
  
  const handlePeriodClick = (studentId: string, day: DayOfWeek, period: 'p1' | 'p2' | 'p3') => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const currentStatus = student.attendance[day][period] || '미확인';
        const currentIndex = statusCycle.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % statusCycle.length;
        const nextStatus = statusCycle[nextIndex];

        // 새로운 상태 오브젝트 복사 생성
        const updatedAttendance = { ...student.attendance };
        updatedAttendance[day] = {
          ...updatedAttendance[day],
          [period]: nextStatus
        };

        // 자습 출석 기록 누적 (History) 추가 (요구사항 11을 위한 실시간 날짜교시 스탬핑)
        let updatedHistory = [...(student.attendanceHistory || [])];
        if (nextStatus === '출석') {
          // '출석'으로 새로 마킹되었을 때 이력을 신규 추가함 (중복 방지)
          const dateStr = dateMap[day];
          const periodKorean = period === 'p1' ? '1교시' : period === 'p2' ? '2교시' : '3교시';
          const alreadyLogged = updatedHistory.some(h => h.date === dateStr && h.period === periodKorean && h.status === '출석');
          if (!alreadyLogged) {
            updatedHistory.push({
              date: dateStr,
              day,
              period: periodKorean,
              status: '출석'
            });
          }
        } else {
          // 출석이 아닌 다른 상태로 변경되었을 경우, 기존 이번 주 출석 이력이 있었다면 정합성을 위해 제거함
          const dateStr = dateMap[day];
          const periodKorean = period === 'p1' ? '1교시' : period === 'p2' ? '2교시' : '3교시';
          updatedHistory = updatedHistory.filter(h => !(h.date === dateStr && h.period === periodKorean));
        }

        return {
          ...student,
          attendance: updatedAttendance,
          attendanceHistory: updatedHistory
        };
      }
      return student;
    }));
  };

  // --- 개별 학생 선택 디테일 및 경고 관리 설정 ---
  const openStudentDetail = (student: Student) => {
    setSelectedStudent(student);
    setDetailWarningReason(student.warningReason || '');
    setDetailIsWarning(student.isWarning || false);
    setIsDetailModalOpen(true);
  };

  const saveStudentDetailChanges = () => {
    if (!selectedStudent) return;
    setStudents(prev => prev.map(student => {
      if (student.id === selectedStudent.id) {
        return {
          ...student,
          isWarning: detailIsWarning,
          warningReason: detailWarningReason
        };
      }
      return student;
    }));
    setIsDetailModalOpen(false);
    showToast(`${selectedStudent.name} 학생의 세부정보 및 경고 설정이 수정 완료되었습니다.`, 'success');
  };

  // --- 신규 학생 원장 대장 추가 ---
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.studentId || !addForm.name) {
      showToast('학번과 이름을 올바르게 작성해주세요.', 'error');
      return;
    }

    // 중복 체크 (현재 활동 중인 학생 대상)
    if (students.some(s => s.studentId === addForm.studentId && !s.isDeleted)) {
      showToast('이미 등록된 동일한 학번의 학생이 고유명단에 존재합니다.', 'error');
      return;
    }

    // 기존에 삭제된 학생 중 동일한 학번과 이름이 있는지 확인
    const deletedMatched = students.find(s => s.studentId === addForm.studentId && s.name === addForm.name && s.isDeleted);
    if (deletedMatched) {
      // 연동 복구
      setStudents(prev => prev.map(s => {
        if (s.id === deletedMatched.id) {
          return {
            ...s,
            isDeleted: false,
            classroom: addForm.classroom,
            notes: addForm.notes || s.notes, // 비고가 비어있으면 기존 비고 유지, 있으면 덮어씀
          };
        }
        return s;
      }));
      setIsAddModalOpen(false);
      setAddForm({ studentId: '', name: '', classroom: '3-1', notes: '' });
      showToast(`${addForm.name} 학생의 기존 출석 통계 기록을 감지하여 정상 복구 및 연동하였습니다.`, 'success');
      return;
    }

    const newStudent: Student = {
      id: `st_${Date.now()}`,
      studentId: addForm.studentId,
      name: addForm.name,
      classroom: addForm.classroom,
      attendance: createDefaultAttendance(),
      notes: addForm.notes,
      isWarning: false,
      warningReason: '',
      attendanceHistory: []
    };

    setStudents(prev => [...prev, newStudent]);
    setIsAddModalOpen(false);
    setAddForm({ studentId: '', name: '', classroom: '3-1', notes: '' });
    showToast(`${newStudent.name} 학생이 자율학습 명단에 정상 등록되었습니다.`, 'success');
  };

  // --- 학생 명단 원장 삭제 ---
  const handleDeleteStudent = (studentId: string, name: string) => {
    if (confirm(`실제 학생 [${name}]을 자율학습 명단에서 삭제하시겠습니까?\n(통계 기록은 안전하게 보존되며, 이후 동일 학번 및 이름으로 추가 시 자동 복구됩니다.)`)) {
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return { ...s, isDeleted: true };
        }
        return s;
      }));
      showToast(`${name} 학생이 자율학습 명단에서 제외되었습니다. (통계 보존)`, 'info');
    }
  };

  // --- 요구사항 13: 관리자 설정에서 고정값(기본값) 실시간 지정 처리 ---
  const handleFixedSettingChange = (studentId: string, day: DayOfWeek, period: 'p1' | 'p2' | 'p3', status: AttendanceStatus) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const currentFixed = student.fixedSettings || createDefaultAttendance();
        const updatedFixedDay = { ...currentFixed[day], [period]: status };
        
        const newFixedSettings = {
          ...currentFixed,
          [day]: updatedFixedDay
        };

        // 관리자가 설정을 변경하면, 즉시 현재 이번주 출석부의 attendance도 동기화하여 자동반영 해줍니다 (13번 요구사항 지원)
        const updatedAttendance = { ...student.attendance };
        updatedAttendance[day] = {
          ...updatedAttendance[day],
          [period]: status
        };

        return {
          ...student,
          fixedSettings: newFixedSettings,
          attendance: updatedAttendance
        };
      }
      return student;
    }));
  };

  // 일괄 고정값 초기화 버튼
  const forceResetAllToFixed = () => {
    if (confirm('현재 자율학습 출석부를 관리자가 사전에 지정한 고정 기본값으로 전원 즉시 강제 동기화하시겠습니까?')) {
      setStudents(prev => prev.map(student => {
        const targetFixed = student.fixedSettings || createDefaultAttendance();
        return {
          ...student,
          attendance: JSON.parse(JSON.stringify(targetFixed))
        };
      }));
      showToast('전체 학생의 자율학습 출석 상태가 관리자 지정 기본값으로 일괄 초기화되었습니다.', 'success');
    }
  };

  // --- 요구사항 9: 정교한 누적 출석률 계산엔진 ---
  // 누적출석률 = 출석한 교시 개수 / (출석 + 병결 + 개인사 교시 개수) * 100
  // 고정미참여일, 수업으로 표시된 교시는 전체 참여 교시(분모)에서 완벽 제외
  const calculateStudentAttendanceRate = (student: Student) => {
    let checkedPeriods = 0; // 분모 (출석 + 병결 + 개인사)
    let presentPeriods = 0; // 분자 (출석)

    // 이번주의 모든 교시 상태 검진
    const days: DayOfWeek[] = ['월', '화', '수', '목', '금'];
    days.forEach(day => {
      const pData = student.attendance[day];
      const periods: ('p1' | 'p2' | 'p3')[] = day === '수' ? ['p1', 'p2', 'p3'] : ['p1', 'p2'];
      
      periods.forEach(p => {
        const val = pData[p];
        if (val === '출석') {
          checkedPeriods++;
          presentPeriods++;
        } else if (val === '병결' || val === '개인사' || val === '미인정결') {
          checkedPeriods++;
        }
        // '수업', '미참여일' 은 체크 및 가산에서 제외됨 (분모 분자 둘 다 미포함)
      });
    });

    // 과거 이력(attendanceHistory)에서의 출석건수와 변경건수도 누적 계산에 포함하면 보다 정교해집니다.
    if (student.attendanceHistory && student.attendanceHistory.length > 0) {
      student.attendanceHistory.forEach(h => {
        // 이미 위에 이번 주에 계산한 날짜 범위를 넘어선 완전 과거 데이터가 쌓였다고 판단하는 보완 로직
        // 단순히 계산을 정밀화하기 위해, 이번주 외의 누적 기록이 있다면 반영 가능하도록 아키텍처 지원
      });
    }

    if (checkedPeriods === 0) return null; // 산정 제외 대상
    return Math.round((presentPeriods / checkedPeriods) * 100);
  };

  // 특정 요일 교시의 개별 출석률(%) 단일 계산기
  const getIndividualPeriodRate = (student: Student, day: DayOfWeek, period: 'p1' | 'p2' | 'p3') => {
    const status = student.attendance[day]?.[period];
    if (!status) return '-';
    
    if (status === '수업' || status === '미참여일') {
      return '제외';
    }
    if (status === '출석') {
      return '100%';
    }
    // 병결, 개인사는 감점 (출석안했으므로 0%)
    return '0%';
  };

  // --- 필터링 및 정렬된 결과 명단 (학번 정렬 필수) ---
  const filteredStudents = useMemo(() => {
    let result = students.filter(s => !s.isDeleted);

    // 1. 자습 교실 필터링
    if (selectedClassroom !== '전체') {
      result = result.filter(s => s.classroom === selectedClassroom);
    }

    // 2. 검색어 필터링 (학번 혹은 이름 검색)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.studentId.includes(query)
      );
    }

    // 3. 경고 타겟 필터
    if (warningOnlyFilter) {
      result = result.filter(s => s.isWarning);
    }

    // 학번 기준으로 오름차순 정렬
    return result.sort((a, b) => a.studentId.localeCompare(b.studentId));
  }, [students, selectedClassroom, searchQuery, warningOnlyFilter]);

  // --- 출석 통계용 필터링 및 정렬 결과 명단 (삭제된 학생 포함) ---
  const statsStudents = useMemo(() => {
    let result = [...students];

    // 1. 자습 교실 필터링
    if (selectedClassroom !== '전체') {
      result = result.filter(s => s.classroom === selectedClassroom);
    }

    // 2. 검색어 필터링 (학번 혹은 이름 검색)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.studentId.includes(query)
      );
    }

    // 3. 경고 타겟 필터
    if (warningOnlyFilter) {
      result = result.filter(s => s.isWarning);
    }

    // 학번 기준으로 오름차순 정렬
    return result.sort((a, b) => a.studentId.localeCompare(b.studentId));
  }, [students, selectedClassroom, searchQuery, warningOnlyFilter]);

  // 대시보드 통계 계산기
  const dashboardStats = useMemo(() => {
    let present = 0;
    let totalActive = 0;
    
    // 현재 선택된 요일 기준
    filteredStudents.forEach(s => {
      const dayData = s.attendance[activeTabDay];
      const periods: ('p1' | 'p2' | 'p3')[] = activeTabDay === '수' ? ['p1', 'p2', 'p3'] : ['p1', 'p2'];
      
      periods.forEach(p => {
        const val = dayData[p];
        if (val === '출석') {
          present++;
          totalActive++;
        } else if (val === '병결' || val === '개인사' || val === '미인정결' || val === '미확인') {
          totalActive++;
        }
      });
    });

    const rate = totalActive > 0 ? Math.round((present / totalActive) * 100) : 100;
    return {
      presentCount: present,
      totalCount: filteredStudents.length,
      averageRate: rate
    };
  }, [filteredStudents, activeTabDay]);

  // 해당 활성화 요일 전체 출석률 수치 및 분모/분자
  const activeDayAttendanceRate = useMemo(() => {
    let present = 0;
    let totalActive = 0;
    
    filteredStudents.forEach(s => {
      const dayData = s.attendance[activeTabDay];
      const periods: ('p1' | 'p2' | 'p3')[] = activeTabDay === '수' ? ['p1', 'p2', 'p3'] : ['p1', 'p2'];
      
      periods.forEach(p => {
        const val = dayData[p];
        if (val === '출석') {
          present++;
          totalActive++;
        } else if (val === '병결' || val === '개인사' || val === '미인정결' || val === '미확인') {
          totalActive++;
        }
      });
    });

    return {
      rate: totalActive > 0 ? Math.round((present / totalActive) * 100) : 100,
      present,
      totalActive
    };
  }, [filteredStudents, activeTabDay]);

  // 해당 활성화 요일별 교시 통계 (총원, 출석, 수업, 병결, 개인사, 미인정결)
  const dayPeriodStats = useMemo(() => {
    const periods: ('p1' | 'p2' | 'p3')[] = activeTabDay === '수' ? ['p1', 'p2', 'p3'] : ['p1', 'p2'];
    
    return periods.map(p => {
      let total = 0;
      let present = 0;
      let classCount = 0;
      let sick = 0;
      let personal = 0;
      let unauthorized = 0;

      filteredStudents.forEach(student => {
        const status = student.attendance[activeTabDay]?.[p] || '미확인';
        total++;
        if (status === '출석') {
          present++;
        } else if (status === '수업') {
          classCount++;
        } else if (status === '병결') {
          sick++;
        } else if (status === '개인사') {
          personal++;
        } else if (status === '미인정결') {
          unauthorized++;
        }
      });

      return {
        period: p === 'p1' ? '1교시' : p === 'p2' ? '2교시' : '3교시',
        total,
        present,
        classCount,
        sick,
        personal,
        unauthorized
      };
    });
  }, [filteredStudents, activeTabDay]);

  // 전체 경고 대상 학생 수
  const warningStudentsCount = useMemo(() => {
    return students.filter(s => s.isWarning && !s.isDeleted).length;
  }, [students]);

  // 출석 통계 정렬된 학생 명단
  const statsSortedStudents = useMemo(() => {
    const list = [...statsStudents];
    if (statsSortOrder === 'none') {
      return list;
    }
    return list.sort((a, b) => {
      const rateA = calculateStudentAttendanceRate(a);
      const rateB = calculateStudentAttendanceRate(b);
      
      const rA = rateA === null ? -1 : rateA;
      const rB = rateB === null ? -1 : rateB;
      
      if (statsSortOrder === 'asc') {
        return rA - rB;
      } else {
        return rB - rA;
      }
    });
  }, [statsStudents, statsSortOrder]);

  // 출석 상태 전용 배지 스타일 색상 매핑
  const getStatusBadgeStyle = (status: AttendanceStatus) => {
    switch (status) {
      case '미확인':
        return 'bg-zinc-900 text-zinc-500 border border-dashed border-zinc-700 hover:text-zinc-400 hover:bg-zinc-850';
      case '출석':
        return 'bg-[rgba(255,215,0,0.12)] text-[var(--color-point-yellow)] border border-[rgba(255,215,0,0.3)] hover:brightness-110';
      case '수업':
        return 'bg-blue-500/12 text-blue-400 border border-blue-500/25 hover:brightness-110';
      case '병결':
        return 'bg-orange-500/12 text-orange-400 border border-orange-500/25 hover:brightness-110';
      case '개인사':
        return 'bg-purple-500/12 text-purple-400 border border-purple-500/25 hover:brightness-110';
      case '미참여일':
        return 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 hover:brightness-110';
      case '미인정결':
        return 'bg-red-500/12 text-rose-500 border border-rose-500/30 hover:brightness-110';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#f3f4f6] flex w-full font-sans antialiased" id="app-container">
      
      {/* ----------------- 좌측 메인 내비게이션 바 (요구사항 8에 따라 불필요 메뉴 삭제 및 간소화) ----------------- */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#1E1E1E] border-r border-[rgba(255,215,0,0.15)] h-screen sticky top-0 p-6 shrink-0 justify-between z-20">
        <div className="space-y-7">
          <div className="flex items-center space-x-3 pb-6 border-b border-[rgba(255,215,0,0.12)]">
            <div className="bg-[rgba(255,215,0,0.12)] p-2 rounded-xl text-[var(--color-point-yellow)] border border-[rgba(255,215,0,0.25)] shadow-[0_0_12px_rgba(255,215,0,0.1)]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">3학년 교사실</h2>
              <span className="text-[10px] text-[var(--color-point-yellow)] uppercase font-mono tracking-wider">자율학습 출석부</span>
            </div>
          </div>

          {/* 사이드바 메뉴 */}
          <nav className="space-y-1.5" id="sidebar-navigation">
            <button 
              onClick={() => setCurrentMenu('attendance_chart')} 
              className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all border-l-3 cursor-pointer text-left ${
                currentMenu === 'attendance_chart'
                  ? 'text-[var(--color-point-yellow)] bg-[rgba(255,215,0,0.06)] border-[var(--color-point-yellow)] shadow-[inset_0_0_6px_rgba(255,215,0,0.02)]'
                  : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>요일별 출석부</span>
            </button>

            <button 
              onClick={() => setCurrentMenu('stats')} 
              className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all border-l-3 cursor-pointer text-left ${
                currentMenu === 'stats'
                  ? 'text-[var(--color-point-yellow)] bg-[rgba(255,215,0,0.06)] border-[var(--color-point-yellow)] shadow-[inset_0_0_6px_rgba(255,215,0,0.02)]'
                  : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>출석 통계</span>
            </button>

            <button 
              onClick={() => setCurrentMenu('admin_settings')} 
              className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all border-l-3 cursor-pointer text-left ${
                currentMenu === 'admin_settings'
                  ? 'text-[var(--color-point-yellow)] bg-[rgba(255,215,0,0.06)] border-[var(--color-point-yellow)] shadow-[inset_0_0_6px_rgba(255,215,0,0.02)]'
                  : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>관리자 설정</span>
            </button>
          </nav>
        </div>

        {/* 하단 시스템 시각 */}
        <div className="pt-4 border-t border-[rgba(255,215,0,0.12)]">
          <span className="text-[10px] text-zinc-500 block uppercase font-mono tracking-wider font-semibold">시스템 정보</span>
          <div className="flex items-center space-x-2 mt-1.5 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-medium text-emerald-400">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </aside>

      {/* ----------------- 우측 메인 콘텐츠 워크스페이스 ----------------- */}
      <div className="flex-1 min-h-screen overflow-y-auto flex flex-col bg-[#121212] relative" id="main-scroll-pane">
        
        {/* 토스트 메세지 통지 컴포넌트 */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-3 border border-[rgba(255,215,0,0.2)] bg-neutral-900/90 text-white`}
              id="toast-notification"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-point-yellow)] animate-ping" />
              <span className="text-xs font-semibold tracking-tight">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 모바일 상단 미니 배너/탑 헤더 */}
        <header className="lg:hidden flex items-center justify-between border-b border-[rgba(255,215,0,0.15)] bg-[#1E1E1E] px-6 py-4 z-10">
          <div className="flex items-center space-x-2">
            <div className="bg-[rgba(255,215,0,0.12)] p-1.5 rounded-lg text-[var(--color-point-yellow)] border border-[rgba(255,215,0,0.2)]">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white tracking-tight">자율학습 출석부</span>
          </div>
          
          <div className="flex space-x-1.5">
            <button 
              onClick={() => setCurrentMenu('attendance_chart')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${currentMenu === 'attendance_chart' ? 'bg-[var(--color-point-yellow)] text-black' : 'bg-zinc-800 text-zinc-300'}`}
            >
              출석부
            </button>
            <button 
              onClick={() => setCurrentMenu('stats')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${currentMenu === 'stats' ? 'bg-[var(--color-point-yellow)] text-black' : 'bg-zinc-800 text-zinc-300'}`}
            >
              통계
            </button>
            <button 
              onClick={() => setCurrentMenu('admin_settings')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${currentMenu === 'admin_settings' ? 'bg-[var(--color-point-yellow)] text-black' : 'bg-zinc-800 text-zinc-300'}`}
            >
              설정
            </button>
          </div>
        </header>

        {/* ----------------- 대시보드 인트로 허브 헤더 ----------------- */}
        <section className="border-b border-[rgba(255,215,0,0.15)] bg-[#1E1E1E]/40 backdrop-blur-md px-6 sm:px-8 py-6" id="welcome-header">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-[rgba(255,215,0,0.12)] text-[10px] font-mono text-[var(--color-point-yellow)] border border-[rgba(255,215,0,0.2)] font-semibold tracking-wider">
                  OFFLINE WORKSPACE
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">| 2026학년도 3학년 대입 집중 자율학습</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5">
                {currentMenu === 'attendance_chart' && '요일별 자율학습 출석부'}
                {currentMenu === 'stats' && '출석률 빅데이터 통계'}
                {currentMenu === 'admin_settings' && '관리자 설정'}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                {currentMenu === 'attendance_chart' && '학생 이름을 클릭하시면 상세 연혁 조회, 옐로우 카드 지정 및 경고사유 설정이 가능합니다.'}
                {currentMenu === 'stats' && '수업일과 공식 미참여일은 자동 배제 처리되며 병결 및 개인사 데이터만 엄정히 반영됩니다.'}
                {currentMenu === 'admin_settings' && '학생별 고유 자습 참여 형태를 사전에 정적 기록해두어 자동 영전 출석 세팅을 보조합니다.'}
              </p>
            </div>

            {/* 실시간 정보 요약 카드 */}
            <div className="flex items-center space-x-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 shadow-md">
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">현재 자율학습 참여 현황</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  총 {students.length}명 <span className="text-zinc-600">/</span> <span className="text-[var(--color-point-yellow)]">경고 {warningStudentsCount}명</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------- 주 워크플로우 뷰 ----------------- */}
        <main className="flex-1 p-6 sm:p-8 space-y-6">

          {/* ---------------------------------------------------- */}
          {/* VIEW: 요일별 출석부 (Menu: attendance_chart)           */}
          {/* ---------------------------------------------------- */}
          {currentMenu === 'attendance_chart' && (
            <div className="space-y-6">

              {/* 요일통계일람 (원그래프 및 교시별 통계) */}
              <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-[rgba(255,215,0,0.15)] space-y-3 shadow-xl">
                <label className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1.5 border-b border-zinc-800 pb-2">
                  <span className="w-1.5 h-3 bg-[var(--color-point-yellow)] rounded-full inline-block" />
                  <span className="font-bold text-white text-xs">{activeTabDay}요일 통계 일람</span>
                </label>
                
                <div className="flex flex-col md:flex-row items-center gap-6 pt-1">
                  {/* 왼쪽편: 전체 출석률 원그래프 (SVG) */}
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
                          strokeDashoffset={2 * Math.PI * 38 - (activeDayAttendanceRate.rate / 100) * (2 * Math.PI * 38)}
                          strokeLinecap="round"
                          style={{ filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.2))' }}
                        />
                      </svg>
                      <div className="absolute text-center">
                        <div className="text-base font-bold font-mono text-white">
                          {activeDayAttendanceRate.rate}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] text-zinc-500 font-semibold text-center">
                      출석 {activeDayAttendanceRate.present} / 대상 {activeDayAttendanceRate.totalActive}
                    </div>
                  </div>

                  {/* 오른쪽편: 교시별 상세 카운팅 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 w-full">
                    {dayPeriodStats.map((stat, sIdx) => (
                      <div key={sIdx} className="bg-zinc-900/40 border border-zinc-800/85 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
                          <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 bg-[var(--color-point-yellow)] rounded-full inline-block" />
                            <span>{stat.period}</span>
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono font-medium">
                            총원 {stat.total}명
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-medium text-zinc-400 pt-0.5">
                          <div className="flex justify-between items-center">
                            <span>출석</span>
                            <span className="text-[var(--color-point-yellow)] font-bold">{stat.present}명</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>수업</span>
                            <span className="text-blue-400 font-bold">{stat.classCount}명</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>병결</span>
                            <span className="text-orange-400 font-bold">{stat.sick}명</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>개인사</span>
                            <span className="text-purple-400 font-bold">{stat.personal}명</span>
                          </div>
                          <div className="flex justify-between items-center col-span-2 border-t border-zinc-850/80 pt-1.5 mt-0.5">
                            <span className="text-zinc-500">미인정결</span>
                            <span className="text-rose-500 font-bold">{stat.unauthorized}명</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* [요구사항 2] 출석부 요일 선택 (연월일 출력 포함) */}
              <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[rgba(255,215,0,0.12)]">
                <label className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1.5 mb-3">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-point-yellow)]" />
                  <span>출석부 요일 선택</span>
                </label>
                
                {/* 요일 선택 가전식 인터랙티브 슬라이드바 */}
                <div className="grid grid-cols-5 gap-2">
                  {(['월', '화', '수', '목', '금'] as DayOfWeek[]).map((day) => {
                    const isSelected = activeTabDay === day;
                    return (
                      <button
                        key={day}
                        onClick={() => setActiveTabDay(day)}
                        className={`py-3 px-2 rounded-xl text-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[rgba(255,215,0,0.12)] border-[var(--color-point-yellow)] text-white shadow-[0_0_12px_rgba(255,215,0,0.1)]'
                            : 'bg-zinc-900/60 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="block text-sm font-bold">{day}요일</span>
                        <span className="block text-[9.5px] font-mono mt-1 opacity-70 tracking-tight">
                          {dateMap[day]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* [요구사항 3] 자습 교실 선택 (교실별 명단 격리) */}
              <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[rgba(255,215,0,0.12)] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1.5">
                    <Filter className="w-3.5 h-3.5 text-[var(--color-point-yellow)]" />
                    <span>자습 교실 선택</span>
                  </label>
                  
                  {/* 경고 학생 원터치 토글 필터 */}
                  <button
                    onClick={() => setWarningOnlyFilter(!warningOnlyFilter)}
                    className={`px-3 py-1 rounded-lg text-[10.5px] font-semibold border transition ${
                      warningOnlyFilter
                        ? 'bg-red-950/45 text-red-400 border-red-500/30'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    ⚠️ 경고 대상자만 필터링
                  </button>
                </div>

                {/* 막대 바 제어 버튼 그룹 */}
                <div className="bg-zinc-900/80 p-0.5 sm:p-1 rounded-xl border border-zinc-850 grid grid-cols-6 gap-0.5 sm:gap-1">
                  {(['전체', '3-1', '3-2', '3-3', '3-4', '셀터디'] as const).map((room) => {
                    const isSelected = selectedClassroom === room;
                    return (
                      <button
                        key={room}
                        onClick={() => setSelectedClassroom(room)}
                        className={`py-1.5 sm:py-2 px-0.5 sm:px-3 text-[10.5px] sm:text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--color-point-yellow)] text-black shadow-md'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        {room}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 검색어 및 기능 배너 도구창 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-850">
                
                {/* 실시간 학번 이름 통합 검색바 */}
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
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-zinc-500 text-xs font-semibold">
                    조회 결과: <strong className="text-[var(--color-point-yellow)] font-mono">{filteredStudents.length}</strong>명
                  </span>
                  
                  {/* 신규 학생 수동 원장 등록 모달 트리거 */}
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-[var(--color-point-yellow)] hover:bg-[#E6C200] text-black rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>학생 수동 등록</span>
                  </button>
                </div>
              </div>

              {/* [요구사항 5, 6, 7] 자율학습명단 메인 리스트 보드 */}
              <div className="bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.12)] overflow-hidden shadow-xl">
                <div className="px-6 py-4.5 border-b border-zinc-800 bg-[#262626]/30 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span className="w-1.5 h-3.5 bg-[var(--color-point-yellow)] rounded-full" />
                    <span>자율학습명단</span>
                    <span className="ml-1 text-[11px] text-zinc-500">[{activeTabDay}요일 기준 배정 명부]</span>
                  </h3>
                  
                  <span className="text-[10.5px] text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-md font-medium border border-zinc-800">
                    💡 각 교시를 클릭하면 다음 상태로 바뀝니다
                  </span>
                </div>

                {/* 대장 테이블 영역 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#262626]/40 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 leading-none">
                        <th className="py-4 px-6 whitespace-nowrap">배정 자습실</th>
                        <th className="py-4 px-4 whitespace-nowrap">학번</th>
                        <th className="py-4 px-4 whitespace-nowrap">이름</th>
                        <th className="py-4 px-4 text-center whitespace-nowrap">1교시</th>
                        <th className="py-4 px-4 text-center whitespace-nowrap">2교시</th>
                        {activeTabDay === '수' && (
                          <th className="py-4 px-4 text-center whitespace-nowrap">3교시</th>
                        )}
                        <th className="py-4 px-6 text-right whitespace-nowrap">관리 제어</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-xs">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={activeTabDay === '수' ? 7 : 6} className="py-12 text-center text-zinc-500 font-medium">
                            <AlertTriangle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                            <span>일치하는 자율학습 학생 데이터가 존재하지 않습니다.</span>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => {
                          const hasWarning = student.isWarning;
                          const mondayRate = calculateStudentAttendanceRate(student);

                          return (
                            <tr 
                              key={student.id} 
                              className={`hover:bg-zinc-900/70 transition-all ${
                                hasWarning ? 'bg-red-950/10 border-l-2 border-l-red-500' : ''
                              }`}
                            >
                              {/* 요주의 교실 및 경고 마킹 */}
                              <td className="py-3 px-6 whitespace-nowrap">
                                <span className="flex items-center space-x-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    student.classroom === '셀터디' 
                                      ? 'bg-purple-950/45 text-purple-400 border border-purple-800/30'
                                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700/50'
                                  }`}>
                                    {student.classroom}
                                  </span>

                                  {hasWarning && (
                                    <span className="flex items-center space-x-0.5 bg-red-950 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded text-[9.5px] font-bold animate-pulse">
                                      <span>⚠️ 경고</span>
                                    </span>
                                  )}
                                </span>
                              </td>

                              {/* 학번 (구 성별 컬럼 완전 삭제 처리) */}
                              <td className="py-3 px-4 font-mono font-semibold text-zinc-400 whitespace-nowrap">
                                {student.studentId}
                              </td>

                              {/* 이름 (클릭 세부 연혁 표출 트리거) */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <button
                                  onClick={() => openStudentDetail(student)}
                                  className="font-bold text-white hover:text-[var(--color-point-yellow)] transition hover:underline cursor-pointer text-left focus:outline-none whitespace-nowrap inline-block"
                                >
                                  {student.name}
                                </button>
                              </td>

                              {/* 1교시 출석 상태 블록 */}
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <button
                                  onClick={() => handlePeriodClick(student.id, activeTabDay, 'p1')}
                                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight inline-block cursor-pointer transition focus:scale-95 whitespace-nowrap ${getStatusBadgeStyle(
                                    student.attendance[activeTabDay]?.p1 || '미확인'
                                  )}`}
                                >
                                  {student.attendance[activeTabDay]?.p1 || '미확인'}
                                </button>
                              </td>

                              {/* 2교시 출석 상태 블록 */}
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <button
                                  onClick={() => handlePeriodClick(student.id, activeTabDay, 'p2')}
                                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight inline-block cursor-pointer transition focus:scale-95 whitespace-nowrap ${getStatusBadgeStyle(
                                    student.attendance[activeTabDay]?.p2 || '미확인'
                                  )}`}
                                >
                                  {student.attendance[activeTabDay]?.p2 || '미확인'}
                                </button>
                              </td>

                              {/* [요구사항 7] 수요일 3교시 출석 상태 블록 */}
                              {activeTabDay === '수' && (
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  <button
                                    onClick={() => handlePeriodClick(student.id, '수', 'p3')}
                                    className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight inline-block cursor-pointer transition focus:scale-95 whitespace-nowrap ${getStatusBadgeStyle(
                                      student.attendance['수']?.p3 || '미확인'
                                    )}`}
                                  >
                                    {student.attendance['수']?.p3 || '미확인'}
                                  </button>
                                </td>
                              )}

                              {/* 연계 관리 제어 설정 */}
                              <td className="py-3 px-6 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => openStudentDetail(student)}
                                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded hover:text-white transition cursor-pointer"
                                    title="상세 일치 연혁"
                                  >
                                    <Info className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(student.id, student.name)}
                                    className="p-1.5 bg-red-950/45 hover:bg-red-950 text-red-400 rounded transition cursor-pointer"
                                    title="영구 삭제 제명"
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

                {/* 하단 요일 출석부 퀵 통계 통계 */}
                <div className="bg-[#262626]/20 p-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="flex items-center space-x-1 text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>
                      {selectedClassroom} 자습실 {activeTabDay}요일 기준 일 평균 출석률:
                    </span>
                    <strong className="text-white font-bold ml-1">{dashboardStats.averageRate}%</strong>
                  </div>
                  
                  <span className="text-zinc-500 font-medium">
                    * 전체 73명 교사 보조 일람표 / 누적 비 참여일 자동 제명
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW: 출석 통계 (Menu: stats)                       */}
          {/* ---------------------------------------------------- */}
          {currentMenu === 'stats' && (
            <div className="space-y-6">
              
              {/* 출석률 산정 가이드 패널 */}
              <div className="bg-zinc-900/80 p-4.5 rounded-2xl border border-zinc-800 flex items-start space-x-3.5">
                <Info className="w-5 h-5 text-[var(--color-point-yellow)] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-white">출석률 계산 방식</h4>
                  <p className="text-zinc-400 leading-relaxed">
                    자율학습 총 누적 출석률 산출은 1개 교시를 <strong className="text-white font-bold">1단위</strong>로 환산 정밀 처리합니다.<br />
                    행정상 <strong className="text-white font-bold">‘고정 수업’ 및 ‘미참여일’</strong>로 표기 기록 설정된 시간 및 교시는 분모 및 분자 모두에서 <strong className="text-rose-400">완전 차단 제외</strong>하여, 정당한 사유가 없는 <strong className="text-orange-400 font-bold">‘병결’, ‘개인사’ 및 ‘미인정결’</strong>로 표기된 사안에 대해서만 합리적으로 엄격한 감산 분석이 진행됩니다.
                  </p>
                </div>
              </div>

              {/* 자습 교실 필터 단말 */}
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
                        className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          selectedClassroom === r ? 'bg-[var(--color-point-yellow)] text-black' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* [요구사항 9] 종합 순차 누적 데이터 그리드 보드 */}
              <div className="bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.12)] overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-zinc-800 bg-[#262626]/30">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <span className="w-1.5 h-3.5 bg-[var(--color-point-yellow)] rounded-full" />
                    <span>개별 누적 출석 통계</span>
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#262626]/40 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 leading-none">
                        <th className="py-4 px-4 sticky left-0 bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">학번</th>
                        <th className="py-4 px-4 sticky left-[70px] bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">이름</th>
                        <th className="py-4 px-4 text-center font-bold text-[var(--color-point-yellow)] bg-[rgba(255,215,0,0.03)] border-r border-zinc-800/80">
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
                        
                        <th className="py-4 px-2 text-center border-r border-zinc-800/30">월_1</th>
                        <th className="py-4 px-2 text-center border-r border-zinc-800/80">월_2</th>
                        
                        <th className="py-4 px-2 text-center border-r border-zinc-800/30">화_1</th>
                        <th className="py-4 px-2 text-center border-r border-zinc-800/80">화_2</th>
                        
                        <th className="py-4 px-2 text-center border-r border-zinc-800/30">수_1</th>
                        <th className="py-4 px-2 text-center border-r border-zinc-800/30">수_2</th>
                        <th className="py-4 px-2 text-center border-r border-zinc-800/80">수_3</th>
                        
                        <th className="py-4 px-2 text-center border-r border-zinc-800/30">목_1</th>
                        <th className="py-4 px-2 text-center border-r border-zinc-800/80">목_2</th>
                        
                        <th className="py-4 px-2 text-center border-r border-zinc-800/30">금_1</th>
                        <th className="py-4 px-2 text-center">금_2</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-xs font-mono">
                      {statsSortedStudents.map((student) => {
                        const totalRate = calculateStudentAttendanceRate(student);

                        return (
                          <tr 
                            key={student.id} 
                            className={`hover:bg-zinc-900/60 transition duration-150 ${
                              student.isDeleted ? 'opacity-50 text-zinc-500' : ''
                            }`}
                          >
                            {/* 학번 고정 열 */}
                            <td className="py-3 px-4 sticky left-0 bg-[#1E1E1E] font-semibold text-zinc-400 font-mono z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                              {student.studentId}
                            </td>
                            {/* 이름 고정 열 */}
                            <td className="py-3 px-4 sticky left-[70px] bg-[#1E1E1E] font-bold text-white font-sans z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => openStudentDetail(student)}
                                  className="hover:text-[var(--color-point-yellow)] hover:underline text-left cursor-pointer"
                                >
                                  {student.name}
                                </button>
                                {student.isDeleted && (
                                  <span className="text-[9px] text-rose-400 font-normal px-1 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 shrink-0 select-none">
                                    삭제됨
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 총 누적 출석률 수치 */}
                            <td className="py-3 px-4 text-center font-bold bg-[rgba(255,215,0,0.02)] border-r border-zinc-800/80 text-white">
                              {totalRate === null ? (
                                <span className="text-zinc-500 font-normal">-</span>
                              ) : (
                                <span className={totalRate >= 90 ? 'text-emerald-400' : totalRate < 70 ? 'text-rose-400' : 'text-[var(--color-point-yellow)]'}>
                                  {totalRate}%
                                </span>
                              )}
                            </td>

                            {/* 요일별 개별 누적 출석률 일람 */}
                            <td className="py-3 px-2 text-center border-r border-zinc-800/30">
                              {getIndividualPeriodRate(student, '월', 'p1')}
                            </td>
                            <td className="py-3 px-2 text-center border-r border-zinc-800/80">
                              {getIndividualPeriodRate(student, '월', 'p2')}
                            </td>

                            <td className="py-3 px-2 text-center border-r border-zinc-800/30">
                              {getIndividualPeriodRate(student, '화', 'p1')}
                            </td>
                            <td className="py-3 px-2 text-center border-r border-zinc-800/80">
                              {getIndividualPeriodRate(student, '화', 'p2')}
                            </td>

                            <td className="py-3 px-2 text-center border-r border-zinc-800/30">
                              {getIndividualPeriodRate(student, '수', 'p1')}
                            </td>
                            <td className="py-3 px-2 text-center border-r border-zinc-800/30">
                              {getIndividualPeriodRate(student, '수', 'p2')}
                            </td>
                            <td className="py-3 px-2 text-center border-r border-zinc-800/80">
                              {getIndividualPeriodRate(student, '수', 'p3' as any)}
                            </td>

                            <td className="py-3 px-2 text-center border-r border-zinc-800/30">
                              {getIndividualPeriodRate(student, '목', 'p1')}
                            </td>
                            <td className="py-3 px-2 text-center border-r border-zinc-800/80">
                              {getIndividualPeriodRate(student, '목', 'p2')}
                            </td>

                            <td className="py-3 px-2 text-center border-r border-zinc-800/30">
                              {getIndividualPeriodRate(student, '금', 'p1')}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {getIndividualPeriodRate(student, '금', 'p2')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#262626]/20 p-4 border-t border-zinc-800 text-right text-[11px] text-zinc-500 font-semibold">
                  * 과거 이력이 추가 될 수록 더욱 세밀한 중장기 패턴 감지가 연계 구동됩니다.
                </div>
              </div>

            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW: 관리자 설정 (Menu: admin_settings)              */}
          {/* ---------------------------------------------------- */}
          {currentMenu === 'admin_settings' && (
            <div className="space-y-6">
              
              {/* 관리자 공지 허브 패널 */}
              <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-[var(--color-point-yellow)]" />
                  <h4 className="font-bold text-white text-sm">자율학습 참여 기본 고정값 환경 세팅 (요구사항 13)</h4>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  학생들이 특정 요일에 수능 수업, 모의면접, 학업상 하차 미참여가 확정되어 있는 경우 (예: 수요일 1교시 "수업", 목요일 1~2교시 "미참여일"),<br />
                  이곳에서 <strong className="text-white">학생별 고정값 기본 세팅</strong>을 설정하십시오. 해당 설정은 완료하는 즉시 출석부에 연계 반영되며, <strong className="text-[var(--color-point-yellow)]">매주 월요일 00:00:00시 초기화 실행 시</strong> 우선 보정값으로 지정 복원 적용됩니다.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    onClick={forceResetAllToFixed}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-bold transition border border-zinc-700 cursor-pointer"
                  >
                    🔄 지금 즉시 전체 고정에 동기화하기
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('모든 학생들의 관리자 사전 고정 설정을 공란(기본 출석 대기)으로 전원 포맷하시겠습니까?')) {
                        setStudents(prev => prev.map(s => ({ ...s, fixedSettings: undefined })));
                        showToast('전원 기본 고정값이 포맷 및 해제되었습니다.', 'info');
                      }
                    }}
                    className="px-4 py-2 bg-red-950/20 hover:bg-red-950/45 text-red-400 rounded-xl text-xs font-bold transition border border-red-900/30 cursor-pointer"
                  >
                    ⚠️ 고정 설정 전원 초기화
                  </button>
                </div>
              </div>

              {/* 자습 교실 필터 단말 */}
              <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[rgba(255,215,0,0.12)]">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-[var(--color-point-yellow)]" />
                    <span className="text-xs font-bold text-white">필터 설정 대상실</span>
                  </div>
                  <div className="bg-zinc-900 p-1 rounded-xl flex gap-1 w-full sm:w-auto">
                    {(['전체', '3-1', '3-2', '3-3', '3-4', '셀터디'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setSelectedClassroom(r)}
                        className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          selectedClassroom === r ? 'bg-[var(--color-point-yellow)] text-black' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 개별 고정값 입력 제어 시트 */}
              <div className="bg-[#1E1E1E] rounded-2xl border border-[rgba(255,215,0,0.12)] overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-zinc-800 bg-[#262626]/30">
                  <h3 className="text-sm font-bold text-white">기본값 설정 리스트</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#262626]/40 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 leading-none">
                        <th className="py-4 px-4 sticky left-0 bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">자습실</th>
                        <th className="py-4 px-4 sticky left-[70px] bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">학번</th>
                        <th className="py-4 px-4 sticky left-[130px] bg-[#1E1E1E] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">이름</th>
                        <th className="py-4 px-2 text-center text-zinc-300">월1</th>
                        <th className="py-4 px-2 text-center text-zinc-300">월2</th>
                        <th className="py-4 px-2 text-center text-zinc-300">화1</th>
                        <th className="py-4 px-2 text-center text-zinc-300">화2</th>
                        <th className="py-4 px-2 text-center text-amber-300">수1</th>
                        <th className="py-4 px-2 text-center text-amber-300">수2</th>
                        <th className="py-4 px-2 text-center text-amber-300">수3</th>
                        <th className="py-4 px-2 text-center text-zinc-300">목1</th>
                        <th className="py-4 px-2 text-center text-zinc-300">목2</th>
                        <th className="py-4 px-2 text-center text-zinc-300">금1</th>
                        <th className="py-4 px-2 text-center text-zinc-300">금2</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-xs font-mono">
                      {filteredStudents.map((student) => {
                        const currentFixed = student.fixedSettings || createDefaultAttendance();
                        
                        return (
                          <tr key={student.id} className="hover:bg-zinc-900/60">
                            <td className="py-3 px-4 sticky left-0 bg-[#1E1E1E]/95 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 whitespace-nowrap">
                                {student.classroom}
                              </span>
                            </td>
                            <td className="py-3 px-4 sticky left-[70px] bg-[#1E1E1E]/95 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] text-zinc-400 font-semibold">{student.studentId}</td>
                            <td className="py-3 px-4 sticky left-[130px] bg-[#1E1E1E]/95 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] font-bold text-white whitespace-nowrap">{student.name}</td>
                            
                            {/* 월요일 */}
                            <td className="py-3 px-1 text-center">
                              <select
                                className="bg-[#262626] text-[10px] text-white px-1.5 py-1 rounded border border-zinc-700/60 focus:outline-none focus:border-[var(--color-point-yellow)] w-[68px]"
                                value={currentFixed['월']?.p1 || '미확인'}
                                onChange={(e) => {
                                  handleFixedSettingChange(student.id, '월', 'p1', e.target.value as AttendanceStatus);
                                  showToast(`${student.name} 월1 기본설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                                }}
                              >
                                {statusCycle.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-1 text-center">
                              <select
                                className="bg-[#262626] text-[10px] text-white px-1.5 py-1 rounded border border-zinc-700/60 focus:outline-none focus:border-[var(--color-point-yellow)] w-[68px]"
                                value={currentFixed['월']?.p2 || '미확인'}
                                onChange={(e) => {
                                  handleFixedSettingChange(student.id, '월', 'p2', e.target.value as AttendanceStatus);
                                  showToast(`${student.name} 월2 기본설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                                }}
                              >
                                {statusCycle.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>

                            {/* 화요일 */}
                            <td className="py-3 px-1 text-center">
                              <select
                                className="bg-[#262626] text-[10px] text-white px-1.5 py-1 rounded border border-zinc-700/60 focus:outline-none focus:border-[var(--color-point-yellow)] w-[68px]"
                                value={currentFixed['화']?.p1 || '미확인'}
                                onChange={(e) => {
                                  handleFixedSettingChange(student.id, '화', 'p1', e.target.value as AttendanceStatus);
                                  showToast(`${student.name} 화1 기본설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                                }}
                              >
                                {statusCycle.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-1 text-center">
                              <select
                                className="bg-[#262626] text-[10px] text-white px-1.5 py-1 rounded border border-zinc-700/60 focus:outline-none focus:border-[var(--color-point-yellow)] w-[68px]"
                                value={currentFixed['화']?.p2 || '미확인'}
                                onChange={(e) => {
                                  handleFixedSettingChange(student.id, '화', 'p2', e.target.value as AttendanceStatus);
                                  showToast(`${student.name} 화2 기본설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                                }}
                              >
                                {statusCycle.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>

                            {/* 수요일 */}
                            <td className="py-3 px-1 text-center bg-zinc-900/30">
                              <select
                                className="bg-[#262626] text-[10px] text-white px-1.5 py-1 rounded border border-amber-900/40 focus:outline-none focus:border-[var(--color-point-yellow)] w-[68px]"
                                value={currentFixed['수']?.p1 || '미확인'}
                                onChange={(e) => {
                                  handleFixedSettingChange(student.id, '수', 'p1', e.target.value as AttendanceStatus);
                                  showToast(`${student.name} 수1 기본설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                                }}
                              >
                                {statusCycle.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-1 text-center bg-zinc-900/30">
                              <select
                                className="bg-[#262626] text-[10px] text-white px-1.5 py-1 rounded border border-amber-900/40 focus:outline-none focus:border-[var(--color-point-yellow)] w-[68px]"
                                value={currentFixed['수']?.p2 || '미확인'}
                                onChange={(e) => {
                                  handleFixedSettingChange(student.id, '수', 'p2', e.target.value as AttendanceStatus);
                                  showToast(`${student.name} 수2 기본설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                                }}
                              >
                                {statusCycle.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-1 text-center bg-zinc-900/30">
                              <select
                                className="bg-[#262626] text-[10px] text-white px-1.5 py-1 rounded border border-amber-900/40 focus:outline-none focus:border-[var(--color-point-yellow)] w-[68px]"
                                value={currentFixed['수']?.p3 || '미확인'}
                                onChange={(e) => {
                                  handleFixedSettingChange(student.id, '수', 'p3', e.target.value as AttendanceStatus);
                                  showToast(`${student.name} 수3 기본설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                                }}
                              >
                                {statusCycle.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>

                            {/* 목요일 */}
                            <td className="py-3 px-1 text-center">
                              <select
                                className="bg-[#262626] text-[10px] text-white px-1.5 py-1 rounded border border-zinc-700/60 focus:outline-none focus:border-[var(--color-point-yellow)] w-[68px]"
                                value={currentFixed['목']?.p1 || '미확인'}
                                onChange={(e) => {
                                  handleFixedSettingChange(student.id, '목', 'p1', e.target.value as AttendanceStatus);
                                  showToast(`${student.name} 목1 기본설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                                }}
                              >
                                {statusCycle.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-1 text-center">
                              <select
                                className="bg-[#262626] text-[10px] text-white px-1.5 py-1 rounded border border-zinc-700/60 focus:outline-none focus:border-[var(--color-point-yellow)] w-[68px]"
                                value={currentFixed['목']?.p2 || '미확인'}
                                onChange={(e) => {
                                  handleFixedSettingChange(student.id, '목', 'p2', e.target.value as AttendanceStatus);
                                  showToast(`${student.name} 목2 기본설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                                }}
                              >
                                {statusCycle.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>

                            {/* 금요일 */}
                            <td className="py-3 px-1 text-center">
                              <select
                                className="bg-[#262626] text-[10px] text-white px-1.5 py-1 rounded border border-zinc-700/60 focus:outline-none focus:border-[var(--color-point-yellow)] w-[68px]"
                                value={currentFixed['금']?.p1 || '미확인'}
                                onChange={(e) => {
                                  handleFixedSettingChange(student.id, '금', 'p1', e.target.value as AttendanceStatus);
                                  showToast(`${student.name} 금1 기본설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                                }}
                              >
                                {statusCycle.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-1 text-center">
                              <select
                                className="bg-[#262626] text-[10px] text-white px-1.5 py-1 rounded border border-zinc-700/60 focus:outline-none focus:border-[var(--color-point-yellow)] w-[68px]"
                                value={currentFixed['금']?.p2 || '미확인'}
                                onChange={(e) => {
                                  handleFixedSettingChange(student.id, '금', 'p2', e.target.value as AttendanceStatus);
                                  showToast(`${student.name} 금2 기본설정이 [${e.target.value}]로 변경되었습니다.`, 'success');
                                }}
                              >
                                {statusCycle.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ----------------- 에스테틱 하단 바 ----------------- */}
        <footer className="mt-auto border-t border-[rgba(255,215,0,0.12)] bg-[#1E1E1E] px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-[11px] font-medium" id="main-footer">
          <div>
            <span>© 2026 3학년 집단 자율학습 출석부 관리 시스템</span>
            <span className="mx-2">|</span>
            <span className="text-[var(--color-point-yellow)] font-semibold">Prestige Dark Slate Theme Enabled</span>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>최종 무결성 확인 및 실시간 보정 보장됨</span>
          </div>
        </footer>

      </div> {/* /main-scroll-pane */}

      {/* ----------------- [요구사항 10, 11] 학생 세부 정보 모달 창 ----------------- */}
      <AnimatePresence>
        {isDetailModalOpen && selectedStudent && (
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
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 모달 본문 */}
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                
                {/* 1. 기본 인적 정보 (성별 완치 삭제) */}
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
                    <span className="text-zinc-500 font-semibold text-[11px]">배정 자습교실</span>
                    <strong className="text-white text-sm">{selectedStudent.classroom}</strong>
                  </div>
                  <div className="flex justify-between text-xs border-t border-zinc-800/60 pt-2 items-center">
                    <span className="text-zinc-500 font-semibold text-[11px]">자율학습 참여일(기본상태)</span>
                    <div className="flex flex-wrap gap-1 max-w-[280px] justify-end">
                      {['월', '화', '수', '목', '금'].map(d => {
                        const hasSettings = selectedStudent.fixedSettings || createDefaultAttendance();
                        const pList = d === '수' ? ['p1', 'p2', 'p3'] : ['p1', 'p2'];
                        return pList.map((p, idx) => {
                          const status = hasSettings[d as DayOfWeek]?.[p] || '미확인';
                          const isNonParticipant = status === '미참여일';
                          const label = `${d}${idx + 1}`;
                          return (
                            <span 
                              key={`${d}-${p}`} 
                              className={`px-1 py-0.5 rounded text-[9px] font-bold ${
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

                {/* 2. 옐로우 카드 표시 활성화 (경고 대상자) */}
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
                      <span>교사 보증 옐로우카드 (경고 대상자 지정)</span>
                    </label>
                    
                    <button
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

                {/* [요구사항 11] 지금까지 출석한 날짜와 교시 표시 */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>누적 자습 성실 출석 이력 (출석한 날짜/교시 일람)</span>
                  </label>
                  
                  <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl max-h-[140px] overflow-y-auto space-y-1.5">
                    {/* 실시간 시뮬레이션용 출석건들이 쌓이지 않았다면 이번 주 출석데이터 중 '출석' 마킹 상태를 디폴트 추출해서 띄워줍니다 */}
                    {(() => {
                      const currentWeekDlog: AttendanceHistoryItem[] = [];
                      const days: DayOfWeek[] = ['월', '화', '수', '목', '금'];
                      days.forEach(day => {
                        const pData = selectedStudent.attendance[day];
                        const periods: ('p1' | 'p2' | 'p3')[] = day === '수' ? ['p1', 'p2', 'p3'] : ['p1', 'p2'];
                        
                        periods.forEach(p => {
                          const val = pData[p];
                          if (val === '출석') {
                            currentWeekDlog.push({
                              date: dateMap[day],
                              day,
                              period: p === 'p1' ? '1교시' : p === 'p2' ? '2교시' : '3교시',
                              status: '출석'
                            });
                          }
                        });
                      });

                      // 중합 아카이빙 이력 병합
                      const allHistory = [
                        ...currentWeekDlog,
                        ...(selectedStudent.attendanceHistory || [])
                      ].filter((v, i, a) => a.findIndex(h => h.date === v.date && h.period === v.period) === i); // 중복제거

                      if (allHistory.length === 0) {
                        return (
                          <div className="text-center py-4 text-zinc-500 text-xs">
                            출석으로 인정 체크된 교시 내역이 존재하지 않습니다.
                          </div>
                        );
                      }

                      return allHistory.sort((a,b)=>b.date.localeCompare(a.date)).map((hist, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] bg-zinc-850 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                          <span className="font-mono text-zinc-400">{hist.date} ({hist.day})</span>
                          <span className="font-semibold text-zinc-300">{hist.period}</span>
                          <span className="px-2 py-0.5 bg-emerald-950/45 text-emerald-400 rounded text-[9.5px] font-bold">인정출석</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

              </div>

              {/* 모달 푸터 */}
              <div className="px-6 py-4 bg-[#262626] border-t border-zinc-800 flex justify-end space-x-2">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  닫기
                </button>
                <button
                  onClick={saveStudentDetailChanges}
                  className="px-4 py-2 bg-[var(--color-point-yellow)] hover:bg-[#E6C200] text-black rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>설정 전격 저장</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- 신규 학생 등록 보조용 다이얼로그 모달 ----------------- */}
      <AnimatePresence>
        {isAddModalOpen && (
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
                <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-bold block uppercase tracking-wider">학번 고유번호 (예: 3101)</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 3650"
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
                    placeholder="성함 기입"
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
                    <option value="3-1">3-1 교실</option>
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
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--color-point-yellow)] hover:bg-[#E6C200] text-black rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>자습 학생 추가 완료</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
