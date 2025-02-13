import {
  Card,
  Page,
  IndexTable,
  TextField,
  Select,
  Text,
  InlineStack,
  Box,
  BlockStack,
  Modal,
  Button,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json, useLoaderData } from "@remix-run/react";
import { useState, useMemo } from "react";
import { PrismaClient } from "@prisma/client";
import { ExportIcon } from "@shopify/polaris-icons";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

export const loader = async () => {
  const feedbacks = await prisma.apiProxyData.findMany();
  const surveyData = await prisma.survey.findMany({
    include: {
      questions: true, // Fetch associated questions
    },
  });

  return json({ feedbacks, surveyData });
};

export default function AdditionalPage() {
  const { feedbacks, surveyData } = useLoaderData();
  console.log(surveyData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("");
  const initialFeedbacks = feedbacks.map((feedback, index) => {
    const dateTime = new Date(feedback.createdAt);
    return {
      sr: index + 1,
      id: feedback.id.toString(),
      email: feedback.email,
      date: dateTime.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
      time: dateTime.toLocaleTimeString(),
      answers: JSON.parse(feedback.answers),
    };
  });

  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSearchChange = (value) => setSearchTerm(value);

  const handleSortChange = (value) => {
    const [field, order] = value.split("-");
    setSortField(field);
    setSortOrder(order);
  };

  const filteredFeedbacks = useMemo(() => {
    let result = initialFeedbacks;

    if (searchTerm) {
      result = result.filter((feedback) =>
        feedback.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // result = result.sort((a, b) => {
    //   if (sortField === "email") {
    //     return sortOrder === "asc"
    //       ? a.email.localeCompare(b.email)
    //       : b.email.localeCompare(a.email);
    //   } else if (sortField === "date") {
    //     return sortOrder === "asc"
    //       ? new Date(a.createdAt) - new Date(b.createdAt)
    //       : new Date(b.createdAt) - new Date(a.createdAt);
    //   }
    //   return 0;
    // });

    result = result.sort((a, b) => {
      if (sortField === "email") {
        return sortOrder === "asc"
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      } else if (sortField === "date") {
        return sortOrder === "asc"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
      return 0;
    });


    return result;
  }, [searchTerm, sortField, sortOrder, initialFeedbacks]);

  const handleExport = () => {
    if (exportFormat === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(
        filteredFeedbacks.map((feedback) => ({
          ID: feedback.id,
          Email: feedback.email,
          CreatedAt: feedback.createdAt,
          Answers: feedback.answers
            .map((ans) => `${ans.questionTitle}: ${ans.answer}`)
            .join("; "),
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Feedbacks");
      XLSX.writeFile(workbook, "feedbacks.xlsx");
    } else if (exportFormat === "csv") {
      const csvContent = filteredFeedbacks.map((feedback) => ({
        ID: feedback.id,
        Email: feedback.email,
        CreatedAt: feedback.createdAt,
        Answers: feedback.answers
          .map((ans) => `${ans.questionTitle}: ${ans.answer}`)
          .join("; "),
      }));
      const worksheet = XLSX.utils.json_to_sheet(csvContent);
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "feedbacks.csv";
      a.click();
    } else if (exportFormat === "json") {
      const jsonData = JSON.stringify(filteredFeedbacks, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "feedbacks.json";
      a.click();
    }

    setIsModalOpen(false);
    setExportFormat("");
  };
  console.log("selected feedback is:", selectedFeedback);
  return (
    <Page
      title="Manage User Dashboard"
      backAction={{ content: "Back", url: "/app/" }}
      primaryAction={{
        content: "Export",
        icon: ExportIcon,
        disabled: filteredFeedbacks.length === 0,
        onAction: () => setIsModalOpen(true),
      }}
    >
      <Card>
        <BlockStack gap={400}>
          <InlineStack alignment="center" gap={400}>
            <Box width="73%">
              <TextField
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by Email"
                autoComplete="off"
              />
            </Box>
            <Box width="25%">
              <Select
                options={[
                  { label: "Email Ascending", value: "email-asc" },
                  { label: "Email Descending", value: "email-desc" },
                  { label: "Date Ascending", value: "date-asc" },
                  { label: "Date Descending", value: "date-desc" }
                ]}
                labelInline
                placeholder="Sort By"
                onChange={handleSortChange}
                value={`${sortField}-${sortOrder}`}
              />

            </Box>
          </InlineStack>
          <IndexTable
            resourceName={{ singular: "feedback", plural: "feedbacks" }}
            itemCount={filteredFeedbacks.length}
            headings={[
              { title: "Sr No" },
              { title: "Email" },
              { title: "Date" },
              { title: "Time (GMT+5:30)" },
              { title: "Action" },
            ]}
            selectable={false}
          >
            {filteredFeedbacks.map(({ sr, id, email, date, time, answers }, index) => (
              <IndexTable.Row id={id} key={id} position={index}>
                <IndexTable.Cell>
                  <Text variation="strong">{sr}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{email}</IndexTable.Cell>
                <IndexTable.Cell>{date}</IndexTable.Cell>
                <IndexTable.Cell>{time}</IndexTable.Cell>
                <IndexTable.Cell>
                  <Button onClick={() => setSelectedFeedback(feedbacks[index])} variant="primary">
                    Details
                  </Button>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </BlockStack>
      </Card>
      {selectedFeedback && (
        <Modal
          open={!!selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          title="Feedback Details"
        >
          <Modal.Section>
            {selectedFeedback && (
              <BlockStack gap={400}>
                {JSON.parse(selectedFeedback.answers).map((ans, idx) => {
                  // Find the matching question in surveyData
                  const matchedQuestion = surveyData[0]?.questions.find(q => q.text === ans.questionTitle);

                  return (
                    <Box padding={300} key={idx} border="base" background="bg-surface-secondary">
                      <Text as="p" variant="headingSm">Q{idx + 1}: {ans.questionTitle}</Text>

                      {/* If the answer is multiple-choice, show it as a list */}
                      {matchedQuestion?.isMultiChoice && ans.answer.includes(",") ? (
                        <>
                          <Text as="p" color="subdued">
                            <strong>A: </strong> Multiple Choice Answers:
                          </Text>
                          <Box paddingInlineStart={400}>
                            {ans.answer.split(",").map((item, index) => (
                              <Text as="p" color="subdued">✅ {item.trim().startsWith("other(") ? (
                                <>
                                 {item.trim().startsWith("other(") ? item.trim().replace(/^other\((.*?)\)$/, "$1") : item.trim()} <Badge tone="info">Other</Badge>
                                </>
                              ) : (
                                item.trim()
                              )}</Text>
                            ))}
                          </Box>
                        </>
                      ) : (
                        <Text as="p" color="subdued">
                          <strong>A: </strong>
                          {ans.answer.startsWith("other(") ? (
                            <>
                             {ans.answer.startsWith("other(") ? ans.answer.replace(/^other\((.*?)\)$/, "$1") : ans.answer} <Badge tone="info">Other</Badge>
                            </>
                          ) : (
                            ans.answer
                          )}
                        </Text>
                      )}
                    </Box>
                  );
                })}
              </BlockStack>
            )}
          </Modal.Section>
        </Modal>
      )}


      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Export Feedbacks"
          primaryAction={{
            content: "Export",
            onAction: handleExport,
            disabled: !exportFormat,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setIsModalOpen(false),
            },
          ]}
        >
          <Modal.Section>
            <Select
              label="Select Export Format"
              options={[
                { label: "Excel", value: "excel" },
                { label: "CSV", value: "csv" },
                { label: "JSON", value: "json" },
              ]}
              value={exportFormat}
              onChange={(value) => setExportFormat(value)}
            />
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}