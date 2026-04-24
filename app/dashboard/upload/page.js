'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { secureFetch } from '@/lib/client-csrf';
import clientLogger from '@/lib/client-logger';
import { trackPdfUpload } from '@/lib/ga';

const steps = ['Upload File', 'Extract Text', 'Detect Sections', 'Analyze Pattern', 'Generate Exam'];

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState('20');

  const handleFile = (f) => {
    if (f) {
      setFile(f);
      setError(null);
      setAnalysis(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setCurrentStep(0);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setCurrentStep(1);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('totalQuestions', totalQuestions);
      setCurrentStep(2);
      const res = await secureFetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setCurrentStep(3);
      await new Promise((r) => setTimeout(r, 800));
      if (data.analysis) {
        setAnalysis(data.analysis);
        trackPdfUpload({
          pageCount: data.analysis.pageCount || 0,
          detectedQuestions: data.analysis.detectedQuestions || 0,
        });
      }
      setCurrentStep(4);
      await new Promise((r) => setTimeout(r, 500));
      if (data.exam) {
        sessionStorage.setItem('currentExam', JSON.stringify(data.exam));
        router.push('/dashboard/exam/live');
      } else {
        setProcessing(false);
        setError('PDF parsed but exam generation requires a Gemini API key.');
      }
    } catch (err) {
      clientLogger.error('Upload error:', err);
      setError(err.message || 'Failed to process file');
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6 text-indigo-400" /> Upload <span className="gradient-text">Exam Pattern</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload a previous year question paper and our AI will learn its pattern to generate a similar exam.
        </p>
      </div>

      {!processing ? (
        <>
          <Card
            className={cn(
              'p-12 flex flex-col items-center justify-center text-center cursor-pointer border-dashed border-2 transition-all',
              dragOver
                ? 'border-indigo-500 bg-indigo-500/5'
                : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'hover:border-indigo-500/30'
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input id="fileInput" type="file" hidden accept=".pdf" onChange={(e) => handleFile(e.target.files[0])} />
            {file ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold">{file.name}</h4>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <>
                <span className="text-4xl mb-3">📄</span>
                <h3 className="text-lg font-semibold">Drop your PDF here</h3>
                <p className="text-sm text-muted-foreground mb-3">or click to browse</p>
                <span className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground">PDF</span>
              </>
            )}
          </Card>

          {file && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Questions to generate:</Label>
                <Select value={totalQuestions} onValueChange={setTotalQuestions}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="brand" onClick={handleProcess} className="gap-2">
                <Upload className="h-4 w-4" /> Analyze & Generate Exam
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analysis && (
            <Card className="p-6 space-y-3">
              <h3 className="font-semibold">📊 Document Analysis</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                  <span className="text-muted-foreground">Pages</span>
                  <strong>{analysis.pageCount}</strong>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                  <span className="text-muted-foreground">Detected Questions</span>
                  <strong>{analysis.detectedQuestions || 'N/A'}</strong>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                  <span className="text-muted-foreground">Sections</span>
                  <strong>{analysis.detectedSections?.join(', ') || 'None detected'}</strong>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                  <span className="text-muted-foreground">Multiple Choice</span>
                  <strong>{analysis.patterns?.hasMultipleChoice ? 'Yes' : 'No'}</strong>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-8">
          <h2 className="text-lg font-semibold mb-6 text-center">Processing Your Document</h2>
          <div className="space-y-4 max-w-md mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
                    i < currentStep
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : i === currentStep
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {i < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : i === currentStep ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn('text-sm', i <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground')}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="mt-6" />
        </Card>
      )}
    </div>
  );
}
