import type {
  ShellData,
  HomeData,
  ClassSession,
  ExamItem,
  NewsItemData,
  PageData,
  AttendanceReportData,
  GradeReportData,
  TranscriptData,
  ConditionsData,
  SubjectsData,
  CurriculumData,
  CertificatesData,
  TransactionsData,
  DocumentsData,
  WishlistData,
  FyeLogData,
  ApplicationsData,
  ApplicationCatalogData,
  ListOrEmptyData,
  ArticleData,
  AccountData,
} from "./types";

export const mockShell: ShellData = {
  student: {
    name: "Nguyễn Đăng Khoa",
    initials: "NK",
    studentId: "HE190183",
  },
  campus: "Cơ sở Hà Nội (HN)",
  unreadNotifications: 2,
};

export const mockNews: NewsItemData[] = [
  {
    id: "n1",
    title:
      "Thông báo lịch thi kết thúc học phần lần 1, lần 2 các môn học Block 1-4 học kỳ Fall 2026",
    category: "Thông tin Khảo Thí",
    publishedAt: "02/11/2026 23:27",
    href: "/News/Detail/n1",
  },
  {
    id: "n2",
    title: "Thông báo danh sách thi kết thúc học phần lần 2 võ 1 VOV114 half 1 ngày 04/11/2026",
    category: "Thông tin Khảo Thí",
    publishedAt: "02/11/2026 14:05",
    href: "/News/Detail/n2",
  },
  {
    id: "n3",
    title: "Thông báo điểm thi giữa kỳ môn KRG301 học kỳ Fall 2026",
    category: "Thông tin Khảo Thí",
    publishedAt: "02/11/2026 14:02",
    href: "/News/Detail/n3",
  },
  {
    id: "n4",
    title:
      "Thông báo điểm thi giữa kỳ KOR411, KRL402, điểm thi kết thúc học phần lần 1 võ 1 VOV114, điểm thi kết thúc học phần lần 2 võ 2,3 VOV124, VOV134 half 1 học kỳ Fall 2026",
    category: "Thông tin Khảo Thí",
    publishedAt: "31/10/2026 14:13",
    href: "/News/Detail/n4",
  },
  {
    id: "n5",
    title:
      "Thông báo điểm thi kết thúc học phần lần 2 các môn kết thúc sớm, các môn tiếng anh chuẩn bị half 1 học kỳ Fall 2026",
    category: "Thông tin Khảo Thí",
    publishedAt: "29/10/2026 20:31",
    href: "/News/Detail/n5",
  },
  {
    id: "n6",
    title: "Thông báo lịch thi giữa kỳ học phần KRG301, KRL402 học kỳ Fall 2026",
    category: "Thông tin Khảo Thí",
    publishedAt: "28/10/2026 22:09",
    href: "/News/Detail/n6",
  },
];

export const mockCategories = [
  "Tất cả",
  "Thông báo tài chính",
  "Thông tin chung",
  "Thông tin Đào tạo",
  "Thông tin Khảo Thí",
];

export const mockHome: HomeData = {
  metrics: {
    status: "HD",
    program: "BIT_SE_19B_NJ",
    email: "rogkhoa.mail@gmail.com",
    cohort: "19",
    balance: "0 VNĐ",
  },
  news: mockNews,
  categories: mockCategories,
};

export const mockSessions: ClassSession[] = [
  {
    id: "s1",
    date: "2026-11-03",
    slot: 3,
    time: "12h50-15h10",
    courseCode: "PRM393",
    classCode: "SE1938-NJ",
    mode: "offline",
    room: "DE-338",
    lecturer: "duongtb",
    attendance: "attended",
  },
  {
    id: "s2",
    date: "2026-11-03",
    slot: 4,
    time: "15h20-17h40",
    courseCode: "MLN122",
    classCode: "SE1938-NJ",
    mode: "offline",
    room: "BE-217",
    lecturer: "damk",
    attendance: "attended",
  },
  {
    id: "s3",
    date: "2026-11-04",
    slot: 4,
    time: "15h20-17h40",
    courseCode: "WDP301",
    classCode: "SE1938-NJ",
    mode: "offline",
    room: "DE-331",
    lecturer: "hailt",
    attendance: "attended",
  },
  {
    id: "s4",
    date: "2026-11-05",
    slot: 3,
    time: "12h50-15h10",
    courseCode: "MLN122",
    classCode: "SE1938-NJ",
    mode: "offline",
    room: "BE-306",
    lecturer: "HaDT37",
    attendance: "attended",
  },
  {
    id: "s5",
    date: "2026-11-06",
    slot: 2,
    time: "10h00-12h20",
    courseCode: "EXE201",
    classCode: "GD1911-AD",
    mode: "online",
    room: "BE-410",
    lecturer: "HieuDT46",
    attendance: "not-yet",
  },
  {
    id: "s6",
    date: "2026-11-06",
    slot: 3,
    time: "12h50-15h10",
    courseCode: "WDP301",
    classCode: "SE1938-NJ",
    mode: "offline",
    room: "DE-331",
    lecturer: "hailt",
    attendance: "not-yet",
  },
  {
    id: "s7",
    date: "2026-11-06",
    slot: 4,
    time: "15h20-17h40",
    courseCode: "PRM393",
    classCode: "SE1938-NJ",
    mode: "offline",
    room: "DE-338",
    lecturer: "duongtb",
    attendance: "not-yet",
  },
];

export const mockWeekStart = "2026-11-02";

export const mockExams: ExamItem[] = [
  {
    courseCode: "WDP301",
    courseName: "Dự án phát triển Web",
    date: "15/11/2026",
    time: "12h50 - 17h40",
    room: "BE-315",
    form: "Project Presentation",
    kind: "FE",
  },
  {
    courseCode: "MLN122",
    courseName: "Kinh tế chính trị Mác-Lênin",
    date: "17/11/2026",
    time: "14h30 - 16h00",
    room: "BE-302",
    form: "Multiple choices on EOS",
    kind: "FE",
  },
  {
    courseCode: "PRM393",
    courseName: "Lập trình di động",
    date: "22/11/2026",
    time: "10h50 - 12h20",
    room: "BE-314",
    form: "Multiple choices on EOS",
    kind: "FE",
  },
  {
    courseCode: "ITE302c",
    courseName: "Đạo đức trong CNTT",
    date: "13/12/2026",
    time: "07h30 - 08h50",
    room: "BE-302",
    form: "Multiple choices on EOS",
    kind: "FE",
  },
];

export const mockAttendanceReport: AttendanceReportData = {
  courses: [
    { code: "MLN122", name: "Kinh tế chính trị Mác - Lênin", attended: 10, absent: 2, total: 12, rate: 10 / 12 },
    { code: "EXE201", name: "Khởi nghiệp trải nghiệm 2", attended: 0, absent: 0, total: 0, rate: null },
  ],
  selectedCourse: "MLN122 - Kinh tế chính trị Mác - Lênin",
  filter: {
    value: "fall2026",
    options: [
      { value: "fall2026", label: "Fall2026" },
      { value: "summer2026", label: "Summer2026" },
      { value: "spring2026", label: "Spring2026" },
    ],
  },
  sessions: [
    { index: "1", date: "02/09/2026", slot: "07:30 - 09:50", room: "AL-101", lecturer: "Nguyễn Văn B", class: "SE1938-NJ", status: "Có mặt", note: "-" },
    { index: "2", date: "05/09/2026", slot: "07:30 - 09:50", room: "AL-101", lecturer: "Nguyễn Văn B", class: "SE1938-NJ", status: "Có mặt", note: "-" },
    { index: "3", date: "09/09/2026", slot: "07:30 - 09:50", room: "AL-101", lecturer: "Nguyễn Văn B", class: "SE1938-NJ", status: "Vắng mặt", note: "-" },
  ],
};

export const mockGradeReport: GradeReportData = {
  term: {
    value: "fall2026",
    options: [
      { value: "fall2026", label: "Fall2026" },
      { value: "summer2026", label: "Summer2026" },
    ],
  },
  courses: [
    {
      code: "FER202",
      name: "Front-End web development with React",
      components: [
        { name: "Progress Test 1", weight: "10%", value: "8.5" },
        { name: "Assignment", weight: "20%", value: "9.0" },
        { name: "Practical Exam", weight: "30%", value: "7.5" },
        { name: "Final Exam", weight: "40%", value: "8.0" },
      ],
      total: "8.2",
      status: "Passed",
    },
  ],
};

export const mockTranscript: TranscriptData = {
  programs: [
    {
      title: "Chương trình Kỹ thuật phần mềm (BIT_SE_19B_NJ)",
      rows: [
        { code: "PRF192", name: "C Programming", credit: "3", grade: "8.0", status: "Passed" },
        { code: "PRO192", name: "Object-Oriented Programming with Java", credit: "3", grade: "8.5", status: "Passed" },
        { code: "CSD201", name: "Data Structures and Algorithms", credit: "3", grade: "7.8", status: "Passed" },
        { code: "DBI202", name: "Database Systems", credit: "3", grade: "8.2", status: "Passed" },
      ],
      gpa: "8.13",
      credits: "12",
    },
  ],
};

export const mockOjtConditions: ConditionsData = {
  summary: {
    eligible: true,
    message: "Đủ điều kiện tham gia học kỳ thực tập doanh nghiệp (OJT)",
  },
  checks: [
    { label: "Số tín chỉ tích lũy", required: ">= 90 tín chỉ", actual: "105 tín chỉ", passed: true },
    { label: "Kỳ học theo tiến độ", required: ">= Kỳ 5", actual: "Kỳ 6", passed: true },
    { label: "Môn chuyên ngành bắt buộc", required: "Hoàn thành", actual: "Hoàn thành", passed: true },
    { label: "Tiếng Anh chuẩn đầu ra OJT", required: "Level 6 / IELTS 6.0", actual: "Đạt", passed: true },
  ],
};

export const mockThesisConditions: ConditionsData = {
  summary: {
    eligible: null,
    message: "Hiện tại chưa có thông báo điều kiện xét khóa luận tốt nghiệp.",
  },
  checks: [],
};

export const mockSubjects: SubjectsData = {
  rows: [
    { code: "PRJ301", name: "Java Web Application", credit: "3", status: "Active" },
    { code: "MAS291", name: "Statistics", credit: "3", status: "Active" },
    { code: "SWE201c", name: "Introduction to Software Engineering", credit: "3", status: "Active" },
    { code: "IOT102", name: "Internet of Things", credit: "3", status: "Active" },
  ],
};

export const mockCurriculum: CurriculumData = {
  groups: [
    {
      title: "Học kỳ 1",
      rows: [
        { code: "PRF192", name: "Programming Fundamentals", credit: "3", prerequisite: "None" },
        { code: "MAE101", name: "Mathematics for Engineering", credit: "3", prerequisite: "None" },
        { code: "CSI104", name: "Introduction to Computer Science", credit: "3", prerequisite: "None" },
      ],
    },
    {
      title: "Học kỳ 2",
      rows: [
        { code: "PRO192", name: "Object-Oriented Programming", credit: "3", prerequisite: "PRF192" },
        { code: "MAD101", name: "Discrete Mathematics", credit: "3", prerequisite: "None" },
        { code: "OSG202", name: "Operating Systems", credit: "3", prerequisite: "CSI104" },
      ],
    },
  ],
  totalCredits: "140",
};

export const mockCertificates: CertificatesData = {
  items: [
    {
      name: "Chứng chỉ Giáo dục Quốc phòng & An ninh",
      issuer: "123/QD-GDQP",
      date: "15/08/2024",
      status: "Valid",
      href: "https://fap.fpt.edu.vn/download-gdqp",
    },
    {
      name: "Chứng chỉ Giáo dục Thể chất - Vovinam",
      issuer: "456/QD-GDTC",
      date: "20/12/2024",
      status: "Valid",
      href: "https://fap.fpt.edu.vn/download-vovinam",
    },
  ],
};

export const mockTransactions: TransactionsData = {
  rows: [
    {
      date: "01/10/2026",
      amount: "-100.000",
      direction: "out",
      type: "Học phí",
      balance: "500.000",
      description: "Thanh toán học phí",
    },
    {
      date: "15/09/2026",
      amount: "2.000.000",
      direction: "in",
      type: "Nộp tiền",
      balance: "600.000",
      description: "Nộp tiền vào tài khoản",
    },
  ],
};

export const mockDocuments: DocumentsData = {
  rows: [
    {
      title: "Biểu mẫu xin cấp bảng điểm",
      category: "Khảo thí",
      date: "10/09/2026",
      href: "/Document/Detail/1",
    },
  ],
};

export const mockWishlist: WishlistData = {
  rows: [
    {
      code: "SWE301",
      name: "Software Architecture",
      status: "Chờ mở lớp",
      registerHref: "/Wishlist/Register?code=SWE301",
    },
  ],
  registerHref: "/Wishlist/Register",
};

export const mockFyeLog: FyeLogData = {
  rows: [
    {
      activity: "Check-in tuần 1",
      date: "05/09/2026",
      status: "Đã hoàn thành",
    },
  ],
};

export const mockApplications: ApplicationsData = {
  rows: [
    {
      type: "Đơn xin nghỉ học tạm thời",
      created: "20/09/2026",
      status: "Đã duyệt",
      href: "/Application/Detail/1",
    },
  ],
};

export const mockApplicationCatalog: ApplicationCatalogData = {
  items: [
    {
      title: "Đơn xin cấp bảng điểm",
      description: "Xin cấp bảng điểm tạm thời hoặc chính thức",
      href: "/Application/Create?type=transcript",
    },
    {
      title: "Đơn xin rút học phần",
      description: "Đơn xin thôi học học phần trong kỳ",
      href: "/Application/Create?type=withdraw",
    },
  ],
};

export const mockStartupGroup: ListOrEmptyData = {
  empty: true,
  createHref: "/StartupGroup/Add",
};

export const mockCrossClassChange: ListOrEmptyData = {
  empty: true,
  createHref: "/CrossClassChange/Create",
};

export const mockNewsDetail: ArticleData = {
  title: "Thông báo lịch thi kết thúc học phần lần 1, lần 2 các môn học Block 1-4 học kỳ Fall 2026",
  meta: [
    { label: "Chuyên mục", value: "Thông tin Khảo Thí" },
    { label: "Người đăng", value: "Phòng Khảo thí" },
    { label: "Ngày đăng", value: "02/11/2026 23:27" },
  ],
  attachments: [
    { name: "LichThi_Block1_4_Fall2026.pdf", href: "https://fap.fpt.edu.vn/download/lich-thi.pdf" },
  ],
  bodySelector: ".fap-news-content",
  backHref: "/News",
};

export const mockDocumentDetail: ArticleData = {
  title: "View syllabus",
  meta: [
    { label: "Thời gian", value: "28/09/2026 16:58" },
    { label: "Loại tài liệu", value: "Đề cương môn học" },
  ],
  attachments: [
    { name: "Mở tệp", href: "https://flm.fpt.edu.vn/" },
  ],
  bodySelector: ".fap-document-body",
  backHref: "/Document",
};

export const mockAccount: AccountData = {
  sections: [
    {
      title: "Định danh",
      items: [
        { label: "Họ và tên", value: "Nguyễn Đăng Khoa" },
        { label: "Mã sinh viên", value: "HE190183" },
        { label: "Giới tính", value: "Nam" },
      ],
    },
    {
      title: "Học thuật",
      items: [
        { label: "Ngành", value: "Công nghệ thông tin" },
        { label: "Chuyên ngành", value: "Kỹ thuật phần mềm" },
        { label: "Khóa", value: "K19" },
        { label: "Trạng thái", value: "Đang học" },
      ],
    },
    {
      title: "Cá nhân & liên hệ",
      items: [
        { label: "Email", value: "khoandhe190183@fpt.edu.vn" },
        { label: "Số điện thoại", value: "0912 345 678" },
        { label: "Địa chỉ", value: "Hà Nội" },
      ],
    },
  ],
  editHref: "/StudentProfile",
};

export function mockPageData(
  page:
    | "overview"
    | "timetable"
    | "exams"
    | "news"
    | "report-attendance"
    | "report-grade"
    | "report-transcript"
    | "report-ojt-conditions"
    | "report-thesis-conditions"
    | "subject"
    | "curriculum"
    | "my-certificates"
    | "transaction"
    | "document"
    | "wishlist"
    | "fye-check-in-log"
    | "fye-mentor-feedback"
    | "application"
    | "application-catalog"
    | "startup-group"
    | "cross-class-change"
    | "news-detail"
    | "document-detail"
    | "account"
): PageData {
  switch (page) {
    case "overview":
      return {
        shell: mockShell,
        page: "overview",
        home: mockHome,
      };
    case "timetable":
      return {
        shell: mockShell,
        page: "timetable",
        sessions: mockSessions,
        weekStart: mockWeekStart,
      };
    case "exams":
      return {
        shell: mockShell,
        page: "exams",
        exams: mockExams,
      };
    case "news":
      return {
        shell: mockShell,
        page: "news",
        news: mockNews,
        categories: mockCategories,
      };
    case "report-attendance":
      return {
        shell: mockShell,
        page: "report-attendance",
        attendance: mockAttendanceReport,
      };
    case "report-grade":
      return {
        shell: mockShell,
        page: "report-grade",
        grade: mockGradeReport,
      };
    case "report-transcript":
      return {
        shell: mockShell,
        page: "report-transcript",
        transcript: mockTranscript,
      };
    case "report-ojt-conditions":
      return {
        shell: mockShell,
        page: "report-ojt-conditions",
        conditions: mockOjtConditions,
      };
    case "report-thesis-conditions":
      return {
        shell: mockShell,
        page: "report-thesis-conditions",
        conditions: mockThesisConditions,
      };
    case "subject":
      return {
        shell: mockShell,
        page: "subject",
        subjects: mockSubjects,
      };
    case "curriculum":
      return {
        shell: mockShell,
        page: "curriculum",
        curriculum: mockCurriculum,
      };
    case "my-certificates":
      return {
        shell: mockShell,
        page: "my-certificates",
        certificates: mockCertificates,
      };
    case "transaction":
      return {
        shell: mockShell,
        page: "transaction",
        transactions: mockTransactions,
      };
    case "document":
      return {
        shell: mockShell,
        page: "document",
        documents: mockDocuments,
      };
    case "wishlist":
      return {
        shell: mockShell,
        page: "wishlist",
        wishlist: mockWishlist,
      };
    case "fye-check-in-log":
      return {
        shell: mockShell,
        page: "fye-check-in-log",
        fye: mockFyeLog,
      };
    case "fye-mentor-feedback":
      return {
        shell: mockShell,
        page: "fye-mentor-feedback",
        fye: mockFyeLog,
      };
    case "application":
      return {
        shell: mockShell,
        page: "application",
        applications: mockApplications,
      };
    case "application-catalog":
      return {
        shell: mockShell,
        page: "application-catalog",
        catalog: mockApplicationCatalog,
      };
    case "startup-group":
      return {
        shell: mockShell,
        page: "startup-group",
        startup: mockStartupGroup,
      };
    case "cross-class-change":
      return {
        shell: mockShell,
        page: "cross-class-change",
        crossClass: mockCrossClassChange,
      };
    case "news-detail":
      return {
        shell: mockShell,
        page: "news-detail",
        article: mockNewsDetail,
      };
    case "document-detail":
      return {
        shell: mockShell,
        page: "document-detail",
        article: mockDocumentDetail,
      };
    case "account":
      return {
        shell: mockShell,
        page: "account",
        account: mockAccount,
      };
  }
}

