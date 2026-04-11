'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineUpload, HiOutlineDocumentText, HiOutlineCheck, HiOutlineExclamation } from 'react-icons/hi';
import styles from './upload.module.css';

const steps = ['Upload File', 'Extract Text', 'Detect Sections', 'Analyze Pattern', 'Generate Exam'];

export default function UploadPage() {
    const router = useRouter();
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [totalQuestions, setTotalQuestions] = useState(20);

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
            // Step 1: Upload
            await new Promise(r => setTimeout(r, 500));
            setCurrentStep(1);

            // Steps 2-4: Send to server for real parsing
            const formData = new FormData();
            formData.append('file', file);
            formData.append('totalQuestions', totalQuestions.toString());

            setCurrentStep(2);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setCurrentStep(3);
            await new Promise(r => setTimeout(r, 800));

            if (data.analysis) {
                setAnalysis(data.analysis);
            }

            setCurrentStep(4);
            await new Promise(r => setTimeout(r, 500));

            if (data.exam) {
                // Got a generated exam — go to live
                sessionStorage.setItem('currentExam', JSON.stringify(data.exam));
                router.push('/dashboard/exam/live');
            } else {
                // Only got analysis (no API key or generation failed)
                setProcessing(false);
                setError('PDF parsed successfully but exam generation requires a Gemini API key. You can configure one in .env.local');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to process file');
            setProcessing(false);
        }
    };

    return (
        <div className={styles.uploadPage}>
            <h1><HiOutlineUpload style={{ display: 'inline' }} /> Upload <span className="gradient-text">Exam Pattern</span></h1>
            <p>Upload a previous year question paper and our AI will learn its pattern to generate a similar exam.</p>

            {!processing ? (
                <>
                    <div
                        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''} ${file ? styles.hasFile : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                        onClick={() => document.getElementById('fileInput').click()}
                    >
                        <input id="fileInput" type="file" hidden accept=".pdf" onChange={(e) => handleFile(e.target.files[0])} />
                        {file ? (
                            <div className={styles.fileInfo}>
                                <HiOutlineDocumentText className={styles.fileIcon} />
                                <div>
                                    <h4>{file.name}</h4>
                                    <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.dropContent}>
                                <div className={styles.dropIcon}>📄</div>
                                <h3>Drop your PDF here</h3>
                                <p>or click to browse</p>
                                <div className={styles.formats}>
                                    <span>PDF</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {file && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Questions to generate:</label>
                                <select
                                    value={totalQuestions}
                                    onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
                                    style={{ padding: '6px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={30}>30</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                            <button className={styles.processBtn} onClick={handleProcess}>
                                Analyze & Generate Exam
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorBanner}>
                            <HiOutlineExclamation /> {error}
                        </div>
                    )}

                    {analysis && (
                        <div className={styles.analysisCard}>
                            <h3>📊 Document Analysis</h3>
                            <div className={styles.analysisGrid}>
                                <div><strong>Pages:</strong> {analysis.pageCount}</div>
                                <div><strong>Detected Questions:</strong> {analysis.detectedQuestions || 'N/A'}</div>
                                <div><strong>Sections:</strong> {analysis.detectedSections?.join(', ') || 'None detected'}</div>
                                <div><strong>Multiple Choice:</strong> {analysis.patterns?.hasMultipleChoice ? 'Yes' : 'No'}</div>
                                <div><strong>Negative Marking:</strong> {analysis.patterns?.hasNegativeMarking ? 'Yes' : 'No'}</div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.processingCard}>
                    <h2>Processing Your Document</h2>
                    <div className={styles.stepsContainer}>
                        {steps.map((step, i) => (
                            <div key={i} className={`${styles.step} ${i <= currentStep ? styles.completed : ''} ${i === currentStep ? styles.active : ''}`}>
                                <div className={styles.stepIcon}>
                                    {i < currentStep ? <HiOutlineCheck /> : i === currentStep ? <div className={styles.miniSpinner} /> : <span>{i + 1}</span>}
                                </div>
                                <span>{step}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
                    </div>
                </div>
            )}
        </div>
    );
}
