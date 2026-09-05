<template>
  <div class="student-header-badge-wrapper" v-if="currentStudent || loadingStudent">
    <div class="student-badge-card" @click="handleBadgeClick" :class="{ 'clickable': allStudents.length > 1 }">
      <div class="avatar-ring">
        <img 
          :src="studentAvatar" 
          :alt="studentName"
          class="badge-avatar"
        />
        <div class="status-dot"></div>
      </div>

      <div class="badge-content">
        <div class="badge-name-row">
          <span class="badge-role-label">Élève :</span>
          <h3 class="badge-student-name">{{ studentName }}</h3>
        </div>
        <div class="badge-meta-row" v-if="studentClass || currentStudent?.massar_number">
          <span class="badge-class-pill" v-if="studentClass">
            <ion-icon :icon="schoolOutline" class="meta-icon"></ion-icon>
            {{ studentClass }}
          </span>
          <span class="badge-massar-pill" v-if="currentStudent?.massar_number">
            Massar: {{ currentStudent.massar_number }}
          </span>
        </div>
      </div>

      <!-- Switch Child indicator if more than 1 student -->
      <div class="badge-switch-btn" v-if="allStudents.length > 1">
        <span class="switch-label">Changer</span>
        <ion-icon :icon="chevronDownOutline" class="switch-arrow"></ion-icon>
      </div>
    </div>

    <!-- Child Selection Modal / Action Sheet -->
    <ion-modal :is-open="showChildModal" @didDismiss="showChildModal = false" :breakpoints="[0, 0.45, 0.7]" :initial-breakpoint="0.45">
      <div class="modal-child-sheet ion-padding">
        <div class="modal-handle-bar"></div>
        <div class="modal-sheet-header">
          <h3>Changer d'enfant</h3>
          <p>Sélectionnez l'élève pour afficher ses informations</p>
        </div>

        <div class="modal-child-list">
          <div 
            v-for="st in allStudents" 
            :key="st.id" 
            class="modal-child-item"
            :class="{ 'is-selected': st.id === currentStudent?.id }"
            @click="onSelectChild(st.id)"
          >
            <img 
              :src="st.photo ? `data:image/png;base64,${st.photo}` : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (st.display_name || st.name)" 
              class="modal-child-avatar"
            />
            <div class="modal-child-info">
              <span class="modal-child-name">{{ st.display_name || st.full_name || st.name }}</span>
              <span class="modal-child-class">{{ st.level_id?.[1] || 'Classe non définie' }}</span>
            </div>
            <div class="modal-check-mark" v-if="st.id === currentStudent?.id">
              <ion-icon :icon="checkmarkCircle"></ion-icon>
            </div>
          </div>
        </div>
      </div>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { IonIcon, IonModal } from '@ionic/vue';
import { schoolOutline, chevronDownOutline, checkmarkCircle } from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { useCurrentStudent } from '@/services/currentStudent';

const {
  currentStudent,
  allStudents,
  loadingStudent,
  studentName,
  studentClass,
  studentAvatar,
  loadStudentData,
  selectStudent
} = useCurrentStudent();

const showChildModal = ref(false);

const handleBadgeClick = () => {
  if (allStudents.value.length > 1) {
    showChildModal.value = true;
  }
};

const onSelectChild = (id: number) => {
  selectStudent(id);
  showChildModal.value = false;
};

onMounted(() => {
  loadStudentData();
});
</script>

<style scoped>
.student-header-badge-wrapper {
  margin-bottom: 14px;
}

.student-badge-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  padding: 10px 14px;
  border-radius: 16px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.03);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.student-badge-card.clickable {
  cursor: pointer;
}

.student-badge-card.clickable:active {
  transform: scale(0.985);
  background: #f1f5f9;
}

.avatar-ring {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 2px;
}

.badge-avatar {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: #ffffff;
  object-fit: cover;
}

.status-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
}

.badge-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.badge-name-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  overflow: hidden;
}

.badge-role-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.badge-student-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.badge-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  flex-wrap: wrap;
}

.badge-class-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 8px;
}

.meta-icon {
  font-size: 0.8rem;
  color: #6366f1;
}

.badge-massar-pill {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
}

.badge-switch-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #eef2ff;
  color: #4f46e5;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.switch-arrow {
  font-size: 0.9rem;
}

/* Modal Styling */
.modal-child-sheet {
  background: #ffffff;
  border-radius: 24px 24px 0 0;
}

.modal-handle-bar {
  width: 40px;
  height: 4px;
  background: #cbd5e1;
  border-radius: 4px;
  margin: 0 auto 16px;
}

.modal-sheet-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-sheet-header p {
  margin: 4px 0 16px;
  font-size: 0.85rem;
  color: #64748b;
}

.modal-child-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-child-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-child-item.is-selected {
  background: #eef2ff;
  border-color: #6366f1;
}

.modal-child-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
  background: white;
}

.modal-child-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.modal-child-name {
  font-weight: 800;
  font-size: 0.95rem;
  color: #0f172a;
}

.modal-child-class {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.modal-check-mark {
  color: #6366f1;
  font-size: 1.4rem;
}
</style>
