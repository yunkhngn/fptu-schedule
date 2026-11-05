/**
 * fap-routes.js — Single route table for FAP pages
 *
 * Classifies every FAP path into:
 * - "native": React rendered from extracted DOM data
 * - "form": React driven into native inputs, native submit button clicked
 * - "auth": Login page with native credential slots
 * - "wrapped": Shell wraps native FAP content via Shadow DOM slot
 *
 * Excluded paths return null (never mount the new shell: logout, oauth redirects, Default.aspx).
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FapRoutes = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var EXCLUDED_PREFIXES = [
    "/Auth/Logout",
    "/Auth/GoogleLogin",
    "/Auth/LoginParent",
    "/Default.aspx",
    "/Default",
    "/Logout",
  ];

  /**
   * Complete route table.
   * Patterns can be exact path or end with "/*" to match subpaths.
   */
  var ROUTES = [
    {
      id: "overview",
      patterns: ["/", ""],
      kind: "native",
      nav: "/",
    },
    {
      id: "timetable",
      patterns: ["/WeeklyTimetable", "/WeeklyTimetable/*"],
      kind: "native",
      nav: "/thoi-khoa-bieu",
    },
    {
      id: "exams",
      patterns: ["/ExamSchedule", "/ExamSchedule/*"],
      kind: "native",
      nav: "/lich-thi",
    },
    {
      id: "login",
      patterns: ["/Auth/Login", "/Auth/Login/*"],
      kind: "auth",
      nav: null,
    },
    {
      id: "news-detail",
      patterns: ["/News/Detail", "/News/Detail/*"],
      kind: "native",
      nav: "/tin-tuc",
    },
    {
      id: "news",
      patterns: ["/News", "/News/Index", "/News/*"],
      kind: "native",
      nav: "/tin-tuc",
    },
    {
      // Shopping cart and payment pages remain wrapped:
      // payment QR code and payment button must not be disrupted.
      id: "shopping-cart",
      patterns: ["/ShoppingCart", "/ShoppingCart/*"],
      kind: "wrapped",
      nav: "/thanh-toan",
    },
    {
      id: "course-pending-payment",
      patterns: ["/CoursePendingPayment", "/CoursePendingPayment/*"],
      kind: "wrapped",
      nav: "/thanh-toan",
    },
    {
      id: "report-transcript",
      patterns: ["/Report/Transcript", "/Report/Transcript/*"],
      kind: "native",
      nav: "/bang-diem",
    },
    {
      id: "report-grade",
      patterns: ["/Report/Grade", "/Report/Grade/*"],
      kind: "native",
      nav: "/bao-cao-diem",
    },
    {
      id: "report-attendance",
      patterns: ["/Report/Attendance", "/Report/Attendance/*"],
      kind: "native",
      nav: "/bao-cao-diem-danh",
    },
    {
      id: "report-ojt-conditions",
      patterns: ["/Report/OjtConditions", "/Report/OjtConditions/*"],
      kind: "native",
      nav: "/dieu-kien-ojt",
    },
    {
      id: "report-thesis-conditions",
      patterns: ["/Report/ThesisConditions", "/Report/ThesisConditions/*"],
      kind: "native",
      nav: "/dieu-kien-kltn",
    },
    {
      id: "subject",
      patterns: ["/Subject", "/Subject/*"],
      kind: "native",
      nav: "/mon-hoc",
    },
    {
      id: "curriculum",
      patterns: ["/Curriculum", "/Curriculum/*"],
      kind: "native",
      nav: "/khung-chuong-trinh",
    },
    {
      id: "my-certificates",
      patterns: ["/MyCertificates", "/MyCertificates/*"],
      kind: "native",
      nav: "/chung-chi",
    },
    {
      id: "transaction",
      patterns: ["/Transaction", "/Transaction/*"],
      kind: "native",
      nav: "/thanh-toan",
    },
    {
      id: "document-detail",
      patterns: ["/Document/Detail", "/Document/Detail/*"],
      kind: "native",
      nav: "/tai-lieu",
    },
    {
      id: "document",
      patterns: ["/Document", "/Document/*"],
      kind: "native",
      nav: "/tai-lieu",
    },
    {
      id: "wishlist-register",
      patterns: ["/Wishlist/Register", "/Wishlist/Register/*"],
      kind: "wrapped", // upgraded in Task 13
      nav: "/mon-hoc",
    },
    {
      id: "wishlist",
      patterns: ["/Wishlist", "/Wishlist/*"],
      kind: "native",
      nav: "/mon-hoc",
    },
    {
      id: "fye-check-in-log",
      patterns: ["/FyeCheckInLog", "/FyeCheckInLog/*"],
      kind: "native",
      nav: "/fye",
    },
    {
      id: "fye-mentor-feedback",
      patterns: ["/FyeMentorFeedback", "/FyeMentorFeedback/*"],
      kind: "native",
      nav: "/fye",
    },
    {
      id: "application-catalog",
      patterns: ["/Application/Catalog", "/Application/Catalog/*"],
      kind: "native",
      nav: "/gui-don",
    },
    {
      id: "application-create",
      patterns: ["/Application/Create", "/Application/Create/*"],
      kind: "wrapped", // upgraded in Task 13
      nav: "/gui-don",
    },
    {
      id: "application",
      patterns: ["/Application", "/Application/*"],
      kind: "native",
      nav: "/xem-don",
    },
    {
      id: "startup-group-add",
      patterns: ["/StartupGroup/Add", "/StartupGroup/Add/*"],
      kind: "wrapped", // upgraded in Task 13
      nav: "/don-khoi-nghiep",
    },
    {
      id: "startup-group",
      patterns: ["/StartupGroup", "/StartupGroup/*"],
      kind: "native",
      nav: "/don-khoi-nghiep",
    },
    {
      id: "cross-class-change-create",
      patterns: ["/CrossClassChange/Create", "/CrossClassChange/Create/*"],
      kind: "wrapped", // upgraded in Task 13
      nav: "/don-doi-lop-cheo",
    },
    {
      id: "cross-class-change",
      patterns: ["/CrossClassChange", "/CrossClassChange/*"],
      kind: "native",
      nav: "/don-doi-lop-cheo",
    },
    {
      id: "account",
      patterns: ["/Account", "/Account/*", "/UserProfile", "/UserProfile/*"],
      kind: "native",
      nav: "/tai-khoan",
    },
    {
      id: "student-profile",
      patterns: ["/StudentProfile", "/StudentProfile/*"],
      kind: "form", // the profile form is driven through FAP's own controls; falls back to wrapped when it cannot be
      nav: "/tai-khoan",
    },
  ];

  function matchesPattern(pathname, pattern) {
    if (pattern === "*") return true;
    if (pattern.slice(-2) === "/*") {
      var prefix = pattern.slice(0, -2);
      return pathname === prefix || pathname.indexOf(prefix + "/") === 0;
    }
    return pathname === pattern;
  }

  function matchRoute(pathname) {
    if (typeof pathname !== "string") return null;

    var normalized = pathname.trim();
    if (normalized.length > 1 && normalized.charAt(normalized.length - 1) === "/") {
      normalized = normalized.slice(0, -1);
    }

    if (normalized === "") {
      normalized = "/";
    }

    // Check exclusion list
    for (var i = 0; i < EXCLUDED_PREFIXES.length; i++) {
      var excluded = EXCLUDED_PREFIXES[i];
      if (normalized === excluded || normalized.indexOf(excluded + "/") === 0) {
        return null;
      }
    }

    // Find specific route
    for (var r = 0; r < ROUTES.length; r++) {
      var route = ROUTES[r];
      for (var p = 0; p < route.patterns.length; p++) {
        if (matchesPattern(normalized, route.patterns[p])) {
          return {
            id: route.id,
            kind: route.kind,
            nav: route.nav,
          };
        }
      }
    }

    // Default fallback for any unspecified page on FAP
    return {
      id: "wrapped",
      kind: "wrapped",
      nav: null,
    };
  }

  return {
    ROUTES: ROUTES,
    matchRoute: matchRoute,
  };
});
