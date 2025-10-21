// State
let logsVisible = false;
let dashboardVisible = false;
let allLogs = [];

// Error logging
function logError(context, error) {
    console.error(`[Popup Error - ${context}]:`, error);
    alert(`Error: ${error.message || 'Something went wrong'}`);
}

// Show loading state
function setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = isLoading;
        if (isLoading) {
            button.dataset.originalText = button.textContent;
            button.textContent = 'Loading...';
        } else {
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }
}

// Calculate statistics from logs
function calculateStats(logs) {
    const stats = {
        totalEvents: logs.length,
        tabSwitches: 0,
        pasteEvents: 0,
        keystrokeBatches: 0,
        idleEvents: 0,
        sessionStart: null,
        sessionEnd: null,
        problems: new Set(),
        eventTypes: {}
    };

    logs.forEach(log => {
        // Count event types
        stats.eventTypes[log.e] = (stats.eventTypes[log.e] || 0) + 1;

        // Track specific events
        if (log.e === 'tab_switch') stats.tabSwitches++;
        if (log.e === 'paste') stats.pasteEvents++;
        if (log.e === 'keystroke_batch' || log.e === 'keystroke') stats.keystrokeBatches++;
        if (log.e === 'idle_detected' || log.e === 'idle') stats.idleEvents++;

        // Track problems
        if (log.problem && log.problem !== 'unknown') {
            stats.problems.add(log.problem);
        }

        // Track session times
        if (!stats.sessionStart || log.timestamp < stats.sessionStart) {
            stats.sessionStart = log.timestamp;
        }
        if (!stats.sessionEnd || log.timestamp > stats.sessionEnd) {
            stats.sessionEnd = log.timestamp;
        }
    });

    return stats;
}

// Generate alerts based on statistics
function generateAlerts(stats) {
    const alerts = [];

    if (stats.pasteEvents > 10) {
        alerts.push({
            type: 'danger',
            message: `High paste count: ${stats.pasteEvents} pastes detected`
        });
    } else if (stats.pasteEvents > 5) {
        alerts.push({
            type: 'warning',
            message: `Moderate paste activity: ${stats.pasteEvents} pastes`
        });
    }

    if (stats.tabSwitches > 15) {
        alerts.push({
            type: 'danger',
            message: `Excessive tab switching: ${stats.tabSwitches} switches`
        });
    } else if (stats.tabSwitches > 8) {
        alerts.push({
            type: 'warning',
            message: `Frequent tab switching: ${stats.tabSwitches} switches`
        });
    }

    if (stats.idleEvents > 5) {
        alerts.push({
            type: 'warning',
            message: `Multiple idle periods detected: ${stats.idleEvents}`
        });
    }

    if (alerts.length === 0) {
        alerts.push({
            type: 'info',
            message: 'No suspicious behavior detected'
        });
    }

    return alerts;
}


function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}


function renderDashboard(logs) {
    const stats = calculateStats(logs);
    const alerts = generateAlerts(stats);

    // Update stat cards
    document.getElementById('totalEvents').textContent = stats.totalEvents;
    document.getElementById('tabSwitches').textContent = stats.tabSwitches;
    document.getElementById('pasteEvents').textContent = stats.pasteEvents;

    // Calculate session duration
    if (stats.sessionStart && stats.sessionEnd) {
        const duration = stats.sessionEnd - stats.sessionStart;
        document.getElementById('sessionTime').textContent = formatDuration(duration);
    } else {
        document.getElementById('sessionTime').textContent = '0m';
    }

    // Render alerts
    const alertsContainer = document.getElementById('alertsContainer');
    alertsContainer.innerHTML = '';
    alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${alert.type}`;
        alertDiv.textContent = alert.message;
        alertsContainer.appendChild(alertDiv);
    });

    // Render event distribution chart
    const chartContainer = document.getElementById('eventChart');
    chartContainer.innerHTML = '';

    const eventEntries = Object.entries(stats.eventTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); 

    const maxCount = Math.max(...eventEntries.map(e => e[1]));

    eventEntries.forEach(([eventType, count]) => {
        const barItem = document.createElement('div');
        barItem.className = 'bar-item';

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = eventType;

        const barFill = document.createElement('div');
        barFill.className = 'bar-fill';
        const percentage = (count / maxCount) * 100;
        barFill.style.width = `${percentage}%`;

        const value = document.createElement('div');
        value.className = 'bar-value';
        value.textContent = count;

        barItem.appendChild(label);
        barItem.appendChild(barFill);
        barItem.appendChild(value);
        chartContainer.appendChild(barItem);
    });

    document.getElementById('chartContainer').classList.add('visible');
}


// Show Dashboard
document.getElementById("showDashboard").addEventListener("click", async () => {
    if (dashboardVisible) {
        document.getElementById('dashboard').classList.remove('visible');
        dashboardVisible = false;
        return;
    }

    setLoading("showDashboard", true);

    try {
        const data = await chrome.storage.local.get("logs");
        allLogs = data.logs || [];

        if (allLogs.length === 0) {
            alert("No data to display. Start a coding session first!");
            return;
        }

        renderDashboard(allLogs);
        document.getElementById('dashboard').classList.add('visible');
        dashboardVisible = true;
    } catch (error) {
        logError('showDashboard', error);
    } finally {
        setLoading("showDashboard", false);
    }
});
function populateFilters(logs){
  const eventTypes = new Set();
  const problems = new Set();

  logs.forEach(log => {
        if (log.e) eventTypes.add(log.e);
        if (log.problem && log.problem !== 'unknown' && log.problem !== 'error-getting-name') {
            problems.add(log.problem);
        }
    });
  
  const eventTypeFilter = document.getElementById('eventTypeFilter');
  eventTypeFilter.innerHTML = '<option value="all">All Events</option>';
  Array.from(eventTypes).sort().forEach(eventType => {
      const option = document.createElement('option');
      option.value = eventType;
      option.textContent = eventType;
      eventTypeFilter.appendChild(option);
  });

  const problemFilter = document.getElementById('problemFilter');
  problemFilter.innerHTML = '<option value="all">All Problems</option>';
  Array.from(problems).sort().forEach(problem => {
      const option = document.createElement('option');
      option.value = problem;
      option.textContent = problem;
      problemFilter.appendChild(option);
  });
}

function filterLogs(logs) {
  const eventTypeFilter = document.getElementById('eventTypeFilter').value;
  const problemFilter = document.getElementById('problemFilter').value;

  return logs.filter(log => {
    const matchesEventType = eventTypeFilter === 'all' || log.e === eventTypeFilter;
    const matchesProblem = problemFilter === 'all' || log.problem === problemFilter;
    return matchesEventType && matchesProblem;
  });
}


function renderLogs(logs) {
    const list = document.getElementById("logList");
    list.innerHTML = "";

    if (logs.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No logs match the current filters";
        item.style.color = "#888";
        list.appendChild(item);
        return;
    }

   
    const logsToShow = logs.slice(-100);

    logsToShow.forEach(log => {
        const item = document.createElement("li");
        const time = new Date(log.timestamp).toLocaleTimeString();
        const problem = log.problem ? ` (${log.problem})` : '';
        item.textContent = `${log.e} at ${time}${problem}`;

        
        if (log.e === 'paste') {
            item.classList.add('danger');
        } else if (log.e === 'tab_switch' || log.e === 'idle_detected') {
            item.classList.add('warning');
        }

        list.appendChild(item);
    });

    if (logs.length > 100) {
        const notice = document.createElement("li");
        notice.textContent = `... and ${logs.length - 100} more (export to see all)`;
        notice.style.color = "#888";
        notice.style.fontStyle = "italic";
        list.appendChild(notice);
    }
}

// Show/Hide Logs
document.getElementById("showLogs").addEventListener("click", async () => {
    const list = document.getElementById("logList");
    const button = document.getElementById("showLogs");
    const filterSection = document.getElementById("filterSection");

    if (!logsVisible) {
        setLoading("showLogs", true);

        try {
            const data = await chrome.storage.local.get("logs");
            allLogs = data.logs || [];

            if (allLogs.length === 0) {
                list.innerHTML = "";
                const item = document.createElement("li");
                item.textContent = "No logs yet";
                item.style.color = "#888";
                list.appendChild(item);
            } else {
                
                populateFilters(allLogs);

                
                const filteredLogs = filterLogs(allLogs);
                renderLogs(filteredLogs);
            }

            requestAnimationFrame(() => {
                list.classList.add("showing");
            });

            logsVisible = true;
            filterSection.style.display = "flex";
        } catch (error) {
            logError('showLogs', error);
        } finally {
            setLoading("showLogs", false);
            button.textContent = "Hide Logs";
        }
    } else {
        list.classList.remove("showing");
        setTimeout(() => {
            list.innerHTML = "";
        }, 300);
        logsVisible = false;
        button.textContent = "Show Logs";
        filterSection.style.display = "none";
    }
});


document.getElementById('eventTypeFilter').addEventListener('change', () => {
    if (logsVisible && allLogs.length > 0) {
        const filteredLogs = filterLogs(allLogs);
        renderLogs(filteredLogs);
    }
});


document.getElementById('problemFilter').addEventListener('change', () => {
    if (logsVisible && allLogs.length > 0) {
        const filteredLogs = filterLogs(allLogs);
        renderLogs(filteredLogs);
    }
});
// Clear Data
document.getElementById("clearData").addEventListener("click", async () => {
    if (!confirm("Are you sure you want to clear all logs? This cannot be undone.")) {
        return;
    }

    setLoading("clearData", true);

    try {
        const list = document.getElementById("logList");
        if (list) {
            list.innerHTML = "";
            list.classList.remove("showing");
        }

        document.getElementById('dashboard').classList.remove('visible');
        await chrome.storage.local.set({logs: []});
        logsVisible = false;
        dashboardVisible = false;
        document.getElementById("showLogs").textContent = "Show Logs";

        alert("Logs cleared successfully!");
    } catch (error) {
        logError('clearData', error);
    } finally {
        setLoading("clearData", false);
    }
});


document.getElementById("exportLogs").addEventListener("click", async () => {
  const exportOptions = document.getElementById("exportOptions")

  if (exportOptions.style.display === "flex"){
    exportOptions.style.display = "none";
  }
  else{
    exportOptions.style.display = "flex";
  }
});
document.getElementById('exportFilter').addEventListener('change', async (e) => {
  const format = e.target.value;

  if (format === 'none') return;

  const dropdown = e.target;
  dropdown.disabled = true;

  try{
    const data = await chrome.storage.local.get("logs");
    const logs = data.logs || [];

    if (logs.length === 0){
      alert("No logs to export");
      return
    }

    switch(format){
      case 'xlsx':
        await exportXLSX(logs);
        break;
      case 'csv':
        await exportCSV(logs);
        break;
      case 'pdf':
        await exportPDF(logs);
        break;
      default:
        alert("Please select a format")
    } 
    
    document.getElementById("exportOptions").style.display = 'none'
    e.target.value = 'none';
  }
  catch (error) {
    logError('export', error);
  }
  finally{
    dropdown.disabled = false;
  }
  
});

async function exportXLSX(logs) {
    if (typeof XLSX === 'undefined') {
        throw new Error('XLSX library not loaded. Please reload the extension.');
    }

    const header = ["Event", "Typing Speed", "Problem", "Timestamp"];
    const rows = logs.map(log => ([
        log.e || "",
        log.typingSpeed !== undefined ? log.typingSpeed : "",
        log.problem || "",
        new Date(log.timestamp).toLocaleString()
    ]));

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);

    
    worksheet['!cols'] = [
        {wch: 20},
        {wch: 15},
        {wch: 30},
        {wch: 25}
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(blob, `coding-assessment-logs-${timestamp}.xlsx`);

    alert(`Successfully exported ${logs.length} logs as XLSX!`);
}


async function exportCSV(logs) {
    const header = ["Event", "Typing Speed", "Problem", "Timestamp"];
    
    
    let csvContent = header.join(",") + "\n";
    
    logs.forEach(log => {
        const row = [
            escapeCSV(log.e || ""),
            log.typingSpeed !== undefined ? log.typingSpeed : "",
            escapeCSV(log.problem || ""),
            escapeCSV(new Date(log.timestamp).toLocaleString())
        ];
        csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(blob, `coding-assessment-logs-${timestamp}.csv`);

    alert(`Successfully exported ${logs.length} logs as CSV!`);
}


async function exportPDF(logs) {
    if (typeof window.jspdf === 'undefined') {
        throw new Error('jsPDF library not loaded. Please reload the extension.');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    
    const stats = calculateStats(logs);
    const alerts = generateAlerts(stats);
    
    let yPos = 20;
    const leftMargin = 15;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 7;
    
    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Coding Assessment Report', leftMargin, yPos);
    yPos += 10;
    
   
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, leftMargin, yPos);
    yPos += 6;
    doc.text(`Total Events: ${logs.length}`, leftMargin, yPos);
    yPos += 6;
    
    if (stats.sessionStart && stats.sessionEnd) {
        const duration = formatDuration(stats.sessionEnd - stats.sessionStart);
        doc.text(`Session Duration: ${duration}`, leftMargin, yPos);
        yPos += 10;
    } else {
        yPos += 4;
    }
    
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Summary Statistics', leftMargin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Tab Switches: ${stats.tabSwitches}`, leftMargin, yPos);
    yPos += 6;
    doc.text(`Paste Events: ${stats.pasteEvents}`, leftMargin, yPos);
    yPos += 6;
    doc.text(`Idle Periods: ${stats.idleEvents}`, leftMargin, yPos);
    yPos += 6;
    doc.text(`Unique Problems: ${stats.problems.size}`, leftMargin, yPos);
    yPos += 10;
    
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Behavioral Alerts', leftMargin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    alerts.forEach(alert => {
        
        if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
        }
        
        
        if (alert.type === 'danger') {
            doc.setTextColor(220, 20, 20);
            doc.text(`[!] ${alert.message}`, leftMargin, yPos);
        } else if (alert.type === 'warning') {
            doc.setTextColor(220, 180, 20);
            doc.text(`[?] ${alert.message}`, leftMargin, yPos);
        } else {
            doc.setTextColor(20, 180, 20);
            doc.text(`[✓] ${alert.message}`, leftMargin, yPos);
        }
        doc.setTextColor(0, 0, 0); 
        yPos += 7;
    });
    yPos += 5;
    
    
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Detailed Event Log', leftMargin, yPos);
    yPos += 10;
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    
    
    doc.setFont(undefined, 'bold');
    doc.text('Event', leftMargin, yPos);
    doc.text('Problem', leftMargin + 45, yPos);
    doc.text('Timestamp', leftMargin + 110, yPos);
    yPos += 5;
    
   
    doc.line(leftMargin, yPos, 195, yPos);
    yPos += 5;
    
    doc.setFont(undefined, 'normal');
    
    
    logs.forEach((log, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 15) {
            doc.addPage();
            yPos = 20;
            
            // Redraw header on new page
            doc.setFont(undefined, 'bold');
            doc.text('Event', leftMargin, yPos);
            doc.text('Problem', leftMargin + 45, yPos);
            doc.text('Timestamp', leftMargin + 110, yPos);
            yPos += 5;
            doc.line(leftMargin, yPos, 195, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
        }
        
        
        const eventText = (log.e || "").substring(0, 20);
        const problemText = (log.problem || "N/A").substring(0, 30);
        const timeText = new Date(log.timestamp).toLocaleTimeString();
        
        // Color code suspicious events
        if (log.e === 'paste') {
            doc.setTextColor(220, 20, 20);
        } else if (log.e === 'tab_switch' || log.e === 'idle_detected') {
            doc.setTextColor(220, 180, 20);
        }
        
        doc.text(eventText, leftMargin, yPos);
        doc.text(problemText, leftMargin + 45, yPos);
        doc.text(timeText, leftMargin + 110, yPos);
        
        doc.setTextColor(0, 0, 0); // Reset color
        yPos += 5;
    });
    
    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }
    
    
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`coding-assessment-logs-${timestamp}.pdf`);
    
    alert(`Successfully exported ${logs.length} logs as PDF!`);
}


function escapeCSV(str) {
    if (typeof str !== 'string') return str;
    
   
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}


function downloadFile(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}