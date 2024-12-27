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
    return new Response(JSON.stringify({ error: "No surveys found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return new Response(JSON.stringify({ surveys }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
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
    return new Response(JSON.stringify({ error: "No surveys found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return new Response(JSON.stringify({ surveys }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
