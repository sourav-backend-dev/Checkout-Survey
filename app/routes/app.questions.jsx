import { PrismaClient } from "@prisma/client";
import { json } from "@remix-run/node";

// Initialize Prisma client
const prisma = new PrismaClient();

export const loader = async () => {
  // Fetch all surveys
  const surveys = await prisma.survey.findMany({
    include: {
      questions: {
        include: {
          answers: true, // Include the related answers for each question
        },
      },
    },
  });

  // If no surveys are found, return a 404 error
  if (surveys.length === 0) {
    return json({ error: "No surveys found" }, { status: 404 });
  }

  // Return the surveys data as JSON
  return json({ surveys });
};
