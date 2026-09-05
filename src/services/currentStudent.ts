import { ref, computed } from 'vue';
import { odoo } from './odoo';
import { apiRequest } from './api';

export interface StudentInfo {
  id: number;
  name: string;
  full_name?: string;
  display_name?: string;
  massar_number?: string;
  level_id?: [number, string] | false;
  parent_id?: [number, string] | false;
  average_grade?: number;
  photo?: string;
  wallet_balance?: number;
  transport_id?: [number, string] | false;
}

const currentStudent = ref<StudentInfo | null>(null);
const allStudents = ref<StudentInfo[]>([]);
const loadingStudent = ref(false);

export function useCurrentStudent() {
  const studentName = computed(() => {
    if (!currentStudent.value) return 'Élève';
    return (
      currentStudent.value.display_name ||
      currentStudent.value.full_name ||
      currentStudent.value.name ||
      'Élève'
    );
  });

  const studentShortName = computed(() => {
    const full = studentName.value;
    const parts = full.trim().split(' ');
    if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
    return full;
  });

  const studentClass = computed(() => {
    if (!currentStudent.value?.level_id) return '';
    return currentStudent.value.level_id[1];
  });

  const studentAvatar = computed(() => {
    if (currentStudent.value?.photo) {
      return `data:image/png;base64,${currentStudent.value.photo}`;
    }
    const seed = encodeURIComponent(studentName.value);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  });

  const loadStudentData = async (forceRefresh = false) => {
    const config = odoo.userConfig;
    if (!config) return null;

    if (!forceRefresh && currentStudent.value && allStudents.value.length > 0) {
      return currentStudent.value;
    }

    loadingStudent.value = true;
    try {
      const data = await apiRequest('/api/school/student', {
        email: config.email,
        parent_id: config.uid
      });

      if (Array.isArray(data) && data.length > 0) {
        allStudents.value = data;
        const selectedId = odoo.selectedStudentId;
        const found = data.find((s: any) => s.id === selectedId) || data[0];
        currentStudent.value = found;
        if (found) {
          odoo.setSelectedStudentId(found.id);
        }
      }
    } catch (e) {
      console.error('Failed to load current student data:', e);
    } finally {
      loadingStudent.value = false;
    }
    return currentStudent.value;
  };

  const selectStudent = (studentId: number) => {
    const found = allStudents.value.find(s => s.id === studentId);
    if (found) {
      currentStudent.value = found;
      odoo.setSelectedStudentId(found.id);
      window.dispatchEvent(new CustomEvent('student-changed', { detail: found }));
    }
  };

  const clearStudentData = () => {
    currentStudent.value = null;
    allStudents.value = [];
  };

  return {
    currentStudent,
    allStudents,
    loadingStudent,
    studentName,
    studentShortName,
    studentClass,
    studentAvatar,
    loadStudentData,
    selectStudent,
    clearStudentData
  };
}
