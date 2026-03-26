export const studentTypeDefs = `#graphql
  type Student {
    id: String
    name: String
    email: String
  }

  extend type Query {
    students: [Student]
    student(id: String!): Student
  }

  extend type Mutation {
    createStudent(name: String!, email: String!): Student
  }
`;
