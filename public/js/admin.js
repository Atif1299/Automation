// Admin Dashboard JavaScript Functions

// Tab Management
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Add active class to clicked tab button
    const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
}

// Client Management Functions
function viewClientDetails(clientId) {
    // Show loading state
    showLoadingInModal();
    
    // Show modal first
    const modal = document.getElementById('clientDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
    
    // Load real client data from API
    loadClientData(clientId);
}

function showLoadingInModal() {
    const loadingHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; color: var(--primary-color);"></i>
            <p>Loading client details...</p>
        </div>
    `;
    
    // Show loading in all tabs
    ['overview', 'platforms', 'credentials', 'configurations'].forEach(tabId => {
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.innerHTML = loadingHTML;
        }
    });
}

function loadClientData(clientId) {
    // Fetch real data from API
    fetch(`/admin/clients/${clientId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateClientDetailsModal(data.client);
            } else {
                showErrorInModal(data.message || 'Failed to load client data');
            }
        })
        .catch(error => {
            console.error('Error fetching client data:', error);
            showErrorInModal('Failed to connect to server');
        });
}

function showErrorInModal(message) {
    const errorHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; color: var(--danger-color);"></i>
            <p>Error: ${message}</p>
            <p style="font-size: 0.9rem; margin-top: 1rem; color: var(--text-muted);">
                Try refreshing the page or contact support if the problem persists.
            </p>
        </div>
    `;
    
    // Show error in all tabs
    ['overview', 'platforms', 'credentials', 'configurations'].forEach(tabId => {
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.innerHTML = errorHTML;
        }
    });
}

function updateClientDetailsModal(clientData) {
    // Update overview tab
    const overviewTab = document.getElementById('overview');
    if (overviewTab) {
        overviewTab.innerHTML = `
            <div class="client-overview">
                <div class="overview-card">
                    <h3>Client Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Name:</label>
                            <span>${clientData.name}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${clientData.email}</span>
                        </div>
                        <div class="info-item">
                            <label>Client ID:</label>
                            <span>${clientData.clientId}</span>
                        </div>
                        <div class="info-item">
                            <label>Joined:</label>
                            <span>${clientData.joined}</span>
                        </div>
                        <div class="info-item">
                            <label>Status:</label>
                            <span class="status-badge ${clientData.status.toLowerCase()}">${clientData.status.charAt(0).toUpperCase() + clientData.status.slice(1)}</span>
                        </div>
                        <div class="info-item">
                            <label>Plan:</label>
                            <span class="plan-badge">${clientData.plan ? clientData.plan.charAt(0).toUpperCase() + clientData.plan.slice(1) : 'Free'}</span>
                        </div>
                        <div class="info-item">
                            <label>Total Campaigns:</label>
                            <span>${clientData.campaigns ? clientData.campaigns.length : 0}</span>
                        </div>
                        <div class="info-item">
                            <label>Total Files:</label>
                            <span>${clientData.uploadedFiles ? clientData.uploadedFiles.length : 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update platforms tab (using credentials data - exclude account type)
    const platformsTab = document.getElementById('platforms');
    if (platformsTab) {
        // Filter out 'account' type credentials - only show platform automation credentials
        const platformCredentials = clientData.credentials ? 
            clientData.credentials.filter(credential => credential.platform !== 'account') : [];
            
        if (platformCredentials.length > 0) {
            const platformsHTML = platformCredentials.map((credential, index) => {
                const statusClass = credential.connectionStatus || 'pending';
                const statusText = credential.connectionStatus ? 
                    credential.connectionStatus.charAt(0).toUpperCase() + credential.connectionStatus.slice(1) : 
                    'Pending';
                
                // Format platform name properly
                let platformDisplayName = credential.platform.charAt(0).toUpperCase() + credential.platform.slice(1);
                if (credential.platform === 'linkedin') platformDisplayName = 'LinkedIn';
                if (credential.platform === 'facebook') platformDisplayName = 'Facebook';
                if (credential.platform === 'instagram') platformDisplayName = 'Instagram';
                if (credential.platform === 'twitter') platformDisplayName = 'Twitter';
                if (credential.platform === 'email') platformDisplayName = 'Email Marketing';
                
                return `
                    <div class="platform-item">
                        <div class="platform-info">
                            <div class="platform-header">
                                <h4>${platformDisplayName}</h4>
                                <span class="platform-status ${statusClass}">●</span>
                            </div>
                            <div class="credential-details">
                                <div class="credential-row">
                                    <label>Username/Email:</label>
                                    <span class="credential-value">${credential.username}</span>
                                </div>
                                <div class="credential-row">
                                    <label>Password:</label>
                                    <span class="credential-value">${credential.password}</span>
                                </div>
                                ${credential.lastTested ? `
                                <div class="credential-row">
                                    <label>Last Tested:</label>
                                    <span class="credential-value">${new Date(credential.lastTested).toLocaleDateString()}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            platformsTab.innerHTML = `<div class="platforms-list">${platformsHTML}</div>`;
        } else {
            platformsTab.innerHTML = `
                <div class="no-platforms">
                    <i class="fas fa-share-alt"></i>
                    <p>No platform credentials added yet.</p>
                    <small>Client hasn't set up any platform automation credentials.</small>
                </div>
            `;
        }
    }
    
    // Update credentials tab - show API keys and tokens instead of platform credentials
    const credentialsTab = document.getElementById('credentials');
    if (credentialsTab) {
        // For now, show a summary or different view instead of duplicating platform credentials
        credentialsTab.innerHTML = `
            <div class="credentials-summary">
                <div class="summary-card">
                    <h3>Platform Integration Status</h3>
                    <div class="integration-stats">
                        <div class="stat-item">
                            <label>Total Platforms:</label>
                            <span>${clientData.credentials ? clientData.credentials.filter(c => c.platform !== 'account').length : 0}</span>
                        </div>
                        <div class="stat-item">
                            <label>Active Connections:</label>
                            <span>${clientData.credentials ? clientData.credentials.filter(c => c.platform !== 'account' && c.isActive).length : 0}</span>
                        </div>
                        <div class="stat-item">
                            <label>Last Updated:</label>
                            <span>${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="credentials-note">
                    <i class="fas fa-info-circle"></i>
                    <p>Platform credentials are managed in the Platforms tab. This section shows integration summary and API status.</p>
                </div>
            </div>
        `;
    }
    
    // Update configurations tab (using campaigns and files data)
    const configurationsTab = document.getElementById('configurations');
    if (configurationsTab) {
        let configurationsHTML = '';
        
        // Show campaigns
        if (clientData.campaigns && clientData.campaigns.length > 0) {
            configurationsHTML += '<h4>Active Campaigns</h4>';
            configurationsHTML += clientData.campaigns.map(campaign => `
                <div class="config-item">
                    <div>
                        <h5>${campaign.name}</h5>
                        <p>Type: ${campaign.automationType}</p>
                        <p>Status: ${campaign.status}</p>
                        ${campaign.instructions ? `<p>Instructions: ${campaign.instructions.substring(0, 100)}${campaign.instructions.length > 100 ? '...' : ''}</p>` : ''}
                        <p>Created: ${new Date(campaign.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            `).join('');
        }
        
        // Show uploaded files
        if (clientData.uploadedFiles && clientData.uploadedFiles.length > 0) {
            configurationsHTML += '<h4>Uploaded Files</h4>';
            configurationsHTML += clientData.uploadedFiles.map(file => `
                <div class="config-item">
                    <div>
                        <h5>${file.originalName}</h5>
                        <p>Size: ${(file.fileSize / 1024).toFixed(2)} KB</p>
                        <p>Type: ${file.fileType}</p>
                        <p>Status: ${file.status}</p>
                        <p>Uploaded: ${new Date(file.uploadDate).toLocaleDateString()}</p>
                        ${file.processedRows ? `<p>Processed Rows: ${file.processedRows}</p>` : ''}
                    </div>
                </div>
            `).join('');
        }
        
        // Show activity logs (recent 5)
        if (clientData.activityLogs && clientData.activityLogs.length > 0) {
            configurationsHTML += '<h4>Recent Activity</h4>';
            const recentLogs = clientData.activityLogs.slice(-5).reverse();
            configurationsHTML += recentLogs.map(log => `
                <div class="config-item">
                    <div>
                        <h5>${log.message}</h5>
                        <p>Type: ${log.type}</p>
                        ${log.details ? `<p>Details: ${log.details}</p>` : ''}
                        <p>Time: ${new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                </div>
            `).join('');
        }
        
        if (configurationsHTML) {
            configurationsTab.innerHTML = `<div class="config-list">${configurationsHTML}</div>`;
        } else {
            configurationsTab.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-cog" style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-muted);"></i>
                    <p>No configurations or activity yet</p>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Client hasn't created any campaigns or uploaded files</p>
                </div>
            `;
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to toggle password visibility
function togglePassword(index) {
    const passwordHidden = document.getElementById(`password-${index}`);
    const passwordVisible = document.getElementById(`password-visible-${index}`);
    const eyeIcon = document.getElementById(`eye-icon-${index}`);
    
    if (passwordHidden && passwordVisible && eyeIcon) {
        if (passwordHidden.style.display === 'none') {
            // Hide password
            passwordHidden.style.display = 'inline';
            passwordVisible.style.display = 'none';
            eyeIcon.className = 'fas fa-eye';
        } else {
            // Show password
            passwordHidden.style.display = 'none';
            passwordVisible.style.display = 'inline';
            eyeIcon.className = 'fas fa-eye-slash';
        }
    }
}

// Make functions globally accessible
window.togglePassword = togglePassword;
window.openFileSender = openFileSender;
window.sendFileToClient = sendFileToClient;

// File Sender Functions
function openFileSender() {
    const modal = document.getElementById('fileSenderModal');
    if (modal) {
        modal.style.display = 'flex';
        setupFileInputHandler();
    }
}

function setupFileInputHandler() {
    const fileInput = document.getElementById('fileInput');
    const fileInputText = document.getElementById('fileInputText');
    
    if (fileInput && fileInputText) {
        fileInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                fileInputText.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            } else {
                fileInputText.textContent = 'Click to select file or drag & drop';
            }
        });
    }
}

async function sendFileToClient() {
    const form = document.getElementById('fileSenderForm');
    const fileInput = document.getElementById('fileInput');
    const clientSelect = document.getElementById('clientSelect');
    const messageInput = document.getElementById('fileMessage');
    const categorySelect = document.getElementById('fileCategory');
    
    if (!fileInput.files[0]) {
        showNotification('Please select a file to send', 'error');
        return;
    }
    
    if (!clientSelect.value) {
        showNotification('Please select a client', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('clientId', clientSelect.value);
    formData.append('message', messageInput.value || '');
    formData.append('category', categorySelect.value);
    
    const sendBtn = document.querySelector('#fileSenderModal .btn-primary');
    const originalText = sendBtn.innerHTML;
    
    try {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        const response = await fetch('/admin/send-file', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('File sent successfully!', 'success');
            closeModal('fileSenderModal');
            
            // Reset form
            form.reset();
            document.getElementById('fileInputText').textContent = 'Click to select file or drag & drop';
        } else {
            throw new Error(result.message || 'Failed to send file');
        }
        
    } catch (error) {
        console.error('Error sending file:', error);
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
    }
}

function openClientChat(clientId) {
    switchTab('messages');
    selectClient(clientId);
}

// Message Management Functions
// Global variable to track currently selected client
let currentSelectedClientId = null;

function selectClient(clientId) {
    // Store the currently selected client ID
    currentSelectedClientId = clientId;
    
    // Remove active class from all client items
    document.querySelectorAll('.client-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected client
    const targetClient = document.querySelector(`[data-client-id="${clientId}"]`);
    if (targetClient) {
        targetClient.classList.add('active');
        
        // Remove notification badge when chat is opened
        const unreadBadge = targetClient.querySelector('.unread-badge');
        if (unreadBadge) {
            unreadBadge.style.display = 'none';
        }
    }
    
    // Load client information and messages
    loadClientInfo(clientId);
    loadClientMessages(clientId);
}

async function loadClientInfo(clientId) {
    try {
        const response = await fetch(`/admin/clients/${clientId}`);
        const data = await response.json();
        
        if (data.success && data.client) {
            updateChatHeader(data.client);
        } else {
            console.error('Failed to load client info:', data.message);
        }
    } catch (error) {
        console.error('Error loading client info:', error);
    }
}

function updateChatHeader(client) {
    // Update chat header with client info
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
        const clientName = chatHeader.querySelector('h3');
        const clientStatus = chatHeader.querySelector('p');
        
        if (clientName) {
            clientName.textContent = `${client.name}`;
            clientName.setAttribute('data-client-id', client.clientId);
        }
        
        if (clientStatus) {
            const statusText = client.status === 'active' ? 'ONLINE' : 'OFFLINE';
            const statusClass = client.status === 'active' ? 'online' : 'offline';
            clientStatus.innerHTML = `<span class="status-indicator ${statusClass}"></span>${statusText}`;
        }
    }
    
    // Update client info in sidebar if needed
    const selectedClientItem = document.querySelector(`[data-client-id="${client.clientId}"]`);
    if (selectedClientItem) {
        const clientNameElement = selectedClientItem.querySelector('h4');
        const lastMessageElement = selectedClientItem.querySelector('.last-message');
        
        if (clientNameElement) {
            clientNameElement.textContent = client.name;
        }
    }
    
    // Update message input placeholder to show current client
    const messageInput = document.querySelector('.message-input');
    if (messageInput) {
        messageInput.placeholder = `Type your message to ${client.name}...`;
    }
}

async function loadClientMessages(clientId) {
    try {
        // Show loading state
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '<div class="loading-messages"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';
        }
        
        // Fetch real messages from API
        const response = await fetch(`/admin/clients/${clientId}/messages`);
        const data = await response.json();
        
        if (data.success) {
            updateChatMessages(data.messages || []);
        } else {
            // If no specific messages endpoint, show activity logs as messages
            const clientResponse = await fetch(`/admin/clients/${clientId}`);
            const clientData = await clientResponse.json();
            
            if (clientData.success && clientData.client.activityLogs) {
                const adminMessages = clientData.client.activityLogs
                    .filter(log => log.source === 'admin' || log.type === 'admin_message')
                    .map(log => ({
                        type: 'admin',
                        message: log.message,
                        details: log.details,
                        time: new Date(log.timestamp).toLocaleTimeString(),
                        fileInfo: log.fileInfo
                    }));
                
                updateChatMessages(adminMessages);
            } else {
                updateChatMessages([]);
            }
        }
    } catch (error) {
        console.error('Error loading client messages:', error);
        updateChatMessages([]);
    }
}

function updateChatMessages(messages) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    if (messages.length === 0) {
        chatMessages.innerHTML = '<div class="no-messages">No messages yet. Start a conversation!</div>';
        return;
    }
    
    const messagesHTML = messages.map(msg => {
        let messageHTML = `
            <div class="message ${msg.type}-message">
                <div class="message-content">
                    <p>${msg.message}</p>
                    ${msg.details ? `<div class="message-details">${msg.details}</div>` : ''}
        `;
        
        // Add file download link if available
        if (msg.fileInfo && msg.fileInfo.downloadPath) {
            messageHTML += `
                <div class="message-file-attachment">
                    <i class="fas fa-paperclip"></i>
                    <a href="${msg.fileInfo.downloadPath}" download="${msg.fileInfo.originalName}" class="file-link">
                        ${msg.fileInfo.originalName}
                    </a>
                    <span class="file-category">(${msg.fileInfo.category})</span>
                </div>
            `;
        }
        
        messageHTML += `
                    <span class="message-time">${msg.time}</span>
                </div>
            </div>
        `;
        
        return messageHTML;
    }).join('');
    
    chatMessages.innerHTML = messagesHTML;
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    console.log('SendMessage called');
    console.log('Current selected client ID:', currentSelectedClientId);
    
    const messageInput = document.querySelector('.message-input');
    const message = messageInput.value.trim();
    
    console.log('Message input:', message);
    
    if (!message) {
        showNotification('Please enter a message', 'error');
        return;
    }

    // Use the currently selected client ID
    const clientId = currentSelectedClientId;
    
    console.log('Using client ID:', clientId);
    
    if (!clientId) {
        showNotification('Please select a client first', 'error');
        return;
    }    // Send message to backend
    fetch('/admin/message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            clientId: clientId,
            message: message
        })
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            // Add message to chat
            const chatMessages = document.querySelector('.chat-messages');
            const messageElement = document.createElement('div');
            messageElement.className = 'message admin-message';
            messageElement.innerHTML = `
                <div class="message-content">
                    <p>${message}</p>
                    <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            `;
            
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Clear input
            messageInput.value = '';
            
            showNotification('Message sent successfully', 'success');
        } else {
            console.error('Server error:', data.error);
            showNotification(data.error || 'Failed to send message', 'error');
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        showNotification('Failed to send message: ' + error.message, 'error');
    });
}

function openNewMessage() {
    // Logic to open new message dialog
    const clientSelector = prompt('Enter client ID to message:');
    if (clientSelector) {
        selectClient(clientSelector);
    }
}

// Activity Monitoring Functions
async function updateClientMonitor() {
    const form = document.querySelector('.activity-form');
    if (form) {
        const clientId = document.getElementById('activity-client-selector').value;
        const status = form.querySelector('select').value;
        const progress = form.querySelector('input[type="range"]').value;
        const message = form.querySelector('textarea').value;

        if (!clientId) {
            showNotification('Please select a client', 'error');
            return;
        }

        if (!message) {
            showNotification('Please enter a status message', 'error');
            return;
        }

        try {
            const response = await fetch('/admin/activity-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ clientId, status, progress, message }),
            });

            const result = await response.json();

            if (result.success) {
                showNotification('Client activity updated successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to update activity');
            }
        } catch (error) {
            console.error('Error updating client activity:', error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        zIndex: '9999',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    // Set background color based on type
    const colors = {
        success: '#00f5a0',
        error: '#ff4757',
        warning: '#ffb347',
        info: '#00d4ff'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function refreshData() {
    // This would typically refresh all data from API
    console.log('Refreshing dashboard data...');
    showNotification('Dashboard data refreshed!', 'success');
}

function logout() {
    // Redirect to landing page
    window.location.href = '/';
}

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab') || e.target.closest('.tab-btn').getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        });
    });
    
    // Initialize detail tab switching
    document.querySelectorAll('.detail-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            
            document.querySelectorAll('.detail-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            document.querySelectorAll('.detail-tab-btn').forEach(button => {
                button.classList.remove('active');
            });
            
            const targetContent = document.getElementById(tabName);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            e.target.classList.add('active');
        });
    });
    
    // Initialize progress slider
    const progressSlider = document.querySelector('.progress-slider');
    if (progressSlider) {
        progressSlider.addEventListener('input', (e) => {
            const progressValue = document.querySelector('.progress-value');
            const progressFill = document.querySelector('.progress-fill');
            
            if (progressValue) {
                progressValue.textContent = e.target.value + '%';
            }
            if (progressFill) {
                progressFill.style.width = e.target.value + '%';
            }
        });
    }
    
    // Initialize send message functionality
    const sendBtn = document.querySelector('.send-btn');
    const messageInput = document.querySelector('.message-input');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Initialize activity form submission
    const activityForm = document.querySelector('.activity-form');
    if (activityForm) {
        activityForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateClientMonitor();
        });
    }
    
    // Initialize client search and filtering
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchAndFilterClients();
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            searchAndFilterClients();
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Add click handlers for client items in messages
    document.querySelectorAll('.client-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const clientId = e.target.closest('.client-item').getAttribute('data-client-id') || '1';
            selectClient(clientId);
        });
    });
    
    // Add logout button functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    console.log('✅ Admin Dashboard initialized successfully');
});

// Client Delete Functionality
let clientToDelete = null;

function confirmDeleteClient(clientId, clientName) {
    clientToDelete = { clientId, clientName };
    
    // Set client info in modal
    const deleteClientNameEl = document.getElementById('deleteClientName');
    const deleteClientEmailEl = document.getElementById('deleteClientEmail');
    
    if (deleteClientNameEl) {
        deleteClientNameEl.textContent = clientName;
    }
    if (deleteClientEmailEl) {
        deleteClientEmailEl.textContent = getClientEmail(clientId);
    }
    
    // Show modal
    const modal = document.getElementById('deleteClientModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function getClientEmail(clientId) {
    // Get email from the client card
    const clientCard = document.querySelector(`[onclick*="${clientId}"]`)?.closest('.client-card');
    if (clientCard) {
        const emailElement = clientCard.querySelector('.client-email');
        return emailElement ? emailElement.textContent : '';
    }
    return '';
}

async function deleteClient() {
    if (!clientToDelete) {
        console.error('No client selected for deletion');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.innerHTML;
    
    try {
        // Show loading state
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="spinning">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="31.416" stroke-dashoffset="31.416" opacity="0.3"/>
                <path d="M12 2A10 10 0 0 1 22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Deleting...
        `;
        
        // Make API call to delete client
        const response = await fetch(`/admin/clients/${clientToDelete.clientId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // Log response for debugging
        console.log('Delete response status:', response.status);
        console.log('Delete response headers:', response.headers);
        
        const responseText = await response.text();
        console.log('Delete response text:', responseText);
        
        if (response.ok) {
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse JSON response:', parseError);
                throw new Error('Server returned invalid JSON response');
            }
            
            // Show success notification
            showNotification('Client deleted successfully', 'success');
            
            // Close modal
            closeModal('deleteClientModal');
            
            // Remove client card from UI
            removeClientCardFromUI(clientToDelete.clientId);
            
            // Reset client to delete
            clientToDelete = null;
            
            // Update dashboard stats without refreshing
            updateDashboardStats();
            
        } else {
            let error;
            try {
                error = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse error response:', parseError);
                console.error('Raw error response:', responseText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${responseText.substring(0, 200)}...`);
            }
            throw new Error(error.message || error.error || 'Failed to delete client');
        }
        
    } catch (error) {
        console.error('Delete client error:', error);
        showNotification(`Error: ${error.message}`, 'error');
        
        // Reset button
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    }
}

function removeClientCardFromUI(clientId) {
    // Find and remove the client card
    const clientCard = document.querySelector(`[onclick*="${clientId}"]`)?.closest('.client-card');
    if (clientCard) {
        clientCard.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            clientCard.remove();
        }, 300);
    }
}

function updateDashboardStats() {
    // Update stats by counting remaining client cards
    const remainingClientCards = document.querySelectorAll('.client-card');
    const totalClients = remainingClientCards.length;
    
    // Count active clients (those with "active" status)
    const activeClients = Array.from(remainingClientCards).filter(card => {
        const statusElement = card.querySelector('.client-status.active');
        return statusElement !== null;
    }).length;
    
    // Update stat cards in the UI
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const label = card.querySelector('.stat-label')?.textContent;
        const numberElement = card.querySelector('.stat-number');
        
        if (label && numberElement) {
            if (label.includes('Active Clients')) {
                numberElement.textContent = activeClients;
                // Add a subtle animation to show the change
                numberElement.style.animation = 'statUpdate 0.5s ease-out';
                setTimeout(() => {
                    numberElement.style.animation = '';
                }, 500);
            } else if (label.includes('Total') && label.includes('Client')) {
                numberElement.textContent = totalClients;
                numberElement.style.animation = 'statUpdate 0.5s ease-out';
                setTimeout(() => {
                    numberElement.style.animation = '';
                }, 500);
            }
        }
    });
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.95); }
    }
    
    @keyframes statUpdate {
        0% { transform: scale(1); color: var(--text-primary); }
        50% { transform: scale(1.1); color: var(--primary-color); }
        100% { transform: scale(1); color: var(--text-primary); }
    }
    
    .spinning {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .confirmed {
        background: #dc2626 !important;
        animation: confirmPulse 0.3s ease-out;
    }
    
    @keyframes confirmPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize first client selection in messages tab
    const firstClient = document.querySelector('.client-item[data-client-id]');
    if (firstClient) {
        const clientId = firstClient.getAttribute('data-client-id');
        // Only auto-select if we're in the messages tab
        const messagesTab = document.getElementById('messages');
        if (messagesTab && messagesTab.classList.contains('active')) {
            selectClient(clientId);
        }
    }
    
    // Add tab switching listener to initialize client selection
    const messageTabButton = document.querySelector('[data-tab="messages"]');
    if (messageTabButton) {
        messageTabButton.addEventListener('click', function() {
            setTimeout(() => {
                const firstClient = document.querySelector('.client-item[data-client-id]');
                if (firstClient && !currentSelectedClientId) {
                    const clientId = firstClient.getAttribute('data-client-id');
                    selectClient(clientId);
                }
            }, 100);
        });
    }
});
window.AdminDashboard = {
    switchTab,
    viewClientDetails,
    closeModal,
    openClientChat,
    selectClient,
    sendMessage,
    openNewMessage,
    updateClientMonitor,
    refreshData,
    showNotification,
    logout,
    confirmDeleteClient,
    deleteClient,
    togglePassword,
    openFileSender,
    sendFileToClient,
    loadClientInfo,
    updateChatHeader,
    loadClientMessages,
    updateChatMessages
};

// File download functionality - PRODUCTION READY VERSION
function downloadFile(fileId, originalName) {
    try {
        // Use file ID instead of filename for reliable downloads
        const downloadUrl = `/admin/download-file/${encodeURIComponent(fileId)}`;
        
        // Create temporary link element
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = originalName || 'download';
        link.style.display = 'none';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('File download initiated:', originalName);
    } catch (error) {
        console.error('Error downloading file:', error);
        showNotification('Error downloading file', 'error');
    }
}

// File view functionality
function viewFile(fileId, originalName) {
    try {
        const viewUrl = `/admin/view-file/${encodeURIComponent(fileId)}`;
        window.open(viewUrl, '_blank');
        console.log('File view opened:', originalName);
    } catch (error) {
        console.error('Error viewing file:', error);
        showNotification('Error viewing file', 'error');
    }
}

// Function to search and filter clients
async function searchAndFilterClients() {
    const search = document.querySelector('.search-input').value;
    const status = document.querySelector('.filter-select').value;
    
    try {
        const response = await fetch(`/admin/clients?search=${encodeURIComponent(search)}&status=${status}`);
        const data = await response.json();

        if (data.success) {
            updateClientsGrid(data.clients);
        } else {
            console.error('Failed to fetch clients:', data.message);
        }
    } catch (error) {
        console.error('Error fetching clients:', error);
    }
}

// Function to update the clients grid with new data
function updateClientsGrid(clients) {
    const clientsGrid = document.querySelector('.clients-grid');
    clientsGrid.innerHTML = ''; // Clear existing clients

    if (clients.length > 0) {
        clients.forEach(client => {
            const clientCard = document.createElement('div');
            clientCard.className = 'client-card';
            clientCard.innerHTML = `
                <div class="client-header">
                    <div class="client-avatar">
                        ${client.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div class="client-info">
                        <h3>${client.name}</h3>
                        <span class="client-email">${client.email}</span>
                        <span class="client-status ${client.status}">${client.status.charAt(0).toUpperCase() + client.status.slice(1)}</span>
                    </div>
                    <div class="client-actions">
                        <button class="action-btn view-btn" onclick="viewClientDetails('${client.clientId}')">View</button>
                        <button class="action-btn message-btn" onclick="openClientChat('${client.clientId}')">Message</button>
                        <button class="action-btn delete-btn" onclick="confirmDeleteClient('${client.clientId}', '${client.name}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
                <div class="client-stats">
                    <div class="stat-item">
                        <span class="stat-label">Platforms</span>
                        <span class="stat-value">${client.credentials?.length || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Files</span>
                        <span class="stat-value">${client.uploadedFiles?.length || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Last Active</span>
                        <span class="stat-value">${client.lastLogin ? new Date(client.lastLogin).toLocaleDateString() : 'Never'}</span>
                    </div>
                </div>
            `;
            clientsGrid.appendChild(clientCard);
        });
    } else {
        clientsGrid.innerHTML = '<div class="no-clients"><p>No clients found.</p></div>';
    }
}

// Make functions globally available
window.downloadFile = downloadFile;
window.viewFile = viewFile;
