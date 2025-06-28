import React, { useState } from 'react';
import { X, Copy, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';

interface EnvSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnvSetupModal: React.FC<EnvSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const envTemplate = `# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">Supabase Kurulum Rehberi</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold">Supabase Projesini Oluşturun</h3>
              </div>
              <p className="text-neutral-600 mb-3">
                Supabase Dashboard'da yeni bir proje oluşturun veya mevcut projenizi açın.
              </p>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Supabase Dashboard
              </a>
            </div>

            {/* Step 2 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold">API Anahtarlarını Alın</h3>
              </div>
              <div className="space-y-3">
                <p className="text-neutral-600">
                  Proje ayarlarından API anahtarlarınızı kopyalayın:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                  <li>Project Settings → API</li>
                  <li>Project URL'yi kopyalayın</li>
                  <li>anon/public anahtarını kopyalayın</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold">.env Dosyasını Oluşturun</h3>
              </div>
              <div className="space-y-3">
                <p className="text-neutral-600">
                  Proje kök dizininde <code className="bg-neutral-100 px-2 py-1 rounded">.env</code> dosyası oluşturun:
                </p>
                <div className="relative">
                  <pre className="bg-neutral-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{envTemplate}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(envTemplate, 'env')}
                    className="absolute top-2 right-2 p-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
                    title="Kopyala"
                  >
                    {copied === 'env' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-neutral-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="text-lg font-semibold">Değerleri Değiştirin</h3>
              </div>
              <div className="space-y-3">
                <p className="text-neutral-600">
                  Şablondaki değerleri gerçek Supabase bilgilerinizle değiştirin:
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Önemli:</p>
                      <p className="text-sm text-yellow-700">
                        <code>your_supabase_project_url</code> ve <code>your_supabase_anon_key</code> 
                        kısımlarını gerçek değerlerinizle değiştirmeyi unutmayın.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  5
                </div>
                <h3 className="text-lg font-semibold">Uygulamayı Yeniden Başlatın</h3>
              </div>
              <div className="space-y-3">
                <p className="text-neutral-600">
                  Değişikliklerin etkili olması için geliştirme sunucusunu yeniden başlatın:
                </p>
                <div className="bg-neutral-900 text-green-400 p-3 rounded-lg font-mono text-sm">
                  npm run dev
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Doğrulama</h4>
              <p className="text-sm text-blue-700">
                Kurulum tamamlandıktan sonra bu tanılama aracını tekrar çalıştırarak 
                bağlantının başarılı olduğunu doğrulayabilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Anladım
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};