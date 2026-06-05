"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("メールアドレスを入力してください");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "再設定申請に失敗しました");
        return;
      }

      setMessage(
        "登録されているメールアドレス宛に再設定用URLを送信しました。"
      );
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
          パスワード再設定
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          登録済みのメールアドレスを入力してください。
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
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              placeholder="sample@example.com"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full rounded-lg px-4 py-2 font-bold text-white ${
              isLoading
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "送信中..." : "再設定URLを送信"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => router.push("/login")}
            className="text-blue-600 hover:underline"
          >
            ログイン画面へ戻る
          </button>
        </div>
      </div>
    </main>
  );
}