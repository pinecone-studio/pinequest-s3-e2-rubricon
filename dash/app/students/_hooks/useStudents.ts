import { useEffect, useState } from "react";
import { Student } from "../type";
import { graphqlFetch } from "../lib/graphql-client";
import { GET_STUDENTS, GET_STUDENTS_LEGACY } from "../queries/student";

type GetStudentsResponse = {
  students: Student[];
};

type StudentLegacy = Omit<Student, "className">;
type GetStudentsLegacyResponse = {
  students: StudentLegacy[];
};

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    graphqlFetch<GetStudentsResponse>(GET_STUDENTS)
      .then((data) => {
        if (!isMounted) return;
        setStudents(data.students);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        const missingClassNameField =
          message.includes('Cannot query field "className"');

        if (!missingClassNameField) {
          if (!isMounted) return;
          setError(message);
          return;
        }

        graphqlFetch<GetStudentsLegacyResponse>(GET_STUDENTS_LEGACY)
          .then((legacyData) => {
            if (!isMounted) return;
            setStudents(
              legacyData.students.map((student) => ({
                ...student,
                className: "-",
              }))
            );
          })
          .catch((legacyErr: unknown) => {
            if (!isMounted) return;
            setError(
              legacyErr instanceof Error ? legacyErr.message : "Unknown error"
            );
          });
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { students, loading, error };
}
