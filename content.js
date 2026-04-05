/** Hook for clear-and-sync; DOM is re-scraped each time so no page-side state to clear. */
function clearExistingExamEvents() {}

function findScheduleOfWeekYearSelect() {
  return (
    document.getElementById("ctl00_mainContent_drpYear") ||
    document.querySelector('select[name*="Year"]')
  );
}

function findScheduleOfWeekWeekSelect() {
  return (
    document.getElementById("ctl00_mainContent_drpWeek") ||
    document.getElementById("ctl00_mainContent_ddlWeek") ||
    document.querySelector('select[id*="mainContent"][id*="drp"][id*="Week"]') ||
    document.querySelector('select[id*="mainContent"][id*="Week"]') ||
    document.querySelector('select[name*="drpWeek"]') ||
    document.querySelector('select[name*="Week"]')
  );
}

function getScheduleOfWeekControls() {
  const weekSelect = findScheduleOfWeekWeekSelect();
  const yearSelect = findScheduleOfWeekYearSelect();
  const onWeekPage = /ScheduleOfWeek\.aspx/i.test(window.location.pathname || "");

  if (!weekSelect) {
    const loginLike =
      document.querySelector('input[type="password"]') ||
      document.getElementById("ctl00_mainContent_txtPassword");
    const loginRequired = !!loginLike;
    return {
      ok: false,
      loginRequired,
      onWeekPage,
      error: loginRequired ? "login-required" : "week-select-not-found"
    };
  }

  const weeks = Array.from(weekSelect.options).map((opt, idx) => ({
    index: idx,
    value: opt.value,
    label: (opt.textContent || "").trim()
  }));

  const years = yearSelect
    ? Array.from(yearSelect.options).map((opt, idx) => ({
        index: idx,
        value: opt.value,
        label: (opt.textContent || "").trim()
      }))
    : [];

  return {
    ok: true,
    onWeekPage,
    yearIndex: yearSelect ? yearSelect.selectedIndex : -1,
    yearValue: yearSelect ? yearSelect.value : "",
    weekIndex: weekSelect.selectedIndex,
    weeks,
    years
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "extractSchedule") {
    try {
      const fmtTime = t => {
        if (!t || typeof t !== "string") return { hour: 0, minute: 0 };
        
        // Clean up the string - remove extra spaces and normalize
        const cleaned = t.trim().replace(/\s+/g, "");
        
        // Handle Vietnamese format (10h00, 10h, 10H00)
        if (cleaned.match(/\d+h\d*/i)) {
          const [h, m = "0"] = cleaned.replace(/h/i, ":").split(":").map(Number);
          return { hour: h, minute: m };
        }
        
        // Handle colon format (10:00, 10:30)
        if (cleaned.includes(":")) {
          const [h, m = "0"] = cleaned.split(":").map(Number);
          return { hour: h, minute: m };
        }
        
        // Handle hour only format (10, 14) - assume no minutes
        if (/^\d{1,2}$/.test(cleaned)) {
          const h = Number(cleaned);
          return { hour: h, minute: 0 };
        }
        
        // Handle dot format (10.00, 10.30)
        if (cleaned.includes(".")) {
          const [h, m = "0"] = cleaned.split(".").map(Number);
          return { hour: h, minute: m };
        }
        
        return { hour: 0, minute: 0 };
      };

      const rows = Array.from(document.querySelectorAll("#ctl00_mainContent_divContent table tr"))
        .slice(1)
        .map(tr => Array.from(tr.cells).map(td => td.textContent.trim()));

      const events = rows
        .filter(row => row.length >= 8 && row[3] && row[5] !== undefined)
        .map(row => {
          const [no, code, name, date, room, time, form, exam, ...rest] = row;
          
          const [day, month, year] = date.split("/").map(Number);
          const [startStr, endStr] = time.split("-");
          const start = new Date(year, month - 1, day, fmtTime(startStr).hour, fmtTime(startStr).minute);
          const end = new Date(year, month - 1, day, fmtTime(endStr).hour, fmtTime(endStr).minute);
          
          let rawTag = "";
          if (exam && exam.trim()) {
            rawTag = exam.trim().toUpperCase();
          } else if (rest.length > 0 && rest[0] && rest[0].trim()) {
            rawTag = rest[0].trim().toUpperCase();
          }
          
          const formLower = (form || "").toLowerCase();
          
          let tag = null;
          if (rawTag === "2NDFE") tag = "2NDFE";
          else if (rawTag === "2NDPE") tag = "2NDPE";
          else if (rawTag === "PE") tag = "PE";
          else if (rawTag === "FE") tag = "FE";
          else if (!rawTag || rawTag === "") {
            if (formLower.includes("2nd") && formLower.includes("fe")) tag = "2NDFE";
            else if (formLower.includes("2nd") && formLower.includes("pe")) tag = "2NDPE";
            else if (formLower.includes("practical_exam") || formLower.includes("project presentation")) tag = "PE";
            else if (formLower.includes("multiple_choices") || formLower.includes("speaking")) tag = "FE";
          }

          return {
            title: code || "Unknown",
            location: room || "",
            description: form || "",
            start,
            end,
            tag
          };
        });

      sendResponse({ events });
    } catch (e) {
      sendResponse({ events: [] });
    }
    return true;
  } else if (msg.action === "clearAndSync") {
    try {
      // First clear existing exam events
      clearExistingExamEvents();
      
      // Then extract and return new schedule
      const fmtTime = t => {
        if (!t || typeof t !== "string") return { hour: 0, minute: 0 };
        
        // Clean up the string - remove extra spaces and normalize
        const cleaned = t.trim().replace(/\s+/g, "");
        
        // Handle Vietnamese format (10h00, 10h, 10H00)
        if (cleaned.match(/\d+h\d*/i)) {
          const [h, m = "0"] = cleaned.replace(/h/i, ":").split(":").map(Number);
          return { hour: h, minute: m };
        }
        
        // Handle colon format (10:00, 10:30)
        if (cleaned.includes(":")) {
          const [h, m = "0"] = cleaned.split(":").map(Number);
          return { hour: h, minute: m };
        }
        
        // Handle hour only format (10, 14) - assume no minutes
        if (/^\d{1,2}$/.test(cleaned)) {
          const h = Number(cleaned);
          return { hour: h, minute: 0 };
        }
        
        // Handle dot format (10.00, 10.30)
        if (cleaned.includes(".")) {
          const [h, m = "0"] = cleaned.split(".").map(Number);
          return { hour: h, minute: m };
        }
        
        return { hour: 0, minute: 0 };
      };

      const rows = Array.from(document.querySelectorAll("#ctl00_mainContent_divContent table tr"))
        .slice(1)
        .map(tr => Array.from(tr.cells).map(td => td.textContent.trim()));

      const events = rows
        .filter(row => row.length >= 8 && row[3] && row[5] !== undefined)
        .map(row => {
          const [no, code, name, date, room, time, form, exam, ...rest] = row;
          
          const [day, month, year] = date.split("/").map(Number);
          const [startStr, endStr] = time.split("-");
          const start = new Date(year, month - 1, day, fmtTime(startStr).hour, fmtTime(startStr).minute);
          const end = new Date(year, month - 1, day, fmtTime(endStr).hour, fmtTime(endStr).minute);
          
          let rawTag = "";
          if (exam && exam.trim()) {
            rawTag = exam.trim().toUpperCase();
          } else if (rest.length > 0 && rest[0] && rest[0].trim()) {
            rawTag = rest[0].trim().toUpperCase();
          }
          
          const formLower = (form || "").toLowerCase();
          
          let tag = null;
          if (rawTag === "2NDFE") tag = "2NDFE";
          else if (rawTag === "2NDPE") tag = "2NDPE";
          else if (rawTag === "PE") tag = "PE";
          else if (rawTag === "FE") tag = "FE";
          else if (!rawTag || rawTag === "") {
            if (formLower.includes("2nd") && formLower.includes("fe")) tag = "2NDFE";
            else if (formLower.includes("2nd") && formLower.includes("pe")) tag = "2NDPE";
            else if (formLower.includes("practical_exam") || formLower.includes("project presentation")) tag = "PE";
            else if (formLower.includes("multiple_choices") || formLower.includes("speaking")) tag = "FE";
          }

          return {
            title: code || "Unknown",
            location: room || "",
            description: form || "",
            start,
            end,
            tag
          };
        });

      sendResponse({ events, cleared: true });
    } catch (e) {
      sendResponse({ events: [], cleared: false });
    }
    return true;
  } else if (msg.action === "getWeekScheduleControls") {
    try {
      sendResponse(getScheduleOfWeekControls());
    } catch (e) {
      sendResponse({ ok: false, error: String(e.message || e) });
    }
    return true;
  } else if (msg.action === "extractWeeklySchedule") {
    try {
      if (!findScheduleOfWeekWeekSelect()) {
        const loginLike = document.querySelector('input[type="password"]');
        sendResponse({
          schedule: [],
          success: false,
          loginRequired: !!loginLike
        });
        return true;
      }
      const weeklySchedule = extractWeeklyScheduleFromTable();
      sendResponse({ schedule: weeklySchedule, success: true });
    } catch (e) {
      console.error("Error extracting weekly schedule:", e);
      sendResponse({ schedule: [], success: false });
    }
    return true;
  } else if (msg.action === "clearClassSchedule") {
    try {
      // Clear class schedule from localStorage via content script
      sendResponse({ success: true });
    } catch (e) {
      sendResponse({ success: false });
    }
    return true;
  }
});

function extractWeeklyScheduleFromTable() {
  console.log("Starting extraction with simplified code...");
  
  // Simple working version - use exact code that works in console
  const dayHeaders = Array.from(
    document.querySelectorAll("thead tr:nth-child(2) th")
  )
    .slice(1) // bỏ cột đầu "Slot"
    .map((th) => th.textContent.trim());

  const dayNames = Array.from(
    document.querySelectorAll("thead tr:nth-child(1) th")
  )
    .slice(1)
    .map((th) => th.textContent.trim());

  const rows = Array.from(document.querySelectorAll("tbody tr"))
    .filter((row) => row.querySelector("td")?.textContent?.startsWith("Slot"));

  const schedule = [];
  
  // Get correct year for date calculation
  const yearSelect = findScheduleOfWeekYearSelect();
  const year = yearSelect ? parseInt(yearSelect.value) : new Date().getFullYear();
  
  console.log("Headers found:", dayHeaders.length);
  console.log("Rows found:", rows.length);
  console.log("Using year:", year);

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    const slotName = cells[0].textContent.trim();

    for (let i = 1; i < cells.length; i++) {
      const cell = cells[i];
      const content = cell.innerHTML.trim();
      
      // Check for class content
      if (content.includes("href")) {
        // Try multiple regex patterns for more flexibility
        const subjectMatch = content.match(/([A-Z]{2,4}\d{3})-/) || 
                           content.match(/>([A-Z]{2,4}\d{3})/) ||
                           content.match(/([A-Z]{2,4}\d{3})/);
                           
        const roomMatch = content.match(/at\s+(.*?)\s*</) || 
                         content.match(/at\s+([A-Z]{1,3}-\d{3})/);
                         
        const timeMatch = content.match(/\((\d{1,2}:\d{2}-\d{1,2}:\d{2})\)/);
        
        // Extract detail link (anchor href)
        const hrefMatch = content.match(/href="([^"]+)"/i);
        let detailUrl = "";
        if (hrefMatch && hrefMatch[1]) {
          try {
            detailUrl = new URL(hrefMatch[1], window.location.href).href;
          } catch (e) {
            detailUrl = hrefMatch[1];
          }
        }

        // Extract attendance status from <font color="...">status</font>
        let attendanceStatus = null;
        let attendanceColor = null;
        const statusFontMatch = content.match(/<font\s+color="([^"]+)">([^<]+)<\/font>/i);
        if (statusFontMatch) {
          attendanceColor = (statusFontMatch[1] || '').toLowerCase();
          attendanceStatus = (statusFontMatch[2] || '').trim().toLowerCase();
        } else {
          // Fallback textual detection when not wrapped in font
          if (/\bnot\s*yet\b/i.test(content)) {
            attendanceStatus = 'not yet';
            attendanceColor = 'gray';
          } else if (/\babsent\b/i.test(content)) {
            attendanceStatus = 'absent';
            attendanceColor = 'red';
          } else if (/\battended\b/i.test(content)) {
            attendanceStatus = 'attended';
            attendanceColor = 'green';
          }
        }
        
        // Even if we can't find all parts, at least capture what we can
        if (subjectMatch) {
          const subject = subjectMatch[1];
          const room = roomMatch ? roomMatch[1] : "";
          const timeRange = timeMatch ? timeMatch[1] : "7:30-9:00"; // Default time if not found
          
          // Create formatted event 
          const dateStr = dayHeaders[i - 1];
          if (!dateStr) continue;

          const [day, month] = dateStr.split('/').map(Number);
          
          // FIX: Subtract one day from the extracted date to match the correct calendar date
          let adjustedDay = day - 1;
          let adjustedMonth = month;
          let adjustedYear = year;
          
          // Handle month/year boundaries when day becomes 0
          if (adjustedDay <= 0) {
            adjustedMonth -= 1;
            // If month becomes 0 (January), go to previous year December
            if (adjustedMonth <= 0) {
              adjustedMonth = 12;
              adjustedYear -= 1;
            }
            // Get last day of the previous month
            const lastDayOfPrevMonth = new Date(adjustedYear, adjustedMonth, 0).getDate();
            adjustedDay = lastDayOfPrevMonth;
          }
          
          let startHour = 0, startMinute = 0, endHour = 0, endMinute = 0;
          
          // Parse time if available
          if (timeMatch) {
            const [startTime, endTime] = timeRange.split('-');
            [startHour, startMinute] = startTime.split(':').map(Number);
            [endHour, endMinute] = endTime.split(':').map(Number);
          }

          // Store the correct adjusted date
          schedule.push({
            title: subject,
            detailUrl,
            attendanceStatus,
            attendanceColor,
            location: room,
            description: `${subject} - ${slotName} (${timeRange})`,
            rawDate: {
              year: adjustedYear,
              month: adjustedMonth,
              day: adjustedDay, // Adjusted day
              startHour,
              startMinute,
              endHour,
              endMinute,
              timeRange
            },
            slot: slotName,
            day: dayNames[i - 1],
            date: `${adjustedDay}/${adjustedMonth}/${adjustedYear}` // Adjusted date string
          });
          
          console.log(`Added: ${subject} on ${adjustedDay}/${adjustedMonth}/${adjustedYear} (adjusted from ${day}/${month}/${year}) ${timeRange}`);
        }
      }
    }
  });

  console.log(`Found ${schedule.length} classes`);
  return schedule;
}

function parseClassCell(cellHTML) {
  try {
    console.log("PARSE: Analyzing cell HTML...");
    
    // Extract subject code - look for pattern like "PRJ301-"
    const subjectMatch = cellHTML.match(/([A-Z]{3}\d{3})-/);
    if (!subjectMatch) {
      console.log("PARSE: ❌ No subject code found");
      console.log("PARSE: Cell HTML:", cellHTML);
      return null;
    }
    
    const subject = subjectMatch[1];
    console.log("PARSE: ✓ Subject:", subject);
    
    // Extract room - look for pattern like "at DE-226"
    const roomMatch = cellHTML.match(/at\s+([A-Z]{2,3}-?\d{3})/);
    const room = roomMatch ? roomMatch[1] : '';
    console.log("PARSE: ✓ Room:", room || 'N/A');
    
    // Extract status from red font
    const statusMatch = cellHTML.match(/<font color="red">([^<]+)<\/font>/);
    const status = statusMatch ? statusMatch[1] : 'Scheduled';
    console.log("PARSE: ✓ Status:", status);
    
    // Extract time range from label-success span
    const timeMatch = cellHTML.match(/<span class="label label-success">\(([^)]+)\)<\/span>/);
    const timeRange = timeMatch ? timeMatch[1] : '';
    console.log("PARSE: ✓ Time range:", timeRange || 'N/A');
    
    if (!timeRange) {
      console.log("PARSE: ❌ No time range found");
      return null;
    }
    
    // Parse start and end time
    let startHour = 0, startMinute = 0, endHour = 0, endMinute = 0;
    
    const timeParts = timeRange.split('-');
    if (timeParts.length === 2) {
      const [startTime, endTime] = timeParts;
      
      // Parse start time
      const startParts = startTime.trim().split(':');
      if (startParts.length === 2) {
        startHour = parseInt(startParts[0], 10);
        startMinute = parseInt(startParts[1], 10);
      }
      
      // Parse end time
      const endParts = endTime.trim().split(':');
      if (endParts.length === 2) {
        endHour = parseInt(endParts[0], 10);
        endMinute = parseInt(endParts[1], 10);
      }
      
      console.log("PARSE: ✓ Parsed time:", `${startHour}:${startMinute.toString().padStart(2, '0')} - ${endHour}:${endMinute.toString().padStart(2, '0')}`);
    } else {
      console.log("PARSE: ❌ Could not split time range");
      return null;
    }
    
    return {
      subject,
      room,
      status,
      timeRange,
      startHour,
      startMinute,
      endHour,
      endMinute
    };
  } catch (e) {
    console.error("PARSE: Error:", e);
    return null;
  }
}