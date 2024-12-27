import { PrismaClient } from "@prisma/client";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Initialize Prisma client
const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  const { cors } = await authenticate.public.appProxy(request);
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

  return cors(response);
};


export const action = async ({ request }) => {
  const { cors } = await authenticate.public.appProxy(request);
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

  return cors(response);
};
