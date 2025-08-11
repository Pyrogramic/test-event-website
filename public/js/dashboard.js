// Dashboard JavaScript
class DashboardManager {
    constructor() {
        this.currentTab = 'overview';
        this.registrations = [];
        this.events = [];
        this.admins = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadInitialData();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token || !user.id) {
            window.location.href = '/login';
            return;
        }

        // Update UI based on user role
        if (user.role === 'owner') {
            document.body.classList.add('owner');
        }
        
        document.getElementById('navUser').textContent = `${user.role.toUpperCase()}: ${user.userId}`;
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.dashboard-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Modal handlers
        this.setupModalHandlers();

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.setFilter(filter);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        });
    }

    setupModalHandlers() {
        // Event modal
        const eventModal = document.getElementById('eventModal');
        const createEventBtn = document.getElementById('createEventBtn');
        const eventForm = document.getElementById('eventForm');
        
        createEventBtn?.addEventListener('click', () => {
            this.openEventModal();
        });

        eventForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEventSubmit();
        });

        // Admin modal
        const adminModal = document.getElementById('adminModal');
        const createAdminBtn = document.getElementById('createAdminBtn');
        const adminForm = document.getElementById('adminForm');
        
        createAdminBtn?.addEventListener('click', () => {
            this.openAdminModal();
        });

        adminForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminSubmit();
        });

        // Close modal handlers
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update navigation
        document.querySelectorAll('.dashboard-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.dashboard-tab').forEach(tabContent => {
            tabContent.classList.remove('active');
        });
        document.getElementById(tab).classList.add('active');

        // Load data for the current tab
        this.loadTabData(tab);
    }

    async loadInitialData() {
        await this.loadStats();
        this.loadTabData(this.currentTab);
    }

    async loadTabData(tab) {
        switch (tab) {
            case 'events':
                await this.loadEvents();
                break;
            case 'registrations':
                await this.loadRegistrations();
                break;
            case 'admins':
                await this.loadAdmins();
                break;
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: this.getAuthHeaders()
            });
            
            const stats = await response.json();
            this.renderStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
            this.showError('Failed to load statistics');
        }
    }

    async loadEvents() {
        try {
            const response = await fetch('/api/events', {
                headers: this.getAuthHeaders()
            });
            
            const data = await response.json();
            this.events = [...data.upcoming, ...data.past];
            this.renderEvents();
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('Failed to load events');
        }
    }

    async loadRegistrations() {
        try {
            const response = await fetch('/api/admin/registrations', {
                headers: this.getAuthHeaders()
            });
            
            const data = await response.json();
            this.registrations = data.all;
            this.renderRegistrations();
        } catch (error) {
            console.error('Error loading registrations:', error);
            this.showError('Failed to load registrations');
        }
    }

    async loadAdmins() {
        try {
            const response = await fetch('/api/admin/admins', {
                headers: this.getAuthHeaders()
            });
            
            this.admins = await response.json();
            this.renderAdmins();
        } catch (error) {
            console.error('Error loading admins:', error);
            this.showError('Failed to load admins');
        }
    }

    renderStats(stats) {
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <h3>Total Events</h3>
                <p class="stat-number">${stats.totalEvents}</p>
            </div>
            <div class="stat-card">
                <h3>Upcoming Events</h3>
                <p class="stat-number">${stats.upcomingEvents}</p>
            </div>
            <div class="stat-card">
                <h3>Total Registrations</h3>
                <p class="stat-number">${stats.totalRegistrations}</p>
            </div>
            <div class="stat-card">
                <h3>Pending Approvals</h3>
                <p class="stat-number">${stats.pendingRegistrations}</p>
            </div>
        `;
    }

    renderEvents() {
        const eventsList = document.getElementById('eventsList');
        
        if (this.events.length === 0) {
            eventsList.innerHTML = '<div class="text-center">No events found.</div>';
            return;
        }

        eventsList.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.events.map(event => this.createEventRow(event)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    createEventRow(event) {
        const eventDate = new Date(event.eventDate);
        const registrationDeadline = new Date(event.registrationDeadline);
        const now = new Date();
        
        const isUpcoming = eventDate > now;
        const isRegistrationOpen = registrationDeadline > now;
        
        let status = 'Past';
        if (isUpcoming) {
            status = isRegistrationOpen ? 'Registration Open' : 'Registration Closed';
        }

        return `
            <tr>
                <td>
                    <strong>${event.title}</strong><br>
                    <small style="color: var(--gray-600);">${event.venue}</small>
                </td>
                <td>${eventDate.toLocaleDateString()}</td>
                <td>
                    <span class="event-card-badge ${event.registrationType === 'group' ? 'badge-group' : 'badge-individual'}">
                        ${event.registrationType}
                    </span>
                </td>
                <td>
                    <span class="registration-status ${isUpcoming ? (isRegistrationOpen ? 'status-approved' : 'status-pending') : 'status-declined'}">
                        ${status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="dashboard.editEvent('${event._id}')">Edit</button>
                    <button class="btn btn-error btn-sm ml-2" onclick="dashboard.deleteEvent('${event._id}')">Delete</button>
                </td>
            </tr>
        `;
    }

    renderRegistrations() {
        const container = document.getElementById('registrationsContainer');
        
        let filteredRegistrations = this.registrations;
        if (this.currentFilter !== 'all') {
            filteredRegistrations = this.registrations.filter(reg => reg.status === this.currentFilter);
        }

        if (filteredRegistrations.length === 0) {
            container.innerHTML = '<div class="text-center">No registrations found.</div>';
            return;
        }

        container.innerHTML = filteredRegistrations.map(reg => this.createRegistrationCard(reg)).join('');
    }

    createRegistrationCard(registration) {
        const eventDate = new Date(registration.event.eventDate);
        
        return `
            <div class="registration-card ${registration.status}">
                <div class="registration-header">
                    <div class="registration-info">
                        <h4>${registration.studentName}</h4>
                        <p>${registration.event.title} - ${eventDate.toLocaleDateString()}</p>
                    </div>
                    <span class="registration-status status-${registration.status}">${registration.status}</span>
                </div>
                
                <div class="registration-details">
                    <div>
                        <strong>Email:</strong> ${registration.studentEmail}
                    </div>
                    <div>
                        <strong>Student ID:</strong> ${registration.studentId}
                    </div>
                    <div>
                        <strong>Department:</strong> ${registration.department}
                    </div>
                    <div>
                        <strong>Year:</strong> ${registration.year}
                    </div>
                    <div>
                        <strong>Phone:</strong> ${registration.phone}
                    </div>
                    <div>
                        <strong>Registration Type:</strong> ${registration.event.registrationType}
                    </div>
                </div>

                ${registration.groupMembers && registration.groupMembers.length > 0 ? `
                    <div style="margin-top: 16px;">
                        <strong>Group Members:</strong>
                        <ul style="margin-left: 20px; margin-top: 8px;">
                            ${registration.groupMembers.map(member => `
                                <li>${member.name} (${member.studentId}) - ${member.department}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${registration.status === 'pending' ? `
                    <div class="registration-actions">
                        <button class="btn btn-success btn-sm" onclick="dashboard.updateRegistrationStatus('${registration._id}', 'approved')">
                            Approve
                        </button>
                        <button class="btn btn-error btn-sm" onclick="dashboard.updateRegistrationStatus('${registration._id}', 'declined')">
                            Decline
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderAdmins() {
        const adminsList = document.getElementById('adminsList');
        
        if (this.admins.length === 0) {
            adminsList.innerHTML = '<div class="text-center">No admins found.</div>';
            return;
        }

        adminsList.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.admins.map(admin => `
                            <tr>
                                <td><strong>${admin.userId}</strong></td>
                                <td>
                                    <span class="registration-status ${admin.isActive ? 'status-approved' : 'status-declined'}">
                                        ${admin.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>${new Date(admin.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn ${admin.isActive ? 'btn-warning' : 'btn-success'} btn-sm" 
                                            onclick="dashboard.toggleAdminStatus('${admin._id}')">
                                        ${admin.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Re-render registrations
        this.renderRegistrations();
    }

    openEventModal(event = null) {
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        const title = document.getElementById('eventModalTitle');
        
        if (event) {
            title.textContent = 'Edit Event';
            this.populateEventForm(event);
        } else {
            title.textContent = 'Create Event';
            form.reset();
        }
        
        modal.classList.add('active');
    }

    openAdminModal() {
        const modal = document.getElementById('adminModal');
        const form = document.getElementById('adminForm');
        
        form.reset();
        modal.classList.add('active');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    async handleEventSubmit() {
        const form = document.getElementById('eventForm');
        const formData = new FormData(form);
        
        const eventData = {
            title: formData.get('title'),
            description: formData.get('description'),
            eventDate: formData.get('eventDate'),
            registrationDeadline: formData.get('registrationDeadline'),
            registrationType: formData.get('registrationType'),
            venue: formData.get('venue'),
            maxParticipants: formData.get('maxParticipants') || null
        };

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                this.closeModals();
                this.loadEvents();
                this.showSuccess('Event created successfully');
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to create event');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async handleAdminSubmit() {
        const form = document.getElementById('adminForm');
        const formData = new FormData(form);
        
        const adminData = {
            userId: formData.get('userId'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/auth/create-admin', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(adminData)
            });

            if (response.ok) {
                this.closeModals();
                this.loadAdmins();
                this.showSuccess('Admin created successfully');
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to create admin');
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async updateRegistrationStatus(registrationId, status) {
        try {
            const response = await fetch(`/api/admin/registrations/${registrationId}/status`, {
                method: 'PATCH',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                this.loadRegistrations();
                this.showSuccess(`Registration ${status} successfully`);
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to update registration');
            }
        } catch (error) {
            console.error('Error updating registration:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async toggleAdminStatus(adminId) {
        try {
            const response = await fetch(`/api/admin/admins/${adminId}/toggle`, {
                method: 'PATCH',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.loadAdmins();
                this.showSuccess('Admin status updated successfully');
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to update admin status');
            }
        } catch (error) {
            console.error('Error updating admin status:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async editEvent(eventId) {
        // This would open the event modal with the event data
        const event = this.events.find(e => e._id === eventId);
        if (event) {
            this.openEventModal(event);
        }
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.loadEvents();
                this.showSuccess('Event deleted successfully');
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            this.showError('Network error. Please try again.');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
            z-index: 1000;
            box-shadow: var(--shadow-lg);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Global instance for event handlers
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new DashboardManager();
});