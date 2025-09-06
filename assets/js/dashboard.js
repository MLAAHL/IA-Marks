/**
 * IA-MARKS MANAGEMENT Dashboard with Custom Confirmation Modal
 */

class DashboardManager {
    constructor() {
        this.subjects = [];
        this.streams = [];
        this.selectedStream = null;
        this.selectedSemester = null;
        this.selectedSubject = null;
        this.currentUser = null;
        this.isFirebaseReady = false;
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.pendingRemovalSubjectId = null; // For confirmation modal
        this.pendingRemovalSubjectName = null; // For confirmation modal
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupFirebaseAuth();
        this.updateUI();
    }

    async initializeDatabase() {
        try {
            await fetch(`${this.API_BASE_URL}/academic/initialize-new`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('Database initialized with new structure');
        } catch (error) {
            console.log('Database initialization error:', error);
        }
    }

    bindEvents() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });
        
        // Profile dropdown
        document.getElementById('profileBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleProfileDropdown();
        });
        
        // Add subject buttons
        document.getElementById('addFirstSubjectBtn')?.addEventListener('click', () => this.openAddSubjectModal());
        document.getElementById('addSubjectBtn')?.addEventListener('click', () => this.openAddSubjectModal());
        document.getElementById('addSubjectIcon')?.addEventListener('click', () => this.openAddSubjectModal());
        
        // Modal controls
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeAddSubjectModal());
        document.getElementById('addToQueueBtn')?.addEventListener('click', () => this.handleAddToQueue());
        
        // Form controls
        document.getElementById('semester')?.addEventListener('change', (e) => this.handleSemesterChange(e));
        document.getElementById('subject')?.addEventListener('change', (e) => this.handleSubjectChange(e));
        
        // Custom confirmation modal bindings
        document.getElementById('confirmationCancel')?.addEventListener('click', () => this.hideConfirmationModal());
        document.getElementById('confirmationConfirm')?.addEventListener('click', () => this.confirmRemoveSubject());
        
        // *** EVENT DELEGATION FOR DYNAMIC BUTTONS ***
        const subjectsGrid = document.getElementById('subjectsGrid');
        if (subjectsGrid) {
            subjectsGrid.addEventListener('click', (e) => {
                const target = e.target.closest('button[data-action]');
                if (!target) return;

                const action = target.getAttribute('data-action');
                const subjectId = target.getAttribute('data-subject-id');
                const subjectName = target.getAttribute('data-subject-name');

                if (action === 'remove' && subjectId && subjectName) {
                    e.preventDefault();
                    this.showConfirmationModal(subjectId, subjectName);
                } else if (action === 'attend' && subjectId) {
                    e.preventDefault();
                    this.attendSubject(subjectId);
                }
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // Close modals when clicking outside
        document.getElementById('addSubjectModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'addSubjectModal') {
                this.closeAddSubjectModal();
            }
        });
        
        document.getElementById('confirmationModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'confirmationModal') {
                this.hideConfirmationModal();
            }
        });
    }

    setupFirebaseAuth() {
        if (localStorage.getItem('userLoggedOut') === 'true') {
            this.redirectToLogin();
            return;
        }

        const userEmail = document.getElementById('userEmail');
        if (userEmail) {
            userEmail.textContent = 'Loading...';
        }

        window.addEventListener('firebaseReady', () => {
            this.isFirebaseReady = true;
            this.auth = window.auth;
            this.setupAuthStateListener();
        });

        setTimeout(() => {
            if (!this.isFirebaseReady) {
                console.error('Firebase initialization timeout');
                this.checkLocalSession();
            }
        }, 10000);
    }

    setupAuthStateListener() {
        window.firebaseAuth.onAuthStateChanged(this.auth, (user) => {
            if (localStorage.getItem('userLoggedOut') === 'true') {
                this.redirectToLogin();
                return;
            }

            if (user) {
                this.currentUser = user;
                this.updateUserInfo(user);
                
                const userSession = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    lastLoginAt: new Date().toISOString()
                };
                localStorage.setItem('userSession', JSON.stringify(userSession));
                
                this.loadTeacherSubjects();
                console.log('✅ User authenticated:', user.email);
            } else {
                console.log('❌ User not authenticated, redirecting to login');
                this.currentUser = null;
                localStorage.removeItem('userSession');
                this.redirectToLogin();
            }
        });
    }

    checkLocalSession() {
        if (localStorage.getItem('userLoggedOut') === 'true') {
            this.redirectToLogin();
            return;
        }

        const userSession = localStorage.getItem('userSession');
        if (userSession) {
            try {
                const session = JSON.parse(userSession);
                this.updateUserInfo({ email: session.email });
                this.loadTeacherSubjects();
            } catch (error) {
                console.error('Invalid session data');
                this.redirectToLogin();
            }
        } else {
            this.redirectToLogin();
        }
    }

    updateUserInfo(user) {
        const userEmail = document.getElementById('userEmail');
        const dropdownUserEmail = document.getElementById('dropdownUserEmail');
        
        if (userEmail) {
            userEmail.textContent = user.email || user.displayName || 'User';
        }
        if (dropdownUserEmail) {
            dropdownUserEmail.textContent = user.email || user.displayName || 'User';
        }
        
        this.currentUser = user;
    }

    // Custom confirmation modal methods
    showConfirmationModal(subjectId, subjectName) {
        this.pendingRemovalSubjectId = subjectId;
        this.pendingRemovalSubjectName = subjectName;
        
        const modal = document.getElementById('confirmationModal');
        const content = document.getElementById('confirmationModalContent');
        const message = document.getElementById('confirmationMessage');
        
        if (message) {
            message.textContent = `Are you sure you want to remove "${subjectName}" from your class?`;
        }
        
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('show');
                if (content) {
                    content.style.transform = 'scale(1)';
                    content.style.opacity = '1';
                }
            }, 10);
        }
    }

    hideConfirmationModal() {
        const modal = document.getElementById('confirmationModal');
        const content = document.getElementById('confirmationModalContent');
        
        if (modal) {
            modal.classList.remove('show');
            modal.classList.add('hide');
        }
        
        if (content) {
            content.style.transform = 'scale(0.95)';
            content.style.opacity = '0';
        }
        
        setTimeout(() => {
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('hide');
            }
            this.pendingRemovalSubjectId = null;
            this.pendingRemovalSubjectName = null;
        }, 200);
    }

    async confirmRemoveSubject() {
        if (!this.pendingRemovalSubjectId) return;
        
        const subjectId = this.pendingRemovalSubjectId;
        this.hideConfirmationModal();
        
        try {
            console.log('🗑️ Removing subject:', subjectId);
            
            const teacherId = await this.getAuthenticatedUserId();
            
            if (!teacherId) {
                this.showAlert('Please log in to remove subjects', 'error');
                return;
            }

            this.showAlert('Removing subject...', 'info');

            const response = await fetch(`${this.API_BASE_URL}/teacher/${teacherId}/subjects/${subjectId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            console.log('📡 Remove response:', result);

            if (result.success) {
                this.showAlert('Subject removed successfully', 'success');
                await this.loadTeacherSubjects();
            } else {
                this.showAlert(result.message || 'Error removing subject', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error removing subject:', error);
            this.showAlert('Error connecting to server', 'error');
        }
    }

    // Add attend subject method
    attendSubject(subjectId) {
        console.log('Attend subject:', subjectId);
        this.showAlert('Opening subject page...', 'info');
        setTimeout(() => {
            window.location.href = `/attendance.html?subject=${subjectId}`;
        }, 1000);
    }

    async loadTeacherSubjects() {
        try {
            const teacherId = await this.getAuthenticatedUserId();
            
            if (!teacherId) {
                console.log('❌ No authenticated user found');
                this.subjects = [];
                this.updateSubjectCount();
                this.updateUI();
                return;
            }

            console.log('📚 Loading subjects for teacher:', teacherId);
            
            const response = await fetch(`${this.API_BASE_URL}/teacher/${teacherId}/subjects`);
            const result = await response.json();

            console.log('📡 Server response:', result);

            if (result.success && result.subjects) {
                this.subjects = result.subjects;
                console.log('✅ Loaded', this.subjects.length, 'subjects from database');
            } else {
                console.log('📭 No subjects found');
                this.subjects = [];
            }
            
            this.updateSubjectCount();
            this.renderSubjects();
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Error loading subjects:', error);
            this.subjects = [];
            this.updateSubjectCount();
            this.updateUI();
        }
    }

    async loadStreams() {
        try {
            console.log('📚 Loading streams from API...');
            
            const response = await fetch(`${this.API_BASE_URL}/academic/streams`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            console.log('📡 API Response:', result);
            
            if (result.success && result.streams) {
                this.streams = result.streams;
                console.log('✅ Loaded', this.streams.length, 'streams');
                this.renderStreams();
            } else {
                throw new Error(result.message || 'No streams data received');
            }
        } catch (error) {
            console.error('❌ Error loading streams:', error);
            this.showAlert('Error loading academic streams. Please check if database is populated.', 'error');
            this.checkDatabaseStatus();
        }
    }

    async checkDatabaseStatus() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/academic/status`);
            const result = await response.json();
            
            if (result.success && result.database.status === 'empty') {
                this.showAlert('Database is empty. Please populate it first.', 'error');
            }
        } catch (error) {
            console.error('Database status check failed:', error);
        }
    }

    renderStreams() {
        const streamsList = document.getElementById('streamsList');
        if (!streamsList) return;

        streamsList.innerHTML = '';

        this.streams.forEach(stream => {
            const streamDiv = document.createElement('div');
            streamDiv.className = 'stream-option';
            streamDiv.innerHTML = `
                <label class="flex items-center p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-primary hover:bg-blue-50 transition-all duration-200 group">
                    <input type="radio" name="stream" value="${stream._id}" class="sr-only stream-radio">
                    <div class="flex items-center space-x-3 flex-1">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${stream.color || '#6366f1'}20;">
                            <i class="${stream.icon || 'fas fa-graduation-cap'}" style="color: ${stream.color || '#6366f1'};"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900 group-hover:text-primary transition-colors">${stream.name}</div>
                            <div class="text-sm text-gray-500">All semesters</div>
                        </div>
                    </div>
                    <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center radio-indicator transition-all duration-200">
                        <div class="w-2.5 h-2.5 bg-primary rounded-full opacity-0 scale-0 transition-all duration-200 radio-dot"></div>
                    </div>
                </label>
            `;

            const radio = streamDiv.querySelector('.stream-radio');
            const label = streamDiv.querySelector('label');
            const indicator = streamDiv.querySelector('.radio-indicator');
            const dot = streamDiv.querySelector('.radio-dot');

            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.handleStreamSelection(stream);
                    this.updateStreamSelection(streamsList, label, indicator, dot);
                }
            });

            streamsList.appendChild(streamDiv);
        });
    }

    updateStreamSelection(container, selectedLabel, selectedIndicator, selectedDot) {
        container.querySelectorAll('label').forEach(label => {
            label.classList.remove('border-primary', 'bg-blue-50');
            label.classList.add('border-gray-200');
        });
        container.querySelectorAll('.radio-indicator').forEach(indicator => {
            indicator.classList.remove('border-primary');
            indicator.classList.add('border-gray-300');
        });
        container.querySelectorAll('.radio-dot').forEach(dot => {
            dot.classList.add('opacity-0', 'scale-0');
        });
        
        selectedLabel.classList.add('border-primary', 'bg-blue-50');
        selectedLabel.classList.remove('border-gray-200');
        selectedIndicator.classList.add('border-primary');
        selectedIndicator.classList.remove('border-gray-300');
        selectedDot.classList.remove('opacity-0', 'scale-0');
    }

    async handleStreamSelection(stream) {
        this.selectedStream = stream;
        this.selectedSemester = null;
        this.selectedSubject = null;
        
        const semesterSection = document.getElementById('semesterSection');
        const semesterSelect = document.getElementById('semester');
        
        if (semesterSection && semesterSelect) {
            semesterSection.classList.remove('hidden');
            semesterSelect.disabled = false;
            semesterSelect.focus();
            
            semesterSelect.innerHTML = '<option value="">Select semester</option>';
            stream.semesters.forEach(semester => {
                const option = document.createElement('option');
                option.value = semester;
                option.textContent = `Semester ${semester}`;
                semesterSelect.appendChild(option);
            });
        }
        
        const subjectSection = document.getElementById('subjectSection');
        const subjectSelect = document.getElementById('subject');
        if (subjectSection) subjectSection.classList.add('hidden');
        if (subjectSelect) subjectSelect.innerHTML = '<option value="">Select stream & semester first</option>';
        this.updateAddButton();
    }

    async handleSemesterChange(e) {
        const semesterNumber = e.target.value;
        if (!semesterNumber || !this.selectedStream) return;
        
        this.selectedSemester = semesterNumber;
        this.selectedSubject = null;
        
        const subjectSection = document.getElementById('subjectSection');
        const subjectSelect = document.getElementById('subject');
        
        if (subjectSection && subjectSelect) {
            subjectSection.classList.remove('hidden');
            subjectSelect.disabled = false;
            subjectSelect.focus();
            
            try {
                const response = await fetch(`${this.API_BASE_URL}/academic/streams/${this.selectedStream._id}/semester/${semesterNumber}/subjects`);
                const result = await response.json();
                
                if (result.success) {
                    subjectSelect.innerHTML = '<option value="">Select subject</option>';
                    result.subjects.forEach(subject => {
                        const option = document.createElement('option');
                        option.value = subject._id;
                        option.textContent = `${subject.name}`;
                        option.dataset.name = subject.name;
                        option.dataset.code = subject.code || `${this.selectedStream.name}${semesterNumber}01`;
                        subjectSelect.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error loading subjects:', error);
                this.showAlert('Error loading subjects', 'error');
            }
        }
        
        this.updateAddButton();
    }

    handleSubjectChange(e) {
        const subjectId = e.target.value;
        if (!subjectId) {
            this.selectedSubject = null;
        } else {
            const option = e.target.selectedOptions[0];
            this.selectedSubject = {
                id: subjectId,
                name: option.dataset.name,
                code: option.dataset.code
            };
        }
        this.updateAddButton();
    }

    updateAddButton() {
        const addBtn = document.getElementById('addToQueueBtn');
        if (!addBtn) return;
        
        const canAdd = this.selectedStream && this.selectedSemester && this.selectedSubject;
        
        addBtn.disabled = !canAdd;
        
        if (canAdd) {
            addBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'disabled:bg-gray-300');
            addBtn.classList.add('bg-primary', 'hover:bg-primary-dark');
        } else {
            addBtn.classList.add('opacity-50', 'cursor-not-allowed');
            addBtn.classList.remove('hover:bg-primary-dark');
        }
    }

    async handleAddToQueue() {
        if (!this.selectedStream || !this.selectedSemester || !this.selectedSubject) {
            this.showAlert('Please select all required fields', 'error');
            return;
        }

        const addBtn = document.getElementById('addToQueueBtn');
        if (!addBtn) return;
        
        const originalText = addBtn.innerHTML;
        
        addBtn.disabled = true;
        addBtn.innerHTML = `
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            <span>Adding...</span>
        `;

        try {
            const teacherId = await this.getAuthenticatedUserId();
            
            if (!teacherId) {
                throw new Error('Please log in to add subjects');
            }

            console.log('📝 Adding subject for teacher:', teacherId);
            
            const response = await fetch(`${this.API_BASE_URL}/teacher/add-subject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: teacherId,
                    streamId: this.selectedStream._id,
                    semester: parseInt(this.selectedSemester),
                    subjectId: this.selectedSubject.id
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(`${this.selectedSubject.name} added successfully!`, 'success');
                this.closeAddSubjectModal();
                await this.loadTeacherSubjects();
            } else {
                this.showAlert(result.message || 'Error adding subject', 'error');
            }
        } catch (error) {
            console.error('❌ Error adding subject:', error);
            this.showAlert(error.message || 'Error connecting to server', 'error');
        } finally {
            addBtn.disabled = false;
            addBtn.innerHTML = originalText;
            this.updateAddButton();
        }
    }

    async getAuthenticatedUserId() {
        return new Promise((resolve) => {
            if (this.currentUser?.uid) {
                resolve(this.currentUser.uid);
                return;
            }

            const userSession = localStorage.getItem('userSession');
            if (userSession) {
                try {
                    const session = JSON.parse(userSession);
                    if (session.uid) {
                        resolve(session.uid);
                        return;
                    }
                } catch (error) {
                    console.error('Invalid session data');
                }
            }

            if (this.isFirebaseReady && this.auth) {
                const timeout = setTimeout(() => {
                    console.error('Firebase auth timeout');
                    resolve(null);
                }, 10000);

                const unsubscribe = window.firebaseAuth.onAuthStateChanged(this.auth, (user) => {
                    clearTimeout(timeout);
                    unsubscribe();
                    if (user) {
                        this.currentUser = user;
                        resolve(user.uid);
                    } else {
                        resolve(null);
                    }
                });
            } else {
                resolve(null);
            }
        });
    }

    async openAddSubjectModal() {
        const modal = document.getElementById('addSubjectModal');
        if (!modal) return;
        
        modal.classList.remove('hidden');
        
        setTimeout(() => {
            const content = modal.querySelector('.bg-white');
            if (content) {
                content.style.transform = 'scale(1)';
                content.style.opacity = '1';
            }
        }, 10);
        
        await this.loadStreams();
        this.resetModalForm();
    }

    closeAddSubjectModal() {
        const modal = document.getElementById('addSubjectModal');
        if (!modal) return;
        
        const modalContent = modal.querySelector('.bg-white');
        
        if (modalContent) {
            modalContent.style.transform = 'scale(0.95)';
            modalContent.style.opacity = '0';
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            if (modalContent) {
                modalContent.style.transform = 'scale(1)';
                modalContent.style.opacity = '1';
            }
        }, 150);
        
        this.resetModalForm();
    }

    resetModalForm() {
        this.selectedStream = null;
        this.selectedSemester = null;
        this.selectedSubject = null;
        
        const semesterSection = document.getElementById('semesterSection');
        const subjectSection = document.getElementById('subjectSection');
        const semesterSelect = document.getElementById('semester');
        const subjectSelect = document.getElementById('subject');
        
        if (semesterSection) semesterSection.classList.add('hidden');
        if (subjectSection) subjectSection.classList.add('hidden');
        if (semesterSelect) semesterSelect.innerHTML = '<option value="">Select semester</option>';
        if (subjectSelect) subjectSelect.innerHTML = '<option value="">Select stream & semester first</option>';
        
        document.querySelectorAll('.stream-radio').forEach(radio => {
            radio.checked = false;
        });
        
        this.updateAddButton();
    }

    updateSubjectCount() {
        const countElement = document.getElementById('subjectCount');
        if (countElement) {
            countElement.textContent = this.subjects.length;
        }
    }

    updateUI() {
        const emptyState = document.getElementById('emptyState');
        const subjectsList = document.getElementById('subjectsList');
        
        if (this.subjects.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (subjectsList) subjectsList.classList.add('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            if (subjectsList) subjectsList.classList.remove('hidden');
        }
    }

    renderSubjects() {
        const grid = document.getElementById('subjectsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.subjects.forEach(subject => {
            const card = this.createSubjectCard(subject);
            grid.appendChild(card);
        });
    }

    // *** UPDATED SUBJECT CARD WITH DATA ATTRIBUTES ***
    createSubjectCard(subject) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200';

        card.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-start space-x-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style="background-color: ${subject.streamColor || '#6366f1'};">
                        ${subject.serialNumber}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <i class="${subject.streamIcon || 'fas fa-graduation-cap'}" style="color: ${subject.streamColor || '#6366f1'};"></i>
                            <h3 class="text-lg font-semibold text-gray-900">${subject.name.toUpperCase()}</h3>
                        </div>
                        <div class="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style="background-color: ${subject.streamColor || '#6366f1'}20; color: ${subject.streamColor || '#6366f1'};">
                                ${subject.stream}
                            </span>
                            <span>Sem ${subject.semester}</span>
                        </div>
                        <p class="text-xs text-gray-500">Added: ${subject.addedTime}</p>
                    </div>
                </div>
                <button class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors" 
                        data-action="remove" 
                        data-subject-id="${subject.id}" 
                        data-subject-name="${subject.name.replace(/"/g, '&quot;')}" 
                        title="Remove Subject">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <button class="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2" 
                    data-action="attend" 
                    data-subject-id="${subject.id}">
                <i class="fas fa-user-check"></i>
                <span>Manage</span>
            </button>
        `;

        return card;
    }

    async handleLogout() {
        try {
            this.showAlert('Signing out...', 'info');
            localStorage.setItem('userLoggedOut', 'true');
            localStorage.removeItem('userSession');
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('ia-marks-subjects');
            localStorage.removeItem('currentSubject');
            sessionStorage.clear();
            
            try {
                if (this.isFirebaseReady && this.auth) {
                    await window.firebaseAuth.signOut(this.auth);
                    console.log('Firebase logout successful');
                }
            } catch (signOutError) {
                console.error('Firebase signOut failed (continuing):', signOutError);
            }
            
            this.showAlert('Logged out successfully!', 'success');
            setTimeout(() => {
                window.location.replace('/index.html');
            }, 300);
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.setItem('userLoggedOut', 'true');
            localStorage.removeUser('userSession');
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('ia-marks-subjects');
            localStorage.removeItem('currentSubject');
            sessionStorage.clear();
            this.showAlert('Logged out successfully!', 'success');
            setTimeout(() => {
                window.location.replace('/index.html');
            }, 1000);
        }
    }

    redirectToLogin() {
        window.location.replace('/index.html');
    }

    toggleProfileDropdown() {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }

    handleOutsideClick(e) {
        const dropdown = document.getElementById('profileDropdown');
        const profileBtn = document.getElementById('profileBtn');
        
        if (dropdown && profileBtn && !dropdown.contains(e.target) && !profileBtn.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    }

    showAlert(message, type = 'info') {
        const alert = document.getElementById('alertMessage');
        const alertText = document.getElementById('alertText');
        
        if (alert && alertText) {
            alert.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm alert-${type}`;
            alertText.textContent = message;
            alert.classList.remove('hidden');
            
            setTimeout(() => {
                alert.classList.add('hidden');
            }, 4000);
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
