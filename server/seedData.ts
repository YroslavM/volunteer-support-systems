import { storage } from "./storage";
import { db } from "./db";
import { projects, users } from "@shared/schema";

export async function seedDatabase() {
  console.log("Seeding database with initial data...");
  
  // Create admin user if doesn't exist
  const adminExists = await storage.getUserByEmail("admin@example.com");
  const hiddenAdminExists = await storage.getUserByEmail("admin@gmail.com");
  const moderatorExists = await storage.getUserByEmail("moderator@example.com");
  
  if (!hiddenAdminExists) {
    console.log("Creating hidden admin user...");
    // Використовуємо функцію для хеширования пароля з auth.ts
    const hashedPassword = await require('./auth').hashPassword("123456");
    await storage.createUser({
      email: "admin@gmail.com",
      username: "admin",
      password: hashedPassword, // password: 123456 
      role: "admin",
      firstName: "Admin",
      lastName: "System",
      isVerified: true
    });
    console.log("Hidden admin user created");
  }
  
  if (!moderatorExists) {
    console.log("Creating moderator user...");
    // Використовуємо функцію для хеширования пароля з auth.ts
    const hashedPassword = await require('./auth').hashPassword("123456");
    await storage.createUser({
      email: "moderator@example.com",
      username: "moderator",
      password: hashedPassword, // password: 123456
      role: "admin", // Using admin role since moderator role is not available in database
      firstName: "Модератор",
      lastName: "Проєктів",
      isVerified: true
    });
    console.log("Moderator user created (with admin role)");
  }
  
  if (!adminExists) {
    console.log("Creating admin coordinator user...");
    const coordinator = await storage.createUser({
      email: "admin@example.com",
      username: "coordinator",
      password: "$2b$10$iuiwkSOomtYOpVVgWLUBtOBa.1yWCVn0EnSA8EEMN0dTMK/5SPgXK", // password: admin123
      role: "coordinator",
      firstName: "Адміністратор",
      lastName: "Системи",
      isVerified: true
    });
    
    console.log(`Created coordinator with ID: ${coordinator.id}`);

    // Create demo projects
    const projects = [
      {
        name: "Підтримка переселенців",
        description: "Проєкт з допомоги внутрішньо переміщеним особам у Львівській області. Потрібна допомога з розселенням, забезпеченням продуктами та ліками.",
        targetAmount: 150000,
        imageUrl: "https://images.unsplash.com/photo-1637419450536-378d5457abb8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
        coordinatorId: coordinator.id,
        location: "Львів",
        startDate: new Date("2023-11-01"),
        endDate: new Date("2024-03-01"),
        status: "funding"
      },
      {
        name: "Відновлення парку",
        description: "Проєкт з відновлення міського парку після негоди. Потрібні волонтери для прибирання території, висадки нових дерев та облаштування доріжок.",
        targetAmount: 75000,
        imageUrl: "https://images.unsplash.com/photo-1569817480241-41b3e7a13c89?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
        coordinatorId: coordinator.id,
        location: "Київ",
        startDate: new Date("2023-10-15"),
        endDate: new Date("2023-12-15"),
        status: "in_progress"
      },
      {
        name: "Допомога літнім людям",
        description: "Програма підтримки літніх людей в зимовий період. Доставка продуктів, ліків, допомога по господарству та психологічна підтримка.",
        targetAmount: 100000,
        imageUrl: "https://images.unsplash.com/photo-1516307365426-bea591f05011?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
        coordinatorId: coordinator.id,
        location: "Харків",
        startDate: new Date("2023-11-15"),
        endDate: new Date("2024-02-28"),
        status: "funding"
      },
      {
        name: "Реставрація історичної будівлі",
        description: "Відновлення історичної пам'ятки архітектури в центрі міста. Потрібні волонтери з досвідом реставраційних робіт та допомога в фінансуванні закупівлі матеріалів.",
        targetAmount: 250000,
        imageUrl: "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
        coordinatorId: coordinator.id,
        location: "Одеса",
        startDate: new Date("2023-09-01"),
        endDate: new Date("2024-05-30"),
        status: "in_progress"
      },
      {
        name: "Тваринний притулок",
        description: "Розширення притулку для тварин та покращення умов утримання. Потрібна допомога в будівництві нових вольєрів, забезпеченні кормами та медикаментами.",
        targetAmount: 120000,
        imageUrl: "https://images.unsplash.com/photo-1593871075120-982e042088d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
        coordinatorId: coordinator.id,
        location: "Дніпро",
        startDate: new Date("2023-10-01"),
        endDate: new Date("2024-01-31"),
        status: "funding"
      },
      {
        name: "Освітній центр для дітей",
        description: "Створення сучасного освітнього центру для дітей з малозабезпечених сімей. Потрібна допомога в облаштуванні приміщення, закупівлі техніки та навчальних матеріалів.",
        targetAmount: 180000,
        imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
        coordinatorId: coordinator.id,
        location: "Запоріжжя",
        startDate: new Date("2023-11-20"),
        endDate: new Date("2024-04-30"),
        status: "in_progress"
      }
    ];

    console.log("Creating sample projects...");
    for (const projectData of projects) {
      await storage.createProject(projectData);
    }
    console.log(`Created ${projects.length} sample projects`);
  } else {
    console.log("Admin user already exists, skipping seed data creation");
  }

  console.log("Database seeding completed");
}