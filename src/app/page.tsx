"use client";
import { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { motion } from "framer-motion";
import FaissChatbot from "./_components/FaissChatbot";
import FaissChatbotPDF from "./_components/FaissChatbotPDF";
import { useUser ,useAuth} from "@clerk/nextjs";


export default function Home() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [urls, setUrls] = useState([""]); // List of URLs
  const [taskId, setTaskId] = useState("");
  const [status, setStatus] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerPDF, setAnswerPDF] = useState("");
  const [defaults, setDefaults] = useState("Urls");
  const [selectedLanguage, setSelectedLanguage] = useState("en"); // Default language: English
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to send URLs and PDFs to backend
  const initializeFaiss = async () => {
    setStatus("Initializing...");
    setAnswer(""); // Clear previous answers
    setIsLoading(true);
    try {
      const res = await fetch("https://api.harshita.click/initialize_faiss", {
        method: "POST",
        body: JSON.stringify({ urls }), // No content-type header for multipart/form-data
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Processing your Urls.");

        setTaskId(data.task_id);
        checkTaskStatus(data.task_id); // Start polling
      } else {
        alert("Error: " + data.detail);
      }
    } catch (error) {
      alert("Network error: " + error);
    }
  };

  // // Function to poll task status
  const checkTaskStatus = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`https://api.harshita.click/task_status/${taskId}`);
        const data = await res.json();
        setStatus(data.status);

        if (data.status === "Completed") {
          clearInterval(interval); // Stop polling
          // toast.success("Processing Done! Start asking your Questions.");
          setIsLoading(false);
        }
      } catch (error) {
        clearInterval(interval);
        alert("Error checking task status");
      }
    }, 3000); // Poll every 3 seconds
  };

  const [isRecording, setIsRecording] = useState(false);

  const translateText = async (text: string, targetLang: string) => {
    setIsLoading(true)
    try {
      const response = await axios.get(`https://lingva.ml/api/v1/en/${targetLang}/${encodeURIComponent(text)}`);
      setIsLoading(false)
      return response.data.translation;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };


  const textToSpeech = (text: string, lang: string) => {
    if (!text.trim()) return; // Avoid empty text input

    const synth = window.speechSynthesis;
    synth.cancel(); // Stop any ongoing speech
    const sentences = text.match(/[^.!?,]+[.!?,]*|[^.!?,]+/g) || [text];
    let index = 0;

    const speakNextSentence = () => {
      if (index >= sentences.length) return;
      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      // Map language codes
      const langMap: Record<string, string> = {
        en: "en-US",
        hi: "hi-IN",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
      };
      utterance.lang = langMap[lang] || "en-US";
      // Assign voice
      const voices = synth.getVoices();
      utterance.voice = voices.find((v) => v.lang === utterance.lang) || voices[0];
      utterance.onend = () => {
        index++;
        speakNextSentence(); // Recursively speak next sentence
      };
      // Speak the text
      synth.speak(utterance);
    }

    speakNextSentence();
  };




  const startSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = selectedLanguage;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      const translatedText = await translateText(transcript, "en");
      setQuestion(translatedText);
    };

    recognition.start();
  };
  // Function to ask a question
  const askQuestionUrl = async () => {
    if (!question.trim()) return alert("Please enter a question.");
    setIsLoading(true);
    try {
      const res = await fetch(`https://api.harshita.click/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      if (res.ok) {

        const translatedResponse = await translateText(data.answer, selectedLanguage);
        toast.success("Answer retrieved!");
        setAnswer(translatedResponse);
        setIsLoading(false);
        // textToSpeech(translatedResponse, selectedLanguage);
      } else {
        toast.error("Error retrieving answer.");;
      }
    } catch (error) {
      toast.error("Error retrieving answer.Network Error");;
    }
  };



  const [sources, setSources] = useState("");
  const [pdfs, setPdfs] = useState<File[]>([]);  
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setPdfs([...pdfs, ...Array.from(event.target.files)]); // Append new files
    }else{
      setPdfs([])
    }
  };
  const removeFile = (index: number) => {
    if (!pdfs) return;
    const newFiles = Array.from(pdfs).filter((_, i) => i !== index);
    
    setPdfs(newFiles);
  };
  
  const uploadPDFs = async () => {
    if (pdfs.length === 0) {
        toast.error("Please select at least one PDF file.");
        return;
    }

    const formData = new FormData();
    pdfs.forEach((file) => formData.append("files", file));
    setIsLoading(true);

    try {
      const token = await getToken({ template: "first" });
              console.log("Clerk Token:", token);  // ✅ Log token for debugging

        if (!token) {
            toast.error("Failed to retrieve authentication token.");
            setIsLoading(false);
            return;
        }

        const response = await axios.post("https://api.harshita.click/upload_pdfs/", formData, {
            headers: {
                Authorization: `Bearer ${token}`, // ✅ Pass token in headers
            },
        });

        setTaskId(response.data.task_id);
        setIsLoading(false);
        toast.success("PDFs uploaded successfully! Processing started.");
    } catch (error) {
        toast.error("Error uploading PDFs. Please try again.");
        console.error("❌ Upload Error:", error);
    }
};


  // ✅ Ask a question
  const askQuestion = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question.");
      return;
    }
    setIsLoading(true);
    try {
      const token = await getToken({ template: "first" });

      const response = await axios.post("https://api.harshita.click/ask_pdf", { question },{
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Pass token in headers
      },
      });
      const translatedResponse = await translateText(response.data.answer, selectedLanguage);
      setAnswerPDF(translatedResponse);
      // setAnswer();
      setSources(response.data.sources || "");
      toast.success("Answer retrieved!");
      setIsLoading(false);
    } catch (error) {
      toast.error("Error retrieving answer.");
      console.error(error);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 ">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="py-10">
          <div className="flex justify-center items-center  px-4">
            <motion.h1
              className="relative text-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold overflow-hidden"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              Vectra<span className="text-gray-700">Mind</span>
              {/* Shining Effect */}
              <motion.div
                className="absolute top-0 left-[-100%] w-[20%] h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
                animate={{ left: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.h1>

          </div>
          <div className="flex justify-center items-center text-center px-4">
            <motion.p
              className="mt-4 text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 font-light italic max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            >
              Transform URLs & PDFs into a <span className="font-bold"> Powerful Vector Database </span>
              and get instant answers from your documents with <span className="font-bold">  MultiLingiual Support.</span>
            </motion.p>
          </div>
        </div>
        <div className="md:max-w-[60%] mx-auto border rounded-xl shadow-lg bg-white">
          <div className="flex justify-around mb-4">
            <button
              className={`relative px-4 py-2  w-[50%] ${defaults === "Urls" ? "text-black font-semibold border-b-2 border-black bg-slate-50" : "text-gray-500"
                }`}
              onClick={() => setDefaults("Urls")}
            >
              URL

            </button>

            <button
              className={`relative px-4 py-2  w-[50%] ${defaults === "PDF" ? "text-black font-semibold border-b-2 border-black bg-slate-50" : "text-gray-500"
                }`}
              onClick={() => setDefaults("PDF")}
            >
              PDF

            </button>
          </div>


          {defaults === "Urls" ? (
            <FaissChatbot
              urls={urls}
              isLoading={isLoading}
              setUrls={setUrls}
              status={status}
              initializeFaiss={initializeFaiss}
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
              question={question}
              setQuestion={setQuestion}
              askQuestionUrl={askQuestionUrl}
              isRecording={isRecording}
              startSpeechRecognition={startSpeechRecognition}
              answer={answer}
              textToSpeech={textToSpeech}
            />
          )
            :
            (

                <FaissChatbotPDF
                removeFile={removeFile}
                pdfs={pdfs}
                  handleFileChange={handleFileChange}
                  uploadPDFs={uploadPDFs}
                  isLoading={isLoading}
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                  question={question}
                  setQuestion={setQuestion}
                  isRecording={isRecording}
                  startSpeechRecognition={startSpeechRecognition}
                  answer={answerPDF}
                  textToSpeech={textToSpeech}
                  taskId={taskId}
                  askQuestion={askQuestion}
                />
                
            )}
        </div>
      </div>
    </>
  );
}
