// "use client";

// import { useRouter } from "next/navigation";

// export default function Page() {
//   const router = useRouter();

//   const handleGenerate = async () => {
//     try {
//       const baseUrl = process.env.NEXT_PUBLIC_SERVICE_URL;

//       const res = await fetch(`${baseUrl}/api/generate-exam`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           courseId: "831dd3d9-8479-45ac-b664-b32b51c83bec",
//           topic: "GraphQL",
//         }),
//       });

//       if (!res.ok) {
//         const text = await res.text();
//         throw new Error(`Generate failed: ${res.status} ${text}`);
//       }

//       const data = await res.json();

//       if (!data?.examId) {
//         throw new Error("examId not found in response");
//       }

//       router.push(`/exam/${data.examId}`);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   return <button onClick={handleGenerate}>Generate AI Exam</button>;
// }
