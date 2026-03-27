import React from "react";

export type StatCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
};

export type ExamItemProps = {
  title: string;
  date: string;
  time: string;
  students: number;
  duration: string;
};

export type ActivityItemProps = {
  text: string;
  time: string;
  color: string;
};

export type PerformanceCardProps = {
  title: string;
  students: number;
  score: number;
};