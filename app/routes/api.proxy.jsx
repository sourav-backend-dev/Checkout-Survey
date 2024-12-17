import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
  console.log("Action called!");

  try {
    // Parse the incoming POST request body
    const data = await request.json();
    console.log("Received data:", data);

    // For each answer, get the questionId by matching questionTitle with the actual questions in the database
    const answersPromises = data.answers.map(async (answer) => {
      // Find the questionId by matching the questionTitle
      const question = await prisma.question.findFirst({
        where: { text: answer.questionTitle },
      });

      if (!question) {
        throw new Error(`Question with title "${answer.questionTitle}" not found in the database.`);
      }
      console.log(data.email);

      // Now create the answer in the UserAnswer table
      return prisma.userAnswer.create({
        data: {
          userEmail: data.email, 
          questionId: question.id,
          answerText: answer.answer, 
        },
      });
    });

    // Wait for all answers to be stored
    await Promise.all(answersPromises);

    // Store the answers as a JSON string in ApiProxyData table
    await prisma.apiProxyData.create({
      data: {
        email: data.email,
        answers: JSON.stringify(data.answers), 
      },
    });

    // Example response for a POST request
    return new Response(
      JSON.stringify({
        message: "Action successfully called. Data received and stored!",
        receivedData: data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error handling action:", error);

    return new Response(
      JSON.stringify({
        message: "Failed to process the request.",
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
