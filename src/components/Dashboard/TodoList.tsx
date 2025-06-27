import React, { useState, useEffect } from 'react';
import { Check, Clock, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  created_at: string;
}

interface TodoItemProps extends Todo {
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ 
  id, 
  title, 
  description, 
  priority, 
  completed, 
  onToggle,
  onDelete
}) => {
  const priorityColors = {
    low: 'text-neutral-500',
    medium: 'text-secondary-500',
    high: 'text-red-500'
  };

  const priorityIcons = {
    low: Clock,
    medium: AlertCircle,
    high: AlertCircle
  };

  const Icon = priorityIcons[priority];

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200 hover:border-primary-200 transition-colors">
      <button
        onClick={() => onToggle(id)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          completed
            ? 'bg-primary-600 border-primary-600'
            : 'border-neutral-300 hover:border-primary-500'
        }`}
      >
        {completed && <Check className="w-3 h-3 text-white" />}
      </button>
      
      <div className="flex-1">
        <h4 className={`font-medium ${completed ? 'text-neutral-500 line-through' : 'text-neutral-800'}`}>
          {title}
        </h4>
        {description && (
          <p className={`text-sm ${completed ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {description}
          </p>
        )}
      </div>
      
      <Icon className={`w-4 h-4 ${priorityColors[priority]} ${completed ? 'opacity-50' : ''}`} />
    </div>
  );
};

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', priority: 'medium' as const });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadTodos();
  }, []);

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Try to get user profile, create if doesn't exist
    let { data: userData, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    // If no profile exists, create one
    if (!userData) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || ''
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return null;
      }

      userData = newUser;
    }

    return userData.id;
  };

  const loadTodos = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading todos:', error);
        return;
      }

      setTodos(data || []);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', id);

    if (error) {
      console.error('Error updating todo:', error);
      return;
    }

    setTodos(todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
      return;
    }

    setTodos(todos.filter(t => t.id !== id));
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTodo.title.trim()) return;

    try {
      const userId = await getUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('todos')
        .insert({
          user_id: userId,
          title: newTodo.title,
          description: newTodo.description || null,
          priority: newTodo.priority,
          completed: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding todo:', error);
        return;
      }

      setTodos([data, ...todos]);
      setNewTodo({ title: '', description: '', priority: 'medium' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Bugün Yapılacaklar</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-neutral-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const completedCount = todos.filter(todo => todo.completed).length;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">Bugün Yapılacaklar</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-600">
            {completedCount}/{todos.length} tamamlandı
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTodo} className="mb-4 p-4 bg-neutral-50 rounded-lg">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Görev başlığı..."
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
            <input
              type="text"
              placeholder="Açıklama (isteğe bağlı)..."
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="flex items-center gap-3">
              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as any })}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="low">Düşük Öncelik</option>
                <option value="medium">Orta Öncelik</option>
                <option value="high">Yüksek Öncelik</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Ekle
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </form>
      )}
      
      <div className="space-y-3">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Henüz görev eklenmemiş</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              İlk görevinizi ekleyin
            </button>
          </div>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              {...todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};