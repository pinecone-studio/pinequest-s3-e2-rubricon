export const webcamLogTypeDefs = `#graphql
  scalar JSON

  type WebcamLog {
    id: String
    student_id: String
    exam_id: String
    image_url: String
    metadata: JSON
    created_at: String
  }

  extend type Query {
    webcamLogs(student_id: String, exam_id: String): [WebcamLog]
    webcamLog(id: String!): WebcamLog
  }

  extend type Mutation {
    createWebcamLog(
      student_id: String!
      exam_id: String!
      image_url: String!
      metadata: JSON
    ): WebcamLog

    updateWebcamLog(
      id: String!
      image_url: String
      metadata: JSON
    ): WebcamLog

    deleteWebcamLog(id: String!): Boolean
  }
`;
