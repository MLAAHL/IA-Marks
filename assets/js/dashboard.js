// Dashboard JavaScript - Load User Data After Login
let auth;
let currentUser = null;

// Wait for Firebase to be ready
window.addEventListener('firebaseReady', () => {
    auth = window.auth;
    initializeDashboard();
});

function initializeDashboard() {
    // Listen for authentication state changes
    window.firebaseAuth.onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ User authenticated:', user.email);
            
            // Display user information
            displayUserInfo(user);
            
            // Load teacher profile data
            await loadTeacherProfile(user);
            
            // Initialize UI interactions
            initializeUIHandlers();
            
        } else {
            console.log('❌ No user authenticated, redirecting to login');
            window.location.href = '/index.html';
        }
    });
}

function displayUserInfo(user) {
    const email = user.email;
    const displayName = user.displayName || email.split('@')[0];
    
    // Update email displays
    document.getElementById('userEmail').textContent = email;
    document.getElementById('dropdownUserEmail').textContent = email;
    
    // Update profile button with user initials or photo
    const profileBtn = document.getElementById('profileBtn');
    if (user.photoURL) {
        profileBtn.innerHTML = `<img src="${user.photoURL}" alt="Profile" class="w-8 h-8 rounded-lg object-cover">`;
    } else {
        const initials = displayName.substring(0, 2).toUpperCase();
        profileBtn.innerHTML = `<span class="text-sm font-bold">${initials}</span>`;
    }
    
    profileBtn.setAttribute('title', `${displayName} (${email})`);
    
    console.log('✅ User info displayed successfully');
}

async function loadTeacherProfile(user) {
    try {
        showAlert('info', 'Loading your profile...');
        
        // Get Firebase ID token
        const idToken = await user.getIdToken();
        
        // Fetch teacher profile from your API
        const response = await fetch('/api/teachers/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
                const teacherData = data.data;
                console.log('✅ Teacher profile loaded:', teacherData);
                
                // Update subject count
                const subjectsCount = teacherData.subjects?.length || 0;
                document.getElementById('subjectCount').textContent = subjectsCount;
                
                // Show appropriate section based on subjects
                if (subjectsCount > 0) {
                    showSubjectsList(teacherData.subjects);
                } else {
                    showEmptyState();
                }
                
                // Store teacher data for later use
                localStorage.setItem('teacherProfile', JSON.stringify(teacherData));
                
                hideAlert();
                
            } else {
                throw new Error(data.error || 'Failed to load profile');
            }
            
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ Error loading teacher profile:', error);
        showAlert('error', 'Failed to load profile. Please refresh the page.');
        
        // Show empty state as fallback
        showEmptyState();
    }
}

function showSubjectsList(subjects) {
    // Hide empty state and show subjects list
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('subjectsList').classList.remove('hidden');
    
    // Render subjects in the grid
    renderSubjects(subjects);
}

function showEmptyState() {
    // Show empty state and hide subjects list
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('subjectsList').classList.add('hidden');
}

function renderSubjects(subjects) {
    const subjectsGrid = document.getElementById('subjectsGrid');
    
    if (!subjects || subjects.length === 0) {
        subjectsGrid.innerHTML = '<p class="text-gray-500 text-center py-8">No subjects found</p>';
        return;
    }
    
    // Clear existing content
    subjectsGrid.innerHTML = '';
    
    // Create subject cards
    subjects.forEach((subject, index) => {
        const subjectCard = createSubjectCard(subject, index);
        subjectsGrid.appendChild(subjectCard);
    });
}

function createSubjectCard(subject, index) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200';
    
    card.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <i class="fas fa-book text-white text-lg"></i>
            </div>
            <div class="relative">
                <button class="text-gray-400 hover:text-gray-600 transition-colors" onclick="toggleSubjectMenu(${index})">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div id="subjectMenu${index}" class="hidden absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                    <button onclick="editSubject(${index})" class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                        <i class="fas fa-edit mr-2"></i>Edit
                    </button>
                    <button onclick="removeSubject('${subject._id}')" class="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                        <i class="fas fa-trash mr-2"></i>Remove
                    </button>
                </div>
            </div>
        </div>
        
        <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">${subject.subjectName}</h3>
            <div class="text-sm text-gray-500 space-y-1">
                <p><i class="fas fa-graduation-cap mr-2 text-primary"></i>${subject.streamName}</p>
                <p><i class="fas fa-calendar-alt mr-2 text-primary"></i>${subject.semesterName}</p>
            </div>
        </div>
        
        <div class="flex items-center justify-between pt-4 border-t border-gray-100">
            <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Active</span>
            <button onclick="openSubjectDashboard('${subject._id}')" class="text-primary hover:text-primary-dark text-sm font-medium transition-colors">
                Open Dashboard →
            </button>
        </div>
    `;
    
    return card;
}

function initializeUIHandlers() {
    // Profile dropdown toggle
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Add subject buttons
    document.getElementById('addFirstSubjectBtn').addEventListener('click', openAddSubjectModal);
    document.getElementById('addSubjectBtn').addEventListener('click', openAddSubjectModal);
    document.getElementById('addSubjectIcon').addEventListener('click', openAddSubjectModal);
    
    // Modal handlers
    document.getElementById('closeModal').addEventListener('click', closeAddSubjectModal);
    document.getElementById('addSubjectModal').addEventListener('click', (e) => {
        if (e.target.id === 'addSubjectModal') {
            closeAddSubjectModal();
        }
    });
    
    console.log('✅ UI handlers initialized');
}

async function handleLogout() {
    try {
        showAlert('info', 'Signing out...');
        
        // Clear stored data
        localStorage.removeItem('teacherProfile');
        localStorage.removeItem('teacherData');
        
        // Sign out from Firebase
        await window.firebaseAuth.signOut(auth);
        
        console.log('✅ User signed out successfully');
        
        // Redirect to login
        window.location.href = '/login.html';
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        showAlert('error', 'Failed to sign out. Please try again.');
    }
}

// Subject management functions
function toggleSubjectMenu(index) {
    const menu = document.getElementById(`subjectMenu${index}`);
    
    // Close all other menus
    document.querySelectorAll('[id^="subjectMenu"]').forEach(m => {
        if (m !== menu) m.classList.add('hidden');
    });
    
    menu.classList.toggle('hidden');
}

function editSubject(index) {
    // Close menu
    document.getElementById(`subjectMenu${index}`).classList.add('hidden');
    
    showAlert('info', 'Edit functionality coming soon!');
}

function removeSubject(subjectId) {
    // Show confirmation modal
    showConfirmation(
        'Remove Subject',
        'Are you sure you want to remove this subject from your class? This action cannot be undone.',
        async () => {
            try {
                const idToken = await currentUser.getIdToken();
                
                const response = await fetch('/api/teachers/remove-subject', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        subjectId
                    })
                });
                
                if (response.ok) {
                    showAlert('success', 'Subject removed successfully');
                    // Reload profile to refresh the list
                    await loadTeacherProfile(currentUser);
                } else {
                    throw new Error('Failed to remove subject');
                }
                
            } catch (error) {
                console.error('Error removing subject:', error);
                showAlert('error', 'Failed to remove subject. Please try again.');
            }
        }
    );
}

function openSubjectDashboard(subjectId) {
    // Navigate to subject-specific dashboard
    window.location.href = `/subject-dashboard.html?subjectId=${subjectId}`;
}

function openAddSubjectModal() {
    document.getElementById('addSubjectModal').classList.remove('hidden');
    // TODO: Load streams and initialize form
}

function closeAddSubjectModal() {
    document.getElementById('addSubjectModal').classList.add('hidden');
}

// Utility functions
function showAlert(type, message) {
    const alertDiv = document.getElementById('alertMessage');
    const alertText = document.getElementById('alertText');
    
    // Set alert style based on type
    let bgColor, textColor, icon;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-100 border-green-400';
            textColor = 'text-green-700';
            icon = 'fas fa-check-circle';
            break;
        case 'error':
            bgColor = 'bg-red-100 border-red-400';
            textColor = 'text-red-700';
            icon = 'fas fa-exclamation-circle';
            break;
        case 'info':
        default:
            bgColor = 'bg-blue-100 border-blue-400';
            textColor = 'text-blue-700';
            icon = 'fas fa-info-circle';
    }
    
    alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm border ${bgColor} ${textColor}`;
    alertText.innerHTML = `<i class="${icon} mr-2"></i>${message}`;
    
    alertDiv.classList.remove('hidden');
    
    // Auto hide after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            hideAlert();
        }, 5000);
    }
}

function hideAlert() {
    document.getElementById('alertMessage').classList.add('hidden');
}

function showConfirmation(title, message, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    const content = document.getElementById('confirmationModalContent');
    const messageEl = document.getElementById('confirmationMessage');
    const confirmBtn = document.getElementById('confirmationConfirm');
    const cancelBtn = document.getElementById('confirmationCancel');
    
    messageEl.textContent = message;
    
    // Show modal with animation
    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
    
    // Handle confirm
    const handleConfirm = () => {
        hideConfirmation();
        onConfirm();
    };
    
    // Handle cancel
    const handleCancel = () => {
        hideConfirmation();
    };
    
    // Remove existing listeners and add new ones
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    
    document.getElementById('confirmationConfirm').addEventListener('click', handleConfirm);
    document.getElementById('confirmationCancel').addEventListener('click', handleCancel);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) handleCancel();
    });
}

function hideConfirmation() {
    const modal = document.getElementById('confirmationModal');
    const content = document.getElementById('confirmationModalContent');
    
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Dashboard initializing...');
    
    // Check if we're already authenticated (fallback)
    const teacherData = localStorage.getItem('teacherData');
    if (teacherData) {
        console.log('📱 Found stored teacher data');
    }
});

console.log('✅ Dashboard script loaded');
