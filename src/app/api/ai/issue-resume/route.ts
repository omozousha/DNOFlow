import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate hash from projects data to detect changes
function generateProjectsHash(projects: any[]): string {
  const relevantData = projects.map(p => ({
    id: p.id,
    issue: p.issue || '',
    progress: p.progress || '',
    regional: p.regional || '',
  }));
  
  const dataString = JSON.stringify(relevantData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Save resume to database cache
async function saveToCache(
  projectsHash: string,
  projectSummary: any,
  summary: string,
  aiGenerated: boolean,
  topIssues: any[],
  sampleDetails: any[]
) {
  try {
    const { error } = await supabase
      .from('ai_issue_resume_cache')
      .upsert({
        projects_hash: projectsHash,
        total_projects: projectSummary.total,
        projects_with_issues: projectSummary.withIssues,
        summary: summary,
        critical_count: projectSummary.critical,
        high_count: projectSummary.high,
        medium_count: projectSummary.withIssues,
        issue_percentage: parseFloat(projectSummary.issuePercentage),
        ai_generated: aiGenerated,
        top_issues: topIssues,
        sample_details: sampleDetails,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'projects_hash'
      });

    if (error) {
      console.error('[IssueResume API] Error saving to cache:', error);
    } else {
      console.log('[IssueResume API] Successfully saved to cache');
    }
  } catch (err) {
    console.error('[IssueResume API] Exception saving to cache:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projects, forceRefresh = false } = await request.json();

    // Validate projects data
    if (!Array.isArray(projects)) {
      return NextResponse.json(
        { error: 'Invalid projects data' },
        { status: 400 }
      );
    }

    // Generate hash from current projects data
    const projectsHash = generateProjectsHash(projects);
    console.log('[IssueResume API] Projects hash:', projectsHash);

    // Check if we have cached result (unless force refresh)
    if (!forceRefresh) {
      const { data: cachedResume, error: cacheError } = await supabase
        .from('ai_issue_resume_cache')
        .select('*')
        .eq('projects_hash', projectsHash)
        .maybeSingle();

      if (cachedResume && !cacheError) {
        console.log('[IssueResume API] Using cached resume from', cachedResume.generated_at);
        return NextResponse.json({
          summary: cachedResume.summary,
          criticalCount: cachedResume.critical_count,
          highCount: cachedResume.high_count,
          mediumCount: cachedResume.medium_count,
          issuePercentage: cachedResume.issue_percentage?.toString(),
          aiGenerated: cachedResume.ai_generated,
          cached: true,
          generatedAt: cachedResume.generated_at,
        });
      }
      
      console.log('[IssueResume API] No cache found or data changed, generating new resume...');
    } else {
      console.log('[IssueResume API] Force refresh requested, generating new resume...');
    }

    // Collect ALL issues from ALL projects (including detailed analysis)
    const projectsWithIssues = projects.filter((p: any) => 
      p.issue && p.issue.trim() !== '' && p.issue.toLowerCase() !== 'n/a'
    );

    // Count issues by severity based on progress status
    const criticalProjects = projects.filter((p: any) =>
      p.progress?.toLowerCase().includes('cancel') ||
      p.progress?.toLowerCase().includes('reject')
    );
    const highProjects = projects.filter((p: any) =>
      p.progress?.toLowerCase().includes('pending') ||
      p.progress?.toLowerCase().includes('hold')
    );
    const mediumProjects = projects.filter((p: any) =>
      p.progress?.toLowerCase().includes('not yet') ||
      p.progress?.toLowerCase().includes('belum')
    );

    // Get ALL unique issues with frequency analysis
    const issueFrequency = new Map<string, number>();
    const issueDetails = new Map<string, any[]>();
    
    projectsWithIssues.forEach((p: any) => {
      const issue = p.issue.trim();
      issueFrequency.set(issue, (issueFrequency.get(issue) || 0) + 1);
      
      if (!issueDetails.has(issue)) {
        issueDetails.set(issue, []);
      }
      issueDetails.get(issue)?.push({
        regional: p.regional,
        progress: p.progress,
        uic: p.uic,
      });
    });
    
    // Top 15 most frequent issues (increased from 10)
    const topIssues = Array.from(issueFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([issue, count]) => {
        const details = issueDetails.get(issue) || [];
        const regions = [...new Set(details.map(d => d.regional).filter(Boolean))];
        return {
          issue,
          count,
          regions: regions.slice(0, 3), // Top 3 affected regions
          sample: details[0],
        };
      });

    // Get comprehensive issue details (up to 10 instead of 5)
    const sampleIssueDetails = projectsWithIssues.slice(0, 10).map((p: any) => ({
      regional: p.regional || 'N/A',
      project: p.nama_project || p.no_project || 'Unknown',
      issue: p.issue,
      progress: p.progress || 'N/A',
      uic: p.uic || 'N/A',
    }));

    // Prepare COMPREHENSIVE project data for AI analysis
    const projectSummary = {
      total: projects.length,
      withIssues: projectsWithIssues.length,
      critical: criticalProjects.length,
      high: highProjects.length,
      medium: mediumProjects.length,
      regions: [...new Set(projects.map((p: any) => p.regional).filter(Boolean))],
      topIssues,
      sampleDetails: sampleIssueDetails,
      issuePercentage: ((projectsWithIssues.length / projects.length) * 100).toFixed(1),
    };

    // Build comprehensive issue list for AI
    const issueListForAI = topIssues.map((issueData, idx) => {
      return `${idx + 1}. ${issueData.issue} (${issueData.count} proyek)
   Regions: ${issueData.regions.length > 0 ? issueData.regions.join(', ') : 'Multiple'}
   Sample Status: ${issueData.sample?.progress || 'N/A'}`;
    }).join('\n');

    const prompt = `Sebagai AI analis proyek infrastruktur telekomunikasi FTTH, analisis SEMUA data issue proyek berikut dan buatlah resume komprehensif dalam bahasa Indonesia:

📊 STATISTIK PROYEK:
- Total Proyek: ${projectSummary.total}
- Proyek dengan Issue Tercatat: ${projectSummary.withIssues} (${projectSummary.issuePercentage}%)
- Status Critical (Cancel/Reject): ${projectSummary.critical}
- Status High Priority (Pending/Hold): ${projectSummary.high}
- Status Medium (Not Yet Started): ${projectSummary.medium}
- Regional Coverage: ${projectSummary.regions.length} region (${projectSummary.regions.join(', ')})

🔍 DAFTAR LENGKAP ISSUE (Sorted by Frequency):
${issueListForAI || '- Tidak ada issue yang tercatat'}

📋 SAMPLE DETAIL ISSUE (10 Sample dari ${projectsWithIssues.length} proyek):
${sampleIssueDetails.length > 0 ? sampleIssueDetails.map((d, i) => 
  `${i + 1}. Regional: ${d.regional} | UIC: ${d.uic}
   Project: ${d.project}
   Issue: ${d.issue}
   Progress: ${d.progress}`
).join('\n') : 'Tidak ada issue detail'}

🎯 INSTRUKSI ANALISIS:
1. Buat resume 2-3 kalimat yang padat, informatif, dan actionable
2. WAJIB analisis SEMUA issue yang tercatat, fokus pada pola dan frekuensi
3. Identifikasi issue yang paling critical dan perlu perhatian segera
4. Sebutkan regional/area yang paling bermasalah jika ada pola geografis
5. Berikan insight atau rekomendasi spesifik untuk mitigasi
6. Gunakan emoji yang sesuai (⚠️, ✅, 📊, 🔧, 🚨, 🎯)
7. Jika ada issue berulang di multiple regions, highlight ini
8. Jika tidak ada issue signifikan, berikan feedback positif dengtelekomunikasi FTTH yang ahli dalam mengidentifikasi pola masalah, menganalisis root cause, dan memberikan insight actionable. Analisis SEMUA data issue yang diberikan secara komprehensif. Tuliskan resume dalam bahasa Indonesia yang padat, informatif, dan fokus pada issue paling critical. Minimal 250 karakter, maksimal 600 karakter

Resume Komprehensif:`;

    // Try to use Groq AI
    try {
      const Groq = (await import('groq-sdk')).default;
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY || '',
      });

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Kamu adalah AI analis proyek infrastruktur yang ahli dalam mengidentifikasi dan merangkum issue proyek dengan singkat dan jelas. tuliskan dalam bahasa Indonesia. minimal 200 karakter dan 500 karakter maksimal.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.6,
        max_tokens: 400,
        top_p: 0.9,
        stream: false,
      });

      const aiSummary = chatCompletion.choices[0]?.message?.content || '';

      if (aiSummary) {
        const resultData = {
          summary: aiSummary.trim(),
          criticalCount: projectSummary.critical,
          highCount: projectSummary.high,
          mediumCount: projectSummary.withIssues,
          issuePercentage: projectSummary.issuePercentage,
          aiGenerated: true,
          cached: false,
        };

        // Save to database cache
        await saveToCache(projectsHash, projectSummary, aiSummary.trim(), true, topIssues, sampleIssueDetails);
        
        console.log('[IssueResume API] AI resume generated and cached');
        return NextResponse.json(resultData);
      }
    } catch (aiError) {
      console.error('Groq AI error, using fallback:', aiError);
    }

    // Fallback: Generate comprehensive summary without AI
    let summary = "";
    if (projectSummary.withIssues > 0) {
      summary = `📊 Dari ${projectSummary.total} proyek, terdapat ${projectSummary.withIssues} proyek (${projectSummary.issuePercentage}%) dengan issue tercatat. `;
      
      if (projectSummary.critical > 0) {
        summary += `🚨 ${projectSummary.critical} proyek berstatus critical (cancel/reject) - perlu immediate action. `;
      }
      
      if (projectSummary.high > 0) {
        summary += `⚠️ ${projectSummary.high} proyek pending/hold. `;
      }
      
      if (projectSummary.topIssues.length > 0) {
        const topIssue = projectSummary.topIssues[0];
        summary += `Issue paling sering: "${topIssue.issue}" (${topIssue.count} proyek di ${topIssue.regions.length} region). `;
        
        // Add second most common if exists
        if (projectSummary.topIssues.length > 1) {
          const secondIssue = projectSummary.topIssues[1];
          summary += `Issue lain: "${secondIssue.issue}" (${secondIssue.count} proyek). `;
        }
      }
      
      summary += `🎯 Fokus penanganan pada issue berulang di multiple region.`;
    } else {
      if (projectSummary.critical > 0) {
        summary = `🚨 Terdapat ${projectSummary.critical} proyek critical (cancel/reject) namun issue belum tercatat detail. `;
      } else if (projectSummary.high > 0) {
        summary = `📋 ${projectSummary.high} proyek dalam status pending/hold. Perlu investigasi lebih lanjut untuk dokumentasi issue. `;
      } else {
        summary = `✅ Semua ${projectSummary.total} proyek berjalan sesuai rencana. Tidak ada issue critical atau high priority yang tercatat.`;
      }
    }

    // Save fallback to cache as well
    await saveToCache(projectsHash, projectSummary, summary.trim(), false, topIssues, sampleIssueDetails);
    
    console.log('[IssueResume API] Fallback resume generated and cached');

    return NextResponse.json({
      summary: summary.trim(),
      criticalCount: projectSummary.critical,
      highCount: projectSummary.high,
      mediumCount: projectSummary.withIssues,
      issuePercentage: projectSummary.issuePercentage,
      aiGenerated: false,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error in issue-resume API:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate summary',
        message: error.message,
        summary: "⚠️ Gagal menganalisis proyek. Silakan refresh halaman.",
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        aiGenerated: false,
      },
      { status: 200 }
    );
  }
}
