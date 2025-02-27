import React, { useCallback, useState } from 'react';
import { Box, Button, ButtonGroup, Card, InlineStack, Page, Text, Icon, Tooltip } from '@shopify/polaris';
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
    const shopDomain = session.shop;
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

    const formattedData = formatSurveyData(feedbacks, surveyData);

    const [activeButtonIndex, setActiveButtonIndex] = useState('bar');
    const [language, setLanguage] = useState('en');  // Language state

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

    return (
        <Page
            title="Visualization"
            backAction={{ content: "Back", url: "/app/" }}
            primaryAction={<Button variant={language === 'en' ? 'secondary' : 'primary'} icon={language === 'en' ? ToggleOffIcon : ToggleOnIcon} onClick={toggleLanguage}>{language === 'en' ? 'English' : 'French'}</Button>}
            // primaryAction={{
            //     content: (
            //         <Button variant={language === 'en' ? 'primary' : 'secondary'}>ENGLISH</Button>
            //         // <Button variant={language === 'en' ? 'primary' : 'secondary' }>
            //         // <InlineStack gap={200}>
            //         //     <Icon
            //         //         source={language === 'en' ? ToggleOffIcon : ToggleOnIcon}
            //         //         tone={language === 'en' ? 'success' : 'secondary'}
            //         //     />
            //         //     <Text>{language === 'en' ? "English" : "French"}</Text> 
            //         // </InlineStack>
            //         // </Button>
            //     ),
            //     onAction: toggleLanguage,
            //     primary: language === 'en' ? false : true,
            // }}
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
                        <SurveyBarChart surveyData={formattedData} language={language} />
                    )}
                    {activeButtonIndex === 'line' && (
                        <SurveyLineChart surveyData={formattedData} language={language} />
                    )}
                    {activeButtonIndex === 'pai' && (
                        <SurveyPaiChart surveyData={formattedData} language={language} />
                    )}
                </Box>
            </Card>
        </Page>
    );
};

const formatSurveyData = (feedbacks, surveyData) => {
    const totalUsers = feedbacks.length; // Calculate total users who submitted responses
    console.log("Feedback", feedbacks)
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
            totalUsers // Add totalUsers to the formatted data
        };
    });

    return formattedData;
};

export default TestCharts;
