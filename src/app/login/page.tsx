"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    const result = await signIn("credentials", {
      loginId,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    if (result?.error) {
      setError("ログインIDまたはパスワードが違います。");
      return;
    }

    window.location.href = "/";
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="text-xl font-bold text-gray-900">
          施工管理アプリ ログイン
        </h1>

        <div className="mt-6 space-y-4">
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="ログインID"
            className="w-full rounded-lg border px-4 py-2 text-gray-900"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full rounded-lg border px-4 py-2 text-gray-900"
          />

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            className="w-full rounded-lg bg-blue-600 py-2 font-bold text-white hover:bg-blue-700"
          >
            ログイン
          </button>
        </div>
      </div>
    </main>
  );
}