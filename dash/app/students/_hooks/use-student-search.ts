import { useEffect, useMemo, useState } from "react";
import { transliterate } from "../utils/search-helper";

export function useStudentSearch<
  T extends {
    name: string;
    course: string;
    className: string;
    major: string;
    finalScore: number | null;
  }
>(items: T[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string[]>([]);
  const [classFilter, setClassFilter] = useState<string[]>([]);
  const [majorFilter, setMajorFilter] = useState<string[]>([]);
  const [scoreFilter, setScoreFilter] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const query = debouncedSearchQuery.toLowerCase();

      const matchesName =
        !query ||
        item.name.toLowerCase().includes(query) ||
        transliterate(item.name).includes(query);

      const matchesCourse =
        courseFilter.length === 0 || courseFilter.includes(item.course);

      const matchesClass =
        classFilter.length === 0 || classFilter.includes(item.className);

      const matchesMajor =
        majorFilter.length === 0 || majorFilter.includes(item.major);

      const scoreBand =
        item.finalScore === null
          ? null
          : item.finalScore <= 60
            ? "0-60"
            : item.finalScore <= 80
              ? "61-80"
              : "81-100";

      const matchesScore =
        scoreFilter.length === 0 ||
        (scoreBand !== null && scoreFilter.includes(scoreBand));

      return (
        matchesName &&
        matchesCourse &&
        matchesClass &&
        matchesMajor &&
        matchesScore
      );
    });
  }, [
    items,
    debouncedSearchQuery,
    courseFilter,
    classFilter,
    majorFilter,
    scoreFilter,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    courseFilter,
    setCourseFilter,
    classFilter,
    setClassFilter,
    majorFilter,
    setMajorFilter,
    scoreFilter,
    setScoreFilter,
    filteredItems,
  };
}
