import React from 'react';
import { TrendingUp, Clock, Target, Award } from 'lucide-react';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, subtitle, color }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-neutral-800 mb-1">{value}</h3>
        <p className="text-sm font-medium text-neutral-700 mb-1">{title}</p>
        <p className="text-xs text-neutral-500">{subtitle}</p>
      </div>
    </div>
  );
};

export const QuickStats: React.FC = () => {
  const stats = [
    {
      icon: TrendingUp,
      title: 'Başarı Oranı',
      value: '87%',
      subtitle: 'Son 3 kuluçka',
      color: 'bg-primary-500'
    },
    {
      icon: Clock,
      title: 'Aktif Kuluçka',
      value: '2',
      subtitle: '12 yumurta toplam',
      color: 'bg-secondary-500'
    },
    {
      icon: Target,
      title: 'Bu Ay Çıkan',
      value: '18',
      subtitle: '3 farklı çiftten',
      color: 'bg-blue-500'
    },
    {
      icon: Award,
      title: 'Toplam Üretim',
      value: '156',
      subtitle: 'Bu yıl başından',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Hızlı Bakış</h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
};
