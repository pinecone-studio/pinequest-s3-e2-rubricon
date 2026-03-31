import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export const examSqsMutations = {
  generateExam: async (
    _: unknown,
    { courseId, topic }: { courseId: string; topic: string },
  ) => {
    console.log("🔍 SQS_URL:", process.env.SQS_URL);
    console.log("🔍 ACCESS_KEY:", process.env.AWS_ACCESS_KEY);
    console.log("🔍 SECRET_KEY:", !!process.env.AWS_SECRET_KEY);

    try {
      const result = await sqs.send(
        new SendMessageCommand({
          QueueUrl: process.env.SQS_URL!,
          MessageBody: JSON.stringify({
            type: "GENERATE_EXAM",
            courseId,
            topic,
          }),
        }),
      );
      console.log("✅ SQS success! MessageId:", result.MessageId);
    } catch (err) {
      console.error("❌ SQS ERROR:", err);
    }

    return "started 🚀";
  },
};
