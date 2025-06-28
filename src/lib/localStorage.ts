// Local Storage Management System
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  language: 'tr' | 'en';
  theme: 'light' | 'dark' | 'auto';
  created_at: string;
}

export interface Bird {
  id: string;
  user_id: string;
  name: string;
  ring_number: string;
  species: string;
  gender: 'male' | 'female';
  birth_date?: string;
  color_mutation?: string;
  photo_url?: string;
  notes?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Clutch {
  id: string;
  user_id: string;
  nest_name: string;
  start_date: string;
  expected_hatch_date: string;
  actual_hatch_date?: string;
  status: 'active' | 'completed' | 'failed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Egg {
  id: string;
  clutch_id: string;
  position: number;
  status: 'empty' | 'uncertain' | 'occupied' | 'hatched';
  laid_date?: string;
  expected_hatch_date?: string;
  actual_hatch_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Chick {
  id: string;
  user_id: string;
  egg_id?: string;
  name?: string;
  hatch_date: string;
  weight?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PedigreeRelation {
  id: string;
  child_id: string;
  parent_id: string;
  relation_type: 'father' | 'mother';
  created_at: string;
}

class LocalStorageManager {
  private static instance: LocalStorageManager;
  private currentUser: User | null = null;

  static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  // User Management
  setCurrentUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }
    return null;
  }

  signOut(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  // Generic CRUD Operations
  private getKey(table: string): string {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');
    return `${table}_${user.id}`;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getAll<T>(table: string): T[] {
    const key = this.getKey(table);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  private saveAll<T>(table: string, items: T[]): void {
    const key = this.getKey(table);
    localStorage.setItem(key, JSON.stringify(items));
  }

  // Birds
  getBirds(): Bird[] {
    return this.getAll<Bird>('birds');
  }

  saveBird(bird: Omit<Bird, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Bird {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const birds = this.getBirds();
    const newBird: Bird = {
      ...bird,
      id: this.generateId(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    birds.push(newBird);
    this.saveAll('birds', birds);
    return newBird;
  }

  updateBird(id: string, updates: Partial<Bird>): Bird | null {
    const birds = this.getBirds();
    const index = birds.findIndex(b => b.id === id);
    
    if (index === -1) return null;

    birds[index] = {
      ...birds[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveAll('birds', birds);
    return birds[index];
  }

  deleteBird(id: string): boolean {
    const birds = this.getBirds();
    const filtered = birds.filter(b => b.id !== id);
    
    if (filtered.length === birds.length) return false;
    
    this.saveAll('birds', filtered);
    return true;
  }

  // Clutches
  getClutches(): Clutch[] {
    return this.getAll<Clutch>('clutches');
  }

  saveClutch(clutch: Omit<Clutch, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Clutch {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const clutches = this.getClutches();
    const newClutch: Clutch = {
      ...clutch,
      id: this.generateId(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    clutches.push(newClutch);
    this.saveAll('clutches', clutches);
    return newClutch;
  }

  updateClutch(id: string, updates: Partial<Clutch>): Clutch | null {
    const clutches = this.getClutches();
    const index = clutches.findIndex(c => c.id === id);
    
    if (index === -1) return null;

    clutches[index] = {
      ...clutches[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveAll('clutches', clutches);
    return clutches[index];
  }

  deleteClutch(id: string): boolean {
    const clutches = this.getClutches();
    const filtered = clutches.filter(c => c.id !== id);
    
    if (filtered.length === clutches.length) return false;
    
    this.saveAll('clutches', filtered);
    return true;
  }

  // Eggs
  getEggs(): Egg[] {
    return this.getAll<Egg>('eggs');
  }

  saveEgg(egg: Omit<Egg, 'id' | 'created_at' | 'updated_at'>): Egg {
    const eggs = this.getEggs();
    const newEgg: Egg = {
      ...egg,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    eggs.push(newEgg);
    this.saveAll('eggs', eggs);
    return newEgg;
  }

  updateEgg(id: string, updates: Partial<Egg>): Egg | null {
    const eggs = this.getEggs();
    const index = eggs.findIndex(e => e.id === id);
    
    if (index === -1) return null;

    eggs[index] = {
      ...eggs[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveAll('eggs', eggs);
    return eggs[index];
  }

  deleteEgg(id: string): boolean {
    const eggs = this.getEggs();
    const filtered = eggs.filter(e => e.id !== id);
    
    if (filtered.length === eggs.length) return false;
    
    this.saveAll('eggs', filtered);
    return true;
  }

  // Chicks
  getChicks(): Chick[] {
    return this.getAll<Chick>('chicks');
  }

  saveChick(chick: Omit<Chick, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Chick {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const chicks = this.getChicks();
    const newChick: Chick = {
      ...chick,
      id: this.generateId(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    chicks.push(newChick);
    this.saveAll('chicks', chicks);
    return newChick;
  }

  updateChick(id: string, updates: Partial<Chick>): Chick | null {
    const chicks = this.getChicks();
    const index = chicks.findIndex(c => c.id === id);
    
    if (index === -1) return null;

    chicks[index] = {
      ...chicks[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveAll('chicks', chicks);
    return chicks[index];
  }

  deleteChick(id: string): boolean {
    const chicks = this.getChicks();
    const filtered = chicks.filter(c => c.id !== id);
    
    if (filtered.length === chicks.length) return false;
    
    this.saveAll('chicks', filtered);
    return true;
  }

  // Todos
  getTodos(): Todo[] {
    return this.getAll<Todo>('todos');
  }

  saveTodo(todo: Omit<Todo, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Todo {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const todos = this.getTodos();
    const newTodo: Todo = {
      ...todo,
      id: this.generateId(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    todos.push(newTodo);
    this.saveAll('todos', todos);
    return newTodo;
  }

  updateTodo(id: string, updates: Partial<Todo>): Todo | null {
    const todos = this.getTodos();
    const index = todos.findIndex(t => t.id === id);
    
    if (index === -1) return null;

    todos[index] = {
      ...todos[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveAll('todos', todos);
    return todos[index];
  }

  deleteTodo(id: string): boolean {
    const todos = this.getTodos();
    const filtered = todos.filter(t => t.id !== id);
    
    if (filtered.length === todos.length) return false;
    
    this.saveAll('todos', filtered);
    return true;
  }

  // Pedigree
  getPedigreeRelations(): PedigreeRelation[] {
    return this.getAll<PedigreeRelation>('pedigree');
  }

  savePedigreeRelation(relation: Omit<PedigreeRelation, 'id' | 'created_at'>): PedigreeRelation {
    const relations = this.getPedigreeRelations();
    const newRelation: PedigreeRelation = {
      ...relation,
      id: this.generateId(),
      created_at: new Date().toISOString()
    };

    relations.push(newRelation);
    this.saveAll('pedigree', relations);
    return newRelation;
  }

  deletePedigreeRelation(id: string): boolean {
    const relations = this.getPedigreeRelations();
    const filtered = relations.filter(r => r.id !== id);
    
    if (filtered.length === relations.length) return false;
    
    this.saveAll('pedigree', filtered);
    return true;
  }

  // Data Export/Import
  exportAllData(): string {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const data = {
      user,
      birds: this.getBirds(),
      clutches: this.getClutches(),
      eggs: this.getEggs(),
      chicks: this.getChicks(),
      todos: this.getTodos(),
      pedigree: this.getPedigreeRelations(),
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  importAllData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.birds) this.saveAll('birds', data.birds);
      if (data.clutches) this.saveAll('clutches', data.clutches);
      if (data.eggs) this.saveAll('eggs', data.eggs);
      if (data.chicks) this.saveAll('chicks', data.chicks);
      if (data.todos) this.saveAll('todos', data.todos);
      if (data.pedigree) this.saveAll('pedigree', data.pedigree);
      
    } catch (error) {
      throw new Error('Invalid JSON data');
    }
  }

  // Clear all data
  clearAllData(): void {
    const user = this.getCurrentUser();
    if (!user) return;

    const tables = ['birds', 'clutches', 'eggs', 'chicks', 'todos', 'pedigree'];
    tables.forEach(table => {
      localStorage.removeItem(`${table}_${user.id}`);
    });
  }
}

export const localDB = LocalStorageManager.getInstance();