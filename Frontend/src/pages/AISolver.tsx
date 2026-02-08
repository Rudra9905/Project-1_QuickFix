import { useState, useRef } from 'react';
import { Upload, Search, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { analyzeProblem, ProblemAnalysisResponse } from '../services/aiService';
import { useNavigate } from 'react-router-dom';

export function AISolver() {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ProblemAnalysisResponse | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setResult(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleAnalyze = async () => {
        if (!image) return;

        setLoading(true);
        try {
            const data = await analyzeProblem(image);
            setResult(data);
            toast.success('Analysis complete!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to analyze the image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        AI Repair Assistant
                    </h1>
                    <p className="mt-4 text-lg text-gray-500">
                        Upload a photo of your household problem, and our AI will identify the issue and find the right expert for you.
                    </p>
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-gray-100">
                    <div
                        onClick={triggerFileInput}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        {preview ? (
                            <div className="relative inline-block">
                                <img src={preview} alt="Preview" className="max-h-64 rounded-lg shadow-md mx-auto" />
                                <p className="mt-4 text-sm text-gray-500">Click or Drag to replace</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="mx-auto h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                    <Upload className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-gray-900">
                                        Drop your image here, or <span className="text-blue-600">browse</span>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, WEBP</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleAnalyze}
                            disabled={!image || loading}
                            className={`flex items-center space-x-2 px-8 py-3 rounded-full text-white font-medium text-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${!image || loading
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <Search className="h-5 w-5" />
                                    <span>Analyze Problem</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                {result && (
                    <div className="space-y-8 animate-fade-in-up">

                        {/* Analysis Card */}
                        <div className="bg-white rounded-2xl shadow-lg border-l-4 border-indigo-500 p-6 overflow-hidden relative">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 z-0"></div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-start md:space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                        <CheckCircle className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="flex-1 mt-4 md:mt-0">
                                    <h3 className="text-xl font-bold text-gray-900">Diagnosis Complete</h3>
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-start">
                                            <span className="font-semibold w-24 text-gray-600 uppercase text-xs tracking-wider mt-1">Issue:</span>
                                            <p className="text-gray-800 text-lg">{result.issueDescription}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-semibold w-24 text-gray-600 uppercase text-xs tracking-wider">Expertise:</span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                {result.detectedServiceType}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <h2 className="text-2xl font-bold text-gray-900">Recommended Experts</h2>

                        {result.recommendedProviders.length === 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-center space-x-3">
                                <AlertCircle className="h-6 w-6 text-yellow-600" />
                                <p className="text-yellow-700">No specific providers found online for this category right now. You can try browsing all providers.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {result.recommendedProviders.map((provider) => (
                                    <div
                                        key={provider.id}
                                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                                        onClick={() => navigate(`/select-provider?preselect=${provider.id}`)}
                                    >
                                        <div className="aspect-w-16 aspect-h-9 bg-gray-200 h-48 overflow-hidden">
                                            <img
                                                src={provider.profilePhotoUrl || `https://ui-avatars.com/api/?name=${provider.user.firstName}+${provider.user.lastName}&background=random`}
                                                alt="Provider"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {provider.user.firstName} {provider.user.lastName}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">{provider.user.city}</p>
                                                </div>
                                                <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
                                                    <span className="text-yellow-600 font-bold text-sm">★</span>
                                                    <span className="ml-1 text-gray-700 font-medium text-sm">{provider.rating.toFixed(1)}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium uppercase">
                                                    {provider.serviceType}
                                                </span>
                                                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md font-medium">
                                                    Available
                                                </span>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                                <span className="text-lg font-bold text-gray-900">${provider.basePrice}<span className="text-sm font-normal text-gray-500">/hr</span></span>
                                                <button className="text-blue-600 text-sm font-medium hover:underline">View Profile →</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
