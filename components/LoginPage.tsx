
import React, { useState } from 'react';
import { Activity, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { MOCK_USERS } from '../constants';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('用户名或密码错误');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-900/10 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-blue-600/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md bg-med-card border border-gray-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-8 text-center border-b border-gray-800 bg-gray-900/50">
           <div className="inline-flex items-center justify-center p-4 bg-blue-900/20 rounded-full mb-4 border border-blue-900/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
               <Activity size={40} className="text-blue-500" />
           </div>
           <h1 className="text-3xl font-bold text-white tracking-wide">MediGuard <span className="text-gray-500">CMS</span></h1>
           <p className="text-gray-400 text-sm mt-2">中央医疗设备监护管理系统</p>
        </div>

        {/* Form */}
        <div className="p-8 flex-1">
           <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">账号</label>
                 <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="请输入用户名"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                      autoFocus
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">密码</label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                    />
                 </div>
              </div>

              {error && (
                  <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-2 rounded text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                      <AlertCircle size={16} /> {error}
                  </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      登录中...
                    </>
                  ) : (
                    "安全登录"
                  )}
              </button>
           </form>
           
           <div className="mt-8 pt-6 border-t border-gray-800">
               <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 font-mono">
                  <div className="space-y-1">
                      <div className="font-bold text-gray-500 mb-1">演示账号:</div>
                      <div>admin / 123 (全权限)</div>
                      <div>icu / 123 (ICU科室)</div>
                  </div>
                  <div className="space-y-1 text-right">
                      <div className="font-bold text-gray-500 mb-1">其他账号:</div>
                      <div>or / 123 (手术室)</div>
                      <div>er / 123 (急诊科)</div>
                  </div>
               </div>
           </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-900 p-3 text-center text-[10px] text-gray-600 border-t border-gray-800">
            MediGuard System v2.5.0 | Authorized Personnel Only
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
