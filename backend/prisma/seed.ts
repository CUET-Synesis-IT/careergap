import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const careers = [
  {
    slug: "backend_engineer",
    name: "Backend Engineer",
    description:
      "Builds server-side applications, APIs, databases, distributed systems, and backend infrastructure.",

    profile: {
      skills: [
        { name: "Node.js", importance: "HIGH" },
        { name: "TypeScript", importance: "HIGH" },
        { name: "JavaScript", importance: "HIGH" },
        { name: "REST API", importance: "HIGH" },
        { name: "API Design", importance: "HIGH" },
        { name: "SQL", importance: "HIGH" },
        { name: "PostgreSQL", importance: "HIGH" },
        { name: "Database Design", importance: "HIGH" },
        { name: "Authentication & Authorization", importance: "HIGH" },
        { name: "System Design", importance: "HIGH" },
        { name: "Git", importance: "HIGH" },
        { name: "Docker", importance: "MEDIUM" },
        { name: "Redis", importance: "MEDIUM" },
        { name: "Testing", importance: "MEDIUM" },
        { name: "Message Queues", importance: "MEDIUM" },
        { name: "Microservices", importance: "MEDIUM" },
        { name: "Linux", importance: "MEDIUM" },
        { name: "Backend Security", importance: "HIGH" },
      ],
    },
  },

  {
    slug: "frontend_engineer",
    name: "Frontend Engineer",
    description:
      "Builds responsive, accessible, performant, and interactive web applications.",

    profile: {
      skills: [
        { name: "JavaScript", importance: "HIGH" },
        { name: "TypeScript", importance: "HIGH" },
        { name: "React", importance: "HIGH" },
        { name: "Next.js", importance: "HIGH" },
        { name: "HTML", importance: "HIGH" },
        { name: "CSS", importance: "HIGH" },
        { name: "Responsive Design", importance: "HIGH" },
        { name: "Web Accessibility", importance: "HIGH" },
        { name: "State Management", importance: "HIGH" },
        { name: "REST API Integration", importance: "HIGH" },
        { name: "Git", importance: "HIGH" },
        { name: "Testing", importance: "MEDIUM" },
        { name: "Tailwind CSS", importance: "MEDIUM" },
        { name: "Web Performance", importance: "MEDIUM" },
        { name: "Browser DevTools", importance: "MEDIUM" },
        { name: "UI Component Design", importance: "MEDIUM" },
      ],
    },
  },

  {
    slug: "ai_ml_engineer",
    name: "AI/ML Engineer",
    description:
      "Builds machine learning systems, AI applications, data pipelines, and model-powered software.",

    profile: {
      skills: [
        { name: "Python", importance: "HIGH" },
        { name: "Machine Learning", importance: "HIGH" },
        { name: "Deep Learning", importance: "HIGH" },
        { name: "PyTorch", importance: "HIGH" },
        { name: "Scikit-learn", importance: "HIGH" },
        { name: "NumPy", importance: "HIGH" },
        { name: "Pandas", importance: "HIGH" },
        { name: "Data Preprocessing", importance: "HIGH" },
        { name: "Model Evaluation", importance: "HIGH" },
        { name: "TensorFlow", importance: "MEDIUM" },
        { name: "SQL", importance: "MEDIUM" },
        { name: "Git", importance: "HIGH" },
        { name: "Docker", importance: "MEDIUM" },
        { name: "MLOps", importance: "HIGH" },
        { name: "Model Deployment", importance: "HIGH" },
        { name: "NLP", importance: "MEDIUM" },
        { name: "Computer Vision", importance: "MEDIUM" },
        { name: "Cloud AI Services", importance: "MEDIUM" },
      ],
    },
  },

  {
    slug: "devops_engineer",
    name: "DevOps Engineer",
    description:
      "Builds and maintains deployment pipelines, cloud infrastructure, automation, monitoring, and reliable systems.",

    profile: {
      skills: [
        { name: "Linux", importance: "HIGH" },
        { name: "Docker", importance: "HIGH" },
        { name: "Kubernetes", importance: "HIGH" },
        { name: "CI/CD", importance: "HIGH" },
        { name: "Git", importance: "HIGH" },
        { name: "Cloud Computing", importance: "HIGH" },
        { name: "AWS", importance: "HIGH" },
        { name: "Terraform", importance: "HIGH" },
        { name: "Infrastructure as Code", importance: "HIGH" },
        { name: "Networking", importance: "HIGH" },
        { name: "Bash", importance: "MEDIUM" },
        { name: "Monitoring & Observability", importance: "HIGH" },
        { name: "Logging", importance: "MEDIUM" },
        { name: "System Design", importance: "HIGH" },
        { name: "DevOps Security", importance: "HIGH" },
        { name: "Azure", importance: "LOW" },
        { name: "Ansible", importance: "MEDIUM" },
        { name: "Prometheus", importance: "MEDIUM" },
      ],
    },
  },

  {
    slug: "data_engineer",
    name: "Data Engineer",
    description:
      "Builds data pipelines, data platforms, warehouses, transformation systems, and reliable data infrastructure.",

    profile: {
      skills: [
        { name: "Python", importance: "HIGH" },
        { name: "SQL", importance: "HIGH" },
        { name: "PostgreSQL", importance: "HIGH" },
        { name: "ETL", importance: "HIGH" },
        { name: "ELT", importance: "HIGH" },
        { name: "Data Pipelines", importance: "HIGH" },
        { name: "Data Warehousing", importance: "HIGH" },
        { name: "Data Modeling", importance: "HIGH" },
        { name: "Apache Spark", importance: "HIGH" },
        { name: "Apache Airflow", importance: "HIGH" },
        { name: "Data Transformation", importance: "HIGH" },
        { name: "Data Quality", importance: "HIGH" },
        { name: "Distributed Data Processing", importance: "MEDIUM" },
        { name: "Docker", importance: "MEDIUM" },
        { name: "Git", importance: "HIGH" },
        { name: "AWS", importance: "MEDIUM" },
        { name: "Kafka", importance: "MEDIUM" },
        { name: "Data Lake", importance: "MEDIUM" },
      ],
    },
  },
];

async function main() {
  console.log("Seeding CareerGap database...");

  for (const career of careers) {
    await prisma.career.upsert({
      where: {
        slug: career.slug,
      },

      update: {
        name: career.name,
        description: career.description,
        profile: career.profile,
      },

      create: career,
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: {
      email: adminEmail.toLowerCase(),
    },
    update: {
      name: "Super Admin",
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      name: "Super Admin",
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("Seeded Super Admin.");

  console.log(`Seeded ${careers.length} careers.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
