"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { motion } from "framer-motion";
import FaissChatbot from "./_components/FaissChatbot";
import FaissChatbotPDF from "./_components/FaissChatbotPDF";
import { useUser ,useAuth} from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://news-ai-394571818909.us-central1.run.app";

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
  const [isProcessingPDF, setIsProcessingPDF] = useState<boolean>(false); // Track PDF processing state
  const [pdfProcessingStatus, setPdfProcessingStatus] = useState<string>(""); // Track processing status

  const initializeFaiss = async () => {
    setStatus("Initializing...");
    setAnswer(""); // Clear previous answers
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/initialize_faiss`, {
        method: "POST",
        body: JSON.stringify({ urls }),
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

  const checkTaskStatus = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/task_status/${taskId}`);
        const data = await res.json();
        setStatus(data.status);

        if (data.status === "Completed") {
          clearInterval(interval);
          setIsLoading(false);
        }
      } catch (error) {
        clearInterval(interval);
        alert("Error checking task status");
      }
    }, 3000);
  };

  const [isRecording, setIsRecording] = useState(false);

  const splitTextIntoChunks = (text: string, maxLength: number = 450): string[] => {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';
    const sentences = text.split(/([.!?]\s+)/);
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    const finalChunks: string[] = [];
    for (const chunk of chunks) {
      if (chunk.length <= maxLength) {
        finalChunks.push(chunk);
      } else {
        const words = chunk.split(/\s+/);
        let wordChunk = '';
        for (const word of words) {
          if (wordChunk.length + word.length + 1 > maxLength && wordChunk.length > 0) {
            finalChunks.push(wordChunk.trim());
            wordChunk = word;
          } else {
            wordChunk += (wordChunk ? ' ' : '') + word;
          }
        }
        if (wordChunk.trim().length > 0) {
          finalChunks.push(wordChunk.trim());
        }
      }
    }

    return finalChunks.filter(chunk => chunk.length > 0);
  };

  const translateWithMyMemory = async (text: string, targetLang: string): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
      const response = await axios.get(url, {
        signal: controller.signal,
        timeout: 8000,
      });
      
      clearTimeout(timeoutId);
      
      if (response.data?.responseData?.translatedText) {
        return response.data.responseData.translatedText;
      }
      
      return null;
    } catch (error: any) {
      return null;
    }
  };

  const translateText = async (text: string, targetLang: string) => {
    if (targetLang === "en" || !text.trim()) {
      return text;
    }

    const langMap: Record<string, string> = {
      'hi': 'hi',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'pt': 'pt',
      'ru': 'ru',
      'ja': 'ja',
      'zh': 'zh',
      'ar': 'ar',
    };

    const mappedLang = langMap[targetLang] || targetLang;
    const MAX_CHUNK_LENGTH = 450;
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_LENGTH);

    if (chunks.length === 1) {
      const translated = await translateWithMyMemory(text, mappedLang);
      if (translated && translated.trim()) {
        return translated;
      }
    } else {
      const translatedChunks: string[] = [];
      for (const chunk of chunks) {
        const translated = await translateWithMyMemory(chunk, mappedLang);
        if (translated && translated.trim()) {
          translatedChunks.push(translated);
        } else {
          toast.info("Translation service unavailable. Showing answer in English.", {
            autoClose: 3000,
            toastId: 'translation-unavailable',
          });
          return text;
        }
      }
      if (translatedChunks.length === chunks.length) {
        return translatedChunks.join(' ');
      }
    }

    toast.info("Translation service unavailable. Showing answer in English.", {
      autoClose: 3000,
      toastId: 'translation-unavailable',
    });
    return text;
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
      const langMap: Record<string, string> = {
        en: "en-US",
        hi: "hi-IN",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
      };
      utterance.lang = langMap[lang] || "en-US";
      const voices = synth.getVoices();
      utterance.voice = voices.find((v) => v.lang === utterance.lang) || voices[0];
      utterance.onend = () => {
        index++;
        speakNextSentence();
      };
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
  const askQuestionUrl = async () => {
    if (!question.trim()) return alert("Please enter a question.");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/ask`, {
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
    setIsProcessingPDF(true); // Start processing state
    setPdfProcessingStatus("Uploading...");
    
    // Clear stale answers when new upload starts
    setAnswerPDF("");
    setSources("");
    setQuestion(""); // Also clear question to prevent confusion

    try {
      const token = await getToken({ template: "first" });

        if (!token) {
            toast.error("Failed to retrieve authentication token.");
            setIsLoading(false);
            setIsProcessingPDF(false);
            return;
        }

        const response = await axios.post(`${API_URL}/upload_pdfs/`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setTaskId(response.data.task_id);
        setIsLoading(false);
        setPdfProcessingStatus("Processing...");
        toast.success("PDFs uploaded successfully! Processing started.");
        checkPDFTaskStatus(response.data.task_id);
    } catch (error) {
        toast.error("Error uploading PDFs. Please try again.");
        setIsLoading(false);
        setIsProcessingPDF(false);
        setPdfProcessingStatus("");
    }
};

  const pdfPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (pdfPollIntervalRef.current) {
        clearInterval(pdfPollIntervalRef.current);
      }
    };
  }, []);

  const checkPDFTaskStatus = async (taskId: string) => {
    if (pdfPollIntervalRef.current) {
      clearInterval(pdfPollIntervalRef.current);
    }
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/task_status/${taskId}`);
        const data = await res.json();
        setPdfProcessingStatus(data.status);
        
        if (data.status === "Completed") {
          clearInterval(interval);
          pdfPollIntervalRef.current = null;
          setIsProcessingPDF(false);
          setPdfProcessingStatus("Completed");
          toast.success("PDF processing complete! You can now ask questions.");
        } else if (data.status === "Failed" || data.status?.startsWith("Failed:")) {
          clearInterval(interval);
          pdfPollIntervalRef.current = null;
          setIsProcessingPDF(false);
          setPdfProcessingStatus("Failed");
          toast.error("PDF processing failed. Please try uploading again.");
        }
      } catch (error) {
        clearInterval(interval);
        pdfPollIntervalRef.current = null;
        setIsProcessingPDF(false);
        setPdfProcessingStatus("");
      }
    }, 3000);
    
    pdfPollIntervalRef.current = interval;
  };


  const askQuestion = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question.");
      return;
    }
    
    if (isProcessingPDF) {
      toast.warning("Please wait for PDF processing to complete before asking questions.");
      return;
    }
    
    setIsLoading(true);
    try {
      const token = await getToken({ template: "first" });

      const response = await axios.post(`${API_URL}/ask_pdf`, { question },{
        headers: {
          Authorization: `Bearer ${token}`,
      },
      });
      const translatedResponse = await translateText(response.data.answer, selectedLanguage);
      setAnswerPDF(translatedResponse);
      setSources(response.data.sources || "");
      toast.success("Answer retrieved!");
      setIsLoading(false);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setIsLoading(false);
        const errorDetail = error.response?.data?.detail;
        let taskId: string | null = null;
        
        if (typeof errorDetail === 'object' && errorDetail?.task_id) {
          taskId = errorDetail.task_id;
        } else if (typeof errorDetail === 'string') {
          const taskIdMatch = errorDetail.match(/task\(s\)\s+([a-f0-9-]+)/i) || 
                             errorDetail.match(/task_status\/([a-f0-9-]+)/i);
          taskId = taskIdMatch ? taskIdMatch[1] : null;
        }
        
        toast.info("⏳ PDF is still processing. We'll automatically retry when ready...", {
          autoClose: 5000,
        });
        
        if (taskId) {
          pollAndRetryQuestion(taskId, question);
        } else {
          toast.warning("Please wait for processing to complete, then try again.", {
            autoClose: 8000,
          });
        }
      } else {
        toast.error("Error retrieving answer.");
        setIsLoading(false);
      }
    }
  };

  const pollAndRetryQuestion = async (taskId: string, questionToRetry: string) => {
    let pollCount = 0;
    const maxPolls = 60;
    
    const interval = setInterval(async () => {
      pollCount++;
      
      try {
        const res = await fetch(`${API_URL}/task_status/${taskId}`);
        const data = await res.json();
        
        if (data.status === "Completed") {
          clearInterval(interval);
          toast.success("Processing complete! Retrying your question...", { autoClose: 2000 });
          setIsLoading(true);
          try {
            const token = await getToken({ template: "first" });
            const response = await axios.post(
              `${API_URL}/ask_pdf`,
              { question: questionToRetry },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const translatedResponse = await translateText(response.data.answer, selectedLanguage);
            setAnswerPDF(translatedResponse);
            setSources(response.data.sources || "");
            toast.success("Answer retrieved!");
            setIsLoading(false);
          } catch (retryError: any) {
            toast.error("Error retrieving answer after retry.");
            setIsLoading(false);
          }
        } else if (data.status === "Failed" || data.status?.startsWith("Failed:")) {
          clearInterval(interval);
          toast.error("PDF processing failed. Please try uploading again.");
        } else if (pollCount >= maxPolls) {
          clearInterval(interval);
          toast.warning("Processing is taking longer than expected. Please try again later.");
        }
      } catch (error) {
        clearInterval(interval);
        toast.error("Error checking processing status.");
      }
    }, 3000);
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
                  isProcessingPDF={isProcessingPDF}
                  pdfProcessingStatus={pdfProcessingStatus}
                />
                
            )}
        </div>
      </div>
    </>
  );
}
