import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import { useState } from "react";
import {
  Page,
  Card,
  FormLayout,
  TextField,
  Button,
  Checkbox,
  BlockStack,
  Text,
} from "@shopify/polaris";

const prisma = new PrismaClient();

export const loader = async () => {
  const surveys = await prisma.survey.findMany({
    include: {
      questions: {
        include: {
          answers: true, 
        },
      },
    },
  });

  return json({ surveys });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const surveyTitle = formData.get("quizTitle");
  const questions = JSON.parse(formData.get("questions"));

  try {
    const newSurvey = await prisma.survey.create({
      data: {
        title: surveyTitle,
        questions: {
          create: questions.map((q) => ({
            text: q.text,
            answers: {
              create: q.options.map((option) => ({
                text: option.text,
              })),
            },
          })),
        },
      },
    });

    console.log("Survey created:", newSurvey);
    return redirect("/app/");
  } catch (error) {
    console.error("Error creating survey:", error);
    return json({ error: "Failed to create survey." }, { status: 500 });
  }
};

export default function Index() {
  const { surveys } = useLoaderData();
  const actionData = useActionData();
  const [surveyTitle, setSurveyTitle] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: [{ text: "" }] },
  ]);

  const handleInputChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", options: [{ text: "" }] },
    ]);
  };

  const handleAddOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push({ text: "" });
    setQuestions(updatedQuestions);
  };

  return (
    <Page title="Create a Survey">
      {actionData?.error && (
        <Text color="red" variant="bodyMd">
          {actionData.error}
        </Text>
      )}

      <Form method="post">
        <Card sectioned>
          <FormLayout>
            <TextField
              label="Survey Title"
              value={surveyTitle}
              onChange={(value) => setSurveyTitle(value)}
              name="quizTitle"
              id="quizTitle"
              requiredIndicator
            />

            <Text variant="headingMd" as="h2" color="subdued">
              Questions
            </Text>

            {questions.map((question, index) => (
              <Card key={index} sectioned>
                <BlockStack >
                  <TextField
                    label={`Question ${index + 1}`}
                    value={question.text}
                    onChange={(value) => handleInputChange(index, 'text', value)}
                  />

                  <Text variant="bodyMd" color="subdued">Options</Text>
                  {question.options.map((option, optIndex) => (
                    <BlockStack key={optIndex} alignment="center">
                      <TextField
                        label={`Option ${optIndex + 1}`}
                        value={option.text}
                        onChange={(value) => {
                          const updatedQuestions = [...questions];
                          updatedQuestions[index].options[optIndex].text = value;
                          setQuestions(updatedQuestions);
                        }}
                      />
                    </BlockStack>
                  ))}

                  <Button onClick={() => handleAddOption(index)} plain>
                    Add Option
                  </Button>
                </BlockStack>
              </Card>
            ))}

            <Button onClick={handleAddQuestion} plain>
              Add Question
            </Button>

            <input
              type="hidden"
              name="questions"
              value={JSON.stringify(questions)}
            />

            <Button submit primary>
              Save Survey
            </Button>
          </FormLayout>
        </Card>
      </Form>

      <Text variant="headingMd" as="h2" color="subdued">
        Existing Surveys
      </Text>
      {surveys.length > 0 ? (
        surveys.map((survey) => (
          <Card key={survey.id} sectioned>
            <Text variant="headingMd" as="h2" color="subdued">{survey.title}</Text>
            {survey.questions.map((question) => (
              <BlockStack key={question.id}>
                <Text variant="bodyMd">{question.text}</Text>
                <ul>
                  {question.answers.map((answer) => (
                    <li key={answer.id}>{answer.text}</li>
                  ))}
                </ul>
              </BlockStack>
            ))}
          </Card>
        ))
      ) : (
        <Text color="subdued" variant="bodyMd">
          No surveys found.
        </Text>
      )}
    </Page>
  );
}
