export type EggStatus = 'empty' | 'uncertain' | 'occupied' | 'hatched';
    export type ParentalRelation = 'father' | 'mother';

    export interface User {
      id: string; // Corresponds to auth.users.id
      email: string;
      created_at: string;
    }

    export interface Bird {
      id: string;
      user_id: string;
      name: string;
      ring_number: string;
      species?: string | null;
      gender?: string | null;
      birth_date?: string | null;
      color_mutation?: string | null;
      photo_url?: string | null;
      notes?: string | null;
      is_favorite?: boolean;
      created_at: string;
      updated_at: string;
    }

    export interface Clutch {
      id: string;
      user_id: string;
      nest_name: string;
      start_date: string; // ISO date string
      expected_hatch_date: string; // ISO date string
      created_at: string;
      updated_at: string;
    }

    export interface Egg {
      id: string;
      clutch_id: string;
      position: number;
      status: EggStatus;
      laid_date: string; // ISO date string
      created_at: string;
      updated_at: string;
    }

    export interface Chick {
      id: string;
      user_id: string;
      egg_id?: string | null;
      name?: string | null;
      hatch_date: string; // ISO date string
      weight?: number | null; // NUMERIC(5, 2)
      notes?: string | null;
      created_at: string;
      updated_at: string;
    }

    export interface Pedigree {
      id: string;
      child_id: string;
      parent_id: string;
      relation_type: ParentalRelation;
    }
