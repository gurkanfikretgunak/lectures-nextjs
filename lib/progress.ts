import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LectureProgress {
  completed: boolean;
  lastVisited: string | null;
  timeSpent: number; // in seconds
}

interface ProgressState {
  lectures: Record<string, LectureProgress>;
  markAsCompleted: (lectureId: string) => void;
  markAsVisited: (lectureId: string) => void;
  toggleCompleted: (lectureId: string) => void;
  addTimeSpent: (lectureId: string, seconds: number) => void;
  isCompleted: (lectureId: string) => boolean;
  getProgress: (lectureId: string) => LectureProgress | undefined;
  getTotalCompleted: () => number;
  reset: () => void;
}

const initialProgress: LectureProgress = {
  completed: false,
  lastVisited: null,
  timeSpent: 0,
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      lectures: {},

      markAsCompleted: (lectureId: string) => {
        set((state) => ({
          lectures: {
            ...state.lectures,
            [lectureId]: {
              ...initialProgress,
              ...state.lectures[lectureId],
              completed: true,
              lastVisited: new Date().toISOString(),
            },
          },
        }));
      },

      markAsVisited: (lectureId: string) => {
        set((state) => ({
          lectures: {
            ...state.lectures,
            [lectureId]: {
              ...initialProgress,
              ...state.lectures[lectureId],
              lastVisited: new Date().toISOString(),
            },
          },
        }));
      },

      toggleCompleted: (lectureId: string) => {
        set((state) => {
          const current = state.lectures[lectureId];
          return {
            lectures: {
              ...state.lectures,
              [lectureId]: {
                ...initialProgress,
                ...current,
                completed: !current?.completed,
                lastVisited: new Date().toISOString(),
              },
            },
          };
        });
      },

      addTimeSpent: (lectureId: string, seconds: number) => {
        set((state) => ({
          lectures: {
            ...state.lectures,
            [lectureId]: {
              ...initialProgress,
              ...state.lectures[lectureId],
              timeSpent: (state.lectures[lectureId]?.timeSpent || 0) + seconds,
            },
          },
        }));
      },

      isCompleted: (lectureId: string) => {
        return get().lectures[lectureId]?.completed || false;
      },

      getProgress: (lectureId: string) => {
        return get().lectures[lectureId];
      },

      getTotalCompleted: () => {
        return Object.values(get().lectures).filter((l) => l.completed).length;
      },

      reset: () => {
        set({ lectures: {} });
      },
    }),
    {
      name: "lecture-progress",
    }
  )
);

// Helper hook to get lecture ID from category and slug
export function getLectureId(category: string, slug: string): string {
  return `${category}/${slug}`;
}
