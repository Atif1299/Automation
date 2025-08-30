// Enhanced JS for client dashboard

document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Update progress steps
            updateProgressStep(targetTab);
        });
    });
    
    // Progress step update
    function updateProgressStep(currentTab) {
        const steps = document.querySelectorAll('.step');
        const stepMap = {
            'credentials': 0,
            'upload': 1,
            'note': 2,
            'activity': 3
        };
        
        steps.forEach((step, index) => {
            if (index <= stepMap[currentTab]) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }
    
    // File upload functionality
    const fileDropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('csvFile');
    const fileInfo = document.getElementById('fileInfo');
    const browseLink = document.querySelector('.browse-link');
    
    // Click to browse files
    browseLink.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileDropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop functionality
    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.classList.add('dragover');
    });
    
    fileDropZone.addEventListener('dragleave', () => {
        fileDropZone.classList.remove('dragover');
    });
    
    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    function handleFileSelect(file) {
        if (file.type !== 'text/csv') {
            alert('Please select a CSV file');
            return;
        }
        
        // Show file info
        fileInfo.style.display = 'block';
        fileInfo.querySelector('.file-name').textContent = file.name;
        fileInfo.querySelector('.file-size').textContent = formatFileSize(file.size);
        
        // Simulate upload progress
        simulateUpload();
    }
    
    function simulateUpload() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            
            progressFill.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
        }, 200);
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Activity log functionality
    const logEntries = document.querySelectorAll('.log-entry');
    logEntries.forEach(entry => {
        entry.addEventListener('click', () => {
            const details = entry.querySelector('.log-details');
            if (details) {
                details.style.display = details.style.display === 'none' ? 'block' : 'none';
            }
        });
    });
    
    // Log filtering
    document.getElementById('log-filter').addEventListener('change', function() {
        const filterValue = this.value;
        const logs = document.querySelectorAll('.log-entry');
        
        logs.forEach(log => {
            if (filterValue === 'all') {
                log.style.display = 'block';
            } else {
                const logType = log.querySelector('.log-type').classList.contains(filterValue);
                log.style.display = logType ? 'block' : 'none';
            }
        });
    });
    
    // Export logs
    document.getElementById('export-logs').addEventListener('click', function() {
        const logs = document.querySelectorAll('.log-entry');
        let logData = 'Time,Type,Message\n';
        
        logs.forEach(log => {
            const time = log.querySelector('.log-time').textContent;
            const type = log.querySelector('.log-type').textContent;
            const message = log.querySelector('.log-message').textContent;
            logData += `"${time}","${type}","${message}"\n`;
        });
        
        const blob = new Blob([logData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `automation-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    });
    
    // Clear logs
    document.getElementById('clear-logs').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all logs?')) {
            document.getElementById('activity-window').innerHTML = '<p>No logs available.</p>';
        }
    });
    
    // Add new log entry function
    function addLogEntry(type, message, details = null) {
        const activityWindow = document.getElementById('activity-window');
        const now = new Date();
        const timeStr = now.toISOString().replace('T', ' ').split('.')[0];
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <div class="log-header">
                <span class="log-time">${timeStr}</span>
                <span class="log-type ${type}">${type.toUpperCase()}</span>
            </div>
            <div class="log-message">${message}</div>
            ${details ? `<div class="log-details" style="display: none;"><pre>${details}</pre></div>` : ''}
        `;
        
        // Add click handler for details
        if (details) {
            logEntry.addEventListener('click', () => {
                const detailsEl = logEntry.querySelector('.log-details');
                detailsEl.style.display = detailsEl.style.display === 'none' ? 'block' : 'none';
            });
        }
        
        // Insert at top
        if (activityWindow.firstChild && activityWindow.firstChild.tagName) {
            activityWindow.insertBefore(logEntry, activityWindow.firstChild);
        } else {
            activityWindow.innerHTML = '';
            activityWindow.appendChild(logEntry);
        }
    }
    
    // Form submissions
    document.getElementById('save-credentials').addEventListener('click', async function(e) {
        e.preventDefault();
        
        // Get credential data
        const credentialData = {
            platform: document.getElementById('platform').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        };
        
        // Validate required fields
        if (!credentialData.platform || !credentialData.username || !credentialData.password) {
            alert('Please fill in all required fields');
            return;
        }
        
        try {
            // Show loading state
            this.textContent = 'Saving...';
            this.disabled = true;
            
            // Get client ID from URL
            const clientId = window.location.pathname.split('/')[2];
            
            // Send credentials to server
            const response = await fetch(`/client/${clientId}/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentialData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                addLogEntry('success', `Credentials saved for ${credentialData.platform} - ${credentialData.username}`);
                addLogEntry('info', 'Credentials forwarded to admin dashboard');
                
                // Reset form
                document.getElementById('platform').value = '';
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
                
                // Switch to upload tab
                document.querySelector('[data-tab="upload"]').click();
            } else {
                addLogEntry('error', result.error || 'Failed to save credentials');
            }
        } catch (error) {
            console.error('Error saving credentials:', error);
            addLogEntry('error', 'Network error while saving credentials');
        } finally {
            // Reset button state
            this.textContent = 'Save & Continue';
            this.disabled = false;
        }
    });
    
    document.getElementById('upload-file').addEventListener('click', async function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file first');
            return;
        }
        
        try {
            // Show loading state
            this.textContent = 'Uploading...';
            this.disabled = true;
            
            // Get client ID from URL
            const clientId = window.location.pathname.split('/')[2];
            
            // Send file info to server
            const response = await fetch(`/client/${clientId}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                addLogEntry('info', 'File uploaded and validated');
                // Switch to configuration tab
                document.querySelector('[data-tab="note"]').click();
            } else {
                addLogEntry('error', result.error || 'Failed to upload file');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            addLogEntry('error', 'Network error while uploading file');
        } finally {
            // Reset button state
            this.textContent = 'Upload & Validate';
            this.disabled = false;
        }
    });
    
    document.getElementById('save-config').addEventListener('click', async function(e) {
        e.preventDefault();
        
        const configData = {
            campaignName: document.getElementById('campaign-name').value,
            automationType: document.getElementById('automation-type').value,
            instructions: document.getElementById('client-note').value
        };
        
        if (!configData.campaignName || !configData.automationType) {
            alert('Please fill in campaign name and automation type');
            return;
        }
        
        try {
            // Show loading state
            this.textContent = 'Saving...';
            this.disabled = true;
            
            // Get client ID from URL
            const clientId = window.location.pathname.split('/')[2];
            
            // Send configuration to server
            const response = await fetch(`/client/${clientId}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(configData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                addLogEntry('info', 'Configuration saved');
                // Switch to activity tab
                document.querySelector('[data-tab="activity"]').click();
            } else {
                addLogEntry('error', result.error || 'Failed to save configuration');
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
            addLogEntry('error', 'Network error while saving configuration');
        } finally {
            // Reset button state
            this.textContent = 'Save Configuration';
            this.disabled = false;
        }
    });
    
    // Admin Messages sidebar link handler
    const adminMessagesLink = document.querySelector('.admin-messages-link');
    if (adminMessagesLink) {
        adminMessagesLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get current client ID from URL or data attribute
            const currentPath = window.location.pathname;
            const clientId = currentPath.split('/')[2]; // Extract client ID from /client/:id
            
            if (clientId) {
                loadMessagesContent(clientId);
            } else {
                console.error('Client ID not found');
            }
        });
    }

    // Handle other sidebar links to return to dashboard
    const sidebarLinks = document.querySelectorAll('.sidebar a:not(.admin-messages-link)');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('href').substring(1); // Remove #
            
            // If we're in messages view, reload the dashboard
            if (document.querySelector('.messages-container')) {
                loadDashboardContent(targetSection);
            } else {
                // Normal tab switching
                const targetTab = document.querySelector(`[data-tab="${targetSection}"]`);
                if (targetTab) {
                    targetTab.click();
                }
            }
        });
    });

    // Function to load dashboard content
    async function loadDashboardContent(activeTab = 'credentials') {
        try {
            showLoadingState();
            
            // Update sidebar active state
            updateSidebarActiveState(activeTab);
            
            // Get original dashboard content (you might want to store this or fetch it)
            location.reload(); // For now, reload to get back to dashboard
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            showErrorState('Failed to load dashboard. Please refresh the page.');
        }
    }

    // Function to load messages content via AJAX
    async function loadMessagesContent(clientId) {
        try {
            // Show loading state
            showLoadingState();
            
            // Update sidebar active state
            updateSidebarActiveState('messages');
            
            // Fetch messages content
            const response = await fetch(`/client/${clientId}/messages-content`);
            
            if (!response.ok) {
                throw new Error('Failed to load messages');
            }
            
            const messagesHTML = await response.text();
            
            // Replace main content with smooth transition
            await replaceMainContent(messagesHTML);
            
            // Initialize messages functionality
            initializeMessagesPage(clientId);
            
            // Update page title
            document.title = 'Admin Messages - Client Dashboard';
            
        } catch (error) {
            console.error('Error loading messages:', error);
            showErrorState('Failed to load messages. Please try again.');
        }
    }

    // Function to replace main content with smooth transition
    async function replaceMainContent(newHTML) {
        const mainContent = document.querySelector('.main-content');
        const dashboardContent = mainContent.querySelector('.dashboard-content');
        
        // Fade out current content
        dashboardContent.style.opacity = '0';
        dashboardContent.style.transform = 'translateY(20px)';
        
        // Wait for fade out animation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Replace content
        dashboardContent.innerHTML = newHTML;
        
        // Fade in new content
        dashboardContent.style.opacity = '1';
        dashboardContent.style.transform = 'translateY(0)';
    }

    // Function to show loading state
    function showLoadingState() {
        const mainContent = document.querySelector('.main-content');
        const dashboardContent = mainContent.querySelector('.dashboard-content');
        
        dashboardContent.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading messages...</p>
            </div>
        `;
    }

    // Function to show error state
    function showErrorState(message) {
        const mainContent = document.querySelector('.main-content');
        const dashboardContent = mainContent.querySelector('.dashboard-content');
        
        dashboardContent.innerHTML = `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">Retry</button>
            </div>
        `;
    }

    // Function to update sidebar active state
    function updateSidebarActiveState(activeSection) {
        // Remove active class from all sidebar links
        document.querySelectorAll('.sidebar a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current section
        if (activeSection === 'messages') {
            document.querySelector('.admin-messages-link').classList.add('active');
        } else {
            // For dashboard tabs, find the corresponding sidebar link
            const sidebarLink = document.querySelector(`.sidebar a[href="#${activeSection}"]`);
            if (sidebarLink) {
                sidebarLink.classList.add('active');
            }
        }
    }

    // Function to initialize messages page functionality
    function initializeMessagesPage(clientId) {
        // Handle message form submission
        const messageForm = document.getElementById('message-form');
        if (messageForm) {
            messageForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const messageInput = document.getElementById('message-input');
                const message = messageInput.value.trim();
                
                if (!message) return;
                
                try {
                    const response = await fetch(`/client/${clientId}/send-message`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ message })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Add message to chat immediately for better UX
                        addMessageToChat(message, 'client');
                        messageInput.value = '';
                        
                        // Show success notification
                        showNotification('Message sent successfully!', 'success');
                    } else {
                        showNotification('Failed to send message: ' + result.error, 'error');
                    }
                } catch (error) {
                    console.error('Error sending message:', error);
                    showNotification('Failed to send message. Please try again.', 'error');
                }
            });
        }

        // Auto-resize textarea
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
        }
    }

    // Function to add message to chat UI
    function addMessageToChat(message, sender) {
        const messagesList = document.getElementById('messages-list');
        const noMessages = messagesList.querySelector('.no-messages');
        
        if (noMessages) {
            noMessages.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const now = new Date().toLocaleString();
        
        if (sender === 'client') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">You</span>
                        <span class="message-time">${now}</span>
                    </div>
                    <div class="message-text">${message}</div>
                </div>
                <div class="message-avatar">
                    <div class="avatar client-avatar">C</div>
                </div>
            `;
        }
        
        messagesList.appendChild(messageDiv);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    // Function to show notifications
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 1rem;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
    
    // Real-time updates simulation
    setInterval(() => {
        const messages = [
            'Processing contact data...',
            'Enriching contact information...',
            'Validating email addresses...',
            'Updating campaign status...'
        ];
        
        if (Math.random() > 0.7) { // 30% chance every 5 seconds
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            addLogEntry('info', randomMessage);
        }
    }, 5000);
});
