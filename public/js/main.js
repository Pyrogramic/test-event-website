// Main JavaScript for homepage
class EventManager {
    constructor() {
        this.events = { upcoming: [], past: [] };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadEvents();
        this.setupMobileMenu();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    setupMobileMenu() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    async loadEvents() {
        try {
            const response = await fetch('/api/events');
            const data = await response.json();
            
            this.events = data;
            this.renderEvents('upcoming', data.upcoming);
            this.renderEvents('past', data.past);
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('upcoming');
            this.showError('past');
        }
    }

    renderEvents(type, events) {
        const container = document.getElementById(`${type}Events`);
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="text-center">
                    <p>No ${type} events found.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = events.map(event => this.createEventCard(event, type === 'past')).join('');
    }

    createEventCard(event, isPast) {
        const eventDate = new Date(event.eventDate);
        const registrationDeadline = new Date(event.registrationDeadline);
        const now = new Date();
        
        const isRegistrationOpen = now < registrationDeadline && !isPast;
        
        const registrationBadge = event.registrationType === 'group' 
            ? '<span class="event-card-badge badge-group">Group</span>'
            : '<span class="event-card-badge badge-individual">Individual</span>';
            
        const statusBadge = isPast 
            ? '<span class="event-card-badge badge-past">Past Event</span>'
            : isRegistrationOpen 
                ? ''
                : '<span class="event-card-badge badge-closed">Registration Closed</span>';

        return `
            <div class="event-card">
                <div class="event-card-header">
                    <h3 class="event-card-title">${event.title}</h3>
                    <div class="event-card-meta">
                        <span>📅 ${eventDate.toLocaleDateString()}</span>
                        <span>📍 ${event.venue}</span>
                        <span>👤 ${event.registrationType}</span>
                    </div>
                </div>
                
                <div class="event-card-content">
                    <p class="event-card-description">${event.description}</p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${registrationBadge}
                        ${statusBadge}
                    </div>
                </div>
                
                <div class="event-card-actions">
                    <a href="/event/${event._id}" class="btn btn-primary">View Details</a>
                    ${!isPast && isRegistrationOpen ? `<a href="/event/${event._id}" class="btn btn-secondary">Register Now</a>` : ''}
                </div>
            </div>
        `;
    }

    showError(type) {
        const container = document.getElementById(`${type}Events`);
        container.innerHTML = `
            <div class="text-center">
                <p style="color: var(--error);">Error loading events. Please try again later.</p>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EventManager();
});