import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { supabase } from "@/lib/supabase";

const typeDefs = `#graphql
  type Student {
    id: String
    name: String
    email: String
  }

  type Query {
    students: [Student]
  }
`;

const resolvers = {
  Query: {
    students: async () => {
      const { data, error } = await supabase.from("students").select("*");

      if (error) throw new Error(error.message);

      return data;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

export { handler as GET, handler as POST };
