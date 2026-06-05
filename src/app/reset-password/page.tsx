"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    setMessage("");
    setError("");

    if (!token) {
      setError("再設定用トークンがありません");
      return;
    }

    if (!password || !confirmPassword) {
      setError("新しいパスワードを入力してください");
      return;
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    if (password !== confirmPassword) {
      setError("確認用パスワードが一致しません");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "パスワード再設定に失敗しました");
        return;
      }

      setMessage("パスワードを再設定しました。ログインしてください。");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">
          新しいパスワード設定
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          新しいパスワードを入力してください。
        </p>

        {message && (
          <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              新しいパスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              placeholder="8文字以上"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              新しいパスワード確認
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              placeholder="もう一度入力"
            />
          </div>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className={`w-full rounded-lg px-4 py-2 font-bold text-white ${
              isLoading
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "再設定中..." : "パスワードを再設定"}
          </button>
        </div>
      </div>
    </main>
  );
}