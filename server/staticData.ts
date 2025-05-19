// Статичні дані для аварійного режиму без бази даних

// Користувачі
export const staticUsers = [
  {
    id: 1,
    username: "admin",
    email: "admin@gmail.com",
    password: "$2b$10$ZSMvKuEm8wWmAAhZq7YAF.aAQKF24xbsTuKIzqknLgNhR6EwqvDLG", // "123456"
    role: "admin",
    firstName: "Адміністратор",
    lastName: "Системи",
    isVerified: true,
    isBlocked: false,
    createdAt: new Date("2023-01-01"),
    verificationToken: null
  },
  {
    id: 2,
    username: "volunteer1",
    email: "volunteer1@gmail.com",
    password: "$2b$10$ZSMvKuEm8wWmAAhZq7YAF.aAQKF24xbsTuKIzqknLgNhR6EwqvDLG", // "123456"
    role: "volunteer",
    firstName: "Василь",
    lastName: "Волонтер",
    isVerified: true,
    isBlocked: false,
    createdAt: new Date("2023-01-02"),
    verificationToken: null
  },
  {
    id: 3,
    username: "donor1",
    email: "donor1@gmail.com",
    password: "$2b$10$ZSMvKuEm8wWmAAhZq7YAF.aAQKF24xbsTuKIzqknLgNhR6EwqvDLG", // "123456"
    role: "donor",
    firstName: "Діана",
    lastName: "Донор",
    isVerified: true,
    isBlocked: false,
    createdAt: new Date("2023-01-03"),
    verificationToken: null
  },
  {
    id: 4,
    username: "moderator1",
    email: "moderator1@gmail.com",
    password: "$2b$10$ZSMvKuEm8wWmAAhZq7YAF.aAQKF24xbsTuKIzqknLgNhR6EwqvDLG", // "123456"
    role: "moderator",
    firstName: "Модест",
    lastName: "Модератор",
    isVerified: true,
    isBlocked: false,
    createdAt: new Date("2023-01-04"),
    verificationToken: null
  },
  {
    id: 5,
    username: "coordinator1",
    email: "coordinator1@gmail.com",
    password: "$2b$10$ZSMvKuEm8wWmAAhZq7YAF.aAQKF24xbsTuKIzqknLgNhR6EwqvDLG", // "123456"
    role: "coordinator",
    firstName: "Катерина",
    lastName: "Координатор",
    isVerified: true,
    isBlocked: false,
    createdAt: new Date("2023-01-05"),
    verificationToken: null
  },
  {
    id: 6,
    username: "coordinator2",
    email: "coordinator2@gmail.com",
    password: "$2b$10$ZSMvKuEm8wWmAAhZq7YAF.aAQKF24xbsTuKIzqknLgNhR6EwqvDLG", // "123456"
    role: "coordinator",
    firstName: "Кирило",
    lastName: "Коваль",
    isVerified: true,
    isBlocked: false,
    createdAt: new Date("2023-01-06"),
    verificationToken: null
  }
];

// Проєкти
export const staticProjects = [
  {
    id: 4,
    name: "Новий проєкт",
    description: "Опис проєкту",
    targetAmount: 10000,
    collectedAmount: 0,
    imageUrl: "/uploads/placeholder.jpg", // Імітація шляху до зображення
    status: "funding", // Початковий статус - збір коштів
    coordinatorId: 6, // За замовчуванням використовуємо ID = 6
    createdAt: new Date(),
    updatedAt: new Date(),
    bankDetails: null,
    location: "Україна",
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // +90 днів
  }
];

// Задачі
export const staticTasks = [
  {
    id: 1,
    projectId: 4,
    title: "Закупити продукти",
    description: "Потрібно закупити продукти для переселенців",
    status: "pending",
    volunteerId: null,
    createdAt: new Date("2023-02-01"),
    updatedAt: new Date("2023-02-01")
  }
];

// Звіти
export const staticReports = [
  {
    id: 1,
    taskId: 1,
    content: "Звіт про виконання завдання",
    volunteerId: 2,
    createdAt: new Date("2023-02-15")
  }
];

// Заявки
export const staticApplications = [
  {
    id: 1,
    volunteerId: 2,
    projectId: 4,
    status: "pending",
    message: "Хочу допомогти з проєктом",
    createdAt: new Date("2023-02-10")
  }
];

// Пожертви
export const staticDonations = [
  {
    id: 1,
    userId: 3,
    projectId: 4,
    amount: 500,
    message: "На добру справу",
    createdAt: new Date("2023-02-20")
  }
];