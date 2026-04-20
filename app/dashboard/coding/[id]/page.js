'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useNotification } from '@/app/components/BadgeNotification/BadgeNotification';
import { cacheInvalidate } from '@/lib/clientCache';
import clientLogger from '@/lib/client-logger';
import { trackCodingSubmit } from '@/lib/ga';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const problemsData = {
  1: {
    title: 'Two Sum',
    difficulty: 'easy',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    testCases: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' },
    ],
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n  // Write your solution here\n  \n}',
      python:
        'class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your solution here\n        pass',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};',
    },
  },
  2: {
    title: 'Valid Parentheses',
    difficulty: 'easy',
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: open brackets are closed by the same type of brackets, and open brackets are closed in the correct order. Every close bracket has a corresponding open bracket of the same type.",
    examples: [
      { input: 's = "()"', output: 'true', explanation: 'Simple matching pair.' },
      { input: 's = "()[]{}"', output: 'true', explanation: 'All brackets match in order.' },
      { input: 's = "(]"', output: 'false', explanation: 'Mismatched bracket types.' },
    ],
    constraints: ['1 <= s.length <= 10^4', "s consists of parentheses only '()[]{}'"],
    testCases: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
      { input: 's = "([)]"', output: 'false' },
      { input: 's = "{[]}"', output: 'true' },
    ],
    starterCode: {
      javascript: 'function isValid(s) {\n  // Write your solution here\n  \n}',
      python:
        'class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write your solution here\n        pass',
      java: 'class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        return false;\n    }\n}',
      cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n        return false;\n    }\n};',
    },
  },
  3: {
    title: 'Merge Two Sorted Lists',
    difficulty: 'easy',
    description:
      'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list. For this challenge, represent the linked lists as arrays.',
    examples: [
      {
        input: 'list1 = [1,2,4], list2 = [1,3,4]',
        output: '[1,1,2,3,4,4]',
        explanation: 'Both lists are merged in sorted order.',
      },
      { input: 'list1 = [], list2 = [0]', output: '[0]', explanation: 'First list is empty, return the second.' },
    ],
    constraints: [
      '0 <= list length <= 50',
      '-100 <= Node.val <= 100',
      'Both lists are sorted in non-decreasing order.',
    ],
    testCases: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' },
      { input: 'list1 = [], list2 = [0]', output: '[0]' },
      { input: 'list1 = [], list2 = []', output: '[]' },
      { input: 'list1 = [5], list2 = [1,2,4]', output: '[1,2,4,5]' },
    ],
    starterCode: {
      javascript:
        'function mergeTwoLists(list1, list2) {\n  // Write your solution here\n  // Treat list1 and list2 as sorted arrays\n  // Return a merged sorted array\n  \n}',
      python:
        'class Solution:\n    def mergeTwoLists(self, list1: list[int], list2: list[int]) -> list[int]:\n        # Write your solution here\n        pass',
      java: 'class Solution {\n    public int[] mergeTwoLists(int[] list1, int[] list2) {\n        // Write your solution here\n        return new int[]{};\n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> mergeTwoLists(vector<int>& list1, vector<int>& list2) {\n        // Write your solution here\n        return {};\n    }\n};',
    },
  },
  4: {
    title: 'Maximum Subarray',
    difficulty: 'medium',
    description:
      'Given an integer array nums, find the subarray with the largest sum, and return its sum. A subarray is a contiguous non-empty sequence of elements within an array.',
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum = 6.',
      },
      { input: 'nums = [1]', output: '1', explanation: 'Single element is the max subarray.' },
      { input: 'nums = [5,4,-1,7,8]', output: '23', explanation: 'The entire array is the max subarray.' },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    testCases: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6' },
      { input: 'nums = [1]', output: '1' },
      { input: 'nums = [5,4,-1,7,8]', output: '23' },
      { input: 'nums = [-1]', output: '-1' },
      { input: 'nums = [-2,-1]', output: '-1' },
    ],
    starterCode: {
      javascript: 'function maxSubArray(nums) {\n  // Write your solution here\n  \n}',
      python:
        'class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        # Write your solution here\n        pass',
      java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};',
    },
  },
  5: {
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'medium',
    description:
      "Given the root of a binary tree represented as an array (BFS order, null for missing nodes), return the level order traversal of its nodes' values (i.e., from left to right, level by level). For this challenge, the input is a BFS-array and you return a 2D array of levels.",
    examples: [
      {
        input: 'root = [3,9,20,null,null,15,7]',
        output: '[[3],[9,20],[15,7]]',
        explanation: 'Level 0: [3], Level 1: [9,20], Level 2: [15,7].',
      },
      { input: 'root = [1]', output: '[[1]]', explanation: 'Single node is one level.' },
    ],
    constraints: ['0 <= number of nodes <= 2000', '-1000 <= Node.val <= 1000'],
    testCases: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' },
      { input: 'root = [1]', output: '[[1]]' },
      { input: 'root = []', output: '[]' },
    ],
    starterCode: {
      javascript:
        'function levelOrder(root) {\n  // root is a BFS-array like [3,9,20,null,null,15,7]\n  // Return a 2D array of levels, e.g. [[3],[9,20],[15,7]]\n  \n}',
      python:
        'class Solution:\n    def levelOrder(self, root: list) -> list[list[int]]:\n        # root is a BFS-array like [3,9,20,None,None,15,7]\n        # Return a 2D array of levels\n        pass',
      java: 'class Solution {\n    // root is a BFS-array representation\n    public int[][] levelOrder(Integer[] root) {\n        // Write your solution here\n        return new int[][]{};\n    }\n}',
      cpp: 'class Solution {\npublic:\n    // root is a BFS-array representation\n    vector<vector<int>> levelOrder(vector<int>& root) {\n        // Write your solution here\n        return {};\n    }\n};',
    },
  },
  6: {
    title: 'Longest Palindromic Substring',
    difficulty: 'medium',
    description:
      'Given a string s, return the longest palindromic substring in s. A palindrome reads the same forward and backward.',
    examples: [
      { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also an accepted answer.' },
      { input: 's = "cbbd"', output: '"bb"', explanation: 'The longest palindromic substring is "bb".' },
    ],
    constraints: ['1 <= s.length <= 1000', 's consists of only digits and English letters.'],
    testCases: [
      { input: 's = "babad"', output: '"bab"' },
      { input: 's = "cbbd"', output: '"bb"' },
      { input: 's = "a"', output: '"a"' },
      { input: 's = "racecar"', output: '"racecar"' },
    ],
    starterCode: {
      javascript: 'function longestPalindrome(s) {\n  // Write your solution here\n  \n}',
      python:
        'class Solution:\n    def longestPalindrome(self, s: str) -> str:\n        # Write your solution here\n        pass',
      java: 'class Solution {\n    public String longestPalindrome(String s) {\n        // Write your solution here\n        return "";\n    }\n}',
      cpp: 'class Solution {\npublic:\n    string longestPalindrome(string s) {\n        // Write your solution here\n        return "";\n    }\n};',
    },
  },
  7: {
    title: 'LRU Cache',
    difficulty: 'hard',
    description:
      'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the function lruCache(capacity, operations, values) where operations is an array of ["put","put","get",...] and values is [[key,val],[key,val],[key],...]. Return an array of results (null for put, value or -1 for get).',
    examples: [
      {
        input:
          'capacity = 2, operations = ["put","put","get","put","get","put","get","get","get"], values = [[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
        output: '[null,null,1,null,-1,null,-1,3,4]',
        explanation: 'Standard LRU eviction behavior.',
      },
    ],
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      '0 <= value <= 10^5',
      'At most 2 * 10^5 calls to get and put.',
    ],
    testCases: [
      {
        input:
          'capacity = 2, operations = ["put","put","get","put","get","put","get","get","get"], values = [[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
        output: '[null,null,1,null,-1,null,-1,3,4]',
      },
      {
        input: 'capacity = 1, operations = ["put","put","get","get"], values = [[1,10],[2,20],[1],[2]]',
        output: '[null,null,-1,20]',
      },
    ],
    starterCode: {
      javascript:
        'function lruCache(capacity, operations, values) {\n  // Implement an LRU cache\n  // Return an array of results for each operation\n  // put -> null, get -> value or -1\n  \n}',
      python:
        'class Solution:\n    def lruCache(self, capacity: int, operations: list[str], values: list[list[int]]) -> list:\n        # Write your solution here\n        pass',
      java: 'class Solution {\n    public int[] lruCache(int capacity, String[] operations, int[][] values) {\n        // Write your solution here\n        return new int[]{};\n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> lruCache(int capacity, vector<string>& operations, vector<vector<int>>& values) {\n        // Write your solution here\n        return {};\n    }\n};',
    },
  },
  8: {
    title: 'Median of Two Sorted Arrays',
    difficulty: 'hard',
    description:
      'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).',
    examples: [
      {
        input: 'nums1 = [1,3], nums2 = [2]',
        output: '2',
        explanation: 'Merged array = [1,2,3] and median is 2.',
      },
      {
        input: 'nums1 = [1,2], nums2 = [3,4]',
        output: '2.5',
        explanation: 'Merged array = [1,2,3,4] and median is (2+3)/2 = 2.5.',
      },
    ],
    constraints: ['nums1.length == m', 'nums2.length == n', '0 <= m <= 1000', '0 <= n <= 1000', '1 <= m + n <= 2000'],
    testCases: [
      { input: 'nums1 = [1,3], nums2 = [2]', output: '2' },
      { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.5' },
      { input: 'nums1 = [0,0], nums2 = [0,0]', output: '0' },
      { input: 'nums1 = [], nums2 = [1]', output: '1' },
    ],
    starterCode: {
      javascript: 'function findMedianSortedArrays(nums1, nums2) {\n  // Write your solution here\n  \n}',
      python:
        'class Solution:\n    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:\n        # Write your solution here\n        pass',
      java: 'class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        // Write your solution here\n        return 0.0;\n    }\n}',
      cpp: 'class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        // Write your solution here\n        return 0.0;\n    }\n};',
    },
  },
  9: {
    title: 'Trapping Rain Water',
    difficulty: 'hard',
    description:
      'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    examples: [
      {
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: '6 units of rain water are trapped.',
      },
      { input: 'height = [4,2,0,3,2,5]', output: '9', explanation: '9 units of rain water are trapped.' },
    ],
    constraints: ['n == height.length', '1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
    testCases: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' },
      { input: 'height = [4,2,0,3,2,5]', output: '9' },
      { input: 'height = [1,0,1]', output: '1' },
      { input: 'height = [3,0,0,2,0,4]', output: '10' },
    ],
    starterCode: {
      javascript: 'function trap(height) {\n  // Write your solution here\n  \n}',
      python:
        'class Solution:\n    def trap(self, height: list[int]) -> int:\n        # Write your solution here\n        pass',
      java: 'class Solution {\n    public int trap(int[] height) {\n        // Write your solution here\n        return 0;\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your solution here\n        return 0;\n    }\n};',
    },
  },
  10: {
    title: 'Reverse Linked List',
    difficulty: 'easy',
    description:
      'Given the head of a singly linked list represented as an array, reverse the list, and return the reversed list as an array.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'The list is reversed.' },
      { input: 'head = [1,2]', output: '[2,1]', explanation: 'Two elements reversed.' },
    ],
    constraints: ['0 <= list length <= 5000', '-5000 <= Node.val <= 5000'],
    testCases: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
      { input: 'head = []', output: '[]' },
      { input: 'head = [1]', output: '[1]' },
    ],
    starterCode: {
      javascript:
        'function reverseList(head) {\n  // head is an array representation of a linked list\n  // Return the reversed array\n  \n}',
      python:
        'class Solution:\n    def reverseList(self, head: list[int]) -> list[int]:\n        # Write your solution here\n        pass',
      java: 'class Solution {\n    public int[] reverseList(int[] head) {\n        // Write your solution here\n        return new int[]{};\n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> reverseList(vector<int>& head) {\n        // Write your solution here\n        return {};\n    }\n};',
    },
  },
};

export default function CodingEditorPage() {
  const params = useParams();
  const router = useRouter();
  const hardcodedProblem = problemsData[params.id];
  // Check sessionStorage for AI-generated problems (from ExamConfigModal / PresetManager)
  const [aiProblem, setAiProblem] = useState(null);
  const [problemLoading, setProblemLoading] = useState(!hardcodedProblem);
  const [language, setLanguage] = useState('javascript');

  // Load AI-generated problem from sessionStorage if no hardcoded match
  useEffect(() => {
    if (!hardcodedProblem) {
      const stored = sessionStorage.getItem('codingProblem_' + params.id);
      if (stored) {
        try {
          setAiProblem(JSON.parse(stored)); // eslint-disable-line react-hooks/set-state-in-effect -- SSR-safe sessionStorage init
        } catch (e) {
          clientLogger.warn('Failed to parse AI-generated problem from sessionStorage:', e.message);
        }
      }
    }
    setProblemLoading(false);
  }, [params.id, hardcodedProblem]);

  const problem = hardcodedProblem || aiProblem;
  const [code, setCode] = useState(hardcodedProblem?.starterCode?.javascript || '');
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [executionOutput, setExecutionOutput] = useState(null);
  const codeInitialized = useRef(false);
  const { notify } = useNotification();

  // Set starter code when problem becomes available (only once)
  useEffect(() => {
    if (problem?.starterCode?.[language] && !codeInitialized.current) {
      codeInitialized.current = true;
      setCode(problem.starterCode[language]); // eslint-disable-line react-hooks/set-state-in-effect -- sync derived state from async-loaded problem
    }
  }, [problem, language]);

  // Show loading until problem is resolved (avoids editor flash with empty content)
  if (!problem) {
    if (problemLoading) {
      return (
        <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col lg:flex-row p-4 gap-4 bg-background">
          <Card className="flex-1 flex flex-col overflow-hidden border-border bg-card/50">
            <div className="p-4 border-b flex items-center justify-between">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <Skeleton className="h-7 w-48 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5 mb-2" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-20" />
                <div className="grid gap-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-secondary/30 p-4 rounded-xl border space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-24" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-32 rounded-md" />
                  ))}
                </div>
              </div>
            </div>
          </Card>
          <div className="flex-1 lg:flex-[1.5] xl:flex-[2] flex flex-col gap-4">
            <Card className="flex-[2] flex flex-col overflow-hidden border-border shadow-sm bg-card">
              <div className="flex items-center justify-between p-2 border-b bg-muted/20">
                <Skeleton className="h-9 w-[180px] rounded-md" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24 rounded-md" />
                  <Skeleton className="h-9 w-28 rounded-md" />
                </div>
              </div>
              <div className="flex-1 bg-[#1e1e1e] p-4 space-y-3">
                {['40%', '70%', '55%', '65%', '45%', '60%', '50%', '35%', '68%', '42%', '58%', '33%'].map((w, i) => (
                  <Skeleton key={i} className="h-4" style={{ width: w }} />
                ))}
              </div>
            </Card>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-5xl">🔍</span>
        <h2 className="text-2xl font-bold text-foreground">Problem not found</h2>
        <p className="text-muted-foreground mb-4">
          This problem doesn&apos;t exist yet. AI-generated problems are only available in the same browser session.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/coding">← Back to Problems</Link>
        </Button>
      </div>
    );
  }

  const evaluateCode = async () => {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'evaluate-code',
        config: { problem: problem.description, language, code, testCases: problem.testCases },
      }),
    });
    return await res.json();
  };

  const handleRun = async () => {
    setRunning(true);
    setSubmitted(false);
    setExecutionOutput(null);
    try {
      // Use real code execution via Piston API
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, testCases: problem.testCases }),
      });
      const result = await res.json();

      if (result.testResults) {
        // Got test case results
        setOutput(result);
      } else {
        // Got raw execution output
        setExecutionOutput(result);
      }
    } catch (e) {
      clientLogger.error('Code execution error:', e.message);
      setOutput({ passed: false, score: 0, testResults: [], feedback: 'Error running code. Check your syntax.' });
    }
    setRunning(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitted(false);
    try {
      const result = await evaluateCode();
      setOutput(result);

      // Save to database
      const actRes = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'coding',
          title: problem.title,
          score: result.score || 0,
          totalMarks: 100,
          details: {
            language,
            testResults: result.testResults,
            feedback: result.feedback,
            timeComplexity: result.timeComplexity,
            spaceComplexity: result.spaceComplexity,
          },
        }),
      });
      if (actRes.ok) {
        // Invalidate client cache so dashboard/analytics refresh on next visit
        cacheInvalidate('/api/dashboard');
        cacheInvalidate('/api/gamification');
        cacheInvalidate('/api/activities');
        const actData = await actRes.json();
        if (actData.xp?.xpAwarded) {
          notify({
            emoji: '✨',
            title: `+${actData.xp.xpAwarded} XP earned!`,
            description:
              actData.xp.newBadges?.length > 0
                ? `New badge: ${actData.xp.newBadges.map((b) => b.emoji + ' ' + b.name).join(', ')}`
                : undefined,
          });
        }
      }

      // Track coding submission in GA4
      trackCodingSubmit({
        problemTitle: problem.title,
        language,
        score: result.score || 0,
        passed: result.passed || false,
      });
      setSubmitted(true);

      // Dispatch solved event for the coding page tracker
      if (result.passed) {
        try {
          window.dispatchEvent(new CustomEvent('coding-problem-solved', { detail: { problemId: params.id } }));
        } catch (e) {
          clientLogger.warn('Failed to dispatch coding-problem-solved event:', e.message);
        }
      }
    } catch (e) {
      clientLogger.error('Code submission error:', e.message);
      setOutput({ passed: false, score: 0, testResults: [], feedback: 'Error submitting code.' });
    }
    setSubmitting(false);
  };

  const handleLangChange = (lang) => {
    setLanguage(lang);
    setCode(problem.starterCode[lang] || problem.starterCode.javascript || '');
    setOutput(null);
    setExecutionOutput(null);
    setSubmitted(false);
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col lg:flex-row p-4 gap-4 bg-background">
      <Card className="flex-1 flex flex-col overflow-hidden border-border bg-card/50">
        <div className="p-4 border-b flex items-center justify-between shadow-sm">
          <Button variant="ghost" asChild size="sm" className="gap-2">
            <Link href="/dashboard/coding">
              <HiOutlineArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
          <Badge
            variant={
              problem.difficulty === 'easy' ? 'success' : problem.difficulty === 'hard' ? 'destructive' : 'warning'
            }
            className="capitalize"
          >
            {problem.difficulty}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">{problem.title}</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              {problem.description}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">Examples</h3>
            <div className="grid gap-4">
              {problem.examples.map((ex, i) => (
                <div
                  key={i}
                  className="bg-secondary/30 p-4 rounded-xl border border-secondary/50 space-y-2 text-sm font-mono leading-relaxed"
                >
                  <div>
                    <span className="text-muted-foreground font-semibold">Input:</span>{' '}
                    <span className="text-foreground">{ex.input}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Output:</span>{' '}
                    <span className="text-foreground">{ex.output}</span>
                  </div>
                  {ex.explanation && (
                    <div className="pt-2 border-t border-border/50 text-muted-foreground mt-2">
                      <span className="font-semibold text-foreground">Explanation:</span> {ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">Constraints</h3>
            <ul className="list-disc list-inside space-y-2">
              {problem.constraints.map((c, i) => (
                <li
                  key={i}
                  className="text-sm font-mono text-muted-foreground bg-secondary/20 inline-block px-3 py-1 rounded-md"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <div className="flex-1 lg:flex-[1.5] xl:flex-[2] flex flex-col gap-4">
        <Card className="flex-[2] flex flex-col overflow-hidden border-border shadow-sm bg-card">
          <div className="flex items-center justify-between p-2 border-b bg-muted/20">
            <Select value={language} onValueChange={handleLangChange}>
              <SelectTrigger className="w-[180px] border-none bg-secondary/50 font-medium h-9">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="ruby">Ruby</SelectItem>
                <SelectItem value="rust">Rust</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRun}
                disabled={running || submitting}
                className="gap-2 font-semibold"
              >
                {running ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span>
                  </>
                ) : (
                  '▶ '
                )}{' '}
                Run Code
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={running || submitting}
                className={cn(
                  'gap-2 font-semibold transition-colors',
                  submitted && 'bg-success text-success-foreground hover:bg-success/90'
                )}
              >
                {submitting ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span>
                  </>
                ) : submitted ? (
                  '✅ '
                ) : (
                  '📤 '
                )}{' '}
                Submit Code
              </Button>
            </div>
          </div>

          <div className="flex-1 relative bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                smoothScrolling: true,
                cursorBlinking: 'smooth',
              }}
            />
          </div>
        </Card>

        {output && (
          <Card className="flex-1 max-h-[350px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in-0 shadow-sm border-border">
            <div
              className={cn(
                'px-4 py-3 flex flex-wrap items-center justify-between font-semibold border-b gap-3',
                output.passed
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              )}
            >
              <div className="flex items-center gap-2 text-base">
                {output.passed ? '✅ All Tests Passed!' : '❌ Some Tests Failed'}
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    'bg-background py-1 text-sm font-bold min-w-[90px] justify-center',
                    output.passed ? 'text-success border-success/50' : 'text-destructive border-destructive/50'
                  )}
                >
                  Score: {output.score}/100
                </Badge>
                {submitted && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 py-1 text-sm px-3">
                    💾 Saved
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-secondary/5">
              {output.testResults?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                    Test Cases
                  </h4>
                  <div className="grid gap-3">
                    {output.testResults?.map((t, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg border bg-background shadow-sm text-sm font-mono"
                      >
                        <div className="flex items-center gap-2 shrink-0 sm:w-20">
                          <span
                            className={cn(
                              'flex items-center justify-center w-6 h-6 rounded-full text-white',
                              t.passed ? 'bg-success' : 'bg-destructive'
                            )}
                          >
                            {t.passed ? '✓' : '✗'}
                          </span>
                          <span className="font-semibold text-xs text-muted-foreground">Test {i + 1}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 flex-1 w-full overflow-hidden text-xs sm:text-sm">
                          <div className="truncate">
                            <span className="text-muted-foreground w-10 inline-block font-sans">In:</span> {t.input}
                          </div>
                          <div className="truncate">
                            <span className="text-muted-foreground w-10 inline-block font-sans">Exp:</span> {t.expected}
                          </div>
                          <div className={cn('truncate font-semibold', t.passed ? 'text-success' : 'text-destructive')}>
                            <span className="text-muted-foreground w-10 inline-block font-sans">Got:</span> {t.actual}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(output.feedback || output.timeComplexity) && (
                <div className="space-y-3 pt-4 border-t border-border/60">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                    AI Analysis
                  </h4>

                  {output.timeComplexity && (
                    <div className="flex gap-3 mt-2">
                      <Badge variant="outline" className="text-xs bg-secondary/50 font-mono py-1 px-3">
                        ⏱️ Time: {output.timeComplexity}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-secondary/50 font-mono py-1 px-3">
                        💾 Space: {output.spaceComplexity}
                      </Badge>
                    </div>
                  )}

                  {output.feedback && (
                    <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/90 leading-relaxed shadow-inner">
                      {output.feedback}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
