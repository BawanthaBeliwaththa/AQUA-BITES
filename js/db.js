// db.js - Complete Fixed Version for Web Interface
let userActivityChart, feedingHistoryChart;
let feedTimeout = null;
let motorStatusListener = null;
let feedingEnabledListener = null;
let scheduleListener = null;
let servoEnabledListener = null;
let temperatureListener = null;
let commandListener = null;
let currentUser = null;

// Enable Firebase debug logging
firebase.database.enableLogging(true);

// System initialization
document.addEventListener('auth-complete', function() {
    console.log("[System] Authentication complete, initializing components");
    if (!firebase.auth().currentUser) {
        console.error("[System] No authenticated user found");
        showAlert("Please log in to access the dashboard", "error");
        window.location.href = 'login.html';
        return;
    }
    currentUser = firebase.auth().currentUser;
    console.log("[System] Current user:", currentUser.email);
    const database = firebase.database();
    
    initCharts();
    initSystemStatus();
    initTemperatureMonitoring(database);
    initFeedingSystem(database);
    initMotorStatusMonitoring(database);
    initAutoFeedToggle(database);
    initServoToggle(database);
    initScheduleSystem(database);
    initCommandListener(database);
    
    trackFeedings(database);
    trackUserActivity(database);
    
    console.log("[System] All components initialized");
});

function initSystemStatus() {
    const statusElement = document.createElement('div');
    statusElement.id = 'system-status';
    statusElement.style.position = 'fixed';
    statusElement.style.bottom = '10px';
    statusElement.style.right = '10px';
    statusElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
    statusElement.style.color = 'white';
    statusElement.style.padding = '5px 10px';
    statusElement.style.borderRadius = '4px';
    statusElement.style.fontFamily = 'monospace';
    statusElement.style.fontSize = '12px';
    statusElement.style.zIndex = '1000';
    document.body.appendChild(statusElement);
    
    updateStatus('System ready');
    setInterval(() => {
        updateStatus(`Online | ${new Date().toLocaleTimeString()}`);
    }, 10000);
}

function updateStatus(message) {
    const statusElement = document.getElementById('system-status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function initCharts() {
    console.log("[Charts] Initializing charts");
    try {
        // User Activity Chart
        const userCtx = document.getElementById('userActivityChart').getContext('2d');
        userActivityChart = new Chart(userCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Active Users',
                    data: Array(24).fill(0),
                    backgroundColor: 'rgba(42, 157, 143, 0.2)',
                    borderColor: 'rgba(42, 157, 143, 1)',
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });

        // Feeding History Chart
        const feedCtx = document.getElementById('feedingHistoryChart').getContext('2d');
        feedingHistoryChart = new Chart(feedCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Feedings',
                    data: [],
                    backgroundColor: 'rgba(233, 196, 106, 0.7)',
                    borderColor: 'rgba(233, 196, 106, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
        console.log("[Charts] Charts initialized successfully");
    } catch (error) {
        console.error("[Charts] Initialization failed:", error);
        showAlert("Failed to initialize charts", "error");
    }
}

function initTemperatureMonitoring(database) {
    console.log("[Temperature] Initializing temperature monitoring");
    try {
        temperatureListener = database.ref('device/sensors/temperature').on('value', snapshot => {
            const temp = snapshot.val();
            const tempElement = document.getElementById('temperature');
            const tempDebug = document.getElementById('temp-debug');
            
            if (temp !== null && !isNaN(temp)) {
                const tempValue = parseFloat(temp).toFixed(1);
                tempElement.innerHTML = `<span class="${temp > 30 || temp < 15 ? 'alert-value' : ''}">${tempValue}</span> °C`;
                tempDebug.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
                tempDebug.className = "debug-info";
                
                if (temp > 30 || temp < 15) {
                    showAlert(`Temperature alert: ${tempValue}°C`, "warning");
                }
            } else {
                tempElement.textContent = "-- °C";
                tempDebug.textContent = "Waiting for data...";
                tempDebug.className = "debug-info warning";
            }
        });
    } catch (error) {
        console.error("[Temperature] Monitoring setup failed:", error);
        showAlert("Failed to initialize temperature monitoring", "error");
    }
}

function initFeedingSystem(database) {
    console.log("[Feeding] Initializing feeding system");
    const feedButton = document.getElementById('feed-button');
    const feedServoButton = document.getElementById('feed-servo-button');
    const feedDebug = document.getElementById('feed-debug');
    
    if (!feedButton || !feedServoButton) {
        console.error("[Feeding] Buttons not found in DOM");
        showAlert("Feed system initialization failed: Buttons not found", "error");
        return;
    }

    const sendFeedCommand = async (useServo) => {
        console.log(`[Feeding] Sending ${useServo ? 'servo' : 'stepper'} feed command`);
        
        if (!firebase.auth().currentUser) {
            console.error("[Feeding] No authenticated user");
            showAlert("Please log in to perform this action", "error");
            return;
        }
        
        const button = useServo ? feedServoButton : feedButton;
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;
        
        if (feedDebug) {
            feedDebug.textContent = "Sending feed command...";
            feedDebug.className = "debug-info";
        }

        try {
            currentUser = firebase.auth().currentUser;
            console.log(`[Auth] User: ${currentUser.email}`);

            // Create command data
            const timestamp = Date.now();
            const commandData = {
                feed: true,
                servo: useServo,
                requestedAt: timestamp,
                requestedBy: currentUser.displayName || currentUser.email,
                userId: currentUser.uid,
                source: 'web',
                status: 'pending'
            };

            console.log("[Firebase] Writing command:", commandData);
            await database.ref('device/commands/latest').set(commandData);
            
            // Record feeding history
            await database.ref('feedingHistory').push().set({
                timestamp: timestamp,
                user: currentUser.displayName || currentUser.email,
                userId: currentUser.uid,
                type: 'manual',
                method: useServo ? 'servo' : 'stepper',
                status: 'requested',
                source: 'web'
            });
            
            if (feedDebug) {
                feedDebug.textContent = "Command sent successfully!";
                feedDebug.className = "debug-info success";
            }

            // Monitor command status
            const commandStatusListener = database.ref('device/commands/latest/status').on('value', (snapshot) => {
                const status = snapshot.val();
                console.log(`[Command] Status update: ${status}`);
                
                if (status === 'completed') {
                    button.disabled = false;
                    button.innerHTML = originalText;
                    
                    if (feedDebug) {
                        feedDebug.textContent = "Feeding completed successfully!";
                        feedDebug.className = "debug-info success";
                    }
                    
                    // Update feeding history status
                    database.ref('feedingHistory').orderByChild('timestamp').equalTo(timestamp).once('value', (snapshot) => {
                        snapshot.forEach((child) => {
                            child.ref.update({ status: 'completed' });
                        });
                    });
                    
                    database.ref('device/commands/latest/status').off('value', commandStatusListener);
                    clearTimeout(feedTimeout);
                } else if (status === 'failed') {
                    button.disabled = false;
                    button.innerHTML = originalText;
                    
                    if (feedDebug) {
                        feedDebug.textContent = "Feeding failed!";
                        feedDebug.className = "debug-info error";
                    }
                    
                    // Update feeding history status
                    database.ref('feedingHistory').orderByChild('timestamp').equalTo(timestamp).once('value', (snapshot) => {
                        snapshot.forEach((child) => {
                            child.ref.update({ status: 'failed' });
                        });
                    });
                    
                    database.ref('device/commands/latest/status').off('value', commandStatusListener);
                    clearTimeout(feedTimeout);
                }
            });

            // Set timeout
            feedTimeout = setTimeout(() => {
                if (button.disabled) {
                    console.warn("[Timeout] No response from device");
                    button.disabled = false;
                    button.innerHTML = originalText;
                    
                    if (feedDebug) {
                        feedDebug.textContent = "No response from device - check connection";
                        feedDebug.className = "debug-info error";
                    }
                    
                    database.ref('device/commands/latest/status').off('value', commandStatusListener);
                    
                    database.ref('device/commands/latest').update({
                        status: 'failed',
                        error: 'timeout'
                    });
                    
                    // Update feeding history status
                    database.ref('feedingHistory').orderByChild('timestamp').equalTo(timestamp).once('value', (snapshot) => {
                        snapshot.forEach((child) => {
                            child.ref.update({ status: 'failed', error: 'timeout' });
                        });
                    });
                }
            }, 20000);

        } catch (error) {
            console.error("[Error] Feed command failed:", error.code, error.message);
            button.disabled = false;
            button.innerHTML = originalText;
            
            if (feedDebug) {
                feedDebug.textContent = `Error: ${error.message}`;
                feedDebug.className = "debug-info error";
            }
            
            showAlert(`Feed command failed: ${error.message}`, "error");
        }
    };

    // Setup button events with debouncing
    const debounce = (func, delay) => {
        let timeoutId;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    };

    feedButton.addEventListener('click', debounce(() => {
        console.log("[UI] Stepper feed button clicked");
        sendFeedCommand(false);
    }, 500));
    
    feedServoButton.addEventListener('click', debounce(() => {
        console.log("[UI] Servo feed button clicked");
        sendFeedCommand(true);
    }, 500));
}

function initMotorStatusMonitoring(database) {
    console.log("[Motor] Initializing status monitoring");
    try {
        motorStatusListener = database.ref('device/status/motor').on('value', snapshot => {
            const status = snapshot.val();
            const motorStatusElement = document.getElementById('motor-status');
            
            if (motorStatusElement) {
                if (status === 'rotating') {
                    motorStatusElement.innerHTML = '<span class="status-indicator status-active"></span> Feeding';
                } else if (status === 'error') {
                    motorStatusElement.innerHTML = '<span class="status-indicator status-offline"></span> Error';
                } else {
                    motorStatusElement.innerHTML = '<span class="status-indicator status-online"></span> Idle';
                }
            }
        });
    } catch (error) {
        console.error("[Motor] Monitoring setup failed:", error);
        showAlert("Failed to initialize motor status monitoring", "error");
    }
}

function initAutoFeedToggle(database) {
    console.log("[Settings] Initializing auto feed toggle");
    const toggleButton = document.getElementById('toggle-feeding');
    if (!toggleButton) {
        console.error("[Settings] Auto feed toggle button not found");
        return;
    }

    if (!currentUser) {
        console.error("[Settings] No authenticated user for auto feed toggle");
        toggleButton.disabled = true;
        return;
    }

    checkPathExists(`authorizedUsers/${currentUser.uid}`).then(isAuthorized => {
        const isOwner = currentUser.email === "bawanthabeliwaththa@gmail.com";
        
        if (!isAuthorized && !isOwner) {
            toggleButton.disabled = true;
            toggleButton.title = "You are not authorized to change this setting";
            showAlert("Not authorized to change auto feed settings", "error");
            return;
        }

        try {
            feedingEnabledListener = database.ref('device/settings/feedingEnabled').on('value', snapshot => {
                const enabled = snapshot.val();
                const enabledElement = document.getElementById('feeding-enabled');
                if (enabledElement) {
                    enabledElement.textContent = enabled ? "Enabled" : "Disabled";
                    enabledElement.style.color = enabled ? "var(--success)" : "var(--danger)";
                }
            });

            toggleButton.addEventListener('click', function() {
                database.ref('device/settings/feedingEnabled').transaction(current => {
                    return !current;
                }).then(() => {
                    showAlert("Auto feeding setting updated", "success");
                }).catch(error => {
                    console.error("[Settings] Failed to toggle feeding:", error);
                    showAlert(`Failed to update auto feeding: ${error.message}`, "error");
                });
            });
        } catch (error) {
            console.error("[Settings] Auto feed toggle setup failed:", error);
            showAlert("Failed to initialize auto feed toggle", "error");
        }
    });
}

function initServoToggle(database) {
    console.log("[Settings] Initializing servo toggle");
    const toggleButton = document.getElementById('toggle-servo');
    if (!toggleButton) {
        console.error("[Settings] Servo toggle button not found");
        return;
    }

    if (!currentUser) {
        console.error("[Settings] No authenticated user for servo toggle");
        toggleButton.disabled = true;
        return;
    }

    checkPathExists(`authorizedUsers/${currentUser.uid}`).then(isAuthorized => {
        const isOwner = currentUser.email === "bawanthabeliwaththa@gmail.com";
        
        if (!isAuthorized && !isOwner) {
            toggleButton.disabled = true;
            toggleButton.title = "You are not authorized to change this setting";
            showAlert("Not authorized to change servo settings", "error");
            return;
        }

        try {
            servoEnabledListener = database.ref('device/settings/servoEnabled').on('value', snapshot => {
                const enabled = snapshot.val();
                const enabledElement = document.getElementById('servo-enabled');
                const methodElement = document.getElementById('feeding-method');
                
                if (enabledElement) {
                    enabledElement.textContent = enabled ? "Enabled" : "Disabled";
                    enabledElement.style.color = enabled ? "var(--success)" : "var(--danger)";
                }
                
                if (methodElement) {
                    methodElement.textContent = enabled ? "Servo Motor" : "Stepper Motor";
                }
            });

            toggleButton.addEventListener('click', function() {
                database.ref('device/settings/servoEnabled').transaction(current => {
                    return !current;
                }).then(() => {
                    showAlert("Servo mode updated", "success");
                }).catch(error => {
                    console.error("[Settings] Failed to toggle servo:", error);
                    showAlert(`Failed to update servo setting: ${error.message}`, "error");
                });
            });
        } catch (error) {
            console.error("[Settings] Servo toggle setup failed:", error);
            showAlert("Failed to initialize servo toggle", "error");
        }
    });
}

function initScheduleSystem(database) {
    console.log("[Schedule] Initializing schedule system");
    const updateButton = document.getElementById('update-schedule');
    if (!updateButton) {
        console.error("[Schedule] Update schedule button not found");
        return;
    }

    if (!currentUser) {
        console.error("[Schedule] No authenticated user for schedule system");
        updateButton.disabled = true;
        return;
    }

    checkPathExists(`authorizedUsers/${currentUser.uid}`).then(isAuthorized => {
        const isOwner = currentUser.email === "bawanthabeliwaththa@gmail.com";
        
        if (!isAuthorized && !isOwner) {
            updateButton.disabled = true;
            updateButton.title = "You are not authorized to change the schedule";
            document.querySelectorAll('input[type="time"]').forEach(input => {
                input.disabled = true;
            });
            showAlert("Not authorized to change schedule", "error");
            return;
        }

        try {
            scheduleListener = database.ref('device/settings/schedule').on('value', snapshot => {
                const schedule = snapshot.val();
                if (schedule) {
                    document.getElementById('time1').value = schedule.time1 || '08:00';
                    document.getElementById('time2').value = schedule.time2 || '12:00';
                    document.getElementById('time3').value = schedule.time3 || '18:00';
                }
            });

            updateButton.addEventListener('click', function() {
                const schedule = {
                    time1: document.getElementById('time1').value,
                    time2: document.getElementById('time2').value,
                    time3: document.getElementById('time3').value
                };
                
                if (!isValidTime(schedule.time1) || !isValidTime(schedule.time2) || !isValidTime(schedule.time3)) {
                    showAlert("Please enter valid times in HH:MM format", "error");
                    return;
                }
                
                database.ref('device/settings/schedule').set(schedule)
                    .then(() => showAlert("Schedule updated successfully!", "success"))
                    .catch(error => {
                        console.error("[Schedule] Schedule update failed:", error);
                        showAlert(`Failed to update schedule: ${error.message}`, "error");
                    });
            });
        } catch (error) {
            console.error("[Schedule] System setup failed:", error);
            showAlert("Failed to initialize schedule system", "error");
        }
    });
}

function initCommandListener(database) {
    console.log("[Command] Initializing command listener");
    try {
        commandListener = database.ref('device/commands/latest').on('value', (snapshot) => {
            const command = snapshot.val();
            console.log("[Command] Current state:", command);
        });
    } catch (error) {
        console.error("[Command] Listener setup failed:", error);
        showAlert("Failed to initialize command listener", "error");
    }
}

function trackFeedings(database) {
    console.log("[History] Initializing feeding history tracking");
    try {
        database.ref('feedingHistory').orderByChild('timestamp').limitToLast(24).on('value', snapshot => {
            const feedings = [];
            const labels = [];
            const data = [];
            
            snapshot.forEach(child => {
                const feed = child.val();
                const time = new Date(feed.timestamp);
                const label = time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                feedings.unshift(feed);
                labels.unshift(label);
                data.unshift(1);
            });
            
            feedingHistoryChart.data.labels = labels;
            feedingHistoryChart.data.datasets[0].data = data;
            feedingHistoryChart.update();
        });
    } catch (error) {
        console.error("[History] Tracking setup failed:", error);
        showAlert("Failed to initialize feeding history", "error");
    }
}

function trackUserActivity(database) {
    console.log("[Activity] Initializing user activity tracking");
    try {
        database.ref('userActivity').orderByChild('lastLogin').limitToLast(100).on('value', snapshot => {
            const hourlyActivity = Array(24).fill(0);
            
            snapshot.forEach(child => {
                const activity = child.val();
                const hour = new Date(activity.lastLogin).getHours();
                hourlyActivity[hour]++;
            });
            
            userActivityChart.data.datasets[0].data = hourlyActivity;
            userActivityChart.update();
        });

        // Update user activity periodically
        setInterval(() => {
            if (currentUser) {
                database.ref(`userActivity/${currentUser.uid}`).update({
                    email: currentUser.email,
                    displayName: currentUser.displayName || currentUser.email.split('@')[0],
                    photoURL: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email.split('@')[0])}`,
                    lastLogin: Date.now(),
                    count: firebase.database.ServerValue.increment(1)
                });
            }
        }, 300000);
    } catch (error) {
        console.error("[Activity] Tracking setup failed:", error);
        showAlert("Failed to initialize user activity tracking", "error");
    }
}

// Utility functions
async function checkPathExists(path) {
    try {
        const snapshot = await firebase.database().ref(path).once('value');
        return snapshot.exists();
    } catch (error) {
        console.error("[Error] Path check failed:", error);
        return false;
    }
}

function isValidTime(timeString) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
}

function showAlert(message, type) {
    console.log(`[Alert] ${type}: ${message}`);
    const alertBox = document.getElementById('alert-box');
    if (alertBox) {
        alertBox.textContent = message;
        alertBox.style.display = 'block';
        alertBox.className = `alert-box ${type}`;
        
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    console.log("[System] Cleaning up listeners");
    const database = firebase.database();
    
    if (motorStatusListener) database.ref('device/status/motor').off('value', motorStatusListener);
    if (feedingEnabledListener) database.ref('device/settings/feedingEnabled').off('value', feedingEnabledListener);
    if (scheduleListener) database.ref('device/settings/schedule').off('value', scheduleListener);
    if (servoEnabledListener) database.ref('device/settings/servoEnabled').off('value', servoEnabledListener);
    if (temperatureListener) database.ref('device/sensors/temperature').off('value', temperatureListener);
    if (commandListener) database.ref('device/commands/latest').off('value', commandListener);
    
    if (feedTimeout) clearTimeout(feedTimeout);
});
