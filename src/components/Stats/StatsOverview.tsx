import React from 'react';
import { TrendingUp, Calendar, Target, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const monthlyData = [
  { month: 'Oca', hatch: 12, laid: 15 },
  { month: 'Şub', hatch: 18, laid: 22 },
  { month: 'Mar', hatch: 15, laid: 18 },
  { month: 'Nis', hatch: 20, laid: 24 },
  { month: 'May', hatch: 22, laid: 25 },
  { month: 'Haz', hatch: 19, laid: 23 },
];

const speciesData = [
  { name: 'Muhabbet Kuşu', value: 65, color: '#2d9959' },
  { name: 'Kanarya', value: 25, color: '#f97316' },
  { name: 'Hint Bülbülü', value: 10, color: '#3b82f6' },
];

const pairData = [
  { pair: 'Luna & Apollo', attempts: 8, success: 87, avgDays: 18.2 },
  { pair: 'Bella & Max', attempts: 6, success: 75, avgDays: 19.1 },
  { pair: 'Zara & Leo', attempts: 4, success: 100, avgDays: 17.8 },
];

export const StatsOverview: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800 mb-6">İstatistikler & Analiz</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-neutral-800 mb-1">87%</h3>
            <p className="text-sm font-medium text-neutral-700 mb-1">Ortalama Başarı</p>
            <p className="text-xs text-neutral-500">Son 6 ay</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-secondary-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-neutral-800 mb-1">18.4</h3>
            <p className="text-sm font-medium text-neutral-700 mb-1">Ort. Çıkım Süresi</p>
            <p className="text-xs text-neutral-500">Gün</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-neutral-800 mb-1">156</h3>
            <p className="text-sm font-medium text-neutral-700 mb-1">Toplam Yavru</p>
            <p className="text-xs text-neutral-500">Bu yıl</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-neutral-800 mb-1">18</h3>
            <p className="text-sm font-medium text-neutral-700 mb-1">Aktif Kuluçka</p>
            <p className="text-xs text-neutral-500">Toplam</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Aylık Üretim Trendi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px' 
                }}
              />
              <Bar dataKey="laid" fill="#f97316" name="Bırakılan" radius={4} />
              <Bar dataKey="hatch" fill="#2d9959" name="Çıkan" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Tür Dağılımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={speciesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {speciesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px' 
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {speciesData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-neutral-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800">En Başarılı Çiftler</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Çift Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Deneme Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Başarı Oranı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Ortalama Süre
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {pairData.map((pair, index) => (
                <tr key={index} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">{pair.pair}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">{pair.attempts}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-neutral-900">{pair.success}%</div>
                      <div className="ml-2 w-16 bg-neutral-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${pair.success}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">{pair.avgDays} gün</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
