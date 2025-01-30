import {
  reactExtension,
  BlockStack,
  View,
  Heading,
  Text,
  ChoiceList,
  Choice,
  Button,
  useStorage,
  useApi,
  useExtension,
  useSettings,
} from '@shopify/ui-extensions-react/checkout';
import { useCallback, useEffect, useState } from 'react';

const orderDetailsBlock = reactExtension(
  "purchase.thank-you.block.render",
  () => <ProductReview />
);
export { orderDetailsBlock };

function ProductReview() {
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showNextQuestions, setShowNextQuestions] = useState(true);
  const api = useApi();
  const { survey_title } = useSettings();
  const userEmail = api.buyerIdentity.email.current;

  useEffect(() => {
    async function fetchQuizData() {
      setLoading(true);
      try {
        const response = await fetch('https://price-projection-mali-riding.trycloudflare.com/app/questions');
        const data = await response.json();
        const quiz = data.surveys.find(survey => survey.title === survey_title);
        if (quiz) setQuizData(quiz);
      } catch (error) {
        console.error("Failed to fetch quiz data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuizData();
  }, [survey_title]);

  async function handleSubmit() {
    setLoading(true);
    try {
      await fetch('https://price-projection-mali-riding.trycloudflare.com/app/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, answers }),
      });
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!quizData || loading) return <Text>Loading quiz...</Text>;
  const currentQuestion = quizData.questions[currentQuestionIndex];

  const handleChoiceChange = (selectedValue) => {
    const isMultiChoice = currentQuestion.isMultiChoice;
    const isConditional = currentQuestion.isConditional;

    if (isConditional) {
      setShowNextQuestions(selectedValue.includes("yes"));
    }

    setAnswers(prevAnswers => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[currentQuestionIndex] = {
        questionTitle: currentQuestion.text,
        questionNumber: currentQuestionIndex + 1,
        answer: isMultiChoice ? selectedValue : selectedValue[0],
      };
      return updatedAnswers;
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (currentQuestion.isConditional && !showNextQuestions) {
    return (
      <View>
        <Heading>Survey Completed</Heading>
        <Text>Thank you for your response!</Text>
      </View>
    );
  }

  return (
    <Survey title="Survey" description="We would like to learn if you are enjoying your purchase." onSubmit={handleSubmit} loading={loading}>
      <ChoiceList
        name={`quiz-response-${currentQuestionIndex}`}
        value={answers[currentQuestionIndex]?.answer || []}
        onChange={handleChoiceChange}
        allowMultiple={currentQuestion.isMultiChoice}>
        <BlockStack>
          <Text>{currentQuestion.text}</Text>
          {currentQuestion.isConditional ? (
            <>
              <Choice id="yes">Yes</Choice>
              <Choice id="no">No</Choice>
            </>
          ) : (
            currentQuestion.answers.map(option => (
              <Choice key={option.id} id={option.id.toString()}>{option.text}</Choice>
            ))
          )}
        </BlockStack>
      </ChoiceList>

      <BlockStack>
        <Button kind="secondary" onPress={handlePrevious} disabled={currentQuestionIndex === 0}>Previous</Button>
        <Button kind="primary" onPress={handleNext} disabled={currentQuestionIndex === quizData.questions.length - 1}>Next</Button>
      </BlockStack>
    </Survey>
  );
}

function Survey({ title, description, onSubmit, children, loading }) {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    await onSubmit();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View>
        <Heading>Thanks for your feedback!</Heading>
        <Text>Your response has been submitted</Text>
      </View>
    );
  }

  return (
    <View>
      <BlockStack>
        <Heading>{title}</Heading>
        <Text>{description}</Text>
        {children}
        <Button kind="secondary" onPress={handleSubmit} loading={loading}>Submit feedback</Button>
      </BlockStack>
    </View>
  );
}
