import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';

interface InterviewStep {
  question: string;
  answer: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface InteriorLayout {
  font: string;
  fontSize: number;       // pt (10–14)
  lineHeight: number;     // % (140–200)
  marginInner: number;    // mm
  marginOuter: number;    // mm
  marginTop: number;      // mm
  marginBottom: number;   // mm
  chapterStyle: 'minimal' | 'classic' | 'ornate';
  letterSpacing: number;  // × 100 em (0 = 기본, 10 = 0.1em)
  paragraphIndent: number; // em 단위 (0 = 없음, 1 = 1em)
}

export const DEFAULT_INTERIOR: InteriorLayout = {
  font: 'Noto Serif KR', fontSize: 11, lineHeight: 165,
  marginInner: 16, marginOuter: 14, marginTop: 18, marginBottom: 22,
  chapterStyle: 'classic',
  letterSpacing: 0,
  paragraphIndent: 1,
};

export interface Project {
  id: string;
  title: string;
  author: string;
  updatedAt: number;
  interviewData: InterviewStep[];
  fullDraft: string;
  coverImageUrl: string;
  coverDesign: {
    layout: string;
    theme: string;
    params?: any;
    topic?: string;
    interiorLayout?: InteriorLayout;
  };
  isDeleted?: boolean;
  interviewStage?: number;
  currentWordCount?: number;
  targetWordCount?: number;
  dedicationText?: string;
  authorBio?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AppSettings {
  notifications: boolean;
  darkMode: boolean;
  fontSize: number;
  echoVoice: string;
}

interface BookStore {
  projects: Project[];
  currentProjectId: string | null;
  userProfile: UserProfile | null;
  settings: AppSettings;
  chatHistory: ChatMessage[];
  isSyncing: boolean;

  // Actions
  createProject: (title: string) => Promise<string>;
  switchProject: (id: string) => void;
  deleteProject: (id: string) => Promise<void>; // This is now "Move to Compost"
  restoreProject: (id: string) => Promise<void>;
  permanentlyDeleteProject: (id: string) => Promise<void>;
  resetDraft: (id: string, newTone: string) => Promise<void>;
  fetchProjects: () => Promise<void>;

  // Current Project Setters
  addInterviewStep: (q: string, a: string) => Promise<void>;
  undoInterviewStep: () => Promise<void>;
  setFullDraft: (draft: string) => Promise<void>;
  setCoverImageUrl: (url: string) => Promise<void>;
  setCoverDesign: (design: Partial<Project['coverDesign']>) => Promise<void>;
  setInteriorLayout: (layout: Partial<InteriorLayout>) => Promise<void>;
  updateProjectTitle: (title: string) => Promise<void>;
  setDedicationText: (text: string) => Promise<void>;
  setAuthorBio: (bio: string) => Promise<void>;
  setTargetWordCount: (count: number) => Promise<void>;

  // User Actions
  setUserProfile: (profile: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => Promise<void>;
  persistChatMessage: (role: 'user' | 'assistant', content: string, timestamp: number) => Promise<void>;
  setChatHistory: (history: ChatMessage[]) => void;
  setTempOnboardingData: (data: { name: string; topic: string; tone: string } | null) => void;
  tempOnboardingData: { name: string; topic: string; tone: string } | null;
  updateLastInterviewQuestion: (question: string) => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  fetchChatHistory: () => Promise<void>;
  resetAll: () => void;
}

const createInitialProject = (id: string, title: string): Project => ({
  id,
  title,
  author: '작가님',
  updatedAt: Date.now(),
  interviewData: [],
  fullDraft: '',
  coverImageUrl: '',
  coverDesign: {
    layout: 'classic',
    theme: 'amber',
  },
  isDeleted: false,
  interviewStage: 1,
  currentWordCount: 0,
  targetWordCount: 100000,
});

// Helper for cloud sync
const syncProjectToCloud = async (project: Project, userId: string, setSyncState?: (syncing: boolean) => void) => {
  if (!userId) return;
  if (setSyncState) setSyncState(true);
  try {
    const { error } = await supabase
      .from('projects')
      .upsert({
        id: project.id,
        user_id: userId,
        title: project.title,
        author: project.author,
        interview_data: project.interviewData,
        full_draft: project.fullDraft,
        cover_image_url: project.coverImageUrl,
        cover_design: project.coverDesign,
        is_deleted: project.isDeleted || false,
        updated_at: new Date(project.updatedAt).toISOString()
      }, { onConflict: 'id' });

    if (error) console.error('Cloud Sync Error:', error);
  } catch (err) {
    console.error('Cloud Sync Failed:', err);
  } finally {
    if (setSyncState) setSyncState(false);
  }
};

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      userProfile: null,
      settings: {
        notifications: true,
        darkMode: false,
        fontSize: 24,
        echoVoice: 'Aoede',
      },
      chatHistory: [],
      isSyncing: false,
      tempOnboardingData: null,

      fetchProjects: async () => {
        const userId = get().userProfile?.id;
        if (!userId) return;

        try {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

          if (error) throw error;
          if (data) {
            const formatted: Project[] = data.map(p => ({
              id: p.id,
              title: p.title,
              author: p.author || '작가님',
              updatedAt: new Date(p.updated_at).getTime(),
              interviewData: p.interview_data || [],
              fullDraft: p.full_draft || '',
              coverImageUrl: p.cover_image_url || '',
              coverDesign: p.cover_design || { layout: 'classic', theme: 'amber' },
              isDeleted: p.is_deleted || false,
              interviewStage: Math.min(5, Math.floor((p.interview_data?.length || 0) / 2) + 1),
              currentWordCount: (p.interview_data?.length || 0) * 8500, // Estimate 8.5k chars per Q&A after expansion
              targetWordCount: 100000,
            }));

            // Merge with any local projects that haven't been synced to the cloud yet.
            // This prevents data loss if the user created a project before their session was fully initialized.
            const localProjects = get().projects;
            const unsyncedProjects = localProjects.filter(localProj => !formatted.some(f => f.id === localProj.id));

            const mergedProjects = [...formatted];

            for (const unsynced of unsyncedProjects) {
              mergedProjects.push(unsynced);
              syncProjectToCloud(unsynced, userId); // Fire and forget upload to cloud
            }

            // Sort by updatedAt descending
            mergedProjects.sort((a, b) => b.updatedAt - a.updatedAt);

            set({ projects: mergedProjects });
            if (mergedProjects.length > 0 && !get().currentProjectId) {
              set({ currentProjectId: mergedProjects[0].id });
            }
          }
        } catch (err) {
          console.error('Fetch Projects Failed:', err);
        }
      },

      createProject: async (title) => {
        const id = Math.random().toString(36).substring(2, 9);
        const authorName = get().userProfile?.name || '작가님';
        const newProject = { ...createInitialProject(id, title), author: authorName };

        set((state) => ({
          projects: [newProject, ...state.projects],
          currentProjectId: id,
        }));

        const userId = get().userProfile?.id;
        if (userId) await syncProjectToCloud(newProject, userId);

        return id;
      },

      switchProject: (id) => set({ currentProjectId: id }),

      deleteProject: async (id) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, isDeleted: true, updatedAt: Date.now() } : p
          )
        }));

        const project = get().projects.find(p => p.id === id);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId);
      },

      restoreProject: async (id) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, isDeleted: false, updatedAt: Date.now() } : p
          )
        }));

        const project = get().projects.find(p => p.id === id);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId);
      },

      resetDraft: async (id, newTone) => {
        const userId = get().userProfile?.id;
        const state = get();
        const projectToReset = state.projects.find(p => p.id === id);

        if (!projectToReset) return;

        // 1. Create backup in Compost
        const backupId = Math.random().toString(36).substring(2, 10);
        const backupProject = {
          ...projectToReset,
          id: backupId,
          title: `${projectToReset.title} (초기화 백업)`,
          isDeleted: true, // Go straight to compost
          updatedAt: Date.now(),
        };

        // 2. Reset the original project's draft only
        const resetProjectData = {
          ...projectToReset,
          fullDraft: '', // Clear the draft
          // Note: We KEEP interviewData
          // We can temporarily store the new tone if we wanted to 
          // add it to the Project interface, but for now we will 
          // manage it before diving into the generation.
          updatedAt: Date.now(),
        };

        // 3. Update local state
        set((state) => ({
          projects: [
            backupProject,
            ...state.projects.map(p => p.id === id ? resetProjectData : p)
          ]
        }));

        // 4. Sync both to cloud
        if (userId) {
          await syncProjectToCloud(backupProject, userId);
          await syncProjectToCloud(resetProjectData, userId);
        }
      },

      permanentlyDeleteProject: async (id) => {
        set((state) => {
          const remaining = state.projects.filter(p => p.id !== id);
          return {
            projects: remaining,
            currentProjectId: state.currentProjectId === id
              ? (remaining[0]?.id || null)
              : state.currentProjectId
          };
        });

        const userId = get().userProfile?.id;
        if (userId) {
          await supabase.from('projects').delete().eq('id', id);
        }
      },

      addInterviewStep: async (q, a) => {
        set((state) => ({
          projects: state.projects.map(p => {
            if (p.id === state.currentProjectId) {
              const newInterviewData = [...p.interviewData, { question: q, answer: a }];
              const newStage = Math.min(5, Math.floor(newInterviewData.length / 2) + 1);
              const newWordCount = Math.min(100000, newInterviewData.length * 8500); // Creative expansion estimate
              return {
                ...p,
                interviewData: newInterviewData,
                interviewStage: newStage,
                currentWordCount: newWordCount,
                updatedAt: Date.now()
              };
            }
            return p;
          })
        }));

        const project = get().projects.find(p => p.id === get().currentProjectId);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId, (s) => set({ isSyncing: s }));
      },

      undoInterviewStep: async () => {
        set((state) => ({
          projects: state.projects.map(p => {
            if (p.id === state.currentProjectId) {
              const newInterviewData = p.interviewData.slice(0, -1);
              const newStage = Math.min(5, Math.floor(newInterviewData.length / 2) + 1);
              const newWordCount = newInterviewData.length * 8500;
              return {
                ...p,
                interviewData: newInterviewData,
                interviewStage: newStage,
                currentWordCount: newWordCount,
                updatedAt: Date.now()
              };
            }
            return p;
          })
        }));

        const project = get().projects.find(p => p.id === get().currentProjectId);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId, (s) => set({ isSyncing: s }));
      },

      setFullDraft: async (draft) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.currentProjectId
              ? { ...p, fullDraft: draft, updatedAt: Date.now() }
              : p
          )
        }));

        const project = get().projects.find(p => p.id === get().currentProjectId);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId);
      },

      setCoverImageUrl: async (url) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.currentProjectId
              ? { ...p, coverImageUrl: url, updatedAt: Date.now() }
              : p
          )
        }));

        const project = get().projects.find(p => p.id === get().currentProjectId);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId);
      },

      setCoverDesign: async (design) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.currentProjectId
              ? { ...p, coverDesign: { ...p.coverDesign, ...design }, updatedAt: Date.now() }
              : p
          )
        }));

        const project = get().projects.find(p => p.id === get().currentProjectId);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId);
      },

      setInteriorLayout: async (layout) => {
        const current = get().projects.find(p => p.id === get().currentProjectId);
        if (!current) return;
        const merged: InteriorLayout = { ...current.coverDesign.interiorLayout, ...layout } as InteriorLayout;
        await get().setCoverDesign({ interiorLayout: merged });
      },

      setDedicationText: async (text) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.currentProjectId
              ? { ...p, dedicationText: text, updatedAt: Date.now() }
              : p
          ),
        }));
        const project = get().projects.find(p => p.id === get().currentProjectId);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId);
      },

      setAuthorBio: async (bio) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.currentProjectId
              ? { ...p, authorBio: bio, updatedAt: Date.now() }
              : p
          ),
        }));
        const project = get().projects.find(p => p.id === get().currentProjectId);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId);
      },

      setTargetWordCount: async (count) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.currentProjectId
              ? { ...p, targetWordCount: count, updatedAt: Date.now() }
              : p
          ),
        }));
        const project = get().projects.find(p => p.id === get().currentProjectId);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId);
      },

      updateProjectTitle: async (title) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.currentProjectId ? { ...p, title, updatedAt: Date.now() } : p
          )
        }));

        const project = get().projects.find(p => p.id === get().currentProjectId);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId);
      },

      setTempOnboardingData: (data) => set({ tempOnboardingData: data }),
      setUserProfile: (profile) => set({ userProfile: profile }),

      updateUserProfile: async (updates) => {
        const currentProfile = get().userProfile;
        if (!currentProfile) return;

        const newProfile = { ...currentProfile, ...updates };
        set({ userProfile: newProfile });

        // Sync to projects as author name if needed
        if (updates.name) {
          set((state) => ({
            projects: state.projects.map(p =>
              (p.author === currentProfile.name || p.author === '작가님')
                ? { ...p, author: updates.name!, updatedAt: Date.now() }
                : p
            )
          }));
        }

        // Sync to Supabase profile
        try {
          await supabase
            .from('profiles')
            .upsert({
              id: currentProfile.id,
              name: newProfile.name,
              email: newProfile.email,
              avatar_url: newProfile.avatar,
              updated_at: new Date().toISOString(),
            });
        } catch (e) {
          console.error('Failed to sync profile to Supabase:', e);
        }
      },

      fetchUserProfile: async () => {
        const userId = get().userProfile?.id;
        if (!userId) return;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) throw error;
          if (data) {
            set({
              userProfile: {
                id: data.id,
                name: data.name || '작가님',
                email: data.email || '',
                avatar: data.avatar_url || undefined,
              }
            });
          }
        } catch (err) {
          console.error('Fetch User Profile Failed:', err);
        }
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }));
      },

      addChatMessage: async (role, content) => {
        const newMessage: ChatMessage = { role, content, timestamp: Date.now() };
        set((state) => ({
          chatHistory: [...state.chatHistory, newMessage]
        }));

        // Skip DB insert for empty streaming placeholders — call persistChatMessage after streaming
        if (!content) return;

        const userId = get().userProfile?.id;
        if (userId) {
          try {
            await supabase.from('chat_messages').insert({
              user_id: userId,
              role,
              content,
              timestamp: new Date(newMessage.timestamp).toISOString()
            });
          } catch (e) {
            console.error('Failed to sync chat to Supabase:', e);
          }
        }
      },

      persistChatMessage: async (role, content, timestamp) => {
        const userId = get().userProfile?.id;
        if (!userId || !content) return;
        try {
          await supabase.from('chat_messages').insert({
            user_id: userId,
            role,
            content,
            timestamp: new Date(timestamp).toISOString()
          });
        } catch (e) {
          console.error('Failed to persist chat message:', e);
        }
      },

      updateLastInterviewQuestion: async (question) => {
        set((state) => ({
          projects: state.projects.map(p => {
            if (p.id === state.currentProjectId && p.interviewData.length > 0) {
              const newInterviewData = [...p.interviewData];
              newInterviewData[newInterviewData.length - 1] = {
                ...newInterviewData[newInterviewData.length - 1],
                question
              };
              return {
                ...p,
                interviewData: newInterviewData,
                updatedAt: Date.now()
              };
            }
            return p;
          })
        }));

        const project = get().projects.find(p => p.id === get().currentProjectId);
        const userId = get().userProfile?.id;
        if (project && userId) await syncProjectToCloud(project, userId);
      },

      setChatHistory: (history) => set({ chatHistory: history }),

      fetchChatHistory: async () => {
        const userId = get().userProfile?.id;
        if (!userId) return;

        try {
          const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: true });

          if (error) throw error;
          if (data) {
            const formatted: ChatMessage[] = data.map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.timestamp).getTime(),
            }));
            set({ chatHistory: formatted });
          }
        } catch (err) {
          console.error('Fetch Chat History Failed:', err);
        }
      },

      resetAll: () => set((state) => ({ projects: [], currentProjectId: null, userProfile: null, tempOnboardingData: state.tempOnboardingData, chatHistory: [] })),
    }),
    {
      name: 'leafnote-storage-v1', // Rebranded storage key
    }
  )
);

// Helper Selector
export const useCurrentProject = () => {
  const { projects, currentProjectId } = useBookStore();
  return projects.find(p => p.id === currentProjectId) || null;
};
