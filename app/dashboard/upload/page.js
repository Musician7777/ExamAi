'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineUpload, HiOutlineDocumentText, HiOutlinePhotograph, HiOutlineCheck } from 'react-icons/hi';
import styles from './upload.module.css';

const steps = ['Upload File', 'Extract Text', 'Detect Sections', 'Analyze Pattern', 'Generate Exam'];

export default function UploadPage() {
    const router = useRouter();
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = (f) => {
        if (f) {
            setFile(f);
        }
    };

    const handleProcess = async () => {
        setProcessing(true);
        for (let i = 0; i < steps.length; i++) {
            setCurrentStep(i);
            await new Promise(r => setTimeout(r, 1500));
        }

        // Generate mock exam from "pattern"
        const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'generate-exam', config: { examType: 'Uploaded Pattern', totalQuestions: 20 } }),
        });
        const exam = await res.json();
        sessionStorage.setItem('currentExam', JSON.stringify(exam));
        router.push('/dashboard/exam/live');
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
                        <input id="fileInput" type="file" hidden accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" onChange={(e) => handleFile(e.target.files[0])} />
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
                                <h3>Drop your file here</h3>
                                <p>or click to browse</p>
                                <div className={styles.formats}>
                                    <span>PDF</span>
                                    <span>DOCX</span>
                                    <span>PNG</span>
                                    <span>JPG</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {file && (
                        <button className={styles.processBtn} onClick={handleProcess}>
                            Analyze & Generate Exam
                        </button>
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
