import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "volunteer-hub-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: app.get("env") === "production",
      sameSite: 'lax',
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          // Normalize email to lowercase for consistency
          const normalizedEmail = email.toLowerCase();
          const user = await storage.getUserByEmail(normalizedEmail);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Невірний email або пароль" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const registerSchema = z.object({
        email: z.string().email("Некоректний email"),
        username: z.string().min(1, "Ім'я користувача обов'язкове"),
        password: z.string().min(6, "Пароль повинен містити мінімум 6 символів"),
        confirmPassword: z.string(),
        role: z.enum(["volunteer", "coordinator", "donor"]),
        firstName: z.string().min(1, "Ім'я обов'язкове"),
        lastName: z.string().min(1, "Прізвище обов'язкове"),
        bio: z.string().default(""),
        region: z.string().min(1, "Область обов'язкова"),
        city: z.string().min(1, "Місто обов'язкове"),
        phoneNumber: z.string().min(1, "Номер телефону обов'язковий"),
        gender: z.enum(["Чоловіча", "Жіноча", "Інше"]),
        birthDate: z.string().min(1, "Дата народження обов'язкова"),
      })
      .refine(data => data.password === data.confirmPassword, {
        message: "Паролі не співпадають",
        path: ["confirmPassword"],
      });

      const validatedData = registerSchema.parse(req.body);
      const { confirmPassword, ...userData } = validatedData;
      
      // Check if user with this email already exists (case insensitive)
      const normalizedEmail = userData.email.toLowerCase();
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ message: "Користувач з таким email вже існує" });
      }
      
      // Normalize email to lowercase for consistency
      userData.email = normalizedEmail;

      // Check if username is taken
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Це ім'я користувача вже зайняте" });
      }

      // Hash password and create verification token
      const hashedPassword = await hashPassword(userData.password);
      const verificationToken = generateVerificationToken();

      // Конвертуємо gender значення для відповідності схемі бази даних
      const genderMap: Record<string, string> = {
        "male": "Чоловіча",
        "female": "Жіноча", 
        "other": "Інше"
      };

      const user = await storage.createUser({
        ...userData,
        bio: userData.bio || "",
        gender: genderMap[userData.gender] || userData.gender,
        password: hashedPassword,
        verificationToken
      });

      // In a real app, we would send an email with the verification token
      // For this demo, we'll auto-verify users
      await storage.verifyUser(user.id);

      // Login the user after registration
      req.login(user, (err) => {
        if (err) return next(err);
        // Send back the user without sensitive data
        const { password, verificationToken, ...userWithoutSensitiveData } = user;
        res.status(201).json(userWithoutSensitiveData);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Помилка валідації даних", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Невірний email або пароль" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Send back the user without sensitive data
        const { password, verificationToken, ...userWithoutSensitiveData } = user;
        res.status(200).json(userWithoutSensitiveData);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Send back the user without sensitive data
    const { password, verificationToken, ...userWithoutSensitiveData } = req.user as SelectUser;
    res.json(userWithoutSensitiveData);
  });

  // Verify email endpoint
  app.post("/api/verify-email", async (req, res, next) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Токен верифікації відсутній" });
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Невірний токен верифікації" });
      }

      await storage.verifyUser(user.id);
      res.status(200).json({ message: "Email успішно підтверджено" });
    } catch (error) {
      next(error);
    }
  });
}
