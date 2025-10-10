import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UploadBox } from '../components/UploadBox';
import { ProgressBar } from '../components/ProgressBar';
import { SceneGeneratorService } from '../services/SceneGeneratorService';
import { IndexedDBService } from '../services/IndexedDBService';
import { v4 as uuidv4 } from 'uuid';
export function InputPage() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const handleFileSelect = async (file: File) => {
    try {
      setIsProcessing(true);
      setStatus('Analyzing image...');
      setProgress(10);
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      // Process the image
      setStatus('Extracting text content...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('Generating scene graph...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('Creating narration script...');
      const result = await SceneGeneratorService.processImage(file);
      // Save to IndexedDB
      const lessonId = uuidv4();
      await IndexedDBService.saveLesson({
        id: lessonId,
        title: `Lesson from ${file.name}`,
        timestamp: Date.now(),
        nodes: result.nodes,
        links: result.links,
        script: result.script
      });
      clearInterval(progressInterval);
      setProgress(100);
      setStatus('Processing complete!');
      // Navigate to output page
      setTimeout(() => {
        navigate('/output', {
          state: {
            result
          }
        });
      }, 1000);
    } catch (error) {
      console.error('Error processing file:', error);
      setStatus('Error processing file. Please try again.');
    }
  };
  const handleTextInput = async (text: string) => {
    try {
      setIsProcessing(true);
      setStatus('Analyzing text...');
      setProgress(20);
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 500);
      // Process the text
      setStatus('Identifying key concepts...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('Generating scene graph...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('Creating narration script...');
      const result = await SceneGeneratorService.processText(text);
      // Save to IndexedDB
      const lessonId = uuidv4();
      await IndexedDBService.saveLesson({
        id: lessonId,
        title: `Lesson from text (${new Date().toLocaleDateString()})`,
        timestamp: Date.now(),
        nodes: result.nodes,
        links: result.links,
        script: result.script
      });
      clearInterval(progressInterval);
      setProgress(100);
      setStatus('Processing complete!');
      // Navigate to output page
      setTimeout(() => {
        navigate('/output', {
          state: {
            result
          }
        });
      }, 1000);
    } catch (error) {
      console.error('Error processing text:', error);
      setStatus('Error processing text. Please try again.');
    }
  };
  return <div className="max-w-4xl mx-auto">
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5
    }}>
        <h1 className="text-3xl font-bold mb-2">Generate Scene & Script</h1>
        <p className="text-gray-600 mb-8">
          Upload a textbook image or enter text to generate an educational scene
          graph and narration script.
        </p>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <UploadBox onFileSelect={handleFileSelect} onTextInput={handleTextInput} />
        </div>
        {isProcessing && <div className="mt-8">
            <ProgressBar progress={progress} status={status} />
          </div>}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            How it works
          </h3>
          <p className="text-blue-700 mb-2">
            Our Educational Scene & Script Generator uses advanced AI to:
          </p>
          <ul className="list-disc pl-5 text-blue-700">
            <li>Extract meaningful academic content using OCR and NLP</li>
            <li>Understand relationships between concepts</li>
            <li>Enrich abstract ideas with real-world examples</li>
            <li>Generate structured scene graphs and narration scripts</li>
          </ul>
        </div>
      </motion.div>
    </div>;
}