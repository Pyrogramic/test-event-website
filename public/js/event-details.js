// Event Details JavaScript
class EventDetailsManager {
    constructor() {
        this.eventId = this.getEventIdFromURL();
        this.event = null;
        this.groupMemberCount = 0;
        this.init();
    }

    getEventIdFromURL() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    init() {
        this.loadEventDetails();
    }

    async loadEventDetails() {
        try {
            const response = await fetch(`/api/events/${this.eventId}`);
            
            if (!response.ok) {
                throw new Error('Event not found');
            }
            
            this.event = await response.json();
            this.renderEventDetails();
            this.renderRegistrationForm();
        } catch (error) {
            console.error('Error loading event:', error);
            this.showError('Failed to load event details');
        }
    }

    renderEventDetails() {
        const container = document.getElementById('eventDetails');
        const eventDate = new Date(this.event.eventDate);
        const registrationDeadline = new Date(this.event.registrationDeadline);
        
        container.innerHTML = `
            <div class="event-header">
                <h1>${this.event.title}</h1>
                <span class="event-card-badge ${this.event.registrationType === 'group' ? 'badge-group' : 'badge-individual'}">
                    ${this.event.registrationType} Registration
                </span>
            </div>
            
            <div class="event-meta">
                <div class="event-meta-item">
                    <div class="event-meta-label">Event Date</div>
                    <div class="event-meta-value">${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString()}</div>
                </div>
                
                <div class="event-meta-item">
                    <div class="event-meta-label">Venue</div>
                    <div class="event-meta-value">${this.event.venue}</div>
                </div>
                
                <div class="event-meta-item">
                    <div class="event-meta-label">Registration Deadline</div>
                    <div class="event-meta-value">${registrationDeadline.toLocaleDateString()} at ${registrationDeadline.toLocaleTimeString()}</div>
                </div>
                
                <div class="event-meta-item">
                    <div class="event-meta-label">Registration Type</div>
                    <div class="event-meta-value">${this.event.registrationType}</div>
                </div>
                
                ${this.event.maxParticipants ? `
                    <div class="event-meta-item">
                        <div class="event-meta-label">Max Participants</div>
                        <div class="event-meta-value">${this.event.maxParticipants}</div>
                    </div>
                ` : ''}
            </div>
            
            <div class="event-description">
                <h3>Description</h3>
                <p>${this.event.description}</p>
            </div>
        `;
    }

    renderRegistrationForm() {
        const container = document.getElementById('registrationFormContainer');
        const now = new Date();
        const registrationDeadline = new Date(this.event.registrationDeadline);
        const eventDate = new Date(this.event.eventDate);
        
        const isPastEvent = now > eventDate;
        const isRegistrationOpen = now < registrationDeadline;
        
        if (isPastEvent) {
            container.innerHTML = `
                <div class="registration-closed">
                    <h3>Event Completed</h3>
                    <p>This event has already taken place.</p>
                </div>
            `;
            return;
        }
        
        if (!isRegistrationOpen) {
            container.innerHTML = `
                <div class="registration-closed">
                    <h3>Registration Over</h3>
                    <p>Registration deadline has passed.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="registration-form">
                <h3>Register for Event</h3>
                <form id="registrationForm">
                    <div class="form-group">
                        <label for="studentName">Full Name *</label>
                        <input type="text" id="studentName" name="studentName" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="studentEmail">Email *</label>
                        <input type="email" id="studentEmail" name="studentEmail" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="studentId">Student ID *</label>
                        <input type="text" id="studentId" name="studentId" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="department">Department *</label>
                        <select id="department" name="department" required>
                            <option value="">Select Department</option>
                            <option value="CSE">Computer Science & Engineering</option>
                            <option value="ECE">Electronics & Communication</option>
                            <option value="EEE">Electrical & Electronics</option>
                            <option value="MECH">Mechanical Engineering</option>
                            <option value="CIVIL">Civil Engineering</option>
                            <option value="IT">Information Technology</option>
                            <option value="BBA">Bachelor of Business Administration</option>
                            <option value="MBA">Master of Business Administration</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="year">Year *</label>
                        <select id="year" name="year" required>
                            <option value="">Select Year</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                            <option value="PG">Post Graduate</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="phone">Phone Number *</label>
                        <input type="tel" id="phone" name="phone" required>
                    </div>
                    
                    ${this.event.registrationType === 'group' ? `
                        <div class="form-group">
                            <label>Group Members</label>
                            <div id="groupMembers">
                                <!-- Group members will be added here -->
                            </div>
                            <button type="button" id="addMemberBtn" class="btn btn-secondary btn-sm">Add Group Member</button>
                        </div>
                    ` : ''}
                    
                    <button type="submit" class="btn btn-primary btn-full">Register</button>
                </form>
            </div>
        `;

        this.setupFormHandlers();
    }

    setupFormHandlers() {
        const form = document.getElementById('registrationForm');
        const addMemberBtn = document.getElementById('addMemberBtn');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        if (addMemberBtn) {
            addMemberBtn.addEventListener('click', () => {
                this.addGroupMember();
            });
        }
    }

    addGroupMember() {
        this.groupMemberCount++;
        const container = document.getElementById('groupMembers');
        const memberDiv = document.createElement('div');
        memberDiv.className = 'group-member';
        memberDiv.innerHTML = `
            <button type="button" class="remove-member" onclick="this.parentElement.remove()">×</button>
            <div class="form-row">
                <div class="form-group">
                    <label>Member Name *</label>
                    <input type="text" name="groupMember${this.groupMemberCount}Name" required>
                </div>
                <div class="form-group">
                    <label>Student ID *</label>
                    <input type="text" name="groupMember${this.groupMemberCount}StudentId" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Department *</label>
                    <select name="groupMember${this.groupMemberCount}Department" required>
                        <option value="">Select Department</option>
                        <option value="CSE">Computer Science & Engineering</option>
                        <option value="ECE">Electronics & Communication</option>
                        <option value="EEE">Electrical & Electronics</option>
                        <option value="MECH">Mechanical Engineering</option>
                        <option value="CIVIL">Civil Engineering</option>
                        <option value="IT">Information Technology</option>
                        <option value="BBA">Bachelor of Business Administration</option>
                        <option value="MBA">Master of Business Administration</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Year *</label>
                    <select name="groupMember${this.groupMemberCount}Year" required>
                        <option value="">Select Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="PG">Post Graduate</option>
                    </select>
                </div>
            </div>
        `;
        
        container.appendChild(memberDiv);
    }

    async handleRegistration() {
        const form = document.getElementById('registrationForm');
        const formData = new FormData(form);
        
        const registrationData = {
            eventId: this.eventId,
            studentName: formData.get('studentName'),
            studentEmail: formData.get('studentEmail'),
            studentId: formData.get('studentId'),
            department: formData.get('department'),
            year: formData.get('year'),
            phone: formData.get('phone'),
            groupMembers: this.getGroupMembers(formData)
        };

        try {
            const response = await fetch('/api/registrations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registrationData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess(result.message);
                form.reset();
                document.getElementById('groupMembers').innerHTML = '';
                this.groupMemberCount = 0;
            } else {
                this.showError(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    getGroupMembers(formData) {
        const groupMembers = [];
        for (let i = 1; i <= this.groupMemberCount; i++) {
            const name = formData.get(`groupMember${i}Name`);
            const studentId = formData.get(`groupMember${i}StudentId`);
            const department = formData.get(`groupMember${i}Department`);
            const year = formData.get(`groupMember${i}Year`);
            
            if (name && studentId && department && year) {
                groupMembers.push({ name, studentId, department, year });
            }
        }
        return groupMembers;
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EventDetailsManager();
});