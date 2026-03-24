import Link from 'next/link';
import { FaTwitter, FaGithub, FaLinkedin, FaYoutube } from 'react-icons/fa';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerGrid}>
                <div className={styles.brand}>
                    <h3>Exam<span className="gradient-text">AI</span></h3>
                    <p>AI-powered exam generation and interview simulation platform. Built for aspirants, students, and hiring companies.</p>
                    <div className={styles.socials}>
                        <a href="#" className={styles.socialBtn} aria-label="Twitter"><FaTwitter /></a>
                        <a href="#" className={styles.socialBtn} aria-label="GitHub"><FaGithub /></a>
                        <a href="#" className={styles.socialBtn} aria-label="LinkedIn"><FaLinkedin /></a>
                        <a href="#" className={styles.socialBtn} aria-label="YouTube"><FaYoutube /></a>
                    </div>
                </div>
                <div className={styles.column}>
                    <h4>Product</h4>
                    <Link href="/#features">Features</Link>
                    <Link href="/#pricing">Pricing</Link>
                    <Link href="/dashboard">Dashboard</Link>
                    <Link href="/dashboard/coding">Coding Tests</Link>
                </div>
                <div className={styles.column}>
                    <h4>Exams</h4>
                    <Link href="/dashboard/generate">Government</Link>
                    <Link href="/dashboard/generate">Private Hiring</Link>
                    <Link href="/dashboard/generate">Campus Placement</Link>
                    <Link href="/dashboard/interview">Interviews</Link>
                </div>
                <div className={styles.column}>
                    <h4>Company</h4>
                    <a href="#">About</a>
                    <a href="#">Blog</a>
                    <a href="#">Careers</a>
                    <a href="#">Contact</a>
                </div>
            </div>
            <div className={styles.footerBottom}>
                <p>&copy; {new Date().getFullYear()} ExamAI. All rights reserved.</p>
                <div>
                    <a href="#">Privacy</a> &nbsp;·&nbsp; <a href="#">Terms</a>
                </div>
            </div>
        </footer>
    );
}
