import { PrismaClient } from "@prisma/client";
import { json, redirect } from "@remix-run/node";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
    const { surveyId } = await request.json();
  
    if (!surveyId) {
      return json({ error: "Survey ID is required." }, { status: 400 });
    }
  
    try {
      // Start a transaction to delete answers and questions first, then the survey
      await prisma.$transaction(async (prisma) => {
        // Delete all answers related to the questions in the survey
        await prisma.answer.deleteMany({
          where: {
            question: {
              surveyId: surveyId,
            },
          },
        });
  
        // Delete all questions related to the survey
        await prisma.question.deleteMany({
          where: {
            surveyId: surveyId,
          },
        });
  
        // Finally, delete the survey itself
        await prisma.survey.delete({
          where: { id: surveyId },
        });
      });
  
      console.log("Survey and related data deleted successfully.");
      return redirect("/app/")
  
    } catch (error) {
      console.error("Error deleting survey:", error);
      return json({ error: "Error deleting survey." }, { status: 500 });
    }
  };
  