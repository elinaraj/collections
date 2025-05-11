// Notification Management
class NotificationManager {
    static show(message, type = 'success', duration = 5000) {
        // Get the notification container
        const container = document.getElementById('notification-container');
        
        // Create a new notification pill
        const pill = document.createElement('div');
        pill.classList.add('notification-pill', type, 'show');
        pill.textContent = message;
        
        // Add the pill to the container
        container.appendChild(pill);
        
        // Remove the pill after duration
        setTimeout(() => {
            pill.classList.remove('show');
            
            // Wait for transition to complete before removing
            setTimeout(() => {
                container.removeChild(pill);
            }, 300);
        }, duration);
    }
    
    // Convenience methods for different types of notifications
    static success(message, duration) {
        this.show(message, 'success', duration);
    }
    
    static error(message, duration) {
        this.show(message, 'error', duration);
    }
    
    static warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    static info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// Make the notification manager globally accessible
window.NotificationManager = NotificationManager;
