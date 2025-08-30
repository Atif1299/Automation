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
