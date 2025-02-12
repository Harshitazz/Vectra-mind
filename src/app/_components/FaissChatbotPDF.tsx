import { Mic, Send, Volume2, Loader2, File, X } from "lucide-react";
import { useEffect } from "react";

interface FaissChatbotProps {
    taskId: string
    isLoading: boolean;
    uploadPDFs: () => void;
    selectedLanguage: string;
    setSelectedLanguage: (language: string) => void;
    question: string;
    setQuestion: (question: string) => void;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    isRecording: boolean;
    startSpeechRecognition: () => void;
    answer: string;
    textToSpeech: (text: string, language: string) => void;
    askQuestion: () => void
    pdfs: File[];
    removeFile:(index:number)=>void
    // setPdfs: (urls: string[]) => void;
}

const FaissChatbotPDF: React.FC<FaissChatbotProps> = ({
    handleFileChange,
    removeFile,
    pdfs,
    askQuestion,
    taskId,
    uploadPDFs,
    isLoading,
    selectedLanguage,
    setSelectedLanguage,
    question,
    setQuestion,
    isRecording,
    startSpeechRecognition,
    answer,
    textToSpeech,
}) => {
    return (
        <div className="relative flex flex-col items-center min-h-[50vh] bg-black text-white p-6">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                    <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                        <p className="mt-2 text-white text-lg font-semibold">Loading...</p>
                    </div>
                </div>
            )}

            <div className="w-full  bg-gray-900 rounded-lg p-6 shadow-lg relative">
                <h1 className="text-2xl font-bold text-center mb-4">PDF-based Question Answering</h1>
                <label className="block font-medium">Upload PDFs:</label>
                <input type="file" multiple
                    accept="application/pdf" onChange={handleFileChange} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400"
                />

                <ul className="mt-2 text-white">
                    {pdfs && Array.from(pdfs).map((file, index) => (
                        <li key={index} className="text-sm flex gap-2 items-center justify-between bg-gray-800 p-2 rounded-md">
                            <div className="flex items-center gap-2">
                                <File className="w-4 h-4" /> {file.name}
                            </div>
                            <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                                <X className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>


                <button onClick={uploadPDFs}
                    className="mt-3 w-full flex items-center justify-center p-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition disabled:opacity-50"
                >
                    Upload PDFs
                </button>

                {taskId &&
                    <div className="mt-5">
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
                                onClick={askQuestion}
                                disabled={isLoading || !question.trim()}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                }

                {answer && !isLoading &&
                    (
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
    )
}

export default FaissChatbotPDF;