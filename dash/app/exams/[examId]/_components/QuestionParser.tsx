import React from "react";

export const QuestionParser = () => {
  return <div>QuestionParser</div>;
};

type ParsedQuestion = {
  text: string;
  options: string[];
  type: "single_choice";
};

export const parseRawTextToQuestions = (text: string): ParsedQuestion[] => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const questions: ParsedQuestion[] = [];

  let currentQuestion: ParsedQuestion | null = null;

  lines.forEach((line) => {
    // 1. Асуулт эхэлж байгааг таних (Жишээ нь: "4. " эсвэл "4) ")
    const questionMatch = line.match(/^(\d+[\.\)])\s*(.*)/);

    // 2. Сонголт эхэлж байгааг таних (Жишээ нь: "a. " эсвэл "a) ")
    const optionMatch = line.match(/^([a-e][\.\)])\s*(.*)/);

    if (questionMatch) {
      // Шинэ асуулт эхэлж байна
      if (currentQuestion) questions.push(currentQuestion);
      currentQuestion = {
        text: questionMatch[2],
        options: [],
        type: "single_choice",
      };
    } else if (optionMatch && currentQuestion) {
      // Сонголт нэмэх
      currentQuestion.options.push(optionMatch[2]);
    } else if (currentQuestion && !optionMatch) {
      // Хэрэв асуултын текст олон мөр дамжсан бол залгах
      currentQuestion.text += " " + line;
    }
  });

  if (currentQuestion) questions.push(currentQuestion);
  return questions;
};
