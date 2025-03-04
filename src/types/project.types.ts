export interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string;
  live_url: string;
  github_url?: string | null;
  technologies: string[];
  order: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  type: "web" | "mobile";
  category: "frontend" | "fullstack";
  status: "completed" | "in-progress" | "featured";
  year: number;
}