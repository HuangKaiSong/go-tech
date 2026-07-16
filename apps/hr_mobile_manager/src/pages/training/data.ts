import { Award, BookOpen } from 'lucide-react';
import type { TrainingCategory } from './types';

export const trainingData: TrainingCategory[] = [
  {
    id: 'onboarding',
    title: '入職培訓',
    icon: BookOpen,
    color: 'bg-primary',
    description: '新員工必修課程，了解公司文化與制度',
    totalCourses: 4,
    completedCourses: 2,
    courses: [
      {
        id: 'o1',
        title: '公司文化與價值觀',
        duration: '45分鐘',
        status: 'completed',
        progress: 100,
        description: '了解公司的使命、願景和核心價值觀，以及我們的企業文化。',
        modules: [
          { name: '公司歷史與發展', completed: true, duration: '15分鐘' },
          { name: '使命與願景', completed: true, duration: '10分鐘' },
          { name: '核心價值觀', completed: true, duration: '10分鐘' },
          { name: '文化體驗測驗', completed: true, duration: '10分鐘' }
        ]
      },
      {
        id: 'o2',
        title: '員工守則與規章制度',
        duration: '60分鐘',
        status: 'completed',
        progress: 100,
        description: '詳細了解公司的各項規章制度、行為準則及紀律要求。',
        modules: [
          { name: '考勤制度', completed: true, duration: '15分鐘' },
          { name: '假期管理', completed: true, duration: '15分鐘' },
          { name: '行為準則', completed: true, duration: '15分鐘' },
          { name: '規章測驗', completed: true, duration: '15分鐘' }
        ]
      },
      {
        id: 'o3',
        title: '資訊安全意識',
        duration: '30分鐘',
        status: 'in_progress',
        progress: 60,
        description: '學習基本的資訊安全知識，保護公司和個人資料安全。',
        modules: [
          { name: '資料分類與保密', completed: true, duration: '10分鐘' },
          { name: '密碼安全', completed: true, duration: '8分鐘' },
          { name: '網路釣魚防範', completed: false, duration: '7分鐘' },
          { name: '安全測驗', completed: false, duration: '5分鐘' }
        ]
      },
      {
        id: 'o4',
        title: '辦公系統操作指南',
        duration: '40分鐘',
        status: 'locked',
        progress: 0,
        description: '學習使用公司的辦公系統，包括考勤、請假、報銷等功能。',
        modules: [
          { name: 'HR系統導覽', completed: false, duration: '10分鐘' },
          { name: '考勤打卡操作', completed: false, duration: '10分鐘' },
          { name: '申請流程說明', completed: false, duration: '10分鐘' },
          { name: '操作練習', completed: false, duration: '10分鐘' }
        ]
      }
    ]
  },
  {
    id: 'skills',
    title: '職能培訓',
    icon: Award,
    color: 'bg-accent',
    description: '提升專業技能與崗位勝任力',
    totalCourses: 3,
    completedCourses: 0,
    courses: [
      {
        id: 's1',
        title: '項目管理基礎',
        duration: '90分鐘',
        status: 'in_progress',
        progress: 33,
        description: '學習項目管理的基本方法論，掌握敏捷與瀑布流程。',
        modules: [
          { name: '項目管理概述', completed: true, duration: '20分鐘' },
          { name: '敏捷方法論', completed: false, duration: '25分鐘' },
          { name: '項目計劃編制', completed: false, duration: '25分鐘' },
          { name: '項目管理測驗', completed: false, duration: '20分鐘' }
        ]
      },
      {
        id: 's2',
        title: '溝通技巧與團隊協作',
        duration: '60分鐘',
        status: 'locked',
        progress: 0,
        description: '提升職場溝通能力，學習高效團隊協作的方法。',
        modules: [
          { name: '有效溝通原則', completed: false, duration: '15分鐘' },
          { name: '跨部門協作', completed: false, duration: '15分鐘' },
          { name: '會議管理', completed: false, duration: '15分鐘' },
          { name: '情境演練', completed: false, duration: '15分鐘' }
        ]
      },
      {
        id: 's3',
        title: '數據分析入門',
        duration: '75分鐘',
        status: 'locked',
        progress: 0,
        description: '學習基礎數據分析技巧，提升數據驅動決策的能力。',
        modules: [
          { name: '數據思維導入', completed: false, duration: '15分鐘' },
          { name: 'Excel 進階技巧', completed: false, duration: '20分鐘' },
          { name: '數據可視化', completed: false, duration: '20分鐘' },
          { name: '分析實戰練習', completed: false, duration: '20分鐘' }
        ]
      }
    ]
  }
];
