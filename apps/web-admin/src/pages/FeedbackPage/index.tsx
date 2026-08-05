import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@go-tech-frontend/ui';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getFeedbackCounts } from './api';
import { statusOptions } from './contrans';
import Posts from './Posts';
import Trash from './Trash';
import type { FeedbackStatus, FeedbackView } from './types';

const FeedbackPage = () => {
  const [view, setView] = useState<FeedbackView>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<FeedbackStatus | 'all'>('all');
  const countsQuery = useQuery({ queryKey: ['feedback-admin', 'counts'], queryFn: getFeedbackCounts });

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">需求反饋</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜尋標題、內容或客戶..."
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status} onValueChange={value => setStatus(value as FeedbackStatus | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="全部狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Tabs value={view} onValueChange={value => setView(value as FeedbackView)}>
        <TabsList>
          <TabsTrigger value="active">帖子與評論</TabsTrigger>
          <TabsTrigger value="completed">已完成 ({countsQuery.data?.completed ?? 0})</TabsTrigger>
          <TabsTrigger value="trash">回收站 ({countsQuery.data?.trash ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <Posts view="active" q={query} status={status} />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <Posts view="completed" q={query} status={status} />
        </TabsContent>
        <TabsContent value="trash" className="mt-4">
          <Trash q={query} status={status} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeedbackPage;
