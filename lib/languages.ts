export const SUPPORTED_LANGUAGES = [
  "en",
  "zh",
  "mn",
  "ar",
  "ur",
  "az",
  "tr",
  "ja",
  "ko",
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  zh: "中文",
  mn: "Монгол",
  ar: "العربية",
  ur: "اردو",
  az: "Azərbaycanca",
  tr: "Türkçe",
  ja: "日本語",
  ko: "한국어",
};

export const LANGUAGE_SHORT_LABELS: Record<AppLanguage, string> = {
  en: "EN",
  zh: "中文",
  mn: "MN",
  ar: "AR",
  ur: "UR",
  az: "AZ",
  tr: "TR",
  ja: "日本",
  ko: "한국",
};

export const LANGUAGE_DIRECTIONS: Record<AppLanguage, "ltr" | "rtl"> = {
  en: "ltr",
  zh: "ltr",
  mn: "ltr",
  ar: "rtl",
  ur: "rtl",
  az: "ltr",
  tr: "ltr",
  ja: "ltr",
  ko: "ltr",
};

export function normalizeLanguage(value?: string | null): AppLanguage {
  if (
    value === "en" ||
    value === "zh" ||
    value === "mn" ||
    value === "ar" ||
    value === "ur" ||
    value === "az" ||
    value === "tr" ||
    value === "ja" ||
    value === "ko"
  ) {
    return value;
  }

  return "en";
}

export function getLanguageDirection(value?: string | null): "ltr" | "rtl" {
  return LANGUAGE_DIRECTIONS[normalizeLanguage(value)];
}

export const translations = {
  en: {
    "nav.home": "Home",
    "nav.workshops": "Workshops",
    "nav.notices": "Notices",
    "nav.myLearning": "My Learning",
    "nav.login": "Login",
    "nav.signup": "Sign up",
    "nav.dashboard": "Dashboard",
    "nav.admin": "Admin",
    "nav.manager": "Manager",

    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome",
    "dashboard.subtitle":
      "Manage your learning, messages, registrations, language settings, and account tools from one place.",
    "dashboard.role": "Role",

    "card.myLearning.title": "My Learning",
    "card.myLearning.description":
      "View your registered workshops, confirmed access, sessions, subsessions, materials, and recordings.",
    "card.messages.title": "Message Box",
    "card.messages.description":
      "Read payment notices, workshop updates, internal messages, and announcements sent to your account.",
    "card.language.title": "Language Settings",
    "card.language.description": "Choose your preferred website language.",
    "card.password.title": "Change Password",
    "card.password.description": "Update the password for your LexData account.",
    "card.workshops.title": "Workshops",
    "card.workshops.description":
      "Browse available workshops and submit new registrations.",
    "card.notices.title": "Notice Center",
    "card.notices.description":
      "View public notices, announcements, media releases, and platform updates.",
    "card.admin.title": "Admin Dashboard",
    "card.admin.description":
      "Manage users, roles, workshops, registrations, payments, notices, media, and website content.",
    "card.manager.title": "Manager Dashboard",
    "card.manager.description":
      "Manage registrations, manual payments, payment records, notices, workshop status, and monitoring data.",
    "card.monitor.title": "Overall Monitoring Board",
    "card.monitor.description":
      "View registration statistics, payment statistics, website visits, workshop status, course status, and user activity.",
    "card.speaker.title": "Speaker Access",
    "card.speaker.description":
      "Open assigned workshop sessions and view speaker-related messages.",
    "card.open": "Open",

    "language.title": "Language Settings",
    "language.subtitle":
      "Choose the language you prefer to use on LexData. Your choice will be saved to your account and used again when you login.",
    "language.preferred": "Preferred language",
    "language.current": "Current language",
    "language.available":
      "Available languages: English, Chinese, Mongolian, Arabic, Urdu, Azerbaijani, Turkish, Japanese, and Korean.",
    "common.backDashboard": "Back to dashboard",

    "role.member": "Member",
    "role.speaker": "Speaker",
    "role.manager": "Manager",
    "role.staff": "Staff",
    "role.admin": "Admin",

    "status.pending": "Pending",
    "status.approved": "Approved",
    "status.confirmed": "Confirmed",
    "status.rejected": "Rejected",
    "status.cancelled": "Cancelled",
    "status.instructions_sent": "Instructions sent",
    "status.under_review": "Under review",
    "status.waived": "Waived",
    "status.refunded": "Refunded",
    "status.failed": "Failed",
    "status.open": "Open",
    "status.closed": "Closed",
    "status.terminated": "Terminated",
    "status.not_started": "Not started",
    "status.in_progress": "In progress",
    "status.completed": "Completed",
  },

  zh: {
    "nav.home": "首页",
    "nav.workshops": "课程/工作坊",
    "nav.notices": "通知",
    "nav.myLearning": "我的学习",
    "nav.login": "登录",
    "nav.signup": "注册",
    "nav.dashboard": "控制台",
    "nav.admin": "管理员",
    "nav.manager": "经理",

    "dashboard.title": "控制台",
    "dashboard.welcome": "欢迎",
    "dashboard.subtitle": "在这里管理学习、消息、报名、语言设置和账户工具。",
    "dashboard.role": "角色",

    "card.myLearning.title": "我的学习",
    "card.myLearning.description": "查看已报名的工作坊、访问权限、课程安排、资料和录像。",
    "card.messages.title": "消息箱",
    "card.messages.description": "查看付款通知、工作坊更新、内部消息和账户通知。",
    "card.language.title": "语言设置",
    "card.language.description": "选择您偏好的网站语言。",
    "card.password.title": "修改密码",
    "card.password.description": "更新您的 LexData 账户密码。",
    "card.workshops.title": "课程/工作坊",
    "card.workshops.description": "浏览可报名的工作坊并提交报名。",
    "card.notices.title": "通知中心",
    "card.notices.description": "查看公开通知、公告、媒体发布和平台更新。",
    "card.admin.title": "管理员后台",
    "card.admin.description": "管理用户、角色、工作坊、报名、付款、通知、媒体和网站内容。",
    "card.manager.title": "经理后台",
    "card.manager.description": "管理报名、人工付款、付款记录、通知、工作坊状态和监控数据。",
    "card.monitor.title": "综合监控面板",
    "card.monitor.description": "查看报名统计、付款统计、网站访问、工作坊状态、课程状态和用户活动。",
    "card.speaker.title": "讲师入口",
    "card.speaker.description": "查看分配给您的工作坊课程和讲师相关消息。",
    "card.open": "打开",

    "language.title": "语言设置",
    "language.subtitle": "选择您希望在 LexData 使用的语言。该设置将保存到您的账户。",
    "language.preferred": "首选语言",
    "language.current": "当前语言",
    "language.available": "可用语言：英语、中文、蒙古语、阿拉伯语、乌尔都语、阿塞拜疆语、土耳其语、日语和韩语。",
    "common.backDashboard": "返回控制台",

    "role.member": "会员",
    "role.speaker": "讲师",
    "role.manager": "经理",
    "role.staff": "员工",
    "role.admin": "管理员",

    "status.pending": "待处理",
    "status.approved": "已批准",
    "status.confirmed": "已确认",
    "status.rejected": "已拒绝",
    "status.cancelled": "已取消",
    "status.instructions_sent": "已发送付款说明",
    "status.under_review": "审核中",
    "status.waived": "已免除",
    "status.refunded": "已退款",
    "status.failed": "失败",
    "status.open": "开放",
    "status.closed": "已关闭",
    "status.terminated": "已终止",
    "status.not_started": "未开始",
    "status.in_progress": "进行中",
    "status.completed": "已完成",
  },

  mn: {
    "nav.home": "Нүүр",
    "nav.workshops": "Сургалт/воркшоп",
    "nav.notices": "Мэдэгдэл",
    "nav.myLearning": "Миний сургалт",
    "nav.login": "Нэвтрэх",
    "nav.signup": "Бүртгүүлэх",
    "nav.dashboard": "Хянах самбар",
    "nav.admin": "Админ",
    "nav.manager": "Менежер",

    "dashboard.title": "Хянах самбар",
    "dashboard.welcome": "Тавтай морил",
    "dashboard.subtitle":
      "Сургалт, мессеж, бүртгэл, хэлний тохиргоо болон дансны хэрэгслээ нэг дор удирдана.",
    "dashboard.role": "Эрх",

    "card.myLearning.title": "Миний сургалт",
    "card.myLearning.description":
      "Бүртгүүлсэн воркшоп, баталгаажсан эрх, хичээл, дэд хичээл, материал болон бичлэгүүдийг харах.",
    "card.messages.title": "Мессежийн хайрцаг",
    "card.messages.description":
      "Төлбөрийн мэдэгдэл, воркшопын шинэчлэл, дотоод мессеж болон зарлалуудыг унших.",
    "card.language.title": "Хэлний тохиргоо",
    "card.language.description": "Вэбсайтын хэлээ сонгоно уу.",
    "card.password.title": "Нууц үг солих",
    "card.password.description": "LexData дансны нууц үгээ шинэчлэх.",
    "card.workshops.title": "Сургалт/воркшоп",
    "card.workshops.description": "Нээлттэй воркшопуудыг үзэж бүртгүүлнэ үү.",
    "card.notices.title": "Мэдэгдлийн төв",
    "card.notices.description":
      "Нийтийн мэдэгдэл, зарлал, медиа мэдээлэл болон платформын шинэчлэл харах.",
    "card.admin.title": "Админ самбар",
    "card.admin.description":
      "Хэрэглэгч, эрх, воркшоп, бүртгэл, төлбөр, мэдэгдэл, медиа болон вэб контентыг удирдах.",
    "card.manager.title": "Менежер самбар",
    "card.manager.description":
      "Бүртгэл, гар төлбөр, төлбөрийн түүх, мэдэгдэл, воркшопын төлөв болон мониторингийн өгөгдлийг удирдах.",
    "card.monitor.title": "Нэгдсэн мониторинг",
    "card.monitor.description":
      "Бүртгэл, төлбөр, вэб зочлолт, воркшоп, курс болон хэрэглэгчийн идэвхийг харах.",
    "card.speaker.title": "Илтгэгчийн хандалт",
    "card.speaker.description":
      "Танд оноосон воркшопын хичээл болон илтгэгчийн мессежийг харах.",
    "card.open": "Нээх",

    "language.title": "Хэлний тохиргоо",
    "language.subtitle":
      "LexData дээр ашиглах хэлээ сонгоно уу. Сонголт таны дансанд хадгалагдана.",
    "language.preferred": "Сонгосон хэл",
    "language.current": "Одоогийн хэл",
    "language.available":
      "Боломжтой хэлүүд: Англи, Хятад, Монгол, Араб, Урду, Азербайжан, Турк, Япон, Солонгос.",
    "common.backDashboard": "Хянах самбар руу буцах",

    "role.member": "Гишүүн",
    "role.speaker": "Илтгэгч",
    "role.manager": "Менежер",
    "role.staff": "Ажилтан",
    "role.admin": "Админ",

    "status.pending": "Хүлээгдэж байна",
    "status.approved": "Зөвшөөрсөн",
    "status.confirmed": "Баталгаажсан",
    "status.rejected": "Татгалзсан",
    "status.cancelled": "Цуцлагдсан",
    "status.instructions_sent": "Төлбөрийн заавар илгээсэн",
    "status.under_review": "Хянагдаж байна",
    "status.waived": "Чөлөөлсөн",
    "status.refunded": "Буцаасан",
    "status.failed": "Амжилтгүй",
    "status.open": "Нээлттэй",
    "status.closed": "Хаалттай",
    "status.terminated": "Дуусгавар болсон",
    "status.not_started": "Эхлээгүй",
    "status.in_progress": "Явагдаж байна",
    "status.completed": "Дууссан",
  },

  ar: {},
  ur: {},
  az: {},
  tr: {},
  ja: {},
  ko: {},
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(language: AppLanguage, key: TranslationKey) {
  const dictionary = translations[language] as Partial<
    Record<TranslationKey, string>
  >;

  return dictionary[key] || translations.en[key] || key;
}

export function translateStatus(language: AppLanguage, status?: string | null) {
  if (!status) return "-";

  const key = `status.${status}` as TranslationKey;

  return t(language, key);
}

export function translateRole(language: AppLanguage, role?: string | null) {
  if (!role) return "-";

  const key = `role.${role}` as TranslationKey;

  return t(language, key);
}