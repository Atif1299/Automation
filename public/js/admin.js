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
    // Load client data (this would typically fetch from API)
    loadClientData(clientId);
    
    // Show modal
    const modal = document.getElementById('clientDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function loadClientData(clientId) {
    // This would typically fetch real data from your API
    const sampleData = {
        '1': {
            name: 'John Doe',
            email: 'john.doe@email.com',
            joined: '2 months ago',
            status: 'Active',
            platforms: [
                { name: 'Facebook Business', status: 'Connected' },
                { name: 'Google Ads', status: 'Connected' },
                { name: 'Instagram Business', status: 'Pending' }
            ],
            credentials: [
                { name: 'Facebook API Key', status: 'Valid' },
                { name: 'Google OAuth Token', status: 'Valid' }
            ],
            configurations: [
                { name: 'Automation Schedule', value: 'Daily at 9:00 AM' },
                { name: 'Target Audience', value: 'Business professionals, 25-45 years' }
            ]
        },
        '2': {
            name: 'Alice Smith',
            email: 'alice.smith@email.com',
            joined: '1 month ago',
            status: 'Active',
            platforms: [
                { name: 'LinkedIn Business', status: 'Connected' },
                { name: 'Twitter Ads', status: 'Connected' },
                { name: 'Facebook Business', status: 'Connected' }
            ],
            credentials: [
                { name: 'LinkedIn API Key', status: 'Valid' },
                { name: 'Twitter OAuth Token', status: 'Expired' }
            ],
            configurations: [
                { name: 'Automation Schedule', value: 'Twice daily at 9:00 AM & 6:00 PM' },
                { name: 'Target Audience', value: 'Tech professionals, 30-50 years' }
            ]
        }
    };
    
    const clientData = sampleData[clientId];
    if (clientData) {
        updateClientDetailsModal(clientData);
    }
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
                            <label>Joined:</label>
                            <span>${clientData.joined}</span>
                        </div>
                        <div class="info-item">
                            <label>Status:</label>
                            <span class="status-badge ${clientData.status.toLowerCase()}">${clientData.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update platforms tab
    const platformsTab = document.getElementById('platforms');
    if (platformsTab) {
        const platformsHTML = clientData.platforms.map(platform => `
            <div class="platform-item">
                <div>
                    <h4>${platform.name}</h4>
                    <p>Status: ${platform.status}</p>
                </div>
                <span class="platform-status ${platform.status.toLowerCase()}">●</span>
            </div>
        `).join('');
        
        platformsTab.innerHTML = `<div class="platforms-list">${platformsHTML}</div>`;
    }
    
    // Update credentials tab
    const credentialsTab = document.getElementById('credentials');
    if (credentialsTab) {
        const credentialsHTML = clientData.credentials.map(credential => `
            <div class="credential-item">
                <div>
                    <h4>${credential.name}</h4>
                    <p>Status: ${credential.status}</p>
                </div>
                <button class="action-btn">View</button>
            </div>
        `).join('');
        
        credentialsTab.innerHTML = `<div class="credentials-list">${credentialsHTML}</div>`;
    }
    
    // Update configurations tab
    const configurationsTab = document.getElementById('configurations');
    if (configurationsTab) {
        const configurationsHTML = clientData.configurations.map(config => `
            <div class="config-item">
                <div>
                    <h4>${config.name}</h4>
                    <p>${config.value}</p>
                </div>
            </div>
        `).join('');
        
        configurationsTab.innerHTML = `<div class="config-list">${configurationsHTML}</div>`;
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function openClientChat(clientId) {
    switchTab('messages');
    selectClient(clientId);
}

// Message Management Functions
function selectClient(clientId) {
    // Remove active class from all client items
    document.querySelectorAll('.client-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected client
    const targetClient = document.querySelector(`[data-client-id="${clientId}"]`);
    if (targetClient) {
        targetClient.classList.add('active');
    }
    
    // Load chat messages for this client
    loadClientMessages(clientId);
}

function loadClientMessages(clientId) {
    // This would typically fetch real messages from your API
    const sampleMessages = {
        '1': [
            {
                type: 'client',
                message: 'Hi, I\'ve completed the platform setup but I\'m having trouble with the credentials section.',
                time: '2:30 PM'
            },
            {
                type: 'admin',
                message: 'I can see your setup. Let me help you with the credentials. I\'ll update your configuration now.',
                time: '2:35 PM'
            },
            {
                type: 'client',
                message: 'Thank you! That worked perfectly. The automation is running smoothly now.',
                time: '2:45 PM'
            }
        ]
    };
    
    const messages = sampleMessages[clientId] || [];
    updateChatMessages(messages);
}

function updateChatMessages(messages) {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        const messagesHTML = messages.map(msg => `
            <div class="message ${msg.type}-message">
                <div class="message-content">
                    <p>${msg.message}</p>
                    <span class="message-time">${msg.time}</span>
                </div>
            </div>
        `).join('');
        
        chatMessages.innerHTML = messagesHTML;
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function sendMessage() {
    const messageInput = document.querySelector('.message-input');
    const message = messageInput.value.trim();
    
    if (!message) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    // Get selected client ID
    const clientSelector = document.querySelector('#client-selector');
    const clientId = clientSelector ? clientSelector.value : null;
    
    if (!clientId) {
        showNotification('Please select a client first', 'error');
        return;
    }
    
    // Send message to backend
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
    .then(response => response.json())
    .then(data => {
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
            showNotification(data.error || 'Failed to send message', 'error');
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        showNotification('Failed to send message', 'error');
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
function updateClientMonitor() {
    const form = document.querySelector('.activity-form');
    if (form) {
        const formData = new FormData(form);
        const clientId = document.querySelector('.client-selector').value;
        
        if (!clientId) {
            alert('Please select a client first');
            return;
        }
        
        // This would typically send data to API
        console.log('Updating client monitor for client:', clientId);
        console.log('Form data:', Object.fromEntries(formData));
        
        // Show success message
        showNotification('Client monitor updated successfully!', 'success');
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
    
    // Initialize client selector change
    const clientSelector = document.querySelector('.client-selector');
    if (clientSelector) {
        clientSelector.addEventListener('change', (e) => {
            const clientId = e.target.value;
            if (clientId) {
                loadClientData(clientId);
            }
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

// Export functions for external use
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
    logout
};
