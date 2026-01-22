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
    isProcessingPDF?: boolean;
    pdfProcessingStatus?: string;
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
    isProcessingPDF = false,
    pdfProcessingStatus = "",
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

                {isProcessingPDF && (
                    <div className="mt-5 p-4 bg-blue-900/30 border border-blue-500 rounded-md">
                        <div className="flex items-center gap-3">
                            <Loader2 className="animate-spin text-blue-400" size={20} />
                            <div className="flex-1">
                                <p className="text-blue-300 font-semibold">Processing PDFs...</p>
                                <p className="text-blue-400 text-sm mt-1">
                                    Status: {pdfProcessingStatus || "Processing..."}
                                </p>
                                <p className="text-blue-400/70 text-xs mt-1">
                                    Please wait. Questions will be enabled once processing is complete.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!isProcessingPDF && pdfProcessingStatus === "Completed" && taskId && (
                    <div className="mt-5 p-3 bg-green-900/30 border border-green-500 rounded-md">
                        <p className="text-green-300 font-semibold">✓ Processing Complete!</p>
                        <p className="text-green-400 text-sm mt-1">You can now ask questions about your PDFs.</p>
                    </div>
                )}

                {taskId &&
                    <div className="mt-5">
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                            disabled={isLoading || isProcessingPDF}
                        >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                        </select>
                        <div className="flex items-center mt-3 bg-gray-800 border border-gray-700 rounded-md">
                            <input
                                className={`w-full p-3 bg-transparent text-white outline-none ${isProcessingPDF ? "opacity-50 cursor-not-allowed" : ""}`}
                                type="text"
                                placeholder={isProcessingPDF ? "Processing PDFs... Please wait" : "Ask a question..."}
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                disabled={isLoading || isProcessingPDF}
                            />
                            {/* Voice Input */}
                            <button
                                className={`p-3 mr-1 ${isRecording ? "bg-red-500" : "bg-blue-500"
                                    }  text-white transition disabled:opacity-50`}
                                onClick={startSpeechRecognition}
                                disabled={isLoading || isProcessingPDF}
                            >
                                <Mic size={20} className="" />

                            </button>
                            <button
                                className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-r-md transition disabled:opacity-50"
                                onClick={askQuestion}
                                disabled={isLoading || !question.trim() || isProcessingPDF}
                                title={isProcessingPDF ? "Please wait for PDF processing to complete" : ""}
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