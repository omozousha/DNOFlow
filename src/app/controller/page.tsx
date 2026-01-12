// Controller Dashboard Page - Modular Architecture
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { WorksheetProject } from '@/types/worksheet-project';

// Import modular components
import { QuickStatsCards } from '@/components/dashboard/controller/quick-stats-cards';
import { IssueResumeCard } from '@/components/dashboard/controller/issue-resume-card';
import { UpcomingRFSCard } from '@/components/dashboard/controller/upcoming-rfs-card';
import { DashboardFilters } from '@/components/dashboard/shared/dashboard-filters';
import { DashboardTable, DashboardTableRow } from '@/components/dashboard/shared/dashboard-table';
import { DashboardCard } from '@/components/dashboard/shared/summary-card';

// Types
type ProjectStats = {
  total: number;
  done: number;
  construction: number;
  ny_construction: number;
  rescheduled: number;
  cancel: number;
  totalPorts: number;
  donePorts: number;
  constructionPorts: number;
  nyConstructionPorts: number;
  rescheduledPorts: number;
  cancelPorts: number;
};

// Status mapping helper - support both old (with numbers) and new (without numbers) format
const statusKeyMap: Record<string, string> = {
  'deployment': 'done',
  '18. done': 'done',
  'done': 'done',
  'construction': 'construction',
  '10. mos': 'construction',
  '11. perizinan': 'construction',
  '12. const': 'construction',
  '13. commtest': 'construction',
  '14. ut': 'construction',
  'mos': 'construction',
  'perizinan': 'construction',
  'const': 'construction',
  'commtest': 'construction',
  'ut': 'construction',
  'ny construction': 'ny_construction',
  'not yet construction': 'ny_construction',
  'desain': 'ny_construction',
  'design': 'ny_construction',
  'planning': 'ny_construction',
  'pending 2026': 'rescheduled',
  'rescheduled': 'rescheduled',
  '00. pending / hold': 'rescheduled',
  'pending / hold': 'rescheduled',
  'cancel': 'cancel',
  'reject': 'cancel',
};

export default function ControllerDashboardPage() {
  // State
  const [selectedCard, setSelectedCard] = useState('total');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ 
    from: null, 
    to: null 
  });
  const [projects, setProjects] = useState<WorksheetProject[]>([]);
  const [, setLoading] = useState(true);

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        let query = supabase.from('projects').select('*');
        
        if (selectedRegion !== 'ALL') {
          query = query.eq('regional', selectedRegion);
        }
        
        if (dateRange.from) {
          query = query.gte('created_at', dateRange.from.toISOString());
        }
        
        if (dateRange.to) {
          query = query.lte('created_at', dateRange.to.toISOString());
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProjects();
  }, [selectedRegion, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const calculateStats = (): ProjectStats => {
      const total = projects.length;
      const totalPorts = projects.reduce((acc, p) => acc + (Number(p.port) || 0), 0);
      
      const getProjectsByStatus = (status: string) => {
        return projects.filter(p => {
          const progressLower = (p.progress || '').toLowerCase();
          const statusLower = (p.status || '').toLowerCase();
          // Check both progress and status fields
          return statusKeyMap[progressLower] === status || statusKeyMap[statusLower] === status;
        });
      };
      
      const doneProjects = getProjectsByStatus('done');
      const constructionProjects = getProjectsByStatus('construction');
      const nyConstructionProjects = getProjectsByStatus('ny_construction');
      const rescheduledProjects = getProjectsByStatus('rescheduled');
      const cancelProjects = getProjectsByStatus('cancel');
      
      return {
        total,
        done: doneProjects.length,
        construction: constructionProjects.length,
        ny_construction: nyConstructionProjects.length,
        rescheduled: rescheduledProjects.length,
        cancel: cancelProjects.length,
        totalPorts,
        donePorts: doneProjects.reduce((acc, p) => acc + (Number(p.port) || 0), 0),
        constructionPorts: constructionProjects.reduce((acc, p) => acc + (Number(p.port) || 0), 0),
        nyConstructionPorts: nyConstructionProjects.reduce((acc, p) => acc + (Number(p.port) || 0), 0),
        rescheduledPorts: rescheduledProjects.reduce((acc, p) => acc + (Number(p.port) || 0), 0),
        cancelPorts: cancelProjects.reduce((acc, p) => acc + (Number(p.port) || 0), 0),
      };
    };
    
    return calculateStats();
  }, [projects]);

  // Summary data for Quick Stats Cards
  const summaryData: DashboardCard[] = [
    {
      key: 'total',
      title: 'TOTAL LOP',
      value: stats.total,
      subLabel: `${stats.totalPorts} ports`,
      description: 'Total projects',
    },
    {
      key: 'done',
      title: 'DONE',
      value: stats.done,
      subLabel: `${stats.donePorts} ports`,
      description: 'Completed',
    },
    {
      key: 'construction',
      title: 'CONSTRUCTION',
      value: stats.construction,
      subLabel: `${stats.constructionPorts} ports`,
      description: 'In progress',
    },
    {
      key: 'ny_construction',
      title: 'NY CONSTRUCTION',
      value: stats.ny_construction,
      subLabel: `${stats.nyConstructionPorts} ports`,
      description: 'Not yet started',
    },
    {
      key: 'rescheduled',
      title: 'RESCHEDULED',
      value: stats.rescheduled,
      subLabel: `${stats.rescheduledPorts} ports`,
      description: 'Postponed',
    },
    {
      key: 'cancel',
      title: 'CANCEL',
      value: stats.cancel,
      subLabel: `${stats.cancelPorts} ports`,
      description: 'Cancelled',
    },
  ];

  // Filtered projects for table
  const filteredProjects = useMemo(() => {
    if (selectedCard === 'total') return projects;
    
    return projects.filter(p => {
      const progressLower = (p.progress || '').toLowerCase();
      const statusLower = (p.status || '').toLowerCase();
      // Check both progress and status fields
      return statusKeyMap[progressLower] === selectedCard || statusKeyMap[statusLower] === selectedCard;
    });
  }, [projects, selectedCard]);

  // Table rows
  const tableRows: DashboardTableRow[] = filteredProjects.map(project => ({
    no_project: project.no_project || '',
    nama_project: project.nama_project || '',
    region: project.regional || '',
    pop: project.pop || '',
    port: Number(project.port) || 0,
    progress: project.progress || '',
  }));

  // Event handlers
  function handleCardClick(key: string) {
    setSelectedCard(key);
  }

  function handleRegionChange(value: string) {
    setSelectedRegion(value);
  }

  function handleDateRangeChange(range: { from: Date | null; to: Date | null }) {
    setDateRange(range);
  }

  return (
    <div className="p-2 sm:p-3 lg:p-4 2xl:p-5 max-w-[2560px] mx-auto space-y-3 sm:space-y-4 lg:space-y-5">
      {/* Grid 1: Dashboard Filters */}
      <div className="sticky lg:static top-0 z-30 bg-background/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none -mx-2 sm:-mx-3 lg:mx-0 px-2 sm:px-3 lg:px-0 py-1.5 lg:py-0 border-b lg:border-0 shadow-sm lg:shadow-none">
        <DashboardFilters
          regionOptions={['ALL', 'BANTEN', 'JABAR', 'JABODEBEK', 'JATENGKAL', 'JATIM', 'SULAWESI']}
          selectedRegion={selectedRegion}
          dateRange={dateRange}
          onRegionChange={handleRegionChange}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      {/* Grid 2: Quick Stats Cards - 6 cards in 3x2 grid */}
      <div 
        className="grid gap-2 sm:gap-3 lg:gap-4
          grid-cols-1
          sm:grid-cols-2 sm:grid-rows-[repeat(3,minmax(100px,auto))]
          lg:grid-cols-3 lg:grid-rows-[repeat(2,minmax(120px,auto))]
          2xl:grid-cols-3 2xl:grid-rows-[repeat(2,minmax(140px,auto))]"
      >
        {/* 1. TOTAL LOP */}
        <div className="sm:col-span-1 sm:row-span-1">
          <QuickStatsCards
            summaryData={[summaryData[0]]}
            selectedCard={selectedCard}
            onCardClick={handleCardClick}
          />
        </div>

        {/* 2. NY CONSTRUCTION */}
        <div className="sm:col-span-1 sm:row-span-1">
          <QuickStatsCards
            summaryData={[summaryData[3]]}
            selectedCard={selectedCard}
            onCardClick={handleCardClick}
          />
        </div>

        {/* 3. DONE */}
        <div className="sm:col-span-1 sm:row-span-1">
          <QuickStatsCards
            summaryData={[summaryData[1]]}
            selectedCard={selectedCard}
            onCardClick={handleCardClick}
          />
        </div>

        {/* 4. CONSTRUCTION */}
        <div className="sm:col-span-1 sm:row-span-1">
          <QuickStatsCards
            summaryData={[summaryData[2]]}
            selectedCard={selectedCard}
            onCardClick={handleCardClick}
          />
        </div>

        {/* 5. RESCHEDULED */}
        <div className="sm:col-span-1 sm:row-span-1">
          <QuickStatsCards
            summaryData={[summaryData[4]]}
            selectedCard={selectedCard}
            onCardClick={handleCardClick}
          />
        </div>

        {/* 6. CANCEL */}
        <div className="sm:col-span-1 sm:row-span-1">
          <QuickStatsCards
            summaryData={[summaryData[5]]}
            selectedCard={selectedCard}
            onCardClick={handleCardClick}
          />
        </div>
      </div>

      {/* Grid 3: Dashboard Table & Analysis Cards */}
      <div 
        className="grid gap-2 sm:gap-3 lg:gap-4
          grid-cols-1
          sm:grid-cols-2 sm:grid-rows-[repeat(2,minmax(200px,auto))]
          lg:grid-cols-2 lg:grid-rows-[repeat(2,minmax(250px,auto))]
          2xl:grid-cols-2 2xl:grid-rows-[repeat(2,minmax(300px,auto))]"
      >
        {/* 7. DashboardTable - Full width */}
        <div className="sm:col-span-2 lg:col-span-2">
          <DashboardTable data={tableRows} />
        </div>

        {/* 8. IssueResumeCard - Half width */}
        <div className="sm:col-span-1">
          <IssueResumeCard projects={projects} />
        </div>

        {/* 9. UpcomingRFSCard - Half width */}
        <div className="sm:col-span-1">
          <UpcomingRFSCard projects={projects} />
        </div>
      </div>
    </div>
  );
}
