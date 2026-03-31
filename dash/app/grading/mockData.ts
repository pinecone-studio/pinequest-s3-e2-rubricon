import type {
  ClassCourse,
  EssayQuestion,
  RubricCriterion,
  Student,
} from "@/lib/grading/types";

type GqlError = { message: string };

async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = (await res.json()) as { data?: T; errors?: GqlError[] };
  if (!res.ok || json.errors?.length || !json.data) {
    throw new Error(json.errors?.[0]?.message ?? "GraphQL request failed");
  }
  return json.data;
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function toRelative(iso?: string | null): string {
  if (!iso) return "сая";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 60) return `${min}м өмнө`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}ц өмнө`;
  const d = Math.floor(hr / 24);
  return `${d}ө өмнө`;
}

const DEFAULT_RUBRIC: RubricCriterion[] = [
  {
    id: "accuracy",
    name: "Агуулгын Үнэн Зөв Байдал",
    description: "Хариултын зөв ба гүнзгий байдал",
    maxScore: 10,
    score: 0,
  },
  {
    id: "clarity",
    name: "Тодорхой ба Зохион Байгуулалт",
    description: "Бүтэц, урсгал, уншигдах байдал",
    maxScore: 5,
    score: 0,
  },
];

type Course = {
  id: string;
  code: string;
  name: string;
  exams?:
    | { id: string; title?: string | null; questions?: Question[] | null }[]
    | null;
};
type Enrollment = { id: string; student_id: string; course_id: string };
type SubmissionAnswer = {
  id: string;
  question_id: string;
  answer_id?: string | null;
  text_answer?: string | null;
};
type Submission = {
  id: string;
  student_id: string;
  exam_id: string;
  started_at?: string | null;
  submitted_at?: string | null;
  final_score?: number | null;
  answers?: SubmissionAnswer[] | null;
};
type StudentRow = { id: string; name: string; email: string };
type Question = {
  id: string;
  text: string;
  type?: string | null;
  order_index?: number | null;
};

const BOOT_QUERY = `
query GradingBoot {
  courses { id code name exams { id title } }
  enrollments { id student_id course_id }
  students { id name email }
  submissions { id student_id exam_id started_at submitted_at final_score }
}
`;

export async function fetchGradingClasses(): Promise<ClassCourse[]> {
  const data = await gql<{
    courses: Course[];
    enrollments: Enrollment[];
    submissions: Submission[];
  }>(BOOT_QUERY);

  return data.courses.map((c) => {
    const examIds = new Set((c.exams ?? []).map((e) => e.id));
    const courseSubs = data.submissions.filter((s) => examIds.has(s.exam_id));
    const total = data.enrollments.filter((e) => e.course_id === c.id).length;
    const graded = courseSubs.filter(
      (s) => s.final_score !== null && s.final_score !== undefined,
    ).length;
    const pending = courseSubs.filter(
      (s) => s.final_score === null || s.final_score === undefined,
    ).length;

    return {
      id: c.id,
      code: c.code,
      name: c.name,
      assignmentLabel: c.exams?.[0]?.title ?? "Шалгалт",
      pending,
      graded,
      total: total || courseSubs.length,
    };
  });
}

export async function fetchClassStudents(classId: string): Promise<{
  course: ClassCourse | null;
  students: Student[];
}> {
  const data = await gql<{
    courses: Course[];
    enrollments: Enrollment[];
    students: StudentRow[];
    submissions: Submission[];
  }>(BOOT_QUERY);

  const course = data.courses.find((c) => c.id === classId);
  if (!course) return { course: null, students: [] };

  const examIds = new Set((course.exams ?? []).map((e) => e.id));
  const courseSubs = data.submissions.filter((s) => examIds.has(s.exam_id));
  const enrolledIds = new Set(
    data.enrollments
      .filter((e) => e.course_id === classId)
      .map((e) => e.student_id),
  );

  const latestByStudent = new Map<string, Submission>();
  for (const s of courseSubs) {
    const prev = latestByStudent.get(s.student_id);
    const prevTs = new Date(
      prev?.submitted_at ?? prev?.started_at ?? 0,
    ).getTime();
    const nextTs = new Date(s.submitted_at ?? s.started_at ?? 0).getTime();
    if (!prev || nextTs >= prevTs) latestByStudent.set(s.student_id, s);
  }

  const students = data.students
    .filter((s) => enrolledIds.has(s.id))
    .map((s) => {
      const sub = latestByStudent.get(s.id);
      const graded =
        sub?.final_score !== null && sub?.final_score !== undefined;
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        initials: toInitials(s.name),
        submittedAt: toRelative(sub?.submitted_at ?? sub?.started_at),
        status: graded ? "Дүгнэгдсэн" : "Хүлээгдэж байна",
        mcScore: sub?.final_score ?? 0,
        mcTotal: 100,
        essays: [],
      } satisfies Student;
    });

  return {
    course: {
      id: course.id,
      code: course.code,
      name: course.name,
      assignmentLabel: course.exams?.[0]?.title ?? "Шалгалт",
      pending: students.filter((s) => s.status === "Хүлээгдэж байна").length,
      graded: students.filter((s) => s.status === "Дүгнэгдсэн").length,
      total: students.length,
    },
    students,
  };
}

const STUDENT_QUERY = `
query GradingStudent($courseId: String!, $studentId: String!) {
  course(id: $courseId) {
    id
    code
    name
    exams {
      id
      title
      questions { id text type order_index }
    }
  }
  student(id: $studentId) { id name email }
  enrollments { id student_id course_id }
  submissions {
    id student_id exam_id started_at submitted_at final_score
    answers { id question_id answer_id text_answer }
  }
}
`;

export async function fetchStudentGradingContext(
  classId: string,
  studentId: string,
): Promise<{
  course: ClassCourse | null;
  classStudents: Student[];
  student: Student | null;
  submissionId: string | null;
}> {
  const data = await gql<{
    course: Course | null;
    student: StudentRow | null;
    enrollments: Enrollment[];
    submissions: Submission[];
  }>(STUDENT_QUERY, { courseId: classId, studentId });

  if (!data.course || !data.student) {
    return {
      course: null,
      classStudents: [],
      student: null,
      submissionId: null,
    };
  }

  const examIds = new Set((data.course.exams ?? []).map((e) => e.id));
  const classSubs = data.submissions.filter((s) => examIds.has(s.exam_id));
  const enrolledIds = new Set(
    data.enrollments
      .filter((e) => e.course_id === classId)
      .map((e) => e.student_id),
  );

  const classStudents = Array.from(enrolledIds).map((sid) => {
    const sub = classSubs.find((s) => s.student_id === sid);
    return {
      id: sid,
      name: sid === data.student?.id ? data.student.name : sid,
      email:
        sid === data.student?.id ? data.student.email : `${sid}@unknown.local`,
      initials: sid === data.student?.id ? toInitials(data.student.name) : "??",
      submittedAt: toRelative(sub?.submitted_at ?? sub?.started_at),
      status:
        sub?.final_score !== null && sub?.final_score !== undefined
          ? "Дүгнэгдсэн"
          : "Хүлээгдэж байна",
      mcScore: sub?.final_score ?? 0,
      mcTotal: 100,
      essays: [],
    } satisfies Student;
  });

  const latest = classSubs
    .filter((s) => s.student_id === studentId)
    .sort((a, b) => {
      const at = new Date(a.submitted_at ?? a.started_at ?? 0).getTime();
      const bt = new Date(b.submitted_at ?? b.started_at ?? 0).getTime();
      return bt - at;
    })[0];

  const questions = (data.course.exams ?? [])
    .flatMap((e) => e.questions ?? [])
    .filter((q): q is Question => Boolean(q?.id && q?.text))
    .filter(
      (q) => (q.type ?? "").toLowerCase().includes("essay") || q.type == null,
    )
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const answerMap = new Map(
    (latest?.answers ?? []).map((a) => [a.question_id, a]),
  );
  const essays: EssayQuestion[] = questions.map((q, idx) => ({
    id: idx + 1,
    question: q.text,
    studentAnswer: answerMap.get(q.id)?.text_answer ?? "",
    rubric: DEFAULT_RUBRIC.map((r) => ({ ...r })),
    feedback: "",
  }));

  const student: Student = {
    id: data.student.id,
    name: data.student.name,
    email: data.student.email,
    initials: toInitials(data.student.name),
    submittedAt: toRelative(latest?.submitted_at ?? latest?.started_at),
    status:
      latest?.final_score !== null && latest?.final_score !== undefined
        ? "Дүгнэгдсэн"
        : "Хүлээгдэж байна",
    mcScore: latest?.final_score ?? 0,
    mcTotal: 100,
    essays,
  };

  return {
    course: {
      id: data.course.id,
      code: data.course.code,
      name: data.course.name,
      assignmentLabel: data.course.exams?.[0]?.title ?? "Шалгалт",
      pending: classSubs.filter(
        (s) => s.final_score === null || s.final_score === undefined,
      ).length,
      graded: classSubs.filter(
        (s) => s.final_score !== null && s.final_score !== undefined,
      ).length,
      total: enrolledIds.size,
    },
    classStudents,
    student,
    submissionId: latest?.id ?? null,
  };
}

export async function saveSubmissionScore(
  submissionId: string,
  score: number,
): Promise<void> {
  await gql<{ updateSubmission: { id: string } }>(
    `
    mutation SaveScore($id: String!, $final_score: Int) {
      updateSubmission(id: $id, final_score: $final_score) { id }
    }
    `,
    { id: submissionId, final_score: Math.round(score) },
  );
}
