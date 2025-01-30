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
  Box,
  InlineStack,
  InlineGrid,
  ButtonGroup,
  DataTable,
  Modal,
  List,
  Banner,
  Badge, // Import Banner component
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, PlusCircleIcon, SaveIcon, ViewIcon } from '@shopify/polaris-icons';
import { TitleBar } from "@shopify/app-bridge-react";

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
  const surveyId = parseInt(formData.get("surveyId"));
  console.log("Survey id is :", surveyId);

  try {
    if (surveyId) {
      // Update survey
      await prisma.answer.deleteMany({
        where: {
          question: {
            surveyId: surveyId,
          },
        },
      });

      await prisma.question.deleteMany({
        where: {
          surveyId: surveyId,
        },
      });

      const updatedSurvey = await prisma.survey.update({
        where: { id: surveyId },
        data: {
          title: surveyTitle,
          questions: {
            create: questions.map((q) => ({
              text: q.text,
              isMultiChoice: q.isConditional ? false : q.isMultiChoice || false,
              isConditional: q.isConditional || false,
              conditionAnswer: q.isConditional ? q.conditionAnswer : null,
              answers: {
                create: q.isConditional
                  ? [{ id: 1, text: "Yes" }, { id: 2, text: "No" }]
                  : q.options.map((option) => ({
                    text: option.text,
                  })),
              },
            })),
          },
        },
      });

      console.log("Survey updated:", updatedSurvey);
    } else {
      // Create new survey
      const newSurvey = await prisma.survey.create({
        data: {
          title: surveyTitle,
          questions: {
            create: questions.map((q) => ({
              text: q.text,
              isMultiChoice: q.isConditional ? false : q.isMultiChoice || false,
              isConditional: q.isConditional || false,
              conditionAnswer: q.isConditional ? q.conditionAnswer : null,
              answers: {
                create: q.isConditional
                  ? [{ id: 1, text: "Yes" }, { id: 2, text: "No" }]
                  : q.options.map((option) => ({
                    text: option.text,
                  })),
              },
            })),
          },
        },
      });
      console.log("Survey created:", newSurvey);
    }

    return redirect("/app/");
  } catch (error) {
    console.error("Error saving survey:", error);
    return json({ error: "Failed to save survey." }, { status: 500 });
  }
};


export default function Index() {
  const { surveys } = useLoaderData();
  const actionData = useActionData();
  const [surveyTitle, setSurveyTitle] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: [{ text: "" }] },
  ]);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDeleteBannerVisible, setDeleteBannerVisible] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState(null);

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

  const handleRemoveQuestion = (index) => {
    const updatedQuestions = questions.filter((_, idx) => idx !== index);
    setQuestions(updatedQuestions);
  };

  const handleRemoveOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter(
      (_, idx) => idx !== optionIndex
    );
    setQuestions(updatedQuestions);
  };

  const handleViewSurvey = (survey) => {
    setActiveSurvey(survey);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setActiveSurvey(null);
  };

  const handleEditSurvey = (survey) => {
    setSurveyTitle(survey.title);
    setActiveSurvey(survey);
    setQuestions(
      survey.questions.map(q => ({
        text: q.text,
        options: q.answers.map(answer => ({ text: answer.text }))
      }))
    );
  };

  // Handle Delete Survey and Show Banner
  const handleDeleteSurvey = (surveyId) => {
    setSurveyToDelete(surveyId);
    setDeleteBannerVisible(true);
  };

  const confirmDeleteSurvey = async () => {
    if (!surveyToDelete) return;
    try {
      const response = await fetch("/api/delete-survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ surveyId: surveyToDelete }),
      });

      if (response.ok) {
        setDeleteBannerVisible(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting survey:", error);
    }
  };

  const cancelDeleteSurvey = () => {
    setDeleteBannerVisible(false);
    setSurveyToDelete(null);
  };

  const rows = surveys.map((survey, index) => [
    index + 1,
    survey.title,
    <InlineStack key={survey.id} alignment="center" gap={300}>
      <Button onClick={() => handleViewSurvey(survey)} icon={ViewIcon} size="slim">View</Button>
      <Button onClick={() => handleEditSurvey(survey)} icon={EditIcon} variant="primary" size="slim">Edit</Button>
      <Button onClick={() => handleDeleteSurvey(survey.id)} icon={DeleteIcon} variant="primary" size="slim" tone="critical">Delete</Button>
    </InlineStack>
  ]);

  return (
    <Page>
      {actionData?.error && (
        <Text color="red" variant="bodyMd">
          {actionData.error}
        </Text>
      )}
      <TitleBar title="Manage Surveys" />
      {/* Delete confirmation banner */}
      {isDeleteBannerVisible && (
        <Modal
          open={true}
          onClose={cancelDeleteSurvey}
          title="Are you sure you want to delete this survey?"
          primaryAction={{
            content: 'Delete',
            onAction: confirmDeleteSurvey,
            destructive: true,
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: cancelDeleteSurvey, // Close the banner
            },
          ]}
        >
          <Modal.Section>
            <Banner
              title="This action will delete the survey, all its questions, and all associated answers from users.
                Are you sure you want to proceed? This action cannot be undone."
              tone="critical"
            />
          </Modal.Section>
        </Modal>

      )}

      <InlineGrid gap="400" columns={2}>
        <Form method="post">
          <Card sectioned>
            <FormLayout>
              <Text variant="headingMd" as="h2">Survey Title</Text>
              <TextField
                value={surveyTitle}
                onChange={(value) => setSurveyTitle(value)}
                name="quizTitle"
                id="quizTitle"
                placeholder="Enter Your Survey Title Here"
                requiredIndicator
              />
              <InlineStack alignment="center" gap={400}>
                <Box width="90%">
                  <Text variant="headingMd" as="h2">Questions</Text>
                </Box>
                <Box width="5%">
                  <Button onClick={handleAddQuestion} icon={PlusCircleIcon} variant="primary" />
                </Box>
              </InlineStack>
              {questions.map((question, index) => (
                <Card key={index} sectioned>
                  <BlockStack gap={300}>
                    <InlineGrid columns={2}>
                      <Checkbox
                        label="Is Conditional-Question?"
                        checked={question.isConditional || false}
                        onChange={(value) => handleInputChange(index, "isConditional", value)}
                      />
                      {!question.isConditional &&
                        <Checkbox
                          label="Is Multi-Choice?"
                          checked={question.isMultiChoice || false}
                          onChange={(value) => handleInputChange(index, "isMultiChoice", value)}
                        />
                      }
                    </InlineGrid>
                    <InlineStack alignment="center" gap={300}>
                      <Box width="90%">
                        <TextField
                          placeholder={`Question ${index + 1}`}
                          value={question.text}
                          onChange={(value) => handleInputChange(index, 'text', value)}
                        />
                      </Box>
                      <Box width="5%">
                        <Button onClick={() => handleRemoveQuestion(index)} icon={DeleteIcon} variant="primary" tone="critical" />
                      </Box>
                    </InlineStack>
                    <>
                      <InlineStack alignment="center" gap={300}>
                        <Box width="80%">
                          <Text variant="headingMd" as="h2">Options</Text>
                        </Box>

                        {!question.isConditional &&
                          <ButtonGroup>
                            <Button onClick={() => handleAddOption(index)} icon={PlusCircleIcon} variant="primary" tone="success" />
                          </ButtonGroup>
                        }
                      </InlineStack>
                      <BlockStack alignment="center" gap={300}>


                        {!question.isConditional ?
                          <>
                            {question.options.map((option, optIndex) => (
                              <InlineStack key={optIndex} alignment="center" gap={300}>
                                <Box width="90%">
                                  <TextField
                                    placeholder={`Option ${optIndex + 1}`}
                                    value={option.text}
                                    onChange={(value) => {
                                      const updatedQuestions = [...questions];
                                      updatedQuestions[index].options[optIndex].text = value;
                                      setQuestions(updatedQuestions);
                                    }}
                                  />
                                </Box>
                                <Box width="5%">
                                  <Button onClick={() => handleRemoveOption(index, optIndex)} icon={DeleteIcon} tone="critical" />
                                </Box>
                              </InlineStack>
                            ))}
                          </>
                          :
                          <>
                            <Box width="90%">
                              <TextField
                                placeholder={`Option 1`}
                                value="Yes"
                                disabled
                              />
                            </Box>
                            <Box width="90%">
                              <TextField
                                placeholder={`Option 2`}
                                value="No"
                                disabled
                              />
                            </Box>
                          </>
                        }
                      </BlockStack>
                    </>
                  </BlockStack>
                </Card>
              ))}

              <input type="hidden" name="questions" value={JSON.stringify(questions)} />
              <input type="hidden" name="surveyId" value={activeSurvey ? activeSurvey.id : ""} />
              <Button submit icon={SaveIcon} variant="primary">Save</Button>
            </FormLayout>
          </Card>
        </Form>

        <Card>
          <Text variant="headingMd" as="h2" color="subdued">Existing Surveys</Text>
          <DataTable
            columnContentTypes={['text', 'text', 'text']}
            headings={['Sr. No.', 'Title', 'Actions']}
            rows={rows}
          />
        </Card>
      </InlineGrid>

      {activeSurvey && (
        <Modal open={modalOpen} onClose={handleCloseModal} title={`Survey: ${activeSurvey.title}`}>
          <Modal.Section>
            <InlineGrid columns={2} gap={300}>
              {activeSurvey.questions.map((question, questionIndex) => (
                <Card>
                  <BlockStack key={question.id} gap={200}>
                    <Text variant="headingMd">Question {questionIndex + 1}: {question.text}</Text>
                    <InlineStack>
                      <Box width="40%">
                        <Text variant="headingXs" as="h6">is Conditional ?</Text>
                      </Box>
                      <Box width="5%">
                        <Badge>{question.isConditional ? <>Yes</> : <>No</>}</Badge>
                      </Box>
                    </InlineStack>
                    <InlineStack>
                      <Box width="40%">
                        <Text variant="headingXs" as="h6">is Multi Choice ?</Text>
                      </Box>
                      <Box width="5%">
                        <Badge>{question.isMultiChoice ? <>Yes</> : <>No</>}</Badge>
                      </Box>
                    </InlineStack>
                    <List type="bullet">
                      {question.answers.map((answer, answerIndex) => (
                        <List.Item key={answer.id}>{answer.text}</List.Item>
                      ))}
                    </List>
                  </BlockStack>
                </Card>
              ))}
            </InlineGrid>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
