import { useState, useMemo } from "react";
import { transliterate } from "../utils/search-helper";

export function useStudentSearch<
  T extends {
    name: string;
    course: string;
    className: string;
    major: string;
  }
>(items: T[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string[]>([]);
  const [classFilter, setClassFilter] = useState<string[]>([]);
  const [majorFilter, setMajorFilter] = useState<string[]>([]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const query = searchQuery.toLowerCase();

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

      return matchesName && matchesCourse && matchesClass && matchesMajor;
    });
  }, [items, searchQuery, courseFilter, classFilter, majorFilter]);

  return {
    searchQuery,
    setSearchQuery,
    courseFilter,
    setCourseFilter,
    classFilter,
    setClassFilter,
    majorFilter,
    setMajorFilter,
    filteredItems,
  };
}
