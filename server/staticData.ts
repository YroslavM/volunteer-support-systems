// Статичні дані для використання під час технічного обслуговування
// коли доступ до бази даних обмежений

// Статичні проекти
export const staticProjects = [
  {
    id: 1,
    name: "Допомога переселенцям",
    description: "Проект з допомоги переселенцям із зони бойових дій",
    targetAmount: 50000,
    collectedAmount: 25000,
    imageUrl: "/uploads/project1.jpg",
    status: "in_progress",
    coordinatorId: 6,
    createdAt: new Date("2023-05-15"),
    updatedAt: new Date("2023-05-20"),
    bankDetails: null,
    location: "Київ, Україна",
    startDate: new Date("2023-05-25"),
    endDate: new Date("2023-08-25"),
  },
  {
    id: 2,
    name: "Відбудова школи",
    description: "Проект з відбудови школи після руйнувань",
    targetAmount: 100000,
    collectedAmount: 35000,
    imageUrl: "/uploads/project2.jpg",
    status: "in_progress",
    coordinatorId: 6,
    createdAt: new Date("2023-06-01"),
    updatedAt: new Date("2023-06-05"),
    bankDetails: null,
    location: "Харків, Україна",
    startDate: new Date("2023-06-10"),
    endDate: new Date("2023-10-10"),
  },
  {
    id: 3,
    name: "Збір коштів на генератори",
    description: "Проект із збору коштів на придбання генераторів для лікарень",
    targetAmount: 75000,
    collectedAmount: 40000,
    imageUrl: "/uploads/project3.jpg",
    status: "funding",
    coordinatorId: 6,
    createdAt: new Date("2023-07-01"),
    updatedAt: new Date("2023-07-05"),
    bankDetails: null,
    location: "Львів, Україна",
    startDate: new Date("2023-07-10"),
    endDate: new Date("2023-09-10"),
  }
];

// Статичні задачі
export const staticTasks = [
  {
    id: 1,
    title: "Організація доставки продуктів",
    description: "Організувати доставку продуктових наборів для переселенців",
    projectId: 1,
    status: "pending",
    volunteerId: null,
    createdAt: new Date("2023-05-16"),
    updatedAt: new Date("2023-05-16"),
    deadline: new Date("2023-06-30")
  },
  {
    id: 2,
    title: "Збір меблів",
    description: "Організувати збір меблів для облаштування тимчасового житла",
    projectId: 1,
    status: "pending",
    volunteerId: null,
    createdAt: new Date("2023-05-17"),
    updatedAt: new Date("2023-05-17"),
    deadline: new Date("2023-07-15")
  },
  {
    id: 3,
    title: "Контакт із постачальниками будматеріалів",
    description: "Знайти та укласти договори з постачальниками будматеріалів",
    projectId: 2,
    status: "pending",
    volunteerId: null,
    createdAt: new Date("2023-06-02"),
    updatedAt: new Date("2023-06-02"),
    deadline: new Date("2023-06-20")
  }
];

// Статичні користувачі
export const staticUsers = [
  {
    id: 1,
    username: "admin",
    email: "admin@gmail.com",
    role: "admin",
    firstName: "Admin",
    lastName: "User",
    isVerified: true,
    isBlocked: false,
    createdAt: new Date("2023-01-01"),
    verificationToken: null
  },
  {
    id: 2,
    username: "volunteer1",
    email: "volunteer1@example.com",
    role: "volunteer",
    firstName: "Іван",
    lastName: "Петренко",
    isVerified: true,
    isBlocked: false,
    createdAt: new Date("2023-02-10"),
    verificationToken: null
  },
  {
    id: 3,
    username: "donor1",
    email: "donor1@example.com",
    role: "donor",
    firstName: "Марія",
    lastName: "Іваненко",
    isVerified: true,
    isBlocked: false,
    createdAt: new Date("2023-02-15"),
    verificationToken: null
  },
  {
    id: 6,
    username: "Yaroslav3",
    email: "ipz22-3@kpi.ua",
    role: "coordinator",
    firstName: "Yaroslav",
    lastName: "Korotetskyi",
    isVerified: true,
    isBlocked: false,
    createdAt: new Date("2023-03-05"),
    verificationToken: null
  }
];

// Статичні заявки
export const staticApplications = [
  {
    id: 1,
    volunteerId: 2,
    projectId: 1,
    message: "Я хочу допомогти з організацією доставки продуктів",
    status: "pending",
    createdAt: new Date("2023-05-18")
  },
  {
    id: 2,
    volunteerId: 2,
    projectId: 2,
    message: "Маю досвід роботи з будівництвом, хочу допомогти",
    status: "approved",
    createdAt: new Date("2023-06-05")
  }
];

// Статичні пожертви
export const staticDonations = [
  {
    id: 1,
    userId: 3,
    projectId: 1,
    amount: 1000,
    message: "Дякую за вашу важливу роботу!",
    createdAt: new Date("2023-05-20")
  },
  {
    id: 2,
    userId: 3,
    projectId: 2,
    amount: 2000,
    message: "Підтримую вашу ініціативу",
    createdAt: new Date("2023-06-10")
  }
];

// Статичні звіти
export const staticReports = [
  {
    id: 1,
    taskId: 2,
    content: "Виконано збір та доставку меблів для 5 сімей",
    volunteerId: 2,
    createdAt: new Date("2023-06-01")
  },
  {
    id: 2,
    taskId: 3,
    content: "Знайдено три постачальники, з двома підписано договори",
    volunteerId: 2,
    createdAt: new Date("2023-06-15")
  }
];