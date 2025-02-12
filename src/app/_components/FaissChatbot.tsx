import { Mic, Send, Volume2, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface FaissChatbotProps {
    urls: string[];
    setUrls: (urls: string[]) => void;
    status: string;
    isLoading: boolean;
    initializeFaiss: () => void;
    selectedLanguage: string;
    setSelectedLanguage: (language: string) => void;
    question: string;
    setQuestion: (question: string) => void;
    askQuestionUrl: () => void;
    isRecording: boolean;
    startSpeechRecognition: () => void;
    answer: string;
    textToSpeech: (text: string, language: string) => void;
}

const FaissChatbot: React.FC<FaissChatbotProps> = ({
    urls,
    setUrls,
    status,
    isLoading,
    initializeFaiss,
    selectedLanguage,
    setSelectedLanguage,
    question,
    setQuestion,
    askQuestionUrl,
    isRecording,
    startSpeechRecognition,
    answer,
    textToSpeech,
}) => {


    return (
        <div className="relative flex flex-col items-center min-h-[50vh] bg-black text-white p-6">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                    <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                        <p className="mt-2 text-white text-lg font-semibold">Loading...</p>
                    </div>
                </div>
            )}

            {/* Chatbot UI */}
            <div className="w-full  bg-gray-900 rounded-lg p-6 shadow-lg relative">
                <h1 className="text-2xl font-bold text-center mb-4">FAISS Chatbot</h1>

                {/* Input URLs */}
                <textarea
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400"
                    rows={3}
                    placeholder="Enter URLs (comma separated)"
                    value={urls.join(",")}
                    onChange={(e) => setUrls(e.target.value.split(","))}
                    disabled={isLoading}
                />

                {/* Initialize FAISS */}
                <button
                    className="mt-3 w-full flex items-center justify-center p-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition disabled:opacity-50"
                    onClick={initializeFaiss}
                    disabled={urls.filter((u) => u.trim()).length === 0 || isLoading}
                >
                    Initialize FAISS
                </button>


                {/* Question Section */}
                {status === "Completed" && (
                    <div className="mt-5">
                        {/* Language Selection */}
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                            disabled={isLoading}
                        >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                        </select>

                        {/* Question Input */}
                        <div className="flex items-center mt-3 bg-gray-800 border border-gray-700 rounded-md">
                            <input
                                className="w-full p-3 bg-transparent text-white outline-none"
                                type="text"
                                placeholder="Ask a question..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                disabled={isLoading}
                            />
                            {/* Voice Input */}
                            <button
                                className={`p-3 mr-1 ${isRecording ? "bg-red-500" : "bg-blue-500"
                                    }  text-white transition`}
                                onClick={startSpeechRecognition}
                                disabled={isLoading}
                            >
                                <Mic size={20} className="" />

                            </button>
                            <button
                                className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-r-md transition disabled:opacity-50"
                                onClick={askQuestionUrl}
                                disabled={isLoading || !question.trim()}
                            >
                                <Send size={20} />
                            </button>
                        </div>


                    </div>
                )}

                {/* Show Answer */}
                {answer && !isLoading && (
                    <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-md">
                        <p className="text-lg text-gray-300"> Answer:</p>
                        <p className="mt-1 text-white font-medium">{answer}</p>

                        {/* Text-to-Speech */}
                        <button
                            className="mt-3 flex items-center p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition"
                            onClick={() => textToSpeech(answer, selectedLanguage)}
                        >
                            <Volume2 size={20} className="mr-2" />
                            Speak
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FaissChatbot;
