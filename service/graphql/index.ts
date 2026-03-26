import { studentTypeDefs } from "./modules/students/schema";
import { studentQueries } from "./modules/students/queries";
import { studentMutations } from "./modules/students/mutations";

export const typeDefs = `#graphql
  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }

  ${studentTypeDefs}
`;

export const resolvers = {
  Query: {
    ...studentQueries,
  },
  Mutation: {
    ...studentMutations,
  },
};
