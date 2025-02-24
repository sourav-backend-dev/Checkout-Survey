import React, { useCallback, useState } from 'react';
import { Box, Button, ButtonGroup, Card, InlineStack, Page } from '@shopify/polaris';
import SurveyChart from './component/SurveyBarChart';
import { json, useLoaderData } from '@remix-run/react';
import { PrismaClient } from '@prisma/client';
import SurveyLineChart from './component/SurveyLineChart';
import SurveyBarChart from './component/SurveyBarChart';
import SurveyPaiChart from './component/SurveyPaiChart';
import {
    ChartDonutIcon,
    ChartLineIcon,
    ChartVerticalIcon
  } from '@shopify/polaris-icons';
import { authenticate } from '../shopify.server';

const prisma = new PrismaClient();


export const loader = async ({ request }) => {
  const {session} = await authenticate.admin(request);
  const shopDomain = session.shop;
  const feedbacks = await prisma.apiProxyData.findMany({
    where: {
      shopDomain: shopDomain
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
    const formattedData = formatSurveyData(feedbacks, surveyData);
    const [activeButtonIndex, setActiveButtonIndex] = useState('bar');
    const handleButtonClick = useCallback(
        (index) => {
            if (activeButtonIndex === index) return;
            setActiveButtonIndex(index);
        },
        [activeButtonIndex],
    );


    return (
        <Page>
            <Card padding={0}>
                <InlineStack align='center'>
                    <ButtonGroup variant="segmented" connectedTop>
                        <Button
                            pressed={activeButtonIndex === 'bar'}
                            onClick={() => handleButtonClick('bar')}
                            size='large'
                            icon={ChartVerticalIcon}
                        >
                            Bar Chart
                        </Button>
                        <Button
                            pressed={activeButtonIndex === 'line'}
                            onClick={() => handleButtonClick('line')}
                            size='large'
                            icon={ChartLineIcon}
                        >
                            Line Chart
                        </Button>
                        <Button
                            pressed={activeButtonIndex === 'pai'}
                            onClick={() => handleButtonClick('pai')}
                            size='large'
                            icon={ChartDonutIcon}
                        >
                            Pai Chart
                        </Button>
                    </ButtonGroup>
                </InlineStack>
                <Box padding={300}>
                    {activeButtonIndex == 'bar' &&
                        <SurveyBarChart surveyData={formattedData} />
                    }
                    {activeButtonIndex == 'line' &&
                        <SurveyLineChart surveyData={formattedData} />
                    }
                    {activeButtonIndex == 'pai' &&
                        <SurveyPaiChart surveyData={formattedData} />
                    }
                </Box>
            </Card>
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
                const answer = answers.find(a => a.questionNumber === question.id)?.answer;

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
            totalUsers // Add totalUsers to the formatted data
        };
    });

    return formattedData;
};

export default TestCharts;
