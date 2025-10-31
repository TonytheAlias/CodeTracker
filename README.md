# 🔍 Code Tracker

A Chrome extension designed to monitor and analyze user behavior during coding assessments on popular platforms like LeetCode, HackerRank, CodeSignal, and more. This tool helps identify suspicious patterns that may indicate AI-assisted cheating or other irregular behavior during technical interviews.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat&logo=javascript)

## 📋 Table of Contents

- [Features](#-features)
- [Supported Platforms](#-supported-platforms)
- [Installation](#-installation)
- [Usage](#-usage)
- [Technical Architecture](#-technical-architecture)
- [Export Formats](#-export-formats)
- [Privacy & Ethics](#-privacy--ethics)
- [Development](#-development)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

## ✨ Features

### Real-Time Behavior Tracking

- **Keystroke Analysis**: Monitors typing patterns and speed
- **Paste Detection**: Tracks code paste events that may indicate external assistance
- **Tab Switching**: Logs when users navigate away from the coding platform
- **Idle Detection**: Identifies periods of inactivity during assessments
- **Mouse Movement**: Tracks user engagement through cursor activity

### Comprehensive Dashboard

- **Visual Analytics**: Interactive charts showing event distribution
- **Statistical Summary**: Total events, session duration, and key metrics
- **Behavioral Alerts**: Automated flagging of suspicious patterns
  - High paste frequency (>10 pastes = danger, >5 = warning)
  - Excessive tab switching (>15 = danger, >8 = warning)
  - Multiple idle periods

### Flexible Data Export

Export logs in multiple formats for detailed analysis:

- **Excel (.xlsx)**: Structured spreadsheet with formatted columns
- **CSV (.csv)**: Universal format for data processing
- **PDF (.pdf)**: Professional report with statistics and alerts

### Advanced Filtering

- Filter by event type (keystroke, paste, tab switch, etc.)
- Filter by problem/challenge name
- View up to 100 most recent events in real-time

## 🌐 Supported Platforms

- [LeetCode](https://leetcode.com)
- [HackerRank](https://hackerrank.com)
- [CodeSignal](https://codesignal.com)
- [Codility](https://codility.com)
- [HackerEarth](https://hackerearth.com)

## 📦 Installation

### From Source (Developer Mode)

1. **Clone or Download the Repository**

   ```bash
   git clone https://github.com/tonythealias/code-tracker.git
   cd code-tracker
   ```

2. **Download Required Libraries**

   - Download [SheetJS (xlsx.full.min.js)](https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js)
   - Download [jsPDF (jspdf.umd.min.js)](https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js)
   - Place both files in the extension root directory

3. **Load in Chrome**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the extension directory
   - The Code Tracker icon should appear in your toolbar

4. **Verify Installation**
   - Click the extension icon to open the popup
   - You should see the dashboard interface with a retro terminal theme

## 🚀 Usage

### Starting a Session

1. Navigate to any supported coding platform
2. Open a coding problem/challenge
3. The extension automatically begins tracking once the page loads
4. A `session_start` event is logged immediately

### Viewing the Dashboard

1. Click the Code Tracker extension icon
2. Click **"Dashboard"** to view analytics
3. Review statistics and behavioral alerts
4. Click **"Dashboard"** again to hide

### Viewing Detailed Logs

1. Click **"Logs"** to view event history
2. Use filter dropdowns to narrow results:
   - Filter by event type
   - Filter by problem name
3. Last 100 events displayed with color coding:
   - 🔴 **Red**: Paste events (high risk)
   - 🟡 **Yellow**: Tab switches, idle periods (medium risk)
   - ⚪ **White**: Normal events

### Exporting Data

1. Click **"Export"** button
2. Select desired format from dropdown:
   - Excel for spreadsheet analysis
   - CSV for data processing
   - PDF for professional reports
3. File downloads automatically with timestamp

### Clearing Data

1. Click **"Clear"** button
2. Confirm the action
3. All logs are permanently deleted from local storage

## 🏗️ Technical Architecture

### Project Structure

```
code-tracker/
├── manifest.json           # Extension configuration (Manifest V3)
├── background.js          # Service worker for data persistence
├── content.js             # Injection script for behavior tracking
├── popup.html             # Extension UI interface
├── popup.js               # UI logic and data visualization
├── xlsx.full.min.js       # Excel export library
├── jspdf.umd.min.js       # PDF export library
└── Images/                # Extension icons
    ├── CT-LogoV2-1.png
    ├── CT-LogoV2-2.png
    └── CT-LogoV2-3.png

```

### Key Technologies

- **Manifest V3**: Latest Chrome extension standard
- **Chrome Storage API**: Local data persistence
- **Content Scripts**: DOM interaction and event listening
- **Service Workers**: Background processing
- **SheetJS**: Excel file generation
- **jsPDF**: PDF report creation

### Event Buffering System

- **Batch Processing**: Events buffered for 2 seconds before storage
- **Debouncing**: Keystroke events aggregated every 500ms
- **Idle Detection**: Checks every 5 seconds for 10+ second inactivity
- **Storage Management**: Automatic pruning when approaching 9MB limit

### Data Structure

Each event is stored with:

```javascript
{
  e: "event_type",           // Event name
  problem: "problem-name",   // Problem identifier
  timestamp: 1234567890,     // Unix timestamp
  count: 5,                  // (keystroke batches only)
  avgTypingSpeed: 150,       // (keystroke batches only)
  idleDuration: 15000        // (active_return only)
}
```

## 📊 Export Formats

### Excel (.xlsx)

- Formatted columns: Event, Typing Speed, Problem, Timestamp
- Auto-sized columns for readability
- Preserves all data fields
- Compatible with Microsoft Excel, Google Sheets, LibreOffice

### CSV (.csv)

- Standard comma-separated format
- Proper escaping for special characters
- Universal compatibility
- Ideal for Python/R data analysis

### PDF (.pdf)

- **Summary Section**: Statistics, session duration, alerts
- **Event Log**: Complete chronological listing
- **Color Coding**: Red (pastes), Yellow (switches/idle), Green (normal)
- **Multi-page Support**: Automatic pagination
- **Professional Formatting**: Headers, footers, page numbers

## 🔐 Privacy & Ethics

### Data Storage

- **Local Only**: All data stored in browser's local storage
- **No External Transmission**: No data sent to external servers
- **User Control**: Easy data export and deletion
- **Transparent Operation**: All tracking visible and documented

### Ethical Considerations

This tool is designed for:

- ✅ Interview process integrity monitoring
- ✅ Educational research on coding behavior
- ✅ Self-assessment and improvement
- ✅ Authorized assessment environments

**NOT intended for:**

- ❌ Unauthorized surveillance
- ❌ Privacy invasion
- ❌ Unlawful monitoring

### Usage Recommendations

- Inform candidates that monitoring is active
- Obtain consent before deployment
- Use as one data point among many
- Consider context before making judgments

## 🛠️ Development

### Prerequisites

- Google Chrome (latest version)
- Basic understanding of Chrome Extension APIs
- JavaScript ES6+ knowledge

### Local Development

1. Make code changes in your editor
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Code Tracker card
4. Test changes on supported platforms

### Debugging

- **Background Script**: `chrome://extensions/` → "Inspect views: service worker"
- **Content Script**: Open DevTools on any supported platform
- **Popup**: Right-click extension icon → "Inspect popup"

### Testing Checklist

- [ ] Test on all supported platforms
- [ ] Verify event logging accuracy
- [ ] Test export in all formats
- [ ] Check storage management with large datasets
- [ ] Validate filter functionality
- [ ] Test dashboard calculations
- [ ] Verify alert thresholds

## 🚀 Future Enhancements

### Planned Features

- [ ] Real-time anomaly detection using ML
- [ ] Integration with ATS (Applicant Tracking Systems)
- [ ] Screenshot capture on suspicious events
- [ ] Network request monitoring
- [ ] Browser developer tools detection
- [ ] Multi-monitor detection
- [ ] Keyboard shortcut logging
- [ ] Code similarity analysis
- [ ] Session replay capability
- [ ] Cloud storage integration

### Performance Optimizations

- [ ] IndexedDB for larger datasets
- [ ] Web Workers for export processing
- [ ] Lazy loading for log rendering
- [ ] Virtual scrolling for large lists

## 📄 License

This project is provided as-is for educational and authorized assessment purposes. Users are responsible for ensuring compliance with applicable privacy laws and obtaining necessary consents before deployment.

## 👨‍💻 Author

**Your Name**

- GitHub: [@tonythealias](https://github.com/tonythealias)
- LinkedIn: [Tyreek Brasfield](https://linkedin.com/in/tyreekbrasfield)
- Email: www.tyreekbasfield@outlook.com

## 🙏 Acknowledgments

- SheetJS team for Excel export functionality
- jsPDF team for PDF generation
- Chrome Extensions documentation and community

---

**Note**: This tool should be used responsibly and ethically. Always obtain proper authorization and consent before monitoring user behavior in any context.

_Built with ❤️ to promote integrity in technical assessments_
