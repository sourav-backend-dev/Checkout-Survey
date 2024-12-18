import { PrismaClient } from "@prisma/client";
import { json } from "@remix-run/node";

// Initialize Prisma client
const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  // Fetch all surveys
  const surveys = await prisma.survey.findMany({
    include: {
      questions: {
        include: {
          answers: true,
        },
      },
    },
  });

  // If no surveys are found, return a 404 error
  if (surveys.length === 0) {
    return json({ error: "No surveys found" }, { status: 404 });
  }

  const response = json({ surveys });

  return response;
};


export const action = async ({ request }) => {
  // Fetch all surveys
  const surveys = await prisma.survey.findMany({
    include: {
      questions: {
        include: {
          answers: true,
        },
      },
    },
  });

  // If no surveys are found, return a 404 error
  if (surveys.length === 0) {
    return json({ error: "No surveys found" }, { status: 404 });
  }

  const response = json({ surveys });

  return response;
};
