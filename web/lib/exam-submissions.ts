import { graphqlRequest } from "@/lib/graphql";
import { ExamQuestion } from "@/app/exam/exam-types";

type StudentLookupResponse = {
  studentByEmail: {
    id: string;
  } | null;
};

type CreateStudentResponse = {
  createStudent: {
    id: string;
  };
};

type CreateSubmissionResponse = {
  createSubmission: {
    id: string;
  };
};

type UpdateSubmissionResponse = {
  updateSubmission: {
    id: string;
  };
};

type CreateSubmissionAnswerResponse = {
  createSubmissionAnswer: {
    id: string;
  } | null;
};

type SubmitExamInput = {
  studentEmail: string;
  studentName: string;
  examId: string;
  startedAt: string;
  submittedAt: string;
  questions: ExamQuestion[];
  answers: Record<number, string | null>;
};

type SubmissionAnswer = {
  questionId: string;
  answerId?: string;
  textAnswer?: string;
  isCorrect?: boolean;
  score?: number;
};

const STUDENT_BY_EMAIL_QUERY = `
  query StudentByEmail($email: String!) {
    studentByEmail(email: $email) {
      id
    }
  }
`;

const CREATE_STUDENT_MUTATION = `
  mutation CreateStudent($name: String!, $email: String!) {
    createStudent(name: $name, email: $email) {
      id
    }
  }
`;

const CREATE_SUBMISSION_MUTATION = `
  mutation CreateSubmission(
    $studentId: String!
    $examId: String!
    $startedAt: String!
    $submittedAt: String!
    $status: SubmissionStatus
  ) {
    createSubmission(
      student_id: $studentId
      exam_id: $examId
      started_at: $startedAt
      submitted_at: $submittedAt
      status: $status
    ) {
      id
    }
  }
`;

const CREATE_SUBMISSION_ANSWER_MUTATION = `
  mutation CreateSubmissionAnswer(
    $submissionId: String!
    $questionId: String!
    $answerId: String
    $textAnswer: String
    $isCorrect: Boolean
    $score: Int
  ) {
    createSubmissionAnswer(
      submission_id: $submissionId
      question_id: $questionId
      answer_id: $answerId
      text_answer: $textAnswer
      is_correct: $isCorrect
      score: $score
    ) {
      id
    }
  }
`;

const UPDATE_SUBMISSION_MUTATION = `
  mutation UpdateSubmission(
    $id: String!
    $scoreAuto: Int
    $finalScore: Int
    $status: SubmissionStatus
  ) {
    updateSubmission(
      id: $id
      score_auto: $scoreAuto
      final_score: $finalScore
      status: $status
    ) {
      id
    }
  }
`;

const resolveStudentId = async (studentEmail: string, studentName: string) => {
  const existingStudent = await graphqlRequest<StudentLookupResponse>(
    STUDENT_BY_EMAIL_QUERY,
    { email: studentEmail },
  );

  if (existingStudent.studentByEmail?.id) {
    return existingStudent.studentByEmail.id;
  }

  const createdStudent = await graphqlRequest<CreateStudentResponse>(
    CREATE_STUDENT_MUTATION,
    {
      name: studentName,
      email: studentEmail,
    },
  );

  if (!createdStudent.createStudent?.id) {
    throw new Error("Оюутны мэдээлэл үүсгэж чадсангүй.");
  }

  return createdStudent.createStudent.id;
};

const normalizeAnswerText = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const buildSubmissionAnswers = (
  questions: ExamQuestion[],
  answers: Record<number, string | null>,
): SubmissionAnswer[] => {
  return questions.flatMap<SubmissionAnswer>((question) => {
    const rawAnswer = answers[question.id];

    if (!rawAnswer) {
      return [];
    }

    if (question.type === "Short Answer") {
      const textAnswer = rawAnswer.trim();

      if (!textAnswer) {
        return [];
      }

      const normalizedStudentAnswer = normalizeAnswerText(textAnswer);
      const normalizedCorrectAnswer = normalizeAnswerText(question.correctAnswer);
      const isAutoGradable = normalizedCorrectAnswer.length > 0;
      const isCorrect = isAutoGradable
        ? normalizedStudentAnswer === normalizedCorrectAnswer
        : undefined;

      return [
        {
          questionId: question.questionId,
          textAnswer,
          isCorrect,
          score: isCorrect ? question.points : isAutoGradable ? 0 : undefined,
        },
      ];
    }

    const selectedChoice = question.choices?.find((choice) => choice.id === rawAnswer);

    if (!selectedChoice?.answerId) {
      return [];
    }

    return [
      {
        questionId: question.questionId,
        answerId: selectedChoice.answerId,
        isCorrect: rawAnswer === question.correctAnswer,
        score: rawAnswer === question.correctAnswer ? question.points : 0,
      },
    ];
  });
};

const canAutoGradeSubmission = (
  questions: ExamQuestion[],
) => {
  if (questions.length === 0) {
    return false;
  }

  return questions.every(
    (question) => normalizeAnswerText(question.correctAnswer).length > 0,
  );
};

export const submitExamToBackend = async ({
  studentEmail,
  studentName,
  examId,
  startedAt,
  submittedAt,
  questions,
  answers,
}: SubmitExamInput) => {
  const studentId = await resolveStudentId(studentEmail, studentName);

  const submissionResponse = await graphqlRequest<CreateSubmissionResponse>(
    CREATE_SUBMISSION_MUTATION,
    {
      studentId,
      examId,
      startedAt,
      submittedAt,
      status: "submitted",
    },
  );

  const submissionId = submissionResponse.createSubmission?.id;

  if (!submissionId) {
    throw new Error("Шалгалтын submission үүсгэж чадсангүй.");
  }

  const submissionAnswers = buildSubmissionAnswers(questions, answers);

  await Promise.all(
    submissionAnswers.map((answer) =>
      graphqlRequest<CreateSubmissionAnswerResponse>(
        CREATE_SUBMISSION_ANSWER_MUTATION,
        {
          submissionId,
          questionId: answer.questionId,
          answerId: answer.answerId,
          textAnswer: answer.textAnswer,
          isCorrect: answer.isCorrect,
          score: answer.score,
        },
      ),
    ),
  );

  if (canAutoGradeSubmission(questions)) {
    const finalScore = submissionAnswers.reduce(
      (sum, answer) => sum + (answer.score ?? 0),
      0,
    );

    await graphqlRequest<UpdateSubmissionResponse>(UPDATE_SUBMISSION_MUTATION, {
      id: submissionId,
      scoreAuto: finalScore,
      finalScore,
      status: "reviewed",
    });
  }

  return submissionId;
};
