
import { apiRequest, setApiBaseUrl } from './api';

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  email?: string;
  phone?: string;
  password?: string;
  uid?: number;
}

class OdooService {
  private config: OdooConfig | null = null;
  private _selectedStudentId: number | null = null;

  constructor() {
    const savedConfig = localStorage.getItem('odoo_config');
    if (savedConfig) {
      try {
        this.config = JSON.parse(savedConfig);
        if (this.config && this.config.url) {
          setApiBaseUrl(this.config.url);
        }
      } catch (e) {
        localStorage.removeItem('odoo_config');
      }
    }

    const savedStudentId = localStorage.getItem('selected_student_id');
    if (savedStudentId) {
      this._selectedStudentId = parseInt(savedStudentId);
    }
  }

  get selectedStudentId(): number | null {
    return this._selectedStudentId;
  }

  setSelectedStudentId(id: number) {
    this._selectedStudentId = id;
    localStorage.setItem('selected_student_id', id.toString());
  }

  get isLogged(): boolean {
    return !!this.config;
  }

  get userConfig(): OdooConfig | null {
    return this.config;
  }

  setUserConfig(config: OdooConfig) {
    this.config = config;
    try {
      localStorage.setItem('odoo_config', JSON.stringify(config));
    } catch (e) {
      console.warn('Erreur sauvegarde odoo_config:', e);
    }
  }

  updateParentUser(data: { id?: number | string; name?: string; phone?: string; email?: string }) {
    try {
      const saved = localStorage.getItem('parent_user');
      const current = saved ? JSON.parse(saved) : {};
      const updated = { ...current, ...data };
      localStorage.setItem('parent_user', JSON.stringify(updated));
    } catch (e) {
      console.warn('Erreur update parent_user:', e);
    }
  }

  async login(url: string, db: string, user: string, pass: string): Promise<any> {
    setApiBaseUrl(url);
    const result = await apiRequest('/api/auth/login', { db, username: user, password: pass });

    if (!result.success) throw new Error(result.message);
    
    const uid = result.uid;
    // Si première connexion (must_change_password), on ne valide la session qu'après le changement effectif de mot de passe
    if (!result.must_change_password) {
      this.config = { url, db, username: user, password: pass, uid, email: result.email };
      localStorage.setItem('odoo_config', JSON.stringify(this.config));
      localStorage.setItem('parent_user', JSON.stringify({ id: uid, name: result.name, phone: result.phone, email: result.email }));
    }
    return result;
  }

  async changePassword(
    parentId: number | string, 
    currentPass: string, 
    newPass: string, 
    loginContext?: { url: string; db: string; user: string; email?: string; name?: string }
  ): Promise<any> {
    const result = await apiRequest('/api/auth/change-password', {
      parent_id: parentId,
      current_password: currentPass,
      new_password: newPass
    });
    if (!result.success) throw new Error(result.message);

    if (this.config) {
      this.config.password = newPass;
      localStorage.setItem('odoo_config', JSON.stringify(this.config));
    } else if (loginContext) {
      this.config = {
        url: loginContext.url,
        db: loginContext.db,
        username: loginContext.user,
        password: newPass,
        uid: Number(parentId),
        email: loginContext.email
      };
      localStorage.setItem('odoo_config', JSON.stringify(this.config));
      if (loginContext.name) {
        localStorage.setItem('parent_user', JSON.stringify({
          id: parentId,
          name: loginContext.name,
          phone: loginContext.user,
          email: loginContext.email
        }));
      }
    }
    return result;
  }

  async resetPassword(params: {
    parent_id?: number | string;
    phone?: string;
    email?: string;
    new_password?: string;
    temporary_password?: string;
  }): Promise<any> {
    const result = await apiRequest('/api/auth/reset-password', params);
    if (!result.success) throw new Error(result.message);
    return result;
  }

  async forgotPassword(phoneOrEmail: string): Promise<any> {
    const isEmail = phoneOrEmail.includes('@');
    const payload = isEmail ? { email: phoneOrEmail } : { phone: phoneOrEmail };
    const result = await apiRequest('/api/auth/forgot-password', payload);
    if (!result.success) throw new Error(result.message);
    return result;
  }

  async adminLogin(url: string, db: string, user: string, pass: string): Promise<number> {
    setApiBaseUrl(url);
    const result = await apiRequest('/api/auth/admin-login', { db, username: user, password: pass });

    if (!result.success) throw new Error(result.message);
    
    const uid = result.uid;
    // We can store config so that isLogged is true, but we should mark it as admin
    this.config = { url, db, username: user, password: pass, uid, email: 'admin' };
    localStorage.setItem('odoo_config', JSON.stringify(this.config));
    localStorage.setItem('is_admin', 'true');
    return uid;
  }

  async getHomework(studentId: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/homework', { student_id: studentId });
  }

  async getGrades(studentId: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/grades', { student_id: studentId });
  }

  async getNotifications(studentId: number, levelId?: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/notifications', { student_id: studentId, level_id: levelId });
  }

  async updateHomeworkStatus(homeworkId: number, state: 'draft' | 'done', studentId?: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/homework/status', { 
        homework_id: homeworkId,
        student_id: studentId || this.selectedStudentId,
        state: state
    });
  }

  async getSchedule(levelId: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/schedule', { level_id: levelId });
  }

  async getAnnouncements(levelId?: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/announcements', { level_id: levelId });
  }

  async sendAnnouncement(title: string, content: string, levelId?: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/announcements/send', { title, content, level_id: levelId });
  }

  async getLevels() {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/levels', {});
  }

  async getChatHistory(studentId: number) {
    return apiRequest('/api/school/chat/history', { student_id: studentId });
  }

  async sendMessageToAdmin(studentId: number, message: string, attachment?: { filename: string, filedata: string, mimetype?: string }) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/contact-admin', { student_id: studentId, message, attachment });
  }

  async adminReply(studentId: number, message: string, attachment?: { filename: string, filedata: string, mimetype?: string }) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/admin/reply', { student_id: studentId, message, attachment });
  }

  async sendAdminReply(studentId: number, message: string, attachment?: { filename: string, filedata: string, mimetype?: string }) {
    return this.adminReply(studentId, message, attachment);
  }

  async getIncomingMessages() {
    return apiRequest('/api/school/admin/incoming-messages', {});
  }

  async getAllStudentsForAdmin() {
    return apiRequest('/api/school/admin/students', {});
  }

  async getStudentAlbum(studentId: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/student/album', { student_id: studentId });
  }

  async uploadPhotoToAlbum(studentId: number, filename: string, base64Data: string) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/admin/album/upload', { student_id: studentId, filename, filedata: base64Data });
  }

  async deletePhotoFromAlbum(attachmentId: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/admin/album/delete', { attachment_id: attachmentId });
  }

  async adminReply(studentId: number, message: string) {
    return apiRequest('/api/school/admin/reply', { student_id: studentId, message });
  }

  async getPayments(studentId: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/payments', { student_id: studentId });
  }

  async getLostItems() {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/lost-items', {});
  }

  // =========================================================================
  // APPOINTMENTS / RENDEZ-VOUS DIRECTION
  // =========================================================================

  async getAppointments(studentId?: number, parentId?: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/appointments', { student_id: studentId, parent_id: parentId });
  }

  async getAppointmentSlots(date: string) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/appointments/slots', { date });
  }

  async requestAppointment(data: {
    student_id: number;
    student_name?: string;
    parent_id?: number;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
    date: string;
    time_slot: string;
    subject: string;
    type?: string;
    notes?: string;
  }) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/appointments/request', data);
  }

  async acceptAppointmentProposal(appointmentId: number, studentId?: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/appointments/accept-proposal', { appointment_id: appointmentId, student_id: studentId });
  }

  async cancelAppointment(appointmentId: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/appointments/cancel', { appointment_id: appointmentId });
  }

  async getAllAdminAppointments(status?: string, search?: string) {
    return apiRequest('/api/school/admin/appointments', { status, search });
  }

  async adminValidateAppointment(appointmentId: number, location?: string, admin_notes?: string) {
    return apiRequest('/api/school/admin/appointments/validate', {
      appointment_id: appointmentId,
      location,
      admin_notes
    });
  }

  async adminRescheduleAppointment(appointmentId: number, proposed_date: string, proposed_time_slot: string, admin_notes?: string, location?: string) {
    return apiRequest('/api/school/admin/appointments/reschedule', {
      appointment_id: appointmentId,
      proposed_date,
      proposed_time_slot,
      admin_notes,
      location
    });
  }

  async adminRejectAppointment(appointmentId: number, admin_notes?: string) {
    return apiRequest('/api/school/admin/appointments/reject', {
      appointment_id: appointmentId,
      admin_notes
    });
  }

  async adminCompleteAppointment(appointmentId: number) {
    return apiRequest('/api/school/admin/appointments/complete', {
      appointment_id: appointmentId
    });
  }


  private _menuConfigCache: any[] | null = null;
  private _lastMenuFetchTime: number = 0;

  async getMenuConfig(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this._menuConfigCache && (now - this._lastMenuFetchTime < 10000)) {
      return this._menuConfigCache;
    }
    const email = this.config?.email;
    const uid = this.config?.uid;
    try {
      const res = await apiRequest('/api/school/menu-config', { email, user_id: uid });
      if (Array.isArray(res)) {
        this._menuConfigCache = res;
        this._lastMenuFetchTime = now;
      }
      return res;
    } catch (e) {
      if (this._menuConfigCache) return this._menuConfigCache;
      throw e;
    }
  }


  logout() {
    this.config = null;
    this._selectedStudentId = null;
    localStorage.removeItem('odoo_config');
    localStorage.removeItem('selected_student_id');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('api_base_url');
  }
}

export const odoo = new OdooService();
