
import { apiRequest } from './api';

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  email?: string;
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

  async login(url: string, db: string, user: string, pass: string): Promise<number> {
    const result = await apiRequest('/api/auth/login', { db, username: user, password: pass });

    if (!result.success) throw new Error(result.message);
    
    const uid = result.uid;
    this.config = { url, db, username: user, password: pass, uid, email: result.email };
    localStorage.setItem('odoo_config', JSON.stringify(this.config));
    return uid;
  }

  async adminLogin(url: string, db: string, user: string, pass: string): Promise<number> {
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

  async getNotifications(studentId: number) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/notifications', { student_id: studentId });
  }

  async updateHomeworkStatus(homeworkId: number, state: 'draft' | 'done') {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/homework/update-status', { 
        homework_id: homeworkId,
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

  async sendMessageToAdmin(studentId: number, message: string) {
    if (!this.config) throw new Error('Not logged in');
    return apiRequest('/api/school/contact-admin', { student_id: studentId, message });
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

  logout() {
    this.config = null;
    this._selectedStudentId = null;
    localStorage.removeItem('odoo_config');
    localStorage.removeItem('selected_student_id');
    localStorage.removeItem('is_admin');
  }
}

export const odoo = new OdooService();
