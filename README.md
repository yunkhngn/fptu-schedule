# FPTU Examination

A modern Chrome extension that helps FPT University students easily extract and manage their exam schedules from the FAP system.

## Key Features

### Smart Exam Schedule Management
- **Tab Interface**: Clear separation between upcoming and completed exams with counters
- **Countdown Timer**: Visual time remaining until exam with color coding
  - **Today**: Current day exam (red)
  - **Tomorrow**: Next day exam (red) 
  - **Urgent**: 3 days or less (red)
  - **Future**: More than 3 days (green)
  - **Completed**: Past exams (gray)

### Automatic Exam Classification
- **FE** (Final Exam): End-of-term examinations
- **PE** (Practical Exam): Practical/lab examinations  
- **2NDFE** (Second Final Exam): Final exam retakes
- **2NDPE** (Second Practical Exam): Practical exam retakes

### Smart Filtering System
- Filter by exam type (FE, PE, 2NDFE, 2NDPE)
- Automatic filter preference saving
- Modal interface with utility buttons (Select All, Deselect All, Apply)
- Filters apply to both upcoming and completed exam tabs

### Flexible Time Format Support
The extension intelligently handles multiple time formats from different FAP system versions:
- **Vietnamese format**: `10h00`, `14h30`, `10H00`
- **Colon format**: `10:00`, `14:30`
- **Hour only**: `10`, `14` (assumes 00 minutes)
- **Dot format**: `10.00`, `14.30`
- **Mixed formats**: Automatically detects and processes different formats

### Modern Design
- Clean Material Design interface
- Responsive across different screen sizes
- Automatic dark mode following system preferences
- Smooth animations and transitions
- Tab-based navigation for better organization

### Intelligent Calendar Export
- **Export only upcoming exams** with confirmed room assignments
- Skip exams without room numbers or with TBA status
- Compatible with Apple Calendar, Google Calendar, Outlook
- Automatic reminders:
  - 1 day before exam
  - 1 hour before exam
- **Works from any website** using stored data (no need to be on FAP page)

## Installation

### Chrome Web Store Installation (Recommended)
Available now: [FPTU Examination on Chrome Web Store](https://chromewebstore.google.com/detail/fptu-exam-to-calendar/obiiippodjlfcmdipfbkneknbakjekfm)

### Manual Installation (Developer Mode)
1. **Clone repository**:
   ```bash
   git clone https://github.com/yunkhngn/fptu-schedule.git
   ```
2. **Open Chrome Extensions**:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** in the top right corner
3. **Load extension**:
   - Click **Load unpacked**
   - Select the cloned folder

## Usage Guide

### Step 1: Access FAP System
1. Open `https://fap.fpt.edu.vn/Exam/ScheduleExams.aspx`
2. Login with your FPT student account

### Step 2: Sync Exam Schedule
1. **Click extension icon** in Chrome toolbar
2. **Auto-sync**: Extension automatically loads when on FAP page
3. **Manual sync**: Click **Đồng bộ** button to reload data

### Step 3: Manage Exam Schedule
- **View upcoming exams**: "📅 Chưa thi" tab (shows count)
- **View exam history**: "✅ Đã thi" tab (shows count)
- **See countdown**: Each exam shows days remaining with color coding
- **Filter by type**: Click **Lọc** to select exam types to display

### Step 4: Export Calendar
1. **Click "📅 Tải xuống lịch .ics"** button
2. **Wait for download**: `lich-thi.ics` file
3. **Import to calendar app**:
   - **macOS**: Open with Calendar app
   - **Windows**: Open with Outlook
   - **Mobile**: Google Calendar, Apple Calendar

**Note**: Calendar export works from any website using previously synced data. Only exports upcoming exams with confirmed room assignments.

## Technology Stack

- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Chrome APIs**: Tabs, Scripting, Storage
- **Standards**: iCalendar (RFC 5545)
- **Design**: Material Design principles
- **Storage**: LocalStorage for data persistence

## Smart Features

### Time Format Detection
The extension automatically handles various time formats from FAP:
```javascript
// Supported formats:
"10h00 - 12h00"    // Vietnamese format
"10:00 - 12:00"    // Colon format  
"10.00 - 12.30"    // Dot format
"10 - 12"          // Hour only
```

### Exam Type Recognition
Automatically detects exam types from:
- Explicit exam type tags in data
- Form description keywords
- Mixed Vietnamese/English terminology

### Intelligent Export Logic
- Skips completed exams (past dates)
- Excludes exams without room assignments
- Filters out TBA/unscheduled exams
- Adds appropriate reminders

## Interface Design

### Light Theme
- Primary color: Blue (#3b82f6)
- Background: White (#ffffff)
- Text: Dark gray (#1f2937)

### Component Design
- **Cards**: 12px border radius, subtle shadows
- **Tabs**: Active/inactive states with counters
- **Tags**: Color-coded by exam type and urgency
- **Modal**: Overlay with backdrop blur
- **Countdown**: Dynamic color based on urgency

## Project Structure

```
fptu-schedule/
├── manifest.json          # Extension manifest
├── popup.html             # Main popup interface
├── popup.css              # Styling and themes
├── popup.js               # Main logic and rendering
├── content.js             # FAP page data extraction
├── sanitize-utils.js      # Security utilities
├── icons/                 # Extension icons
├── docs/                  # Documentation website
└── README.md              # Documentation
```

## Contributing

Contributions are welcome! Please:

1. **Fork** the repository
2. **Create branch** for new feature
3. **Commit** changes with clear messages
4. **Push** to branch
5. **Create Pull Request**

## Changelog

### v2.1.0 (Current)
- Enhanced time format support (Vietnamese, colon, dot, hour-only)
- Improved exam type detection and classification
- Added tab system with exam counters
- Enhanced countdown timer with color coding
- Smart filtering system with modal interface
- Export only upcoming exams with confirmed rooms
- Better error handling and data validation

### v2.0.0 (2025)
- Added tab system (Upcoming/Completed exams)
- Added countdown timer with color coding
- Added exam type filtering system
- New Material Design interface
- Calendar export works from any website

### v1.0.0 (2024)
- Initial release
- Basic exam schedule export
- Exam type recognition

## Browser Support

- **Chrome**: v88+ (Manifest V3)
- **Edge**: v88+ (Chromium-based)
- **Other Chromium browsers**: Compatible

## Data Privacy

- **Local Storage Only**: All data stored locally in browser
- **No External Servers**: No data sent to third parties
- **Secure Processing**: Data sanitization and validation
- **User Control**: Complete control over data export and deletion

## Troubleshooting

### Common Issues
1. **No data syncing**: Ensure you're on the correct FAP exam page
2. **Time format errors**: Extension automatically handles multiple formats
3. **Export issues**: Check if exams have confirmed room assignments
4. **Filter not working**: Clear browser data and re-sync

### Support Resources
- **Bug Reports**: [GitHub Issues](https://github.com/yunkhngn/fptu-schedule/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/yunkhngn/fptu-schedule/discussions)
- **Documentation**: [Project Website](https://yunkhngn.github.io/fptu-schedule/)

## Author

**Developed with love by:**
- [@yunkhngn](https://github.com/yunkhngn) - Developer & Designer & Guitarist

**I 💛 FPTU** - Tôi yêu FPT University

## License

MIT License - See [LICENSE](LICENSE) file for details

---

**If this extension helps you manage your exam schedule, please ⭐ star the repository to support the author!**