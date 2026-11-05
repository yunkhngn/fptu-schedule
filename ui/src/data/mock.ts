import type {
  ShellData,
  HomeData,
  ClassSession,
  ExamItem,
  NewsItemData,
  PageData,
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

export function mockPageData(page: "overview" | "timetable" | "exams" | "news"): PageData {
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
  }
}

