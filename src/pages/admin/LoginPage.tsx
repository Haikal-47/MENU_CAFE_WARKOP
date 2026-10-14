import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Coffee, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(username.trim(), password.trim());
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error || 'Login gagal.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFE5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#69574A] hover:text-[#34241C] font-medium mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Pelanggan</span>
        </Link>

        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#34241C] text-[#F5EFE5] flex items-center justify-center mx-auto mb-3 shadow-md">
            <Coffee className="w-6 h-6 text-[#E5D8C7]" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#34241C] tracking-tight">
            Portal Kasir & Barista
          </h1>
          <p className="text-xs text-[#69574A] mt-1.5">
            Masuk untuk mengelola pesanan masuk, verifikasi pembayaran, dan data meja.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#FFFCF7] py-8 px-6 sm:px-10 rounded-2xl border border-[#D8C9B7] shadow-md">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FCEBEB] border border-[#F0B8B8] flex items-center gap-2.5 text-xs text-[#B83E3E]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#896A50] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin atau kasir"
                  className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] placeholder-[#69574A]/60 focus:outline-none focus:ring-2 focus:ring-[#896A50]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#34241C] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#896A50] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F5EFE5] border border-[#D8C9B7] text-[#34241C] placeholder-[#69574A]/60 focus:outline-none focus:ring-2 focus:ring-[#896A50]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#34241C] hover:bg-[#221711] disabled:opacity-50 text-[#FFFCF7] text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#FFFCF7] border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk ke Dashboard Kasir</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Info */}
          <div className="mt-6 pt-5 border-t border-[#D8C9B7]/60 text-center">
            <span className="text-[11px] uppercase tracking-wider text-[#896A50] font-semibold block mb-1.5">
              Akun Bawaan (Default):
            </span>
            <div className="text-xs text-[#69574A] space-y-1 bg-[#F5EFE5] p-2.5 rounded-lg border border-[#D8C9B7]">
              <div><strong>Admin:</strong> admin / admin123</div>
              <div><strong>Kasir:</strong> kasir / kasir123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
