"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!loginId.trim() || !password.trim()) {
      setError("ログインIDとパスワードを入力してください");
      return;
    }

    try {
      setIsLoading(true);

      const result = await signIn("credentials", {
        loginId,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("ログインIDまたはパスワードが正しくありません");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">
          ログイン
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          施工管理アプリにログインしてください。
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              ログインID
            </label>
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={`w-full rounded-lg px-4 py-2 font-bold text-white ${
              isLoading
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </div>

        <div className="mt-6 space-y-2 text-center text-sm">
          <button
            onClick={() => router.push("/register")}
            className="text-blue-600 hover:underline"
          >
            新規登録はこちら
          </button>

          <br />

          <button
            onClick={() => router.push("/forgot-password")}
            className="text-gray-500 hover:underline"
          >
            ログインID・パスワードを忘れた場合
          </button>
        </div>
      </div>
    </main>
  );
}