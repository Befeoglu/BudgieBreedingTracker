import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export interface BackupData {
  users: any[];
  birds: any[];
  incubations: any[];
  eggs: any[];
  chicks: any[];
  daily_logs: any[];
  metadata: {
    backup_date: string;
    version: string;
    total_records: number;
    record_counts: Record<string, number>;
  };
}

export interface BackupOptions {
  includePhotos?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export class BackupService {
  private static instance: BackupService;
  private isBackupInProgress = false;
  private autoBackupInterval: NodeJS.Timeout | null = null;

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  // Get current user ID
  private async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    return userData?.id || null;
  }

  // Create full backup
  async createBackup(type: 'automatic' | 'manual' = 'manual', options: BackupOptions = {}): Promise<{
    success: boolean;
    backupId?: string;
    error?: string;
    data?: BackupData;
  }> {
    if (this.isBackupInProgress) {
      return { success: false, error: 'Backup already in progress' };
    }

    this.isBackupInProgress = true;

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Fetch all user data
      const backupData: BackupData = {
        users: [],
        birds: [],
        incubations: [],
        eggs: [],
        chicks: [],
        daily_logs: [],
        metadata: {
          backup_date: new Date().toISOString(),
          version: '1.0.0',
          total_records: 0,
          record_counts: {}
        }
      };

      // Fetch users data
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);
      backupData.users = users || [];

      // Fetch birds data
      const { data: birds } = await supabase
        .from('birds')
        .select('*')
        .eq('user_id', userId);
      backupData.birds = birds || [];

      // Fetch incubations data
      const { data: incubations } = await supabase
        .from('incubations')
        .select('*')
        .eq('user_id', userId);
      backupData.incubations = incubations || [];

      // Fetch eggs data
      const { data: eggs } = await supabase
        .from('eggs')
        .select('*')
        .in('incubation_id', (incubations || []).map(i => i.id));
      backupData.eggs = eggs || [];

      // Fetch chicks data
      const { data: chicks } = await supabase
        .from('chicks')
        .select('*')
        .eq('user_id', userId);
      backupData.chicks = chicks || [];

      // Fetch daily logs data
      let dailyLogsQuery = supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId);

      if (options.dateRange) {
        dailyLogsQuery = dailyLogsQuery
          .gte('log_date', options.dateRange.start)
          .lte('log_date', options.dateRange.end);
      }

      const { data: dailyLogs } = await dailyLogsQuery;
      backupData.daily_logs = dailyLogs || [];

      // Calculate metadata
      backupData.metadata.record_counts = {
        users: backupData.users.length,
        birds: backupData.birds.length,
        incubations: backupData.incubations.length,
        eggs: backupData.eggs.length,
        chicks: backupData.chicks.length,
        daily_logs: backupData.daily_logs.length
      };

      backupData.metadata.total_records = Object.values(backupData.metadata.record_counts)
        .reduce((sum, count) => sum + count, 0);

      // Save backup to database
      const { data: backup, error: backupError } = await supabase
        .from('backups')
        .insert({
          user_id: userId,
          backup_type: type,
          backup_data: backupData,
          backup_size: JSON.stringify(backupData).length,
          record_counts: backupData.metadata.record_counts,
          status: 'completed'
        })
        .select()
        .single();

      if (backupError) throw backupError;

      return {
        success: true,
        backupId: backup.id,
        data: backupData
      };

    } catch (error: any) {
      console.error('Backup failed:', error);
      
      // Log the error
      const userId = await this.getCurrentUserId();
      if (userId) {
        await supabase.from('sync_logs').insert({
          user_id: userId,
          operation: 'backup',
          conflict_type: 'data_conflict',
          new_data: { error: error.message }
        });
      }

      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isBackupInProgress = false;
    }
  }

  // Restore from backup
  async restoreBackup(backupId: string, options: {
    conflictResolution: 'local_wins' | 'remote_wins' | 'merge';
    confirmRestore: boolean;
  }): Promise<{
    success: boolean;
    error?: string;
    conflicts?: any[];
  }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!options.confirmRestore) {
        throw new Error('Restore not confirmed');
      }

      // Get backup data
      const { data: backup, error: backupError } = await supabase
        .from('backups')
        .select('*')
        .eq('id', backupId)
        .eq('user_id', userId)
        .single();

      if (backupError || !backup) {
        throw new Error('Backup not found');
      }

      const backupData = backup.backup_data as BackupData;
      const conflicts: any[] = [];

      // Restore users data
      if (backupData.users.length > 0) {
        const { error: usersError } = await supabase
          .from('users')
          .upsert(backupData.users, { onConflict: 'id' });
        
        if (usersError) console.error('Users restore error:', usersError);
      }

      // Restore birds data
      if (backupData.birds.length > 0) {
        const { error: birdsError } = await supabase
          .from('birds')
          .upsert(backupData.birds, { onConflict: 'id' });
        
        if (birdsError) console.error('Birds restore error:', birdsError);
      }

      // Restore incubations data
      if (backupData.incubations.length > 0) {
        const { error: incubationsError } = await supabase
          .from('incubations')
          .upsert(backupData.incubations, { onConflict: 'id' });
        
        if (incubationsError) console.error('Incubations restore error:', incubationsError);
      }

      // Restore eggs data
      if (backupData.eggs.length > 0) {
        const { error: eggsError } = await supabase
          .from('eggs')
          .upsert(backupData.eggs, { onConflict: 'id' });
        
        if (eggsError) console.error('Eggs restore error:', eggsError);
      }

      // Restore chicks data
      if (backupData.chicks.length > 0) {
        const { error: chicksError } = await supabase
          .from('chicks')
          .upsert(backupData.chicks, { onConflict: 'id' });
        
        if (chicksError) console.error('Chicks restore error:', chicksError);
      }

      // Restore daily logs data
      if (backupData.daily_logs.length > 0) {
        const { error: logsError } = await supabase
          .from('daily_logs')
          .upsert(backupData.daily_logs, { onConflict: 'id' });
        
        if (logsError) console.error('Daily logs restore error:', logsError);
      }

      // Log successful restore
      await supabase.from('sync_logs').insert({
        user_id: userId,
        operation: 'restore',
        resolution: options.conflictResolution,
        new_data: { backup_id: backupId, records_restored: backupData.metadata.total_records }
      });

      return {
        success: true,
        conflicts
      };

    } catch (error: any) {
      console.error('Restore failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get backup list
  async getBackups(): Promise<{
    success: boolean;
    backups?: any[];
    error?: string;
  }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data: backups, error } = await supabase
        .from('backups')
        .select('id, backup_type, backup_date, record_counts, backup_size, status')
        .eq('user_id', userId)
        .order('backup_date', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        backups: backups || []
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Export backup as JSON file
  async exportBackup(backupId: string): Promise<{
    success: boolean;
    filename?: string;
    error?: string;
  }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data: backup, error } = await supabase
        .from('backups')
        .select('backup_data, backup_date')
        .eq('id', backupId)
        .eq('user_id', userId)
        .single();

      if (error || !backup) {
        throw new Error('Backup not found');
      }

      const filename = `kulucka-takip-backup-${format(new Date(backup.backup_date), 'yyyy-MM-dd-HH-mm')}.json`;
      const dataStr = JSON.stringify(backup.backup_data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        success: true,
        filename
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Start automatic backup
  startAutoBackup(intervalHours: number = 24): void {
    this.stopAutoBackup();
    
    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.autoBackupInterval = setInterval(async () => {
      console.log('Starting automatic backup...');
      const result = await this.createBackup('automatic');
      if (result.success) {
        console.log('Automatic backup completed successfully');
      } else {
        console.error('Automatic backup failed:', result.error);
      }
    }, intervalMs);

    console.log(`Automatic backup started with ${intervalHours} hour interval`);
  }

  // Stop automatic backup
  stopAutoBackup(): void {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
      console.log('Automatic backup stopped');
    }
  }

  // Check backup status
  isBackupRunning(): boolean {
    return this.isBackupInProgress;
  }
}

export const backupService = BackupService.getInstance();
