// ============================================
// Core Types — Content Repurposer
// ============================================

export type Platform = 'facebook' | 'twitter' | 'threads' | 'instagram' | 'linkedin';
export type Tone = 'professional' | 'casual' | 'witty' | 'authoritative' | 'inspirational';
export type Language = 'US' | 'UK';
export type GenerationStatus = 'pending' | 'completed' | 'failed';

export const PLATFORMS: Platform[] = ['facebook', 'twitter', 'threads', 'instagram', 'linkedin'];
export const TONES: { value: Tone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Clean, polished, and business-appropriate' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, friendly, and approachable' },
  { value: 'witty', label: 'Witty', description: 'Clever, humorous, and engaging' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert, confident, and commanding' },
  { value: 'inspirational', label: 'Inspirational', description: 'Motivating, uplifting, and empowering' },
];

export const PLATFORM_CONFIG: Record<Platform, { label: string; maxLength: number; icon: string; color: string }> = {
  facebook: { label: 'Facebook', maxLength: 2000, icon: '📘', color: '#1877F2' },
  twitter: { label: 'Twitter / X', maxLength: 280, icon: '🐦', color: '#1DA1F2' },
  threads: { label: 'Threads', maxLength: 500, icon: '🧵', color: '#000000' },
  instagram: { label: 'Instagram', maxLength: 2200, icon: '📸', color: '#E4405F' },
  linkedin: { label: 'LinkedIn', maxLength: 3000, icon: '💼', color: '#0A66C2' },
};

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  credits: number;
  language_preference: Language;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  source_url: string;
  source_title: string | null;
  tone: Tone;
  language: Language;
  status: GenerationStatus;
  error_message: string | null;
  created_at: string;
}

export interface GeneratedPost {
  id: string;
  generation_id: string;
  platform: Platform;
  variant: number;
  content: string;
  character_count: number;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'usage' | 'refund';
  amount: number;
  generation_id: string | null;
  stripe_session_id: string | null;
  created_at: string;
}

// API types
export interface GenerateRequest {
  url: string;
  tone: Tone;
  language: Language;
}

export interface PostVariant {
  variant: number;
  content: string;
  character_count: number;
}

export interface GenerateResponse {
  success: true;
  generation_id: string;
  source_title: string;
  posts: Record<Platform, PostVariant[]>;
  credits_remaining: number;
}

export interface GenerateErrorResponse {
  success: false;
  error: string;
  credits_deducted: boolean;
}

// Generation with posts (for history)
export interface GenerationWithPosts extends Generation {
  generated_posts: GeneratedPost[];
}
