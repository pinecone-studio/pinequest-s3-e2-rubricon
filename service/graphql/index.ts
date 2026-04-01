import { teacherTypeDefs } from "./modules/teachers/schema";
import { teacherQueries } from "./modules/teachers/queries";
import { teacherMutations } from "./modules/teachers/mutations";

import { studentTypeDefs } from "./modules/students/schema";
import { studentQueries } from "./modules/students/queries";
import { studentMutations } from "./modules/students/mutations";

import { submissionTypeDefs } from "./modules/submissions/schema";
import { submissionQueries } from "./modules/submissions/queries";
import { submissionMutations } from "./modules/submissions/mutations";

import { examTypeDefs } from "./modules/exams/schema";
import { examQueries } from "./modules/exams/queries";
import { examMutations } from "./modules/exams/mutations";

import { questionTypeDefs } from "./modules/questions/schema";
import { questionQueries } from "./modules/questions/queries";
import { questionMutations } from "./modules/questions/mutations";

import { courseTypeDefs } from "./modules/courses/schema";
import { courseQueries } from "./modules/courses/queries";
import { courseMutations } from "./modules/courses/mutations";

import { answerTypeDefs } from "./modules/answers/schema";
import { answerQueries } from "./modules/answers/queries";
import { answerMutations } from "./modules/answers/mutations";

import { submissionAnswerTypeDefs } from "./modules/submission-answers/schema";
import { submissionAnswerQueries } from "./modules/submission-answers/queries";
import { submissionAnswerMutations } from "./modules/submission-answers/mutations";

import { enrollmentTypeDefs } from "./modules/enrollments/schema";
import { enrollmentQueries } from "./modules/enrollments/queries";
import { enrollmentMutations } from "./modules/enrollments/mutations";
import { relationResolvers } from "./relations";
import { examQuestionTypeDefs } from "./modules/exam-questions/schema";
import { examQuestionQueries } from "./modules/exam-questions/queries";
import { examQuestionMutations } from "./modules/exam-questions/mutations";
import { examSqsTypeDefs } from "./modules/exams-sqs/schema";
import { examSqsMutations } from "./modules/exams-sqs/mutations";
import { cheatLogTypeDefs } from "./modules/cheat-logs/schema";
import { cheatLogQueries } from "./modules/cheat-logs/queries";
import { cheatLogMutations } from "./modules/cheat-logs/mutations";
import { webcamLogTypeDefs } from "./modules/webcam-logs/schema";
import { webcamLogQueries } from "./modules/webcam-logs/queries";
import { webcamLogMutations } from "./modules/webcam-logs/mutations";

export const typeDefs = `#graphql
  type Query { _: Boolean }
  type Mutation { _: Boolean }

  ${teacherTypeDefs}
  ${studentTypeDefs}
  ${submissionTypeDefs}
  ${examTypeDefs}
  ${questionTypeDefs}
  ${courseTypeDefs}
  ${answerTypeDefs}
  ${submissionAnswerTypeDefs}
  ${enrollmentTypeDefs}
  ${examQuestionTypeDefs}
  ${examSqsTypeDefs}
    ${cheatLogTypeDefs}
    ${webcamLogTypeDefs}
`;

export const resolvers = {
  Query: {
    ...teacherQueries,
    ...studentQueries,
    ...submissionQueries,
    ...examQueries,
    ...questionQueries,
    ...courseQueries,
    ...answerQueries,
    ...submissionAnswerQueries,
    ...enrollmentQueries,
    ...examQuestionQueries,
    ...cheatLogQueries,
    ...webcamLogQueries,
  },
  Mutation: {
    ...teacherMutations,
    ...studentMutations,
    ...submissionMutations,
    ...examMutations,
    ...questionMutations,
    ...courseMutations,
    ...answerMutations,
    ...submissionAnswerMutations,
    ...enrollmentMutations,
    ...examQuestionMutations,
    ...examSqsMutations,
    ...cheatLogMutations,
    ...webcamLogMutations,
  },
  Course: relationResolvers.Course,
  Exam: relationResolvers.Exam,
  Question: relationResolvers.Question,
  Submission: relationResolvers.Submission,
};
