import React, { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { BlockStack, InlineStack, Pagination, Text } from "@shopify/polaris";

const SurveyBarChart = ({ surveyData }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const questionsPerPage = 1;

    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    const filteredSurveyData = {
        ...surveyData[0],
        questions: surveyData[0].questions.filter((question) => !question.isTextBox),
    };
    const currentQuestions = filteredSurveyData.questions.slice(
        indexOfFirstQuestion,
        indexOfLastQuestion
    );

    const handlePagination = (page) => {
        setCurrentPage(page);
    };

    return (
        <div>
            {currentQuestions.map((question, index) => {
                // Total users who took the survey
                const totalUsers = surveyData[0].totalUsers;

                let chartData;
                if (question.isConditional) {
                    // Get "Yes" count
                    const yesAnswer = question.answersCount.find(
                        (ans) => ans.answer.toLowerCase() === "yes"
                    );
                    const yesCount = yesAnswer ? yesAnswer.count : 0;
                    const noCount = totalUsers - yesCount;

                    // Construct conditional data
                    chartData = [
                        { answer: "Yes", count: yesCount },
                        { answer: "No", count: noCount },
                    ];
                } else {
                    // Filter out answers that start with "Other"
                    chartData = question.answersCount.filter(
                        (ans) => !ans.answer.toLowerCase().startsWith("other")
                    );
                }

                return (
                    <BlockStack gap={300}>
                        <Text variant="headingLg" as="h5">Q{currentPage}: {question.text}</Text>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="answer" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </BlockStack>
                );
            })}
            <InlineStack align="center">
                <Pagination
                    hasPrevious={currentPage > 1}
                    label={currentPage+' / '+filteredSurveyData.questions.length}
                    onPrevious={() => handlePagination(currentPage - 1)}
                    hasNext={
                        currentPage < Math.ceil(filteredSurveyData.questions.length / questionsPerPage)
                    }
                    onNext={() => handlePagination(currentPage + 1)}
                />
            </InlineStack>
        </div>
    );
};

export default SurveyBarChart;
