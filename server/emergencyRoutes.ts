import { Express, Request, Response } from "express";
import { 
  staticUsers, 
  staticProjects, 
  staticTasks, 
  staticReports,
  staticApplications,
  staticDonations 
} from "./staticData";

export function setupEmergencyRoutes(app: Express) {
  console.log("ВАЖЛИВО: Запущено аварійні API маршрути з використанням статичних даних!");
  
  // GET /api/users - отримання списку користувачів
  app.get("/api/users", (req, res) => {
    // Не відправляємо паролі
    const usersWithoutPasswords = staticUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
  });
  
  // GET /api/user - отримання поточного користувача (симуляція авторизації)
  app.get("/api/user", (req, res) => {
    // В аварійному режимі автоматично повертаємо адміністратора
    const { password, ...adminWithoutPassword } = staticUsers[0];
    res.json(adminWithoutPassword);
  });
  
  // GET /api/users/:id - отримання користувача за ID
  app.get("/api/users/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const user = staticUsers.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ message: "Користувач не знайдений" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // GET /api/projects - отримання всіх проєктів
  app.get("/api/projects", (req, res) => {
    // В реальній системі тут буде фільтрація за статусом, пошук і т.д.
    res.json(staticProjects);
  });
  
  // GET /api/projects/:id - отримання проєкту за ID
  app.get("/api/projects/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const project = staticProjects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ message: "Проєкт не знайдено" });
    }
    
    res.json(project);
  });
  
  // GET /api/projects/coordinator/:id - отримання проєктів координатора
  app.get("/api/projects/coordinator/:id", (req, res) => {
    const coordinatorId = parseInt(req.params.id);
    const projects = staticProjects.filter(p => p.coordinatorId === coordinatorId);
    
    res.json(projects);
  });
  
  // GET /api/projects/:id/applications - отримання заявок на проєкт
  app.get("/api/projects/:id/applications", (req, res) => {
    const projectId = parseInt(req.params.id);
    const applications = staticApplications.filter(a => a.projectId === projectId);
    
    // Додаємо інформацію про волонтера
    const applicationsWithVolunteers = applications.map(app => {
      const volunteer = staticUsers.find(u => u.id === app.volunteerId);
      let volunteerInfo = null;
      
      if (volunteer) {
        const { password, ...volunteerWithoutPassword } = volunteer;
        volunteerInfo = volunteerWithoutPassword;
      }
      
      return {
        ...app,
        volunteer: volunteerInfo
      };
    });
    
    res.json(applications);
  });
  
  // GET /api/projects/:id/tasks - отримання завдань проєкту
  app.get("/api/projects/:id/tasks", (req, res) => {
    const projectId = parseInt(req.params.id);
    const tasks = staticTasks.filter(t => t.projectId === projectId);
    res.json(tasks);
  });
  
  // DELETE /api/projects/:id - видалення проєкту
  app.delete("/api/projects/:id", (req, res) => {
    const id = parseInt(req.params.id);
    
    // Перевіряємо чи існує проєкт з таким ID
    const projectIndex = staticProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({ message: "Проєкт не знайдено" });
    }
    
    // Видаляємо проєкт з масиву (в реальній БД це було б постійно)
    staticProjects.splice(projectIndex, 1);
    
    // Видаляємо пов'язані записи (задачі, заявки, пожертви)
    const tasksToRemove = staticTasks.filter(t => t.projectId === id);
    tasksToRemove.forEach(task => {
      const taskIndex = staticTasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        staticTasks.splice(taskIndex, 1);
      }
    });
    
    const applicationsToRemove = staticApplications.filter(a => a.projectId === id);
    applicationsToRemove.forEach(app => {
      const appIndex = staticApplications.findIndex(a => a.id === app.id);
      if (appIndex !== -1) {
        staticApplications.splice(appIndex, 1);
      }
    });
    
    const donationsToRemove = staticDonations.filter(d => d.projectId === id);
    donationsToRemove.forEach(donation => {
      const donationIndex = staticDonations.findIndex(d => d.id === donation.id);
      if (donationIndex !== -1) {
        staticDonations.splice(donationIndex, 1);
      }
    });
    
    res.status(200).json({ message: "Проєкт успішно видалено" });
  });
  
  // Функція для створення нового унікального ID
  function getNextId(array: any[]): number {
    const maxId = array.reduce((max, item) => Math.max(max, item.id), 0);
    return maxId + 1;
  }
  
  // POST /api/projects/with-image - створення проєкту з зображенням
  app.post("/api/projects/with-image", (req, res) => {
    try {
      // В аварійному режимі ми не обробляємо зображення, але імітуємо успішне завантаження
      const projectData = req.body;
      
      // Якщо немає тіла запиту
      if (!projectData) {
        return res.status(400).json({ message: "Відсутні дані проєкту" });
      }
      
      // Генеруємо новий ID для проєкту
      const newProjectId = getNextId(staticProjects);
      
      // Створюємо новий проєкт
      const newProject = {
        id: newProjectId,
        name: projectData.name || "Новий проєкт",
        description: projectData.description || "Опис проєкту",
        targetAmount: projectData.targetAmount || 10000,
        collectedAmount: 0,
        imageUrl: "/uploads/placeholder.jpg", // Імітація шляху до зображення
        status: "funding", // Початковий статус - збір коштів
        coordinatorId: req.user?.id || 6, // За замовчуванням використовуємо ID = 6
        createdAt: new Date(),
        updatedAt: new Date(),
        bankDetails: projectData.bankDetails || null,
        location: projectData.location || "Україна",
        startDate: projectData.startDate ? new Date(projectData.startDate) : new Date(),
        endDate: projectData.endDate ? new Date(projectData.endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // +90 днів
      };
      
      // Додаємо проєкт до списку
      staticProjects.push(newProject);
      
      // Створюємо пустий список задач для нового проєкту
      staticTasks.push({
        id: getNextId(staticTasks),
        projectId: newProjectId,
        title: "Нове завдання",
        description: "Опис завдання",
        status: "pending",
        volunteerId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Оновлюємо пов'язані дані, щоб вони вказували на новий проєкт
      // Це гарантує, що всі зв'язані дані будуть працювати для нового проєкту
      for (let i = 0; i < staticApplications.length; i++) {
        if (staticApplications[i].projectId === 4) { // ID проєкту за замовчуванням в staticData
          staticApplications[i].projectId = newProjectId;
        }
      }
      
      for (let i = 0; i < staticDonations.length; i++) {
        if (staticDonations[i].projectId === 4) { // ID проєкту за замовчуванням в staticData
          staticDonations[i].projectId = newProjectId;
        }
      }
      
      res.status(201).json(newProject);
    } catch (error) {
      console.error("Помилка при створенні проєкту:", error);
      res.status(500).json({ message: "Внутрішня помилка сервера" });
    }
  });

  // POST /api/donations - створення нової пожертви
  app.post("/api/donations", (req, res) => {
    try {
      const donationData = req.body;
      
      if (!donationData || !donationData.projectId || !donationData.amount) {
        return res.status(400).json({ message: "Відсутні обов'язкові дані для пожертви" });
      }
      
      // Перевіряємо чи існує проєкт
      const project = staticProjects.find(p => p.id === donationData.projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Генеруємо новий ID для пожертви
      const newDonationId = getNextId(staticDonations);
      
      // Створюємо нову пожертву
      const newDonation = {
        id: newDonationId,
        userId: donationData.userId || 3, // За замовчуванням донор
        projectId: donationData.projectId,
        amount: donationData.amount,
        message: donationData.message || "Пожертва на проєкт",
        createdAt: new Date()
      };
      
      // Додаємо пожертву до списку
      staticDonations.push(newDonation);
      
      // Оновлюємо зібрану суму проєкту
      const projectIndex = staticProjects.findIndex(p => p.id === donationData.projectId);
      if (projectIndex !== -1) {
        staticProjects[projectIndex].collectedAmount += donationData.amount;
      }
      
      res.status(201).json(newDonation);
    } catch (error) {
      console.error("Помилка при створенні пожертви:", error);
      res.status(500).json({ message: "Внутрішня помилка сервера" });
    }
  });
  
  // Для всіх інших маршрутів, які не реалізовані
  app.all("/api/*", (req, res, next) => {
    // Перевіряємо, чи маршрут вже був оброблений іншим обробником
    if (res.headersSent) {
      return next();
    }
    
    console.log(`Незареєстрований маршрут: ${req.method} ${req.path}`);
    res.status(404).json({ message: "Маршрут не знайдено" });
  });
}