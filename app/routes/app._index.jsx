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
  Badge,
  Tooltip,
  Select,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, PlusCircleIcon, SaveIcon, ToggleOffIcon, ToggleOnIcon, ViewIcon } from '@shopify/polaris-icons';
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  await authenticate.admin(request);
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
  const isFrenchVersion = formData.get("isFrenchVersion") === "true";
  const frenchSurveyId = formData.get("frenchSurveyId") ? parseInt(formData.get("frenchSurveyId")) : null;

  console.log("Survey id is :", surveyId);
  console.log("frenchSurveyId is :", frenchSurveyId);

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
          isFrenchVersion,
          surveyId: frenchSurveyId,
          questions: {
            create: questions.map((q) => ({
              text: q.text,
              isMultiChoice: q.isConditional ? false : q.isTextBox ? false : q.isMultiChoice || false,
              isConditional: q.isMultiChoice ? false : q.isTextBox ? false : q.isConditional || false,
              isTextBox: q.isConditional ? false : q.isMultiChoice ? false : q.isTextBox || false,
              conditionAnswer: null,
              answers: {
                create: q.isConditional
                  ? [{ text: "Yes", haveTextBox: false }, { text: "No", haveTextBox: false }]
                  : q.options.map((option) => ({
                    text: option.text,
                    haveTextBox: option.haveTextBox || false, // Store boolean value
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
          isFrenchVersion,
          surveyId: frenchSurveyId,
          questions: {
            create: questions.map((q) => ({
              text: q.text,
              isMultiChoice: q.isConditional ? false : q.isTextBox ? false : q.isMultiChoice || false,
              isConditional: q.isMultiChoice ? false : q.isTextBox ? false : q.isConditional || false,
              isTextBox: q.isConditional ? false : q.isMultiChoice ? false : q.isTextBox || false,
              conditionAnswer: null,
              answers: {
                create: q.isConditional
                  ? [{ text: "Yes", haveTextBox: false }, { text: "No", haveTextBox: false }]
                  : q.options.map((option) => ({
                    text: option.text,
                    haveTextBox: option.haveTextBox || false, // Store boolean value
                  })),
              }
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
  const [ansText, setAnsText] = useState(false);
  const [isFrenchVersion, setIsFrenchVersion] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState("");


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
        isConditional: q.isConditional || false,
        isMultiChoice: q.isMultiChoice || false,
        isTextBox: q.isTextBox || false,
        options: q.answers.map(answer => ({
          text: answer.text,
          haveTextBox: answer.haveTextBox || false,
        }))
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

  console.log("questions: ", questions)

  return (
    <Page fullWidth>
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
              <InlineStack gap={400}>
                <Checkbox
                  label="Is French Version?"
                  checked={isFrenchVersion}
                  onChange={(value) => setIsFrenchVersion(value)}
                />
                {isFrenchVersion && (
                  <Select
                    placeholder="Select French Survey"
                    options={surveys.map((survey) => ({
                      label: survey.title,
                      value: survey.id.toString(),
                    }))}
                    value={selectedSurveyId}
                    onChange={(value) => setSelectedSurveyId(value)}
                  />
                )}
              </InlineStack>

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
                    <InlineGrid columns={3}>
                      <Checkbox
                        label="Is Conditional?"
                        checked={question.isConditional || false}
                        disabled={question.isMultiChoice || question.isTextBox}
                        onChange={(value) => handleInputChange(index, "isConditional", value)}
                      />
                      <Checkbox
                        label="Is Text Box?"
                        checked={question.isTextBox || false}
                        disabled={question.isMultiChoice || question.isConditional}
                        onChange={(value) => handleInputChange(index, "isTextBox", value)}
                      />
                      <Checkbox
                        label="Is Multi-Choice?"
                        checked={question.isMultiChoice || false}
                        disabled={question.isConditional || question.isTextBox}
                        onChange={(value) => handleInputChange(index, "isMultiChoice", value)}
                      />
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
                        {!question.isTextBox &&
                          <Box width="80%">
                            <Text variant="headingMd" as="h2">Options</Text>
                          </Box>
                        }
                        {!question.isConditional && !question.isTextBox &&
                          <ButtonGroup>
                            <Button onClick={() => handleAddOption(index)} icon={PlusCircleIcon} variant="primary" tone="success" />
                          </ButtonGroup>
                        }
                      </InlineStack>
                      <BlockStack alignment="center" gap={300}>
                        {question.isConditional ?
                          <>
                            <Box width="90%">
                              <TextField
                                placeholder={`Option 1`}
                                disabled={true}
                                value="Yes" // Ensure "Yes" is passed
                                onChange={(value) => {
                                  const updatedQuestions = [...questions];
                                  updatedQuestions[index].options[0].text = value; // Update "Yes"
                                  setQuestions(updatedQuestions);
                                }}
                              />
                            </Box>
                            <Box width="90%">
                              <TextField
                                placeholder={`Option 2`}
                                disabled={true}
                                value="No" // Ensure "No" is passed
                                onChange={(value) => {
                                  const updatedQuestions = [...questions];
                                  updatedQuestions[index].options[1].text = value; // Update "No"
                                  setQuestions(updatedQuestions);
                                }}
                              />
                            </Box>
                          </>
                          : question.isTextBox ?
                            <></>
                            :
                            <>
                              {question.options.map((option, optIndex) => (
                                <InlineStack key={optIndex} alignment="center" gap={300}>
                                  <Box width="80%">
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
                                  {question.isConditional || question.isTextBox ? <></> :
                                    <Box width="5%">
                                      <Tooltip active={optIndex == 0 && index == 0} content="Add Text Field?">
                                        <Button
                                          onClick={() => {
                                            const updatedQuestions = [...questions];
                                            updatedQuestions[index].options[optIndex].haveTextBox = !updatedQuestions[index].options[optIndex].haveTextBox;
                                            setQuestions(updatedQuestions);
                                          }}
                                          icon={questions[index].options[optIndex].haveTextBox ? ToggleOnIcon : ToggleOffIcon}
                                          variant={questions[index].options[optIndex].haveTextBox ? "primary" : "secondary"}
                                        />
                                      </Tooltip>
                                    </Box>
                                  }
                                </InlineStack>
                              ))}
                            </>
                        }

                      </BlockStack>
                    </>
                  </BlockStack>
                </Card>
              ))}

              <input type="hidden" name="questions" value={JSON.stringify(questions)} />
              <input type="hidden" name="surveyId" value={activeSurvey ? activeSurvey.id : ""} />
              <input type="hidden" name="isFrenchVersion" value={isFrenchVersion} />
              <input type="hidden" name="frenchSurveyId" value={selectedSurveyId || ""} />
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
                        <Badge tone={question.isConditional ? "attention" : "info"}>{question.isConditional ? <>Yes</> : <>No</>}</Badge>
                      </Box>
                    </InlineStack>
                    <InlineStack>
                      <Box width="40%">
                        <Text variant="headingXs" as="h6">is Multi Choice ?</Text>
                      </Box>
                      <Box width="5%">
                        <Badge tone={question.isMultiChoice ? "attention" : "info"}>{question.isMultiChoice ? <>Yes</> : <>No</>}</Badge>
                      </Box>
                    </InlineStack>
                    <InlineStack>
                      <Box width="40%">
                        <Text variant="headingXs" as="h6">is Text Box ?</Text>
                      </Box>
                      <Box width="5%">
                        <Badge tone={question.isTextBox ? "attention" : "info"}>{question.isTextBox ? <>Yes</> : <>No</>}</Badge>
                      </Box>
                    </InlineStack>
                    {!question.isTextBox &&
                      <List type="bullet">
                        {question.answers.map((answer, answerIndex) => (
                          <List.Item key={answer.id}>{answer.text} {answer.haveTextBox && <Tooltip active content="Have Text Box"><Badge tone="attention">Yes</Badge></Tooltip>}</List.Item>
                        ))}
                      </List>
                    }
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