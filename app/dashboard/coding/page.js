'use client';
import Link from 'next/link';
import styles from './coding.module.css';

const problems = [
    { id: 1, title: 'Two Sum', tags: ['Array', 'Hash Map'], difficulty: 'easy' },
    { id: 2, title: 'Valid Parentheses', tags: ['Stack', 'String'], difficulty: 'easy' },
    { id: 3, title: 'Merge Two Sorted Lists', tags: ['Linked List'], difficulty: 'easy' },
    { id: 4, title: 'Maximum Subarray', tags: ['Array', 'DP'], difficulty: 'medium' },
    { id: 5, title: 'Binary Tree Level Order Traversal', tags: ['Tree', 'BFS'], difficulty: 'medium' },
    { id: 6, title: 'Longest Palindromic Substring', tags: ['String', 'DP'], difficulty: 'medium' },
    { id: 7, title: 'LRU Cache', tags: ['Hash Map', 'DLL'], difficulty: 'hard' },
    { id: 8, title: 'Median of Two Sorted Arrays', tags: ['Binary Search'], difficulty: 'hard' },
    { id: 9, title: 'Trapping Rain Water', tags: ['Array', 'Two Pointer'], difficulty: 'hard' },
    { id: 10, title: 'Reverse Linked List', tags: ['Linked List'], difficulty: 'easy' },
];

export default function CodingPage() {
    return (
        <div className={styles.codingPage}>
            <h1>💻 Coding <span className="gradient-text">Challenges</span></h1>
            <p>Practice DSA, debugging, and system design problems with an integrated code editor.</p>

            <div className={styles.problemList}>
                {problems.map((p) => (
                    <Link key={p.id} href={`/dashboard/coding/${p.id}`} className={styles.problemCard}>
                        <div className={styles.problemLeft}>
                            <div className={styles.problemNum}>{p.id}</div>
                            <div className={styles.problemInfo}>
                                <h4>{p.title}</h4>
                                <div className={styles.problemTags}>
                                    {p.tags.map((t, i) => <span key={i} className={styles.problemTag}>{t}</span>)}
                                </div>
                            </div>
                        </div>
                        <div className={styles.problemRight}>
                            <span className={`${styles.diffBadge} ${styles[p.difficulty]}`}>{p.difficulty}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
