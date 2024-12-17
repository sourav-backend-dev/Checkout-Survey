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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json, useLoaderData } from "@remix-run/react";
import { useState, useMemo } from "react";

// Loader to fetch data
export const loader = async () => {
  const feedbacks = await prisma.ApiProxyData.findMany();
  return json({ feedbacks });
};

export default function AdditionalPage() {
  const data = useLoaderData();

  // Parse the initial feedbacks
  const initialFeedbacks = data.feedbacks.map((feedback) => ({
    id: feedback.id.toString(),
    email: feedback.email,
    createdAt: new Date(feedback.createdAt).toLocaleString(),
    answers: JSON.parse(feedback.answers),
  }));

  // State for search and sort
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("asc");

  // Search handler
  const handleSearchChange = (value) => setSearchTerm(value);

  // Sort handler
  const handleSortChange = (value) => {
    const [field, order] = value.split("-");
    setSortField(field);
    setSortOrder(order);
  };

  // Filtered and Sorted Feedbacks
  const filteredFeedbacks = useMemo(() => {
    let result = initialFeedbacks;

    // Search filter
    if (searchTerm) {
      result = result.filter((feedback) =>
        feedback.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
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

  return (
    <Page>
      <TitleBar title="Manage User Dashboard" />
      <Card>
        {/* Search and Sort Filters */}
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

          {/* Index Table */}
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
                  {answers.map((ans, idx) => (
                    <div key={idx}>
                      <strong>{ans.questionTitle}:</strong> {ans.answer}
                    </div>
                  ))}
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </BlockStack>
      </Card>
    </Page>
  );
}
