export const examSqsTypeDefs = `#graphql
  extend type Mutation {
    generateExam(courseId: String!, topic: String!): String!
  }
`;
