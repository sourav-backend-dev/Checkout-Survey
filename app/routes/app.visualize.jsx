import React, { useCallback, useState } from 'react';
import { Box, Button, ButtonGroup, Card, InlineStack, Page, Text, Icon, Tooltip, DatePicker, Modal, BlockStack } from '@shopify/polaris';
import SurveyChart from './component/SurveyBarChart';
import { json, useLoaderData } from '@remix-run/react';
import { PrismaClient } from '@prisma/client';
import SurveyLineChart from './component/SurveyLineChart';
import SurveyBarChart from './component/SurveyBarChart';
import SurveyPaiChart from './component/SurveyPaiChart';
import {
    ChartDonutIcon,
    ChartLineIcon,
    ChartVerticalIcon,
    ReplaceIcon,
    ToggleOffIcon,
    ToggleOnIcon
} from '@shopify/polaris-icons';
import { authenticate } from '../shopify.server';

const prisma = new PrismaClient();

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    const { session } = await authenticate.admin(request);
    // const shopDomain = session.shop;
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
        `#graphql
    query {
    shop{
      url
    }
  }`,
    );

    const data = await response.json();
    const url = data.data.shop.url
    const shopDomain = url.split("https://")[1];
    console.log(shopDomain, "Domain")
    const feedbacks = await prisma.apiProxyData.findMany({
        where: {
            OR: [
                { shopDomain: shopDomain },  // Look for the domain without '/en'
                { shopDomain: `${shopDomain}/en` },  // Look for the domain with '/en'
                { shopDomain: `${shopDomain}/fr` }  // Look for the domain with '/fr'
            ]
        }
    });
    const surveyData = await prisma.survey.findMany({
        include: {
            questions: true,
        },
    });

    return json({ feedbacks, surveyData });
};

const TestCharts = () => {
    const { feedbacks, surveyData } = useLoaderData();
    console.log(feedbacks, "feedbacks");
    console.log(surveyData, "survey data");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeButtonIndex, setActiveButtonIndex] = useState('bar');
    const [language, setLanguage] = useState('en');  // Language state
    const [{ month, year }, setDate] = useState({ month: 1, year: 2025 }); // Set initial date to January 2025
    const [selectedDates, setSelectedDates] = useState({
        start: new Date('Wed Jan 01 2025 00:00:00 GMT-0500 (EST)'), // Set initial start date to January 1, 2025
        end: new Date(),   // Set initial end date
    });

    // State to store the initial feedback data (unfiltered)
    const [initialFeedbacks] = useState(feedbacks);

    // State to store filtered feedback data
    const [filteredData, setFilteredData] = useState(formatSurveyData(feedbacks, surveyData, selectedDates));

    const formatDate = (date) => {
        return date.toLocaleDateString(); // You can format it more specifically if needed
    };

    const handleButtonClick = useCallback(
        (index) => {
            if (activeButtonIndex === index) return;
            setActiveButtonIndex(index);
        },
        [activeButtonIndex]
    );

    const toggleLanguage = () => {
        setLanguage((prevLanguage) => (prevLanguage === 'en' ? 'fr' : 'en'));
    };

    const handleMonthChange = useCallback((month, year) => setDate({ month, year }), []);

    const handleDateChange = (dates) => {
        setSelectedDates(dates);
    
        // Normalize the dates by setting the time to midnight to ignore the time part of the Date object
        const normalizedStartDate = new Date(dates.start.setHours(0, 0, 0, 0));
        const normalizedEndDate = new Date(dates.end.setHours(0, 0, 0, 0));
    
        // Check if the selected start and end dates are the same (ignoring time)
        const isSameDate = normalizedStartDate.getTime() === normalizedEndDate.getTime();
    
        // If the start and end date are the same, filter feedbacks for that specific date
        const filteredFeedbacks = isSameDate
            ? feedbacks.filter(feedback => {
                const feedbackDate = new Date(feedback.createdAt).setHours(0, 0, 0, 0); // Normalize feedback's createdAt date
                if(feedbackDate === normalizedStartDate.getTime()){
                    console.log(feedbackDate, normalizedStartDate.getTime(), "is same");
                }
                return feedbackDate === normalizedStartDate.getTime();
            })
            : feedbacks.filter(feedback => {
                const feedbackDate = new Date(feedback.createdAt).setHours(0, 0, 0, 0);  // Normalize feedback's createdAt date
                const startDate = new Date(dates.start).setHours(0, 0, 0, 0);  // Normalize start date
                const endDate = new Date(dates.end).setHours(0, 0, 0, 0);  // Normalize end date
                return feedbackDate >= startDate && feedbackDate <= endDate;
            });
    
        console.log(filteredFeedbacks, "filteredFeedbacks");  // Make sure filteredFeedbacks contains the correct data
    
        // Update the filtered data with the filtered feedbacks
        const newFilteredData = formatSurveyData(filteredFeedbacks, surveyData, dates);
        console.log(newFilteredData, "newFilteredData");  // Check if data is properly formatted
    
        setFilteredData(newFilteredData);  // Update the filtered data state
    };
    


    // Reset the filter on cancel
    const handleCancel = () => {
        setIsModalOpen(false);
        setSelectedDates({
            start: new Date('Wed Jan 01 2025 00:00:00 GMT-0500 (EST)'), // Reset to initial date
            end: new Date(),   // Reset end date to current date
        });
        setFilteredData(formatSurveyData(initialFeedbacks, surveyData, { start: new Date('Wed Jan 01 2025 00:00:00 GMT-0500 (EST)'), end: new Date() })); // Restore the unfiltered data
    };

    return (
        <Page
            title="Visualization"
            backAction={{ content: "Back", url: "/app/" }}
            primaryAction={<Button variant={language === 'en' ? 'secondary' : 'primary'} icon={language === 'en' ? ToggleOffIcon : ToggleOnIcon} onClick={toggleLanguage}>{language === 'en' ? 'English' : 'French'}</Button>}
            secondaryActions={<Button variant='primary' onClick={() => setIsModalOpen(true)}>Filter by Date</Button>}
            >
            <Card padding={0}>
                <InlineStack align='center' blockAlign="center">
                    <ButtonGroup variant="segmented" connectedTop>
                        <Button
                            pressed={activeButtonIndex === 'bar'}
                            onClick={() => handleButtonClick('bar')}
                            size='large'
                            icon={ChartVerticalIcon}
                        >
                            {language === 'en' ? 'Bar Chart' : 'Graphique à barres'}
                        </Button>
                        <Button
                            pressed={activeButtonIndex === 'line'}
                            onClick={() => handleButtonClick('line')}
                            size='large'
                            icon={ChartLineIcon}
                        >
                            {language === 'en' ? 'Line Chart' : 'Graphique linéaire'}
                        </Button>
                        <Button
                            pressed={activeButtonIndex === 'pai'}
                            onClick={() => handleButtonClick('pai')}
                            size='large'
                            icon={ChartDonutIcon}
                        >
                            {language === 'en' ? 'Pai Chart' : 'Graphique circulaire'}
                        </Button>
                    </ButtonGroup>
                </InlineStack>

                <Box padding={300}>
                    {activeButtonIndex === 'bar' && (
                        <SurveyBarChart surveyData={filteredData} language={language} />
                    )}
                    {activeButtonIndex === 'line' && (
                        <SurveyLineChart surveyData={filteredData} language={language} />
                    )}
                    {activeButtonIndex === 'pai' && (
                        <SurveyPaiChart surveyData={filteredData} language={language} />
                    )}
                </Box>
            </Card>

            {isModalOpen && (
                <Modal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={`Selected Date Range: ${formatDate(selectedDates.start)} - ${formatDate(selectedDates.end)}`}
                    primaryAction={{
                        content: "Apply",
                        onAction: () => {setIsModalOpen(false) },
                    }}
                    secondaryActions={[{
                        content: "Clear Filter",
                        onAction: handleCancel,  // Cancel action to reset filter
                        destructive: true,
                    }]}
                    >
                    <Modal.Section>
                        <Card>
                            <BlockStack gap={400}>
                                <InlineStack alignment="center" gap={400}>
                                    <DatePicker
                                        month={month}
                                        year={year}
                                        onChange={handleDateChange}
                                        onMonthChange={handleMonthChange}
                                        selected={selectedDates}
                                        allowRange
                                    />
                                </InlineStack>
                            </BlockStack>
                        </Card>
                    </Modal.Section>
                </Modal>
            )}
        </Page>
    );
};



const formatSurveyData = (feedbacks, surveyData) => {
    const totalUsers = feedbacks.length; // Calculate total users who submitted responses
    
    const formattedData = surveyData.map(survey => {
        const questionsWithAnswers = survey.questions.map(question => {
            const answersCount = {};
            feedbacks.forEach(feedback => {
                const answers = JSON.parse(feedback.answers);
                const answer = answers.find(a => a.questionTitle === question.text)?.answer;
                if (answer) {
                    if (question.isMultiChoice) {
                        answer.split(',').forEach(a => {
                            answersCount[a] = (answersCount[a] || 0) + 1;
                        });
                    } else {
                        answersCount[answer] = (answersCount[answer] || 0) + 1;
                    }
                }
            });

            return {
                ...question,
                answersCount: Object.entries(answersCount).map(([answer, count]) => ({ answer, count }))
            };
        });

        return {
            ...survey,
            questions: questionsWithAnswers,
            totalUsers: feedbacks.length // Add total filtered users to the formatted data
        };
    });

    return formattedData;
};



export default TestCharts;
