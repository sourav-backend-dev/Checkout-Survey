import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// export const action = async ({ request }) => {
//   console.log("Action called!");

//   // Handle CORS preflight request
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204, // No Content
//       headers: {
//         "Access-Control-Allow-Origin": "*", // Allow all origins
//         "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Allow these methods
//         "Access-Control-Allow-Headers": "Content-Type", // Allow the Content-Type header
//       },
//     });
//   }

//   try {
//     // Parse the incoming POST request body
//     const data = await request.json();
//     console.log("Received data:", data);

//     // For each answer, get the questionId by matching questionTitle with the actual questions in the database
//     const answersPromises = data.answers.map(async (answer) => {
//       // Find the questionId by matching the questionTitle
//       const question = await prisma.question.findFirst({
//         where: { text: answer.questionTitle },
//       });

//       if (!question) {
//         throw new Error(`Question with title "${answer.questionTitle}" not found in the database.`);
//       }
//       console.log(data.email);

//       // Now create the answer in the UserAnswer table
//       return prisma.userAnswer.create({
//         data: {
//           userEmail: data.email,
//           questionId: question.id,
//           answerText: answer.answer,
//         },
//       });
//     });

//     // Wait for all answers to be stored
//     await Promise.all(answersPromises);

//     // Store the answers as a JSON string in ApiProxyData table
//     await prisma.apiProxyData.create({
//       data: {
//         email: data.email,
//         answers: JSON.stringify(data.answers),
//       },
//     });

//     // Example response for a successful POST request
//     return new Response(
//       JSON.stringify({
//         message: "Action successfully called. Data received and stored!",
//         receivedData: data,
//       }),
//       {
//         status: 200,
//         headers: {
//           "Content-Type": "application/json",
//           "Access-Control-Allow-Origin": "*", // Allow all origins
//         },
//       }
//     );
//   } catch (error) {
//     console.error("Error handling action:", error);

//     // Handle any errors and send an error response
//     return new Response(
//       JSON.stringify({
//         message: "Failed to process the request.",
//         error: error.message,
//       }),
//       {
//         status: 500,
//         headers: {
//           "Content-Type": "application/json",
//           "Access-Control-Allow-Origin": "*", // Allow all origins
//         },
//       }
//     );
//   }
// };

export const action = async ({ request }) => {
  console.log("Action called!");

  // Handle CORS preflight request
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204, // No Content
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Allow these methods
        "Access-Control-Allow-Headers": "Content-Type", // Allow the Content-Type header
      },
    });
  }

  try {
    // Parse the incoming POST request body
    const data = await request.json();
    console.log("Received data:", data);
    const existingRecord = await prisma.apiProxyData.findFirst({
      where: {
        orderId: data.orderId,
      },
    });

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

    });

    // Wait for all answers to be stored
    await Promise.all(answersPromises);

    if (existingRecord) {
      console.log("Existing One");
      // If the record exists, update it
      await prisma.apiProxyData.update({
        where: {
          id: existingRecord.id,  // Assuming you have an 'id' field to uniquely identify the record
        },
        data: {
          email: data.email,
          surveyTitle: data.surveyTitle,
          answers: JSON.stringify(data.answers),
        },
      });
    } else {
      console.log("Not existing");
      // If the record doesn't exist, create a new one
      await prisma.apiProxyData.create({
        data: {
          shopDomain: data.shopDomain,
          email: data.email,
          surveyTitle: data.surveyTitle,
          orderId: data.orderId,
          answers: JSON.stringify(data.answers),
        },
      });
    }

    // Example response for a successful POST request
    return new Response(
      JSON.stringify({
        message: "Action successfully called. Data received and stored!",
        receivedData: data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow all origins
        },
      }
    );
  } catch (error) {
    console.error("Error handling action:", error);

    // Handle any errors and send an error response
    return new Response(
      JSON.stringify({
        message: "Failed to process the request.",
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow all origins
        },
      }
    );
  }
};

export const loader = async ({ request }) => {
  console.log("Action called!");

  // Handle CORS preflight request
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204, // No Content
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Allow these methods
        "Access-Control-Allow-Headers": "Content-Type", // Allow the Content-Type header
      },
    });
  }

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

    // Example response for a successful POST request
    return new Response(
      JSON.stringify({
        message: "Action successfully called. Data received and stored!",
        receivedData: data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow all origins
        },
      }
    );
  } catch (error) {
    console.error("Error handling action:", error);

    // Handle any errors and send an error response
    return new Response(
      JSON.stringify({
        message: "Failed to process the request.",
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow all origins
        },
      }
    );
  }
};
