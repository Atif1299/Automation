// Enhanced JS for client dashboard

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar navigation functionality
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-tab');
            console.log('Nav item clicked:', targetTab); // Debug log
            
            // Remove active class from all nav items and contents
            navItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked nav item and corresponding content
            item.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
                console.log('Tab activated:', targetTab); // Debug log
            } else {
                console.error('Target tab content not found:', targetTab);
            }
            
            // Update progress steps (only for first 4 tabs)
            if (targetTab !== 'messages') {
                updateProgressStep(targetTab);
            }
            
            // Initialize messages functionality if messages tab is activated
            if (targetTab === 'messages') {
                initializeMessagesTab();
            }
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
            // messages tab doesn't need progress step
        };
        
        steps.forEach((step, index) => {
            if (index <= stepMap[currentTab]) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // Initialize messages tab functionality
    function initializeMessagesTab() {
        const messageForm = document.getElementById('message-form-tab');
        const messageInput = document.getElementById('message-input-tab');
        
        if (messageForm) {
            // Remove existing listener to avoid duplicates
            const newForm = messageForm.cloneNode(true);
            messageForm.parentNode.replaceChild(newForm, messageForm);
            
            // Add fresh event listener
            newForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const message = document.getElementById('message-input-tab').value.trim();
                if (!message) return;
                
                try {
                    // Get current client ID from URL
                    const currentPath = window.location.pathname;
                    const clientId = currentPath.split('/')[2];
                    
                    console.log('Current path:', currentPath);
                    console.log('Extracted client ID:', clientId);
                    console.log('Sending to URL:', `/client/${clientId}/send-message`);
                    
                    const response = await fetch(`/client/${clientId}/send-message`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ message })
                    });
                    
                    if (response.ok) {
                        // Add message to chat
                        addMessageToTabChat(message, 'client');
                        
                        // Clear input
                        document.getElementById('message-input-tab').value = '';
                        
                        // Show success feedback
                        showNotification('Message sent successfully!', 'success');
                    } else {
                        // Get error details from server
                        const errorData = await response.json();
                        console.error('Server response:', response.status, errorData);
                        throw new Error(errorData.error || 'Failed to send message');
                    }
                } catch (error) {
                    console.error('Error sending message:', error);
                    showNotification('Failed to send message. Please try again.', 'error');
                }
            });
        }
    }

    // Add message to tab chat
    function addMessageToTabChat(message, sender) {
        const messagesList = document.getElementById('messages-list-tab');
        const noMessages = messagesList.querySelector('.no-messages-tab');
        
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
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <div class="avatar admin-avatar">A</div>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">Admin</span>
                        <span class="message-time">${now}</span>
                    </div>
                    <div class="message-text">${message}</div>
                </div>
            `;
        }
        
        messagesList.appendChild(messageDiv);
        
        // Auto-scroll to bottom
        const conversationArea = document.querySelector('.conversation-area-tab');
        conversationArea.scrollTop = conversationArea.scrollHeight;
    }

    // Show notification
    function showNotification(message, type) {
        // You can implement a toast notification here
        console.log(`${type.toUpperCase()}: ${message}`);
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
    
    // Load real activity logs from API
    function loadActivityLogs() {
        const clientId = window.location.pathname.split('/').pop();
        
        fetch(`/client/${clientId}/logs`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.logs) {
                    displayActivityLogs(data.logs);
                } else {
                    console.error('Failed to load activity logs:', data.error);
                }
            })
            .catch(error => {
                console.error('Error loading activity logs:', error);
            });
    }
    
    function displayActivityLogs(logs) {
        const activityWindow = document.getElementById('activity-window');
        if (!activityWindow) return;
        
        // Clear existing logs
        activityWindow.innerHTML = '';
        
        if (logs.length === 0) {
            activityWindow.innerHTML = '<p class="no-logs">No activity logs available.</p>';
            return;
        }
        
        logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${log.type}`;
            
            const timeStr = new Date(log.timestamp).toLocaleString();
            
            let logHTML = `
                <div class="log-header">
                    <span class="log-time">${timeStr}</span>
                    <span class="log-type ${log.type}">${log.type.toUpperCase()}</span>
                    ${log.source ? `<span class="log-source ${log.source}">${log.source.toUpperCase()}</span>` : ''}
                </div>
                <div class="log-message">${log.message}</div>
            `;
            
            // Add details if available
            if (log.details) {
                logHTML += `
                    <div class="log-details" style="display: none;">
                        <pre>${log.details}</pre>
                    </div>
                `;
            }
            
            // Add file download link if it's an admin file
            if (log.fileInfo && log.fileInfo.downloadPath) {
                logHTML += `
                    <div class="log-file-info">
                        <i class="fas fa-file-download"></i>
                        <a href="${log.fileInfo.downloadPath}" download="${log.fileInfo.originalName}" class="file-download-link">
                            Download: ${log.fileInfo.originalName}
                        </a>
                        <span class="file-category">(${log.fileInfo.category})</span>
                    </div>
                `;
            }
            
            logEntry.innerHTML = logHTML;
            
            // Add click event for expanding details
            logEntry.addEventListener('click', () => {
                const details = logEntry.querySelector('.log-details');
                if (details) {
                    details.style.display = details.style.display === 'none' ? 'block' : 'none';
                }
            });
            
            activityWindow.appendChild(logEntry);
        });
    }
    
    // Load logs when Activity Monitor tab is opened
    if (document.getElementById('activity-monitor')) {
        loadActivityLogs();
        
        // Reload logs every 30 seconds for real-time updates
        setInterval(loadActivityLogs, 30000);
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
        
        // Check if activity window exists (not in messages view)
        if (!activityWindow) {
            console.log(`Log Entry (${type}): ${message}`);
            return;
        }
        
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
            
            const formData = new FormData();
            formData.append('file', file);

            // Send file to server
            const response = await fetch(`/client/${clientId}/upload`, {
                method: 'POST',
                body: formData
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
    
    // Simple sidebar navigation for existing tabs
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('href').substring(1); // Remove #
            
            // Activate the corresponding tab
            const targetTab = document.querySelector(`[data-tab="${targetSection}"]`);
            if (targetTab) {
                targetTab.click();
            }
        });
    });

    // OLD COMPLEX NAVIGATION FUNCTIONS - DISABLED FOR SIMPLE TAB APPROACH
    /*
    // Function to load dashboard content
    async function loadDashboardContent(activeTab = 'credentials') {
        try {
            showDashboardLoadingState();
            
            // Get current client ID from URL
            const currentPath = window.location.pathname;
            const clientId = currentPath.split('/')[2];
            
            // Fetch dashboard content
            const response = await fetch(`/client/${clientId}`);
            
            if (!response.ok) {
                throw new Error('Failed to load dashboard');
            }
            
            const html = await response.text();
            
            // Extract dashboard content from the response
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const dashboardHTML = tempDiv.querySelector('.dashboard-content');
            
            if (dashboardHTML) {
                // Replace main content with smooth transition
                await replaceDashboardContent(dashboardHTML.innerHTML);
                
                // Reinitialize dashboard functionality - DISABLED FOR SIMPLE TAB APPROACH
                // initializeDashboard();
                
                // Activate the correct tab
                setTimeout(() => {
                    const targetTab = document.querySelector(`[data-tab="${activeTab}"]`);
                    if (targetTab) {
                        targetTab.click();
                    }
                }, 100);
                
                // Update sidebar active state
                updateSidebarActiveState(activeTab);
                
                // Update page title
                document.title = 'Client Dashboard';
            } else {
                throw new Error('Dashboard content not found');
            }
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            showErrorState('Failed to load dashboard. Please try again.');
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

    // Function to replace dashboard content with smooth transition
    async function replaceDashboardContent(newHTML) {
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

    // Function to show dashboard loading state
    function showDashboardLoadingState() {
        const mainContent = document.querySelector('.main-content');
        const dashboardContent = mainContent.querySelector('.dashboard-content');
        
        dashboardContent.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading dashboard...</p>
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
    
    // Function to reinitialize dashboard functionality after dynamic loading
    function initializeDashboard() {
        // Re-initialize tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            // Remove existing listeners to avoid duplicates
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                this.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
                
                // Update URL hash without triggering page reload
                if (history.pushState) {
                    history.pushState(null, null, `#${targetTab}`);
                }
                
                // Update sidebar active state
                updateSidebarActiveState(targetTab);
            });
        });

        // Re-initialize file upload functionality
        const fileInput = document.getElementById('file-upload');
        const uploadBtn = document.getElementById('upload-btn');
        const uploadProgress = document.getElementById('upload-progress');
        
        if (uploadBtn) {
            // Remove existing listeners
            const newUploadBtn = uploadBtn.cloneNode(true);
            uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
            
            newUploadBtn.addEventListener('click', function() {
                fileInput.click();
            });
        }

        if (fileInput) {
            // Remove existing listeners
            const newFileInput = fileInput.cloneNode(true);
            fileInput.parentNode.replaceChild(newFileInput, fileInput);
            
            newFileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    uploadFile(this.files[0]);
                }
            });
        }

        // Re-initialize any other dashboard-specific functionality here
        console.log('Dashboard functionality reinitialized');
    }

    // END OF OLD COMPLEX FUNCTIONS */

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

// Logout functionality (global function)
function handleLogout(event) {
    event.preventDefault();
    
    // Clear any stored authentication data immediately
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    
    // Clear any client-specific data
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientData');
    
    // Redirect to landing page immediately (no confirmation)
    window.location.href = '/';
}
