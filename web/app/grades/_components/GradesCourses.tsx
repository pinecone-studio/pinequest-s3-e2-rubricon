"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { isHiddenStudentExam } from "@/lib/exam-visibility";
import { graphqlRequest } from "@/lib/graphql";

type GradesCourse = {
  courseId: string;
  courseCode: string;
  courseName: string;
  currentGrade: number | null;
  exams: {
    id: string;
    name: string;
    score: number | null;
    maxScore: number;
    status: "reviewed" | "submitted" | "not_submitted";
  }[];
};

type GradesResponse = {
  studentByEmail: {
    id: string;
  } | null;
  enrollments: {
    id: string;
    student_id: string;
    course_id: string;
  }[];
  submissions: {
    id: string;
    student_id: string;
    exam_id: string;
    submitted_at: string | null;
    status: "in_progress" | "submitted" | "reviewed" | null;
    final_score: number | null;
  }[];
  courses: {
    id: string;
    name: string | null;
    code: string | null;
    exams: {
      id: string;
      title: string | null;
    }[];
  }[];
};

type ExamQuestionsResponse = {
  examQuestions: {
    id: string;
    points: number | null;
  }[];
};

const GRADES_QUERY = `
  query GradesData($email: String!) {
    studentByEmail(email: $email) {
      id
    }
    enrollments {
      id
      student_id
      course_id
    }
    submissions {
      id
      student_id
      exam_id
      submitted_at
      status
      final_score
    }
    courses {
      id
      name
      code
      exams {
        id
        title
      }
    }
  }
`;

const EXAM_QUESTIONS_QUERY = `
  query GradeExamQuestions($examId: String!) {
    examQuestions(exam_id: $examId) {
      id
      points
    }
  }
`;

const EMPTY_MESSAGE = "Одоогоор дүнгийн мэдээлэл алга.";

function getLetterGrade(percentage: number): string {
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  if (percentage >= 60) return "D-";
  return "F";
}

function getGradeColor(percentage: number): string {
  if (percentage >= 90) return "text-green-500";
  if (percentage >= 80) return "text-blue-500";
  if (percentage >= 70) return "text-yellow-500";
  return "text-red-500";
}

function getTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getLatestSubmissionPerExam(submissions: GradesResponse["submissions"]) {
  const latestByExam = new Map<string, GradesResponse["submissions"][number]>();

  [...submissions]
    .sort(
      (left, right) =>
        getTimestamp(right.submitted_at) - getTimestamp(left.submitted_at),
    )
    .forEach((submission) => {
      if (!submission.exam_id || latestByExam.has(submission.exam_id)) {
        return;
      }

      latestByExam.set(submission.exam_id, submission);
    });

  return latestByExam;
}

function buildCourseGrades(
  data: GradesResponse,
  studentId: string,
  examMaxScores: Map<string, number>,
) {
  const enrolledCourseIds = new Set(
    data.enrollments
      .filter((enrollment) => enrollment.student_id === studentId)
      .map((enrollment) => enrollment.course_id),
  );

  const latestSubmissionsByExam = getLatestSubmissionPerExam(
    data.submissions.filter(
      (submission) =>
        submission.student_id === studentId &&
        (submission.status === "submitted" || submission.status === "reviewed"),
    ),
  );

  return data.courses
    .filter((course) => enrolledCourseIds.has(course.id))
    .map<GradesCourse>((course) => {
      const exams = (course.exams ?? [])
        .filter((exam) => !isHiddenStudentExam(exam.title))
        .map<GradesCourse["exams"][number]>((exam) => {
          const latestSubmission = latestSubmissionsByExam.get(exam.id);
          const isReviewed =
            latestSubmission?.status === "reviewed" &&
            typeof latestSubmission.final_score === "number";

          return {
            id: exam.id,
            name: exam.title?.trim() || "Нэргүй шалгалт",
            score: isReviewed ? latestSubmission.final_score : null,
            maxScore: examMaxScores.get(exam.id) ?? 0,
            status: isReviewed
              ? "reviewed"
              : latestSubmission
                ? "submitted"
                : "not_submitted",
          };
        });

      const reviewedExams = exams.filter(
        (exam) => exam.score !== null && exam.maxScore > 0,
      );
      const totalScore = reviewedExams.reduce(
        (sum, exam) => sum + (exam.score ?? 0),
        0,
      );
      const totalMaxScore = reviewedExams.reduce(
        (sum, exam) => sum + exam.maxScore,
        0,
      );

      return {
        courseId: course.id,
        courseCode: course.code?.trim() || "CODE",
        courseName: course.name?.trim() || "Нэргүй хичээл",
        currentGrade:
          totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : null,
        exams,
      };
    })
    .sort((left, right) => left.courseName.localeCompare(right.courseName));
}

export default function GradesCourses() {
  const { user, isLoaded } = useUser();
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [courses, setCourses] = useState<GradesCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const toggleCourse = (courseId: string) => {
    setExpandedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  useEffect(() => {
    let cancelled = false;

    if (!isLoaded) {
      return;
    }

    const loadGrades = async () => {
      try {
        setLoading(true);
        setError(null);
        setMessage(null);

        const studentEmail = user?.primaryEmailAddress?.emailAddress;

        if (!studentEmail) {
          if (cancelled) return;

          setCourses([]);
          setMessage("Дүнгээ харахын тулд нэвтэрнэ үү.");
          setLoading(false);
          return;
        }

        const data = await graphqlRequest<GradesResponse>(GRADES_QUERY, {
          email: studentEmail,
        });

        if (cancelled) return;

        const studentId = data.studentByEmail?.id;

        if (!studentId) {
          setCourses([]);
          setMessage("Таны оюутны мэдээлэл олдсонгүй.");
          return;
        }

        const enrolledCourseIds = new Set(
          data.enrollments
            .filter((enrollment) => enrollment.student_id === studentId)
            .map((enrollment) => enrollment.course_id),
        );

        const visibleExamIds = data.courses
          .filter((course) => enrolledCourseIds.has(course.id))
          .flatMap((course) => course.exams ?? [])
          .filter((exam) => !isHiddenStudentExam(exam.title))
          .map((exam) => exam.id);

        const examQuestionEntries = await Promise.all(
          visibleExamIds.map(async (examId) => {
            const response = await graphqlRequest<ExamQuestionsResponse>(
              EXAM_QUESTIONS_QUERY,
              { examId },
            );

            const maxScore = (response.examQuestions ?? []).reduce(
              (sum, question) => sum + (question.points ?? 0),
              0,
            );

            return [examId, maxScore] as const;
          }),
        );

        if (cancelled) return;

        const nextCourses = buildCourseGrades(
          data,
          studentId,
          new Map(examQuestionEntries),
        );

        setCourses(nextCourses);
        setExpandedCourses((prev) =>
          prev.filter((courseId) =>
            nextCourses.some((course) => course.courseId === courseId),
          ),
        );
        setMessage(nextCourses.length === 0 ? EMPTY_MESSAGE : null);
      } catch (fetchError) {
        if (cancelled) return;

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Дүнгийн мэдээлэл дуудахад алдаа гарлаа.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadGrades();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.primaryEmailAddress?.emailAddress]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Хичээлийн дүнгийн дэлгэрэнгүй</CardTitle>
        <CardDescription>
          Хичээлээ задлаад шалгалтын бодит оноо, төлөвийг харна.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-5 space-y-4">
        {loading ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Дүнгийн мэдээллийг ачаалж байна...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {!loading && !error && courses.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {message ?? EMPTY_MESSAGE}
          </div>
        ) : null}

        {!loading &&
          !error &&
          courses.map((course) => {
            const isExpanded = expandedCourses.includes(course.courseId);
            const letterGrade =
              course.currentGrade !== null
                ? getLetterGrade(course.currentGrade)
                : null;
            const gradeColor =
              course.currentGrade !== null
                ? getGradeColor(course.currentGrade)
                : "text-muted-foreground";

            return (
              <Collapsible
                key={course.courseId}
                open={isExpanded}
                onOpenChange={() => toggleCourse(course.courseId)}
              >
                <div className="rounded-lg border">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto w-full justify-between p-4 hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-sm">
                          {course.courseCode}
                        </Badge>
                        <span className="font-medium">{course.courseName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {course.currentGrade !== null && letterGrade ? (
                            <>
                              <span className={`text-xl font-bold ${gradeColor}`}>
                                {letterGrade}
                              </span>
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({course.currentGrade}%)
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Хүлээгдэж байна
                            </span>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t p-4">
                      {course.exams.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Үнэлгээ</TableHead>
                              <TableHead className="text-center">Оноо</TableHead>
                              <TableHead className="text-center">
                                Дээд оноо
                              </TableHead>
                              <TableHead className="text-center">Хувь</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {course.exams.map((exam) => {
                              const percentage =
                                exam.score !== null && exam.maxScore > 0
                                  ? Math.round((exam.score / exam.maxScore) * 100)
                                  : null;

                              return (
                                <TableRow key={exam.id}>
                                  <TableCell className="font-medium">
                                    {exam.name}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {exam.score !== null ? (
                                      exam.score
                                    ) : exam.status === "submitted" ? (
                                      <Badge variant="secondary" className="text-xs">
                                        Шалгаж байна
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        Өгөөгүй
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {exam.maxScore > 0 ? exam.maxScore : "-"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {percentage !== null ? (
                                      <span className={getGradeColor(percentage)}>
                                        {percentage}%
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                          Энэ хичээлд хараахан шалгалтын дүн алга.
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                        <span className="text-sm font-medium">Хичээлийн дүн</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={course.currentGrade ?? 0}
                            className="h-2 w-24"
                          />
                          <span className={`font-bold ${gradeColor}`}>
                            {course.currentGrade !== null
                              ? `${course.currentGrade}%`
                              : "Хүлээгдэж байна"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
      </CardContent>
    </Card>
  );
}
