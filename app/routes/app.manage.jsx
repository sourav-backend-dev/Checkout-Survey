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

  // Iterate through each feedback
  for (const feedback of feedbacks) {
    const answers = JSON.parse(feedback.answers); // Parse the serialized answers string

    // Iterate through each answer and fetch the corresponding answer texts by ID
    for (const answer of answers) {
      let answerIds = [];

      // Check if the answer is an array (multi-choice) or a single answer
      if (Array.isArray(answer.answer)) {
        answerIds = answer.answer.map((id) => parseInt(id, 10)); // Convert each ID to an integer
      } else if (answer.answer) {
        answerIds = [parseInt(answer.answer, 10)]; // Convert to an array with a single integer
      }

      // Fetch the actual answer texts using the answer IDs
      if (answerIds.length > 0) {
        const answerTexts = await prisma.answer.findMany({
          where: {
            id: {
              in: answerIds, // Fetch answers by their IDs
            },
          },
        });

        // Replace the answer IDs with the actual answer texts
        answer.answer = answerTexts.map((answerText) => answerText.text);
      }
    }

    // Update the feedback's answers with the actual answer texts
    feedback.answers = answers;
  }

  return json({ feedbacks });
};


export default function AdditionalPage() {
  const data = useLoaderData();
  console.log(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("");

  const initialFeedbacks = data.feedbacks.map((feedback) => ({
    id: feedback.id.toString(),
    email: feedback.email,
    createdAt: new Date(feedback.createdAt).toLocaleString(),
    answers: feedback.answers.map((answerObj) => ({
      questionTitle: answerObj.questionTitle,
      answer: Array.isArray(answerObj.answer)
        ? answerObj.answer.join(", ")  // For multi-choice answers, join with commas
        : answerObj.answer,  // For single-choice answers, just return the answer
    })),
  }));


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

    result = result.sort((a, b) => {
      if (sortField === "email") {
        return sortOrder === "asc"
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      } else if (sortField === "createdAt") {
        return sortOrder === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
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
                  { label: "Ascending", value: "email-asc" },
                  { label: "Descending", value: "email-desc" },
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
              { title: "ID" },
              { title: "Email" },
              { title: "Answers" },
            ]}
            selectable={false}
          >
            {filteredFeedbacks.map(({ id, email, createdAt, answers }, index) => (
              <IndexTable.Row id={id} key={id} position={index}>
                <IndexTable.Cell>
                  <Text variation="strong">{id}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{email}</IndexTable.Cell>
                <IndexTable.Cell>
                  {answers.map((answerObj, idx) => (
                    <div key={idx}>
                      <strong>{answerObj.questionTitle}:</strong>
                      {Array.isArray(answerObj.answer)
                        ? answerObj.answer.join(', ') 
                        : answerObj.answer} 
                    </div>
                  ))}
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </BlockStack>
      </Card>
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
