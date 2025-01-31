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
import { useCallback, useLayoutEffect, useState } from 'react';

const orderDetailsBlock = reactExtension(
  "purchase.thank-you.block.render",
  () => <ProductReview />
);
export { orderDetailsBlock };

function ProductReview() {
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productReview, setProductReview] = useState('');
  const [answers, setAnswers] = useState([]); // Array to store answers
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const api = useApi();
  const { survey_title } = useSettings();  // Get the survey title from settings
  console.log("survey title is ", survey_title);  // Log survey title
  const userEmail = api.buyerIdentity.email.current;

  const [{ data: productReviewed, loading: productReviewedLoading }] = useStorageState('product-reviewed');

  // Fetch quiz data
  const fetchQuizData = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://racks-preserve-legacy-tray.trycloudflare.com/app/questions', {
        method: 'GET',  // Set the method to POST
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log("DATA ", data);
      if (response.ok) {
        // Filter the quiz data based on survey title from settings
        const quiz = data.surveys.find(survey => survey.title === survey_title);
        if (quiz) {
          setQuizData(quiz);  // Set the quiz data only for the matching title
        } else {
          console.error(`No quiz found for the survey title: ${survey_title}`);
        }
      } else {
        console.error("Error fetching quiz data:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch quiz data:", error);
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    fetchQuizData();
  }, [survey_title]);  // Re-run the fetch if survey_title changes

  // Handle quiz submission
  async function handleSubmit() {
    setLoading(true);
    try {
      const response = await fetch('https://racks-preserve-legacy-tray.trycloudflare.com/app/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail, answers }), // Send email along with answers
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const result = await response.json();
      console.log('Server response:', result);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setLoading(false);
    }
  }

  if (productReviewed || productReviewedLoading) {
    return null; // Don't show survey if product is already reviewed
  }

  const currentQuestion = quizData ? quizData.questions[currentQuestionIndex] : null;

  // Handle choice change for questions
  const handleChoiceChange = (selectedValue) => {
    console.log('Selected value:', selectedValue); // Log selected choice ID
    const selectedOption = currentQuestion.answers.find(option => option.id === parseInt(selectedValue));
    if (selectedOption) {
      setProductReview(selectedValue); // Update the selected value in state

      // Use a functional update for answers to avoid stale state
      setAnswers((prevAnswers) => {
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[currentQuestionIndex] = {
          questionTitle: currentQuestion.text,
          questionNumber: currentQuestionIndex + 1,
          answer: selectedOption.text,
        };
        console.log('Updated answers:', updatedAnswers); // Log updated answers
        return updatedAnswers;
      });
    }
  };

  // Handle multi-choice change for questions
  const handleMultiChoiceChange = (selectedValues) => {
    console.log('Selected values:', selectedValues); // Log selected choice IDs
    const selectedOptions = currentQuestion.answers.filter(option => selectedValues.includes(option.id.toString()));
    if (selectedOptions.length > 0) {
      setProductReview(selectedValues.join(',')); // Update the selected values in state as a comma-separated string

      // Use a functional update for answers to avoid stale state
      setAnswers((prevAnswers) => {
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[currentQuestionIndex] = {
          questionTitle: currentQuestion.text,
          questionNumber: currentQuestionIndex + 1,
          answer: selectedOptions.map(option => option.text).join(','), // Join answers with commas
        };
        console.log('Updated answers:', updatedAnswers); // Log updated answers
        return updatedAnswers;
      });
    }
  };

  console.log(answers);

  // Handle Next Question navigation
  const handleNext = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Handle Previous Question navigation
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <Survey
      title="Survey"
      description="We would like to learn if you are enjoying your purchase."
      onSubmit={handleSubmit}
      loading={loading}
    >
      {currentQuestion ? (
        <>
          <ChoiceList
            name={`quiz-response-${currentQuestionIndex}`}
            value={currentQuestion.isMultiChoice ? productReview.split(',') : productReview}
            onChange={(selectedValue) => {
              if (currentQuestion.isMultiChoice) {
                handleMultiChoiceChange(selectedValue);
              } else {
                setProductReview(selectedValue); // Ensure productReview is updated
                handleChoiceChange(selectedValue); // Update answers array
              }
            }}
          >
            <BlockStack>
              <Text>{currentQuestion.text}</Text>
              {currentQuestion.answers.map((option, optIndex) => (
                <Choice key={optIndex} id={option.id.toString()}>
                  {option.text}
                </Choice>
              ))}
            </BlockStack>
          </ChoiceList>

          <BlockStack>
            <Button kind="secondary" onPress={handlePrevious} disabled={currentQuestionIndex === 0}>
              Previous
            </Button>
            <Button kind="primary" onPress={handleNext} disabled={currentQuestionIndex === quizData.questions.length - 1}>
              Next
            </Button>
          </BlockStack>
        </>
      ) : (
        <Text>Loading quiz...</Text>
      )}
    </Survey>
  );
}

// Survey component for wrapping the quiz UI
function Survey({ title, description, onSubmit, children, loading }) {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    await onSubmit();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View border="base" padding="base" borderRadius="base">
        <BlockStack>
          <Heading>Thanks for your feedback!</Heading>
          <Text>Your response has been submitted</Text>
        </BlockStack>
      </View>
    );
  }

  return (
    <View border="base" padding="base" borderRadius="base">
      <BlockStack>
        <Heading>{title}</Heading>
        <Text>{description}</Text>
        {children}
        <Button kind="secondary" onPress={handleSubmit} loading={loading}>
          Submit feedback
        </Button>
      </BlockStack>
    </View>
  );
}

function useStorageState(key) {
  const storage = useStorage();
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    async function queryStorage() {
      const value = await storage.read(key);
      setData(value);
      setLoading(false);
    }

    queryStorage();
  }, [setData, setLoading, storage, key]);

  const setStorage = useCallback(
    (value) => {
      storage.write(key, value);
    },
    [storage, key]
  );

  return [{ data, loading }, setStorage];
}