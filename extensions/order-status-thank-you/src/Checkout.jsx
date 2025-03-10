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
  useSettings,
  TextField,
  SkeletonTextBlock,
  InlineStack,
} from '@shopify/ui-extensions-react/checkout';
import { SkeletonText } from '@shopify/ui-extensions/checkout';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const orderDetailsBlock = reactExtension(
  "purchase.thank-you.block.render",
  () => <ProductReview />
);
export { orderDetailsBlock };

function ProductReview() {
  const api = useApi();
  const id = api.orderConfirmation.current.order.id;
  const orderId = id.match(/\d+/g).pop();
  // const [isFrench, setIsFrench] = useState(false);
  // useEffect(() => {
  //   if (api?.localization?.language?.current?.isoCode.slice(0, 2) === 'fr') {
  //     setIsFrench(true);
  //   }
  // }, [api]);
  
  // // Fetch quiz data after isFrench is updated
  // useEffect(() => {
  //   if (isFrench !== null) {
  //     fetchQuizData();
  //   }
  // }, [isFrench]);
  // console.log("api======",isFrench);

  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productReview, setProductReview] = useState('');
  const [answers, setAnswers] = useState([]); // Array to store answers
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shouldProceed, setShouldProceed] = useState(true); // State to track if we should proceed
  const { survey_title } = useSettings();  // Get the survey title from settings
   console.log("survey title is ", survey_title);  // Log survey title
  const userEmail = api.buyerIdentity.email.current;
  const [textInput, setTextInput] = useState(''); // State to store text input
  const [submitted, setSubmitted] = useState(false);
  const shopDomain = api.shop.storefrontUrl;
  const [{ data: productReviewed, loading: productReviewedLoading }] = useStorageState('product-reviewed');

  const fetchQuizData = async () => {
    setLoading(true);
    nextSubmit([]);
    try {
      const response = await fetch('https://ve-republicans-behind-powerful.trycloudflare.com/app/questions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      const data = await response.json();
      if (response.ok) {
        let quiz;
        let isFrench=false;
        console.log("cuntry code is :",api?.localization?.language?.current?.isoCode);
        if (api?.localization?.language?.current?.isoCode.slice(0, 2) === 'fr') {
          isFrench = true;
        }
  
        if (isFrench) {
          // Find the French survey
          const frenchSurvey = data.surveys.find(survey => survey.isFrenchVersion === true);
          
          if (frenchSurvey) {
            if (frenchSurvey.surveyId) {
              // Find the survey that matches the French survey's `surveyId`
              quiz = data.surveys.find(survey => survey.id === frenchSurvey.surveyId);
            } else {
              quiz = frenchSurvey; // Use the French survey if no `surveyId` exists
            }
          }
        } else {
          // Find the survey that matches `survey_title`
          console.log(survey_title)
          quiz = data.surveys.find(survey => survey.title === survey_title);
        }
  
        if (quiz) {
          setQuizData(quiz); // Set the quiz data
        } else {
          console.error(`No quiz found for the given title or language preference.`);
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
    console.log('called layout')
  }, [survey_title]);


  async function handleSubmit(updateAnswers = answers) {
    // console.log("=======", updateAnswers);
    setLoading(true);
    try {
      const response = await fetch('https://ve-republicans-behind-powerful.trycloudflare.com/app/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shopDomain: shopDomain.replace(/^https?:\/\//, ""), email: userEmail, surveyTitle: survey_title, orderId: orderId, answers: updateAnswers }), // Send email along with answers
      });

      if (!response.ok) {
        console.log('Error')
        throw new Error('Failed to submit review');
      }

      const result = await response.json();
      console.log('Server response:', result);
      setShouldProceed(false);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setLoading(false);
    }
  }


  async function nextSubmit(updateAnswers = updateAnswers) {
     console.log("=======", updateAnswers);
     setLoading(true);
    try {
      const response = await fetch('https://ve-republicans-behind-powerful.trycloudflare.com/app/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shopDomain: shopDomain.replace(/^https?:\/\//, ""), email: userEmail, surveyTitle: survey_title, orderId: orderId, answers: updateAnswers }), // Send email along with answers
      });

      if (!response.ok) {
        console.log('Error')
        throw new Error('Failed to submit review');
      }

      const result = await response.json();
      console.log('Server response:', result);
      //setShouldProceed(false);
      //setSubmitted(true);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setLoading(false);
    }
  }

  if (productReviewed || productReviewedLoading) {
    return null;
  }

  const currentQuestion = quizData ? quizData.questions[currentQuestionIndex] : null;


  const handleChoiceChange = (selectedValue) => {
    // console.log('Selected value:', selectedValue); // Log selected choice ID
    const selectedOption = currentQuestion.answers.find(option => option.id === parseInt(selectedValue));
    if (selectedOption) {
      setProductReview(selectedValue); // Update the selected value in state

      setAnswers((prevAnswers) => {
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[currentQuestionIndex] = {
          questionTitle: currentQuestion.text,
          questionNumber: currentQuestionIndex + 1,
          answer: selectedOption.text,
        };

        if (currentQuestion.isConditional && selectedOption.text.toLowerCase() === 'no' || currentQuestion.isConditional && selectedOption.text.toLowerCase() === 'non') {
          setShouldProceed(false);
          handleSubmit(updatedAnswers);
        }
        else
        {
          nextSubmit(updatedAnswers)
        }
        console.log("updatedAnswersss",updatedAnswers)
        return updatedAnswers;
      });

      if (!selectedOption.haveTextBox) {
        handleNext();
      }
    }
  };

  const handleMultiChoiceChange = (selectedValues) => {
    // console.log('Selected values:', selectedValues); // Log selected choice IDs
    const selectedOptions = currentQuestion.answers.filter(option =>
      selectedValues.includes(option.id.toString())
    );

    let formattedAnswers = selectedOptions
      .filter(option => !option.haveTextBox) // Remove default "Other" text from selection
      .map(option => option.text);

    // Check if "Other" is selected and append the text field input correctly
    const otherOption = selectedOptions.find(option => option.haveTextBox);
    if (otherOption && textInput.trim() !== '') {
      formattedAnswers.push(`other(${textInput})`);
    }

    setProductReview(selectedValues.join(',')); // Update the selected values in state as a comma-separated string

    setAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[currentQuestionIndex] = {
        questionTitle: currentQuestion.text,
        questionNumber: currentQuestionIndex + 1,
        answer: formattedAnswers.join(','), // Join answers with commas
      };

        nextSubmit(updatedAnswers)

       console.log('Updated Mul answersss:', updatedAnswers); // Log updated answers
      return updatedAnswers;
    });
  };

  
  const handleNext = () => {
    console.log("answer on handle review",productReview)
    //nextSubmit(answers)
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTextInput(''); // Reset text input for the next question
    }
  };

  const handleTextInputChange = (value) => {
    setTextInput(value); // Update the text input state

    setAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];

      if (currentQuestion.answers.some(option => option.haveTextBox && productReview.includes(option.id.toString()))) {
        // If the "Other" option is selected in multi-choice, format it correctly
        const selectedOptions = currentQuestion.answers.filter(option =>
          productReview.split(',').includes(option.id.toString())
        );
        let formattedAnswer = selectedOptions
          .map(option => (option.haveTextBox ? `other(${value})` : option.text))
          .join(',');

        updatedAnswers[currentQuestionIndex] = {
          questionTitle: currentQuestion.text,
          questionNumber: currentQuestionIndex + 1,
          answer: formattedAnswer,
        };
      } else {
        // If it's a standalone text field question
        updatedAnswers[currentQuestionIndex] = {
          questionTitle: currentQuestion.text,
          questionNumber: currentQuestionIndex + 1,
          answer: `other(${value})`,
        };
      }

      // console.log('Updated answers:', updatedAnswers);
      return updatedAnswers;
    });
  };


  
  if (!shouldProceed) {
    return (
      <View border="base" padding="base" borderRadius="base">
        <BlockStack>
          <Heading>Thanks for your feedback!</Heading>
          <Text>Your response has been submitted</Text>
        </BlockStack>
      </View>
    );
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
    <View border="base" padding="base">
      <BlockStack>
        <Heading level={1}>{currentQuestion ? currentQuestion.text : <SkeletonText />}</Heading>
        {currentQuestion ? (
          <>
            {currentQuestion.isTextBox ?
              <>
                <BlockStack>
                  <TextField
                    name={`quiz-response-${currentQuestionIndex}`}
                    label="Enter Something!"
                    value={textInput} // Bind the value to the state
                    onChange={(value) => handleTextInputChange(value)}
                  />
                </BlockStack>
              </> :
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
                  {currentQuestion.answers.map((option, optIndex) => (
                    <Choice
                      key={optIndex}
                      id={option.id.toString()}
                    >
                      {option.haveTextBox ? (
                        <>
                          {option.text}
                          {productReview.includes(option.id.toString()) && (
                            <>
                              <InlineStack spacing="base">
                                <TextField
                                  name={`quiz-response-${currentQuestionIndex}-${optIndex}`}
                                  label="Enter your response"
                                  value={textInput}
                                  onChange={(value) => handleTextInputChange(value)}
                                />
                                {!currentQuestion.isMultiChoice &&
                                  <Button kind="secondary" onPress={handleNext}>
                                    SAVE
                                  </Button>
                                }
                              </InlineStack>
                            </>
                          )}
                        </>
                      ) : option.text}
                    </Choice>
                  ))}
                </BlockStack>
              </ChoiceList>
            }

            <BlockStack>
              {currentQuestionIndex < quizData.questions.length - 1 ? (
                <>
                  {currentQuestion.isMultiChoice ? (
                    <Button kind="secondary" onPress={handleNext}>
                      SAVE
                    </Button>
                  ) : (
                    <Button kind="primary" disabled>
                      SUBMIT
                    </Button>
                  )}
                </>
              ) : (
                <Button kind="primary" onPress={handleSubmit} loading={loading}>
                  SUBMIT
                </Button>
              )}
            </BlockStack>
          </>
        ) : (
          <>
            <SkeletonTextBlock />
            <SkeletonTextBlock />
            <SkeletonTextBlock />
          </>
        )}
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
