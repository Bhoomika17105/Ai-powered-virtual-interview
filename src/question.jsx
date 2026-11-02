import React, { useEffect, useState } from "react";
import { getQuestion } from "./api";

const Question = () => {
  const [question, setQuestion] = useState("");

  useEffect(() => {
    loadQuestion();
  }, []);

  const loadQuestion = async () => {
    try {
      const res = await getQuestion();
      setQuestion(res.data.question);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Interview Question</h2>
      <p>{question || "Loading..."}</p>
    </div>
  );
};

export default Question;  