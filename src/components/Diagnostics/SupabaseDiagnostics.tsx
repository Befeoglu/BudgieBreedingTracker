import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Database, 
  Settings, 
  Code, 
  Play,
  Download,
  Upload,
  Eye,
  Edit3,
  Trash2,
  Terminal,
  Shield,
  Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DiagnosticResult {
  id: string;
  category: string;
  title: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  action?: () => void;
  actionLabel?: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface RLSPolicy {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}

export const SupabaseDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'rls' | 'migrations' | 'logs'>('overview');
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [policies, setPolicies] = useState<RLSPolicy[]>([]);
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);

  useEffect(() => {
    runDiagnostics();
    loadErrorLogs();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: DiagnosticResult[] = [];

    try {
      // 1. Çevre Değişkenleri Kontrolü
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        results.push({
          id: 'env-vars',
          category: 'Konfigürasyon',
          title: 'Çevre Değişkenleri',
          status: 'error',
          message: 'SUPABASE_URL veya SUPABASE_ANON_KEY tanımlı değil',
          details: 'Lütfen .env dosyasında bu değişkenleri tanımlayın',
          action: () => showEnvSetupModal(),
          actionLabel: 'Kurulum Rehberi'
        });
      } else {
        results.push({
          id: 'env-vars',
          category: 'Konfigürasyon',
          title: 'Çevre Değişkenleri',
          status: 'success',
          message: 'Çevre değişkenleri doğru tanımlanmış'
        });
      }

      // 2. Supabase Bağlantı Testi
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) throw error;
        
        results.push({
          id: 'connection',
          category: 'Bağlantı',
          title: 'Supabase Bağlantısı',
          status: 'success',
          message: 'Supabase bağlantısı başarılı'
        });
      } catch (error: any) {
        results.push({
          id: 'connection',
          category: 'Bağlantı',
          title: 'Supabase Bağlantısı',
          status: 'error',
          message: 'Supabase bağlantısı başarısız',
          details: error.message,
          action: () => testConnection(),
          actionLabel: 'Tekrar Dene'
        });
      }

      // 3. Tablo Şeması Kontrolü
      await checkTableSchema(results);

      // 4. RLS Politikaları Kontrolü
      await checkRLSPolicies(results);

      // 5. Auth Durumu Kontrolü
      const { data: { user } } = await supabase.auth.getUser();
      results.push({
        id: 'auth',
        category: 'Kimlik Doğrulama',
        title: 'Auth Durumu',
        status: user ? 'success' : 'warning',
        message: user ? `Kullanıcı oturumu aktif: ${user.email}` : 'Kullanıcı oturumu yok'
      });

    } catch (error: any) {
      results.push({
        id: 'general-error',
        category: 'Genel',
        title: 'Tanılama Hatası',
        status: 'error',
        message: 'Tanılama sırasında hata oluştu',
        details: error.message
      });
    }

    setDiagnostics(results);
    setLoading(false);
  };

  const checkTableSchema = async (results: DiagnosticResult[]) => {
    try {
      // Birds tablosu sütunlarını kontrol et
      const { data: birdsColumns, error } = await supabase
        .rpc('get_table_columns', { table_name: 'birds' });

      if (error) {
        // Fallback: Information schema sorgusu
        const { data: schemaData, error: schemaError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', 'birds');

        if (schemaError) {
          results.push({
            id: 'schema-check',
            category: 'Şema',
            title: 'Tablo Şeması',
            status: 'error',
            message: 'Tablo şeması kontrol edilemedi',
            details: schemaError.message,
            action: () => setActiveTab('schema'),
            actionLabel: 'Şema Yöneticisi'
          });
          return;
        }

        setColumns(schemaData || []);
      }

      // Kritik sütunları kontrol et
      const requiredColumns = ['id', 'user_id', 'name', 'ring_number'];
      const existingColumns = columns.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        results.push({
          id: 'missing-columns',
          category: 'Şema',
          title: 'Eksik Sütunlar',
          status: 'warning',
          message: `Eksik sütunlar: ${missingColumns.join(', ')}`,
          action: () => setActiveTab('schema'),
          actionLabel: 'Sütun Ekle'
        });
      } else {
        results.push({
          id: 'schema-check',
          category: 'Şema',
          title: 'Tablo Şeması',
          status: 'success',
          message: 'Tüm gerekli sütunlar mevcut'
        });
      }

    } catch (error: any) {
      results.push({
        id: 'schema-error',
        category: 'Şema',
        title: 'Şema Kontrolü',
        status: 'error',
        message: 'Şema kontrolü başarısız',
        details: error.message
      });
    }
  };

  const checkRLSPolicies = async (results: DiagnosticResult[]) => {
    try {
      // RLS politikalarını kontrol et
      const { data: rlsData, error } = await supabase
        .rpc('get_rls_policies');

      if (error) {
        results.push({
          id: 'rls-check',
          category: 'Güvenlik',
          title: 'RLS Politikaları',
          status: 'warning',
          message: 'RLS politikaları kontrol edilemedi',
          details: error.message,
          action: () => setActiveTab('rls'),
          actionLabel: 'RLS Yöneticisi'
        });
        return;
      }

      setPolicies(rlsData || []);

      // Kritik tabloların RLS durumunu kontrol et
      const criticalTables = ['users', 'birds', 'clutches', 'eggs', 'chicks'];
      const tablesWithRLS = rlsData?.map((policy: any) => policy.tablename) || [];
      const missingRLS = criticalTables.filter(table => !tablesWithRLS.includes(table));

      if (missingRLS.length > 0) {
        results.push({
          id: 'missing-rls',
          category: 'Güvenlik',
          title: 'RLS Politikaları',
          status: 'error',
          message: `RLS eksik tablolar: ${missingRLS.join(', ')}`,
          action: () => setActiveTab('rls'),
          actionLabel: 'RLS Ekle'
        });
      } else {
        results.push({
          id: 'rls-check',
          category: 'Güvenlik',
          title: 'RLS Politikaları',
          status: 'success',
          message: 'Tüm kritik tablolarda RLS aktif'
        });
      }

    } catch (error: any) {
      results.push({
        id: 'rls-error',
        category: 'Güvenlik',
        title: 'RLS Kontrolü',
        status: 'error',
        message: 'RLS kontrolü başarısız',
        details: error.message
      });
    }
  };

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) throw error;
      showToast('Bağlantı testi başarılı', 'success');
      runDiagnostics();
    } catch (error: any) {
      showToast(`Bağlantı testi başarısız: ${error.message}`, 'error');
    }
  };

  const executeSQLQuery = async () => {
    if (!sqlQuery.trim()) {
      showToast('Lütfen bir SQL sorgusu girin', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      // Direct SQL execution for simple queries
      if (sqlQuery.toLowerCase().includes('select')) {
        // For SELECT queries, use direct supabase query
        const { data, error } = await supabase.rpc('execute_sql', { query: sqlQuery });
        
        if (error) throw error;
        
        setSqlResult(data);
        showToast('SQL sorgusu başarıyla çalıştırıldı', 'success');
      } else {
        // For DDL queries, show warning and provide manual instructions
        setSqlResult({
          warning: 'DDL komutları güvenlik nedeniyle otomatik çalıştırılamaz',
          instruction: 'Bu komutu Supabase SQL Editor\'da manuel olarak çalıştırın',
          query: sqlQuery
        });
        showToast('DDL komutu hazırlandı - Manuel çalıştırma gerekli', 'warning');
      }
      
      // Log the operation
      logOperation('sql_execute', 'success', { query: sqlQuery });
      
    } catch (error: any) {
      setSqlResult({ error: error.message });
      showToast(`SQL hatası: ${error.message}`, 'error');
      
      // Log the error
      logOperation('sql_execute', 'error', { query: sqlQuery, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const renameColumn = async (tableName: string, oldName: string, newName: string) => {
    // Fixed SQL syntax - added TO keyword
    const query = `ALTER TABLE public.${tableName} RENAME COLUMN ${oldName} TO ${newName};`;
    setSqlQuery(query);
    
    // Show the query for manual execution
    setSqlResult({
      warning: 'Bu DDL komutu manuel olarak çalıştırılmalıdır',
      instruction: 'Aşağıdaki komutu Supabase SQL Editor\'da çalıştırın',
      query: query,
      steps: [
        '1. Supabase Dashboard\'a gidin',
        '2. SQL Editor\'ı açın',
        '3. Aşağıdaki komutu kopyalayıp yapıştırın',
        '4. RUN butonuna tıklayın'
      ]
    });
    
    showToast('SQL komutu hazırlandı - Manuel çalıştırma gerekli', 'warning');
  };

  const addColumn = async (tableName: string, columnName: string, dataType: string) => {
    const query = `ALTER TABLE public.${tableName} ADD COLUMN ${columnName} ${dataType};`;
    setSqlQuery(query);
    
    // Show the query for manual execution
    setSqlResult({
      warning: 'Bu DDL komutu manuel olarak çalıştırılmalıdır',
      instruction: 'Aşağıdaki komutu Supabase SQL Editor\'da çalıştırın',
      query: query,
      steps: [
        '1. Supabase Dashboard\'a gidin',
        '2. SQL Editor\'ı açın',
        '3. Aşağıdaki komutu kopyalayıp yapıştırın',
        '4. RUN butonuna tıklayın'
      ]
    });
    
    showToast('SQL komutu hazırlandı - Manuel çalıştırma gerekli', 'warning');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Panoya kopyalandı', 'success');
  };

  const logOperation = (operation: string, status: 'success' | 'error', details: any) => {
    const logEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      operation,
      status,
      details,
      user_agent: navigator.userAgent
    };
    
    setErrorLogs(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 logs
    
    // Store in localStorage for persistence
    const existingLogs = JSON.parse(localStorage.getItem('supabase_logs') || '[]');
    existingLogs.unshift(logEntry);
    localStorage.setItem('supabase_logs', JSON.stringify(existingLogs.slice(0, 100)));
  };

  const loadErrorLogs = () => {
    const logs = JSON.parse(localStorage.getItem('supabase_logs') || '[]');
    setErrorLogs(logs);
  };

  const clearLogs = () => {
    setErrorLogs([]);
    localStorage.removeItem('supabase_logs');
    showToast('Loglar temizlendi', 'success');
  };

  const showEnvSetupModal = () => {
    // Modal implementation would go here
    alert('Çevre değişkenleri kurulum rehberi açılacak...');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-red-500';
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 animate-slide-up ${bgColor}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 4000);
  };

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: Database },
    { id: 'schema', label: 'Şema Yönetimi', icon: Code },
    { id: 'rls', label: 'RLS Politikaları', icon: Shield },
    { id: 'migrations', label: 'SQL Editörü', icon: Terminal },
    { id: 'logs', label: 'Hata Logları', icon: Zap }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Supabase Tanılama</h1>
          <p className="text-neutral-600 mt-1">Veritabanı durumu ve konfigürasyon kontrolü</p>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {diagnostics.map((diagnostic) => (
            <div
              key={diagnostic.id}
              className={`border rounded-lg p-4 ${getStatusColor(diagnostic.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(diagnostic.status)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-neutral-800">{diagnostic.title}</h3>
                      <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-1 rounded">
                        {diagnostic.category}
                      </span>
                    </div>
                    <p className="text-neutral-700 mb-2">{diagnostic.message}</p>
                    {diagnostic.details && (
                      <p className="text-sm text-neutral-600 bg-white/50 p-2 rounded">
                        {diagnostic.details}
                      </p>
                    )}
                  </div>
                </div>
                {diagnostic.action && (
                  <button
                    onClick={diagnostic.action}
                    className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                  >
                    {diagnostic.actionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Tablo Sütunları (Birds)</h3>
            
            <div className="mb-4 flex gap-4">
              <button
                onClick={() => addColumn('birds', 'health_notes', 'text')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                health_notes Sütunu Ekle
              </button>
              <button
                onClick={() => renameColumn('birds', 'health_note', 'notes')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                health_note → notes
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-neutral-300">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="border border-neutral-300 px-4 py-2 text-left">Sütun Adı</th>
                    <th className="border border-neutral-300 px-4 py-2 text-left">Veri Tipi</th>
                    <th className="border border-neutral-300 px-4 py-2 text-left">Null Olabilir</th>
                    <th className="border border-neutral-300 px-4 py-2 text-left">Varsayılan</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((column, index) => (
                    <tr key={index}>
                      <td className="border border-neutral-300 px-4 py-2 font-mono text-sm">
                        {column.column_name}
                      </td>
                      <td className="border border-neutral-300 px-4 py-2">{column.data_type}</td>
                      <td className="border border-neutral-300 px-4 py-2">{column.is_nullable}</td>
                      <td className="border border-neutral-300 px-4 py-2 font-mono text-sm">
                        {column.column_default || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rls' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">RLS Politikaları</h3>
            
            <div className="space-y-4">
              {policies.map((policy, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{policy.policyname}</h4>
                    <div className="flex gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {policy.tablename}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {policy.cmd}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 font-mono bg-neutral-50 p-2 rounded">
                    {policy.qual}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'migrations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">SQL Editörü</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  SQL Sorgusu
                </label>
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="SELECT * FROM information_schema.columns WHERE table_name = 'birds';"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={executeSQLQuery}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Çalıştır
                </button>
                
                <button
                  onClick={() => setSqlQuery('')}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors"
                >
                  Temizle
                </button>

                {sqlResult?.query && (
                  <button
                    onClick={() => copyToClipboard(sqlResult.query)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    SQL Kopyala
                  </button>
                )}
              </div>

              {sqlResult && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Sonuç:</h4>
                  <div className="bg-neutral-50 p-4 rounded-lg overflow-auto">
                    {sqlResult.warning && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-yellow-800 font-medium">{sqlResult.warning}</p>
                        <p className="text-yellow-700 text-sm mt-1">{sqlResult.instruction}</p>
                      </div>
                    )}
                    
                    {sqlResult.query && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">SQL Komutu:</h5>
                        <pre className="bg-neutral-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                          {sqlResult.query}
                        </pre>
                      </div>
                    )}

                    {sqlResult.steps && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">Adımlar:</h5>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          {sqlResult.steps.map((step: string, index: number) => (
                            <li key={index} className="text-neutral-700">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {sqlResult.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-red-800 font-medium">Hata:</p>
                        <p className="text-red-700 text-sm">{sqlResult.error}</p>
                      </div>
                    )}

                    {sqlResult.data && (
                      <pre className="text-sm">
                        {JSON.stringify(sqlResult.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Hata Logları</h3>
              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Logları Temizle
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {errorLogs.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">Henüz log kaydı yok</p>
              ) : (
                errorLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`border rounded-lg p-3 ${
                      log.status === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{log.operation}</span>
                      <span className="text-xs text-neutral-500">
                        {new Date(log.timestamp).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <pre className="text-sm text-neutral-700 overflow-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};